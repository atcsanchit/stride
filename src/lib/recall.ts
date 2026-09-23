const STORAGE_KEY = 'stride.recallDrafts';

function readAll(): Record<string, string> {
	try {
		const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as unknown;
		if (!parsed || typeof parsed !== 'object') {
			return {};
		}
		return parsed as Record<string, string>;
	} catch {
		return {};
	}
}

export function readRecallDraft(itemId: string): string {
	const value = readAll()[itemId];
	return typeof value === 'string' ? value : '';
}

export function openingNote(itemId: string, blurt?: string, closing?: string): string {
	const close = closing?.trim() ?? '';
	const draft = readRecallDraft(itemId).trim();
	const saved = blurt?.trim() ?? '';
	if (draft && draft !== close) {
		return draft;
	}
	if (saved && saved !== close) {
		return saved;
	}
	return '';
}

export function writeRecallDraft(itemId: string, text: string): void {
	const all = readAll();
	const trimmed = text.trim();
	if (!trimmed) {
		delete all[itemId];
	} else {
		all[itemId] = text;
	}
	localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
