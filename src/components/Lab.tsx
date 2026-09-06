import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { pythonInfo, runPython } from '../lib/python';
import type { PythonRunResult } from '../types';
import { useStride } from '../store/StrideState';
import { AppNav } from './AppNav';

const SNIPPETS: Array<{ id: string; label: string; stdin: string; code: string }> = [
	{
		id: 'hello',
		label: 'Hello',
		stdin: '',
		code: 'print("hello from your laptop Python")\n',
	},
	{
		id: 'two-sum',
		label: 'Two Sum',
		stdin: '',
		code: `def two_sum(nums: list[int], target: int) -> list[int]:
    seen: dict[int, int] = {}
    for i, n in enumerate(nums):
        need = target - n
        if need in seen:
            return [seen[need], i]
        seen[n] = i
    return []


print(two_sum([2, 7, 11, 15], 9))
print(two_sum([3, 2, 4], 6))
`,
	},
	{
		id: 'stdin',
		label: 'Stdin',
		stdin: '5\n1 2 3 4 5\n',
		code: `n = int(input())
nums = list(map(int, input().split()))
print(n, sum(nums))
`,
	},
];

function labKey(profileId: string): string {
	return `stride-personal-lab:${profileId}`;
}

function insertAtCursor(value: string, start: number, end: number, insert: string): { value: string; cursor: number } {
	return {
		value: value.slice(0, start) + insert + value.slice(end),
		cursor: start + insert.length,
	};
}

export function Lab() {
	const { profile } = useStride();
	const editorRef = useRef<HTMLTextAreaElement>(null);
	const [code, setCode] = useState(SNIPPETS[1].code);
	const [stdin, setStdin] = useState('');
	const [running, setRunning] = useState(false);
	const [info, setInfo] = useState<PythonRunResult | null>(null);
	const [result, setResult] = useState<PythonRunResult | null>(null);

	useEffect(() => {
		if (!profile) {
			return;
		}
		try {
			const raw = localStorage.getItem(labKey(profile.id));
			if (!raw) {
				return;
			}
			const saved = JSON.parse(raw) as { code?: string; stdin?: string };
			if (saved.code) {
				setCode(saved.code);
			}
			if (typeof saved.stdin === 'string') {
				setStdin(saved.stdin);
			}
		} catch {
			return;
		}
	}, [profile]);

	useEffect(() => {
		if (!profile) {
			return;
		}
		localStorage.setItem(labKey(profile.id), JSON.stringify({ code, stdin }));
	}, [code, profile, stdin]);

	useEffect(() => {
		void pythonInfo()
			.then(setInfo)
			.catch(() =>
				setInfo({
					ok: false,
					error: 'Local Python runner is not up. Start Stride with npm run dev.',
				}),
			);
	}, []);

	const run = useCallback(async () => {
		setRunning(true);
		setResult(null);
		try {
			setResult(await runPython(code, stdin));
		} catch (error) {
			setResult({
				ok: false,
				error: error instanceof Error ? error.message : 'Could not reach the local Python runner. Is Stride still running?',
			});
		} finally {
			setRunning(false);
		}
	}, [code, stdin]);

	function onEditorKey(event: KeyboardEvent<HTMLTextAreaElement>) {
		const area = event.currentTarget;
		if (event.key === 'Tab') {
			event.preventDefault();
			const next = insertAtCursor(code, area.selectionStart, area.selectionEnd, '    ');
			setCode(next.value);
			requestAnimationFrame(() => {
				area.selectionStart = next.cursor;
				area.selectionEnd = next.cursor;
			});
			return;
		}
		if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
			event.preventDefault();
			void run();
		}
	}

	const pythonLabel = info?.ok === false || info?.error ? info.error : info?.version ? `Python ${info.version}` : 'Looking for python3…';

	return (
		<div className="page">
			<header className="topbar">
				<div>
					<p className="eyebrow">Local interpreter</p>
					<h1>Python lab</h1>
				</div>
				<AppNav active="lab" />
			</header>

			<p className="lede">
				Runs on the Python already on this laptop ({pythonLabel}
				{info?.bin ? ` · ${info.bin}` : ''}). Nothing is sent to a cloud compiler. Stdlib plus whatever you installed
				for yourself — isolated from work env vars.
			</p>

			<div className="meta-row">
				{SNIPPETS.map((snippet) => (
					<button
						key={snippet.id}
						className="pill"
						type="button"
						onClick={() => {
							setCode(snippet.code);
							setStdin(snippet.stdin);
							setResult(null);
						}}
					>
						{snippet.label}
					</button>
				))}
				<span className="muted">Ctrl+Enter to run</span>
			</div>

			<div className="lab-grid">
				<section className="lab-card">
					<div className="shelf-head">
						<h2>main.py</h2>
						<div className="log-actions">
							<button className="primary" type="button" onClick={() => void run()} disabled={running}>
								{running ? 'Running…' : 'Run'}
							</button>
						</div>
					</div>
					<textarea
						ref={editorRef}
						className="code-editor"
						spellCheck={false}
						value={code}
						onChange={(event) => setCode(event.target.value)}
						onKeyDown={onEditorKey}
					/>
					<label className="field">
						stdin
						<textarea
							className="stdin"
							spellCheck={false}
							value={stdin}
							onChange={(event) => setStdin(event.target.value)}
							placeholder="Optional input() lines"
						/>
					</label>
				</section>
				<section className="lab-card">
					<div className="shelf-head">
						<h2>Output</h2>
						<span className="muted">{result?.ms != null ? `${result.ms}ms` : 'Idle'}</span>
					</div>
					{result?.error ? <p className="error">{result.error}</p> : null}
					{result?.timedOut ? <p className="error">Timed out at 8 seconds.</p> : null}
					{result && !result.error ? (
						<>
							{result.stdout ? (
								<pre className="output is-out">{result.stdout}</pre>
							) : (
								<p className="muted">No stdout.</p>
							)}
							{result.stderr ? <pre className="output is-err">{result.stderr}</pre> : null}
							<p className="muted">exit {result.code ?? '—'}</p>
						</>
					) : null}
					{!result ? <p className="muted">Write a solution, then Run. This is your interview editor.</p> : null}
				</section>
			</div>
		</div>
	);
}
