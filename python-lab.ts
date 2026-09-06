import { execFile, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { Connect, Plugin } from 'vite';

const execFileAsync = promisify(execFile);
const TIMEOUT_MS = 8_000;
const MAX_CODE_BYTES = 200_000;
const MAX_OUTPUT_BYTES = 1_000_000;

type PythonInfo = { bin: string; version: string };

let cached: PythonInfo | null = null;

function sendJson(res: ServerResponse, status: number, body: unknown): void {
	const payload = JSON.stringify(body);
	res.statusCode = status;
	res.setHeader('Content-Type', 'application/json');
	res.end(payload);
}

function readBody(req: IncomingMessage): Promise<string> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		let size = 0;
		req.on('data', (chunk: Buffer) => {
			size += chunk.length;
			if (size > MAX_CODE_BYTES + 50_000) {
				reject(new Error('Payload too large'));
				req.destroy();
				return;
			}
			chunks.push(chunk);
		});
		req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
		req.on('error', reject);
	});
}

function cleanEnv(home: string): NodeJS.ProcessEnv {
	return {
		PATH: process.env.PATH ?? '/usr/bin:/bin',
		HOME: home,
		LANG: process.env.LANG ?? 'C.UTF-8',
		LC_ALL: process.env.LC_ALL ?? 'C.UTF-8',
		PYTHONUNBUFFERED: '1',
		PYTHONDONTWRITEBYTECODE: '1',
	};
}

async function resolvePython(): Promise<PythonInfo> {
	if (cached) {
		return cached;
	}
	const candidates = [process.env.STRIDE_PYTHON, 'python3', 'python'].filter((value): value is string => Boolean(value));
	for (const bin of candidates) {
		try {
			const { stdout } = await execFileAsync(bin, ['-E', '-c', 'import sys; print(sys.executable); print(sys.version.split()[0])'], {
				timeout: 4_000,
				env: { PATH: process.env.PATH ?? '/usr/bin:/bin' },
			});
			const [executable, version] = stdout.trim().split('\n');
			if (executable && version) {
				cached = { bin: executable.trim(), version: version.trim() };
				return cached;
			}
		} catch {
			continue;
		}
	}
	throw new Error('No Python found on this machine. Install python3 or set STRIDE_PYTHON.');
}

function runFile(bin: string, file: string, stdin: string, cwd: string): Promise<{
	stdout: string;
	stderr: string;
	code: number | null;
	timedOut: boolean;
}> {
	return new Promise((resolve) => {
		const child = spawn(bin, ['-E', '-B', '-u', file], {
			cwd,
			env: cleanEnv(cwd),
			stdio: ['pipe', 'pipe', 'pipe'],
		});
		let stdout = '';
		let stderr = '';
		let timedOut = false;
		const timer = setTimeout(() => {
			timedOut = true;
			child.kill('SIGKILL');
		}, TIMEOUT_MS);

		const take = (chunk: Buffer, current: string): string => {
			const next = current + chunk.toString('utf8');
			if (next.length > MAX_OUTPUT_BYTES) {
				child.kill('SIGKILL');
				return next.slice(0, MAX_OUTPUT_BYTES) + '\n… output truncated\n';
			}
			return next;
		};

		child.stdout.on('data', (chunk: Buffer) => {
			stdout = take(chunk, stdout);
		});
		child.stderr.on('data', (chunk: Buffer) => {
			stderr = take(chunk, stderr);
		});
		child.on('close', (code) => {
			clearTimeout(timer);
			resolve({ stdout, stderr, code, timedOut });
		});
		child.on('error', (error) => {
			clearTimeout(timer);
			resolve({ stdout, stderr: error.message, code: 1, timedOut: false });
		});
		child.stdin.write(stdin);
		child.stdin.end();
	});
}

function attach(server: { middlewares: Connect.Server }): void {
	const info: Connect.NextHandleFunction = async (_req, res) => {
		try {
			const python = await resolvePython();
			sendJson(res, 200, { ok: true, bin: python.bin, version: python.version, timeoutMs: TIMEOUT_MS });
		} catch (error) {
			sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Python missing' });
		}
	};

	const run: Connect.NextHandleFunction = async (req, res) => {
		if (req.method !== 'POST') {
			sendJson(res, 405, { ok: false, error: 'POST only' });
			return;
		}
		let python: PythonInfo;
		try {
			python = await resolvePython();
		} catch (error) {
			sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Python missing' });
			return;
		}

		let payload: { code?: string; stdin?: string };
		try {
			payload = JSON.parse(await readBody(req)) as { code?: string; stdin?: string };
		} catch {
			sendJson(res, 400, { ok: false, error: 'Invalid JSON' });
			return;
		}

		const code = payload.code ?? '';
		if (!code.trim()) {
			sendJson(res, 400, { ok: false, error: 'Write some Python first.' });
			return;
		}
		if (Buffer.byteLength(code, 'utf8') > MAX_CODE_BYTES) {
			sendJson(res, 400, { ok: false, error: 'Code is too large.' });
			return;
		}

		const dir = await mkdtemp(join(tmpdir(), 'stride-lab-'));
		const file = join(dir, `${randomUUID()}.py`);
		const started = Date.now();
		try {
			await writeFile(file, code, 'utf8');
			const result = await runFile(python.bin, file, payload.stdin ?? '', dir);
			sendJson(res, 200, {
				ok: !result.timedOut && result.code === 0,
				bin: python.bin,
				version: python.version,
				stdout: result.stdout,
				stderr: result.timedOut ? `${result.stderr}\nTimed out after ${TIMEOUT_MS / 1000}s.`.trim() : result.stderr,
				code: result.code,
				timedOut: result.timedOut,
				ms: Date.now() - started,
			});
		} catch (error) {
			sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Run failed' });
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	};

	server.middlewares.use('/api/python/info', (req, res, next) => {
		if (req.method !== 'GET' && req.method !== 'HEAD') {
			next();
			return;
		}
		void info(req, res, next);
	});
	server.middlewares.use('/api/python/run', (req, res, next) => {
		void run(req, res, next);
	});
}

export function pythonLab(): Plugin {
	return {
		name: 'stride-python-lab',
		configureServer: attach,
		configurePreviewServer: attach,
	};
}
