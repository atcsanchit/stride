export function createId(): string {
	return crypto.randomUUID();
}

export async function hashText(text: string): Promise<string> {
	const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
	return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function slug(value: string): string {
	return value
		.toLowerCase()
		.replace(/[`*_~]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 80);
}

export function itemKey(section: string, subsection: string, title: string): string {
	return [section, subsection, title].map(slug).filter(Boolean).join('/');
}
