import { currentAccessToken, requestGoogleToken } from './google-auth';

const FOLDER_MIME = 'application/vnd.google-apps.folder';
const FOLDER_NAME = 'Stride';
const FOLDER_KEY = 'stride-drive-folder-id';

type DriveFile = { id: string; name: string };

async function authHeader(interactive: boolean): Promise<string> {
	const cached = currentAccessToken();
	if (cached) {
		return `Bearer ${cached}`;
	}
	if (!interactive) {
		throw new Error('Drive token is only requested from a button click.');
	}
	const next = await requestGoogleToken(true);
	return `Bearer ${next.token}`;
}

async function driveFetch(url: string, init: RequestInit, interactive: boolean): Promise<Response> {
	const headers = new Headers(init.headers);
	headers.set('Authorization', await authHeader(interactive));
	let response = await fetch(url, { ...init, headers });
	if (response.status === 401) {
		if (!interactive) {
			return response;
		}
		const next = await requestGoogleToken(true);
		headers.set('Authorization', `Bearer ${next.token}`);
		response = await fetch(url, { ...init, headers });
	}
	return response;
}

async function driveJson<T>(url: string, init: RequestInit, interactive: boolean): Promise<T> {
	const response = await driveFetch(url, init, interactive);
	if (!response.ok) {
		const text = await response.text();
		throw new Error(text.slice(0, 180) || `Drive request failed (${response.status})`);
	}
	if (response.status === 204) {
		return {} as T;
	}
	return (await response.json()) as T;
}

function rememberedFolderId(): string | null {
	try {
		return localStorage.getItem(FOLDER_KEY);
	} catch {
		return null;
	}
}

function rememberFolderId(id: string): void {
	try {
		localStorage.setItem(FOLDER_KEY, id);
	} catch {
		// ignore
	}
}

export function clearDriveFileCache(): void {
	try {
		localStorage.removeItem(FOLDER_KEY);
	} catch {
		// ignore
	}
}

async function findFolder(interactive: boolean): Promise<string | null> {
	const remembered = rememberedFolderId();
	if (remembered) {
		const probe = await driveFetch(
			`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(remembered)}?fields=id,trashed`,
			{ method: 'GET' },
			interactive,
		);
		if (probe.ok) {
			const body = (await probe.json()) as { id?: string; trashed?: boolean };
			if (body.id && !body.trashed) {
				return body.id;
			}
		}
	}
	const query = encodeURIComponent(
		`name = '${FOLDER_NAME}' and mimeType = '${FOLDER_MIME}' and trashed = false`,
	);
	const listed = await driveJson<{ files?: DriveFile[] }>(
		`https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&fields=files(id,name)&pageSize=10`,
		{ method: 'GET' },
		interactive,
	);
	const id = listed.files?.[0]?.id ?? null;
	if (id) {
		rememberFolderId(id);
	}
	return id;
}

export async function ensureStrideFolder(interactive: boolean): Promise<string> {
	const existing = await findFolder(interactive);
	if (existing) {
		return existing;
	}
	const created = await driveJson<DriveFile>(
		'https://www.googleapis.com/drive/v3/files?fields=id,name',
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: FOLDER_NAME,
				mimeType: FOLDER_MIME,
				appProperties: { stride: 'v1' },
			}),
		},
		interactive,
	);
	if (!created.id) {
		throw new Error('Could not create the Stride folder on Drive.');
	}
	rememberFolderId(created.id);
	return created.id;
}

async function findChild(folderId: string, name: string, interactive: boolean): Promise<string | null> {
	const query = encodeURIComponent(`name = '${name}' and '${folderId}' in parents and trashed = false`);
	const listed = await driveJson<{ files?: DriveFile[] }>(
		`https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&fields=files(id,name)&pageSize=5`,
		{ method: 'GET' },
		interactive,
	);
	return listed.files?.[0]?.id ?? null;
}

export async function listStrideJsonNames(interactive: boolean): Promise<string[]> {
	const folderId = await ensureStrideFolder(interactive);
	const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
	const listed = await driveJson<{ files?: DriveFile[] }>(
		`https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&fields=files(id,name)&pageSize=100`,
		{ method: 'GET' },
		interactive,
	);
	return (listed.files ?? []).map((file) => file.name);
}

export async function readDriveJson<T>(name: string, interactive: boolean): Promise<T | null> {
	const folderId = await ensureStrideFolder(interactive);
	const id = await findChild(folderId, name, interactive);
	if (!id) {
		return null;
	}
	const response = await driveFetch(
		`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`,
		{ method: 'GET' },
		interactive,
	);
	if (response.status === 404) {
		return null;
	}
	if (!response.ok) {
		throw new Error(`Could not read ${name} from Drive.`);
	}
	return (await response.json()) as T;
}

export async function writeDriveJson(name: string, data: unknown, interactive: boolean): Promise<void> {
	const folderId = await ensureStrideFolder(interactive);
	const existing = await findChild(folderId, name, interactive);
	const body = JSON.stringify(data);
	if (existing) {
		const response = await driveFetch(
			`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existing)}?uploadType=media`,
			{ method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body },
			interactive,
		);
		if (!response.ok) {
			throw new Error(`Could not update ${name} on Drive.`);
		}
		return;
	}
	const boundary = 'stride_drive_boundary';
	const metadata = JSON.stringify({
		name,
		parents: [folderId],
		appProperties: { stride: 'v1' },
	});
	const multipart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`;
	const response = await driveFetch(
		'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
		{
			method: 'POST',
			headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
			body: multipart,
		},
		interactive,
	);
	if (!response.ok) {
		throw new Error(`Could not create ${name} on Drive.`);
	}
}
