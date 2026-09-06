import type { PythonRunResult } from '../types';

export async function pythonInfo(): Promise<PythonRunResult> {
	const response = await fetch('/api/python/info');
	return (await response.json()) as PythonRunResult;
}

export async function runPython(code: string, stdin = ''): Promise<PythonRunResult> {
	const response = await fetch('/api/python/run', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ code, stdin }),
	});
	return (await response.json()) as PythonRunResult;
}
