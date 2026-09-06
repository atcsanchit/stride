import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Connect, Plugin } from 'vite';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Ticket = { id: string; kind?: string; [key: string]: unknown };
type Snapshot = {
	roadmaps: unknown[];
	items: unknown[];
	drops: unknown[];
	completions: unknown[];
	sessions: unknown[];
	sprints: unknown[];
	tickets: Ticket[];
	reviews: unknown[];
	settings: unknown;
	identity?: unknown;
};

const emptySnapshot = (): Snapshot => ({
	roadmaps: [],
	items: [],
	drops: [],
	completions: [],
	sessions: [],
	sprints: [],
	tickets: [],
	reviews: [],
	settings: null,
});

const queues = new Map<string, Promise<void>>();

function dataRoot(): string {
	return join(process.cwd(), 'data');
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
	res.statusCode = status;
	res.setHeader('Content-Type', 'application/json');
	res.setHeader('Cache-Control', 'no-store');
	res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		req.on('data', (chunk: Buffer) => chunks.push(chunk));
		req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
		req.on('error', reject);
	});
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
	try {
		return JSON.parse(await readFile(file, 'utf8')) as T;
	} catch {
		return fallback;
	}
}

async function writeJson(file: string, data: unknown): Promise<void> {
	await mkdir(dirname(file), { recursive: true });
	const tmp = `${file}.tmp`;
	await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
	await rename(tmp, file);
}

function enqueue(key: string, work: () => Promise<void>): Promise<void> {
	const next = (queues.get(key) ?? Promise.resolve()).then(work, work);
	queues.set(key, next.catch(() => undefined));
	return next;
}

function accountsFile(): string {
	return join(dataRoot(), 'accounts.json');
}

function userDir(userId: string): string {
	return join(dataRoot(), 'users', userId);
}

function tagged<T>(userId: string, rows: T[]): { userId: string; updatedAt: number; rows: T[] } {
	return { userId, updatedAt: Date.now(), rows };
}

async function readUserSnapshot(userId: string): Promise<Snapshot> {
	const dir = userDir(userId);
	const sprint = await readJson<{ rows?: Ticket[] }>(join(dir, 'sprint-tickets.json'), { rows: [] });
	const chores = await readJson<{ rows?: Ticket[] }>(join(dir, 'chore-tickets.json'), { rows: [] });
	const courses = await readJson<{ roadmaps?: unknown[]; items?: unknown[] }>(join(dir, 'courses.json'), {});
	const completions = await readJson<{ rows?: unknown[] }>(join(dir, 'completions.json'), { rows: [] });
	const sessions = await readJson<{ rows?: unknown[] }>(join(dir, 'sessions.json'), { rows: [] });
	const sprints = await readJson<{ rows?: unknown[] }>(join(dir, 'sprints.json'), { rows: [] });
	const reviews = await readJson<{ rows?: unknown[] }>(join(dir, 'reviews.json'), { rows: [] });
	const drops = await readJson<{ rows?: unknown[] }>(join(dir, 'drops.json'), { rows: [] });
	const settings = await readJson<{ value?: unknown }>(join(dir, 'settings.json'), {});
	const identity = await readJson<{ value?: unknown }>(join(dir, 'identity.json'), {});
	return {
		roadmaps: courses.roadmaps ?? [],
		items: courses.items ?? [],
		drops: drops.rows ?? [],
		completions: completions.rows ?? [],
		sessions: sessions.rows ?? [],
		sprints: sprints.rows ?? [],
		tickets: [...(sprint.rows ?? []), ...(chores.rows ?? [])],
		reviews: reviews.rows ?? [],
		settings: settings.value ?? null,
		identity: identity.value ?? null,
	};
}

async function backupTicketFiles(dir: string, sprint: unknown, chores: unknown): Promise<void> {
	const history = join(dir, 'history');
	await mkdir(history, { recursive: true });
	const stamp = Date.now();
	await writeJson(join(history, `sprint-tickets.${stamp}.json`), sprint);
	await writeJson(join(history, `chore-tickets.${stamp}.json`), chores);
	const names = (await readdir(history))
		.filter((name) => name.startsWith('sprint-tickets.') || name.startsWith('chore-tickets.'))
		.sort();
	if (names.length > 20) {
		for (const name of names.slice(0, names.length - 20)) {
			await rm(join(history, name), { force: true });
		}
	}
}

function keepRows<T>(incoming: T[] | undefined, existing: T[]): T[] {
	const next = incoming ?? [];
	if (next.length === 0 && existing.length > 0) {
		return existing;
	}
	return next;
}

async function writeUserSnapshot(userId: string, snapshot: Snapshot): Promise<void> {
	const dir = userDir(userId);
	const existing = await readUserSnapshot(userId);
	let tickets = snapshot.tickets ?? [];
	if (tickets.length === 0 && existing.tickets.length > 0) {
		const sprintFile = await readJson(join(dir, 'sprint-tickets.json'), { rows: [] });
		const choreFile = await readJson(join(dir, 'chore-tickets.json'), { rows: [] });
		await backupTicketFiles(dir, sprintFile, choreFile);
		tickets = existing.tickets as Ticket[];
	}
	const roadmaps = keepRows(snapshot.roadmaps as Array<{ id?: string }>, existing.roadmaps as Array<{ id?: string }>);
	const items = keepRows(snapshot.items as Array<{ id?: string }>, existing.items as Array<{ id?: string }>);
	const drops = keepRows(snapshot.drops as Array<{ id?: string }>, existing.drops as Array<{ id?: string }>);
	const completions = keepRows(snapshot.completions as Array<{ id?: string }>, existing.completions as Array<{ id?: string }>);
	const sessions = keepRows(snapshot.sessions as Array<{ id?: string }>, existing.sessions as Array<{ id?: string }>);
	const sprints = keepRows(snapshot.sprints as Array<{ id?: string }>, existing.sprints as Array<{ id?: string }>);
	const reviews = keepRows(snapshot.reviews as Array<{ id?: string }>, existing.reviews as Array<{ id?: string }>);
	const settings = snapshot.settings ?? existing.settings;
	const withUser = <T extends { id?: string }>(rows: T[]) =>
		rows.map((row) => ({ ...row, userId }));
	await writeJson(join(dir, 'sprint-tickets.json'), tagged(userId, withUser(tickets.filter((row) => row.kind !== 'chore'))));
	await writeJson(join(dir, 'chore-tickets.json'), tagged(userId, withUser(tickets.filter((row) => row.kind === 'chore'))));
	await writeJson(join(dir, 'courses.json'), {
		userId,
		updatedAt: Date.now(),
		roadmaps: withUser(roadmaps),
		items: withUser(items),
	});
	await writeJson(join(dir, 'completions.json'), tagged(userId, withUser(completions)));
	await writeJson(join(dir, 'sessions.json'), tagged(userId, withUser(sessions)));
	await writeJson(join(dir, 'sprints.json'), tagged(userId, withUser(sprints)));
	await writeJson(join(dir, 'reviews.json'), tagged(userId, withUser(reviews)));
	await writeJson(join(dir, 'drops.json'), tagged(userId, withUser(drops)));
	await writeJson(join(dir, 'settings.json'), { userId, updatedAt: Date.now(), value: settings ?? null });
	if (snapshot.identity) {
		await writeJson(join(dir, 'identity.json'), { userId, updatedAt: Date.now(), value: snapshot.identity });
	}
}

function attach(server: { middlewares: Connect.Server }): void {
	server.middlewares.use((req, res, next) => {
		const raw = (req as IncomingMessage & { originalUrl?: string }).originalUrl ?? req.url ?? '';
		if (!raw.startsWith('/api/stride')) {
			next();
			return;
		}
		void (async () => {
			const url = new URL(raw, 'http://localhost');
			let path = url.pathname.replace(/^\/api\/stride/, '') || '/';
			if (path.length > 1) {
				path = path.replace(/\/$/, '');
			}
			const method = req.method ?? 'GET';

			if (path === '/health' && method === 'GET') {
				sendJson(res, 200, { ok: true, root: dataRoot() });
				return;
			}

			if (path === '/accounts' && method === 'GET') {
				sendJson(res, 200, await readJson(accountsFile(), { users: [], sessionUserId: null }));
				return;
			}

			if (path === '/accounts' && method === 'PUT') {
				const body = JSON.parse(await readBody(req)) as { users?: unknown[]; sessionUserId?: string | null };
				await enqueue('accounts', async () => {
					await writeJson(accountsFile(), {
						users: body.users ?? [],
						sessionUserId: body.sessionUserId ?? null,
						updatedAt: Date.now(),
					});
				});
				sendJson(res, 200, { ok: true });
				return;
			}

			const userMatch = path.match(/^\/users\/([^/]+)(?:\/(.*))?$/);
			if (!userMatch) {
				sendJson(res, 404, { ok: false, error: 'Unknown stride persist route' });
				return;
			}
			const userId = decodeURIComponent(userMatch[1]);
			if (!UUID_RE.test(userId)) {
				sendJson(res, 400, { ok: false, error: 'Invalid user id' });
				return;
			}
			const rest = userMatch[2] ?? '';

			if (method === 'GET' && rest === '') {
				sendJson(res, 200, { userId, ...emptySnapshot(), ...(await readUserSnapshot(userId)) });
				return;
			}

			if (method === 'PUT' && rest === '') {
				const body = JSON.parse(await readBody(req)) as Snapshot;
				await enqueue(userId, () => writeUserSnapshot(userId, body));
				sendJson(res, 200, { ok: true });
				return;
			}

			if (method === 'PUT' && rest === 'identity') {
				const body = JSON.parse(await readBody(req)) as { value?: unknown };
				await enqueue(userId, async () => {
					await writeJson(join(userDir(userId), 'identity.json'), {
						userId,
						updatedAt: Date.now(),
						value: body.value ?? null,
					});
				});
				sendJson(res, 200, { ok: true });
				return;
			}

			if (method === 'PUT' && rest === 'settings') {
				const body = JSON.parse(await readBody(req)) as { value?: unknown };
				await enqueue(userId, async () => {
					await writeJson(join(userDir(userId), 'settings.json'), {
						userId,
						updatedAt: Date.now(),
						value: body.value ?? null,
					});
				});
				sendJson(res, 200, { ok: true });
				return;
			}

			if (method === 'DELETE' && rest === '') {
				await enqueue(userId, async () => {
					await rm(userDir(userId), { recursive: true, force: true });
					const accounts = await readJson<{ users?: Array<{ id: string }>; sessionUserId?: string | null }>(
						accountsFile(),
						{ users: [], sessionUserId: null },
					);
					await writeJson(accountsFile(), {
						users: (accounts.users ?? []).filter((user) => user.id !== userId),
						sessionUserId: accounts.sessionUserId === userId ? null : accounts.sessionUserId,
						updatedAt: Date.now(),
					});
				});
				sendJson(res, 200, { ok: true });
				return;
			}

			sendJson(res, 404, { ok: false, error: 'Unknown stride persist route' });
		})().catch((error: unknown) => {
			sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Persist failed' });
		});
	});
}

export function stridePersist(): Plugin {
	return {
		name: 'stride-persist',
		configureServer: attach,
		configurePreviewServer: attach,
	};
}
