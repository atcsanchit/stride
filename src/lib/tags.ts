const TAG_TONES = [
	'teal',
	'blue',
	'violet',
	'orange',
	'gold',
	'rose',
	'green',
	'indigo',
	'mint',
] as const;

export type TagTone = (typeof TAG_TONES)[number];

const KNOWN_TONES: Record<string, TagTone> = {
	'workflow testing': 'teal',
	'code changes': 'blue',
	'workflow builder': 'violet',
	'upload function': 'orange',
	stage: 'gold',
	prod: 'rose',
	'local validation': 'green',
	workflows: 'indigo',
	'ocr poc': 'mint',
};

function hashTone(value: string): TagTone {
	let hash = 0;
	for (let index = 0; index < value.length; index += 1) {
		hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
	}
	return TAG_TONES[hash % TAG_TONES.length];
}

export function tagTone(tag: string): TagTone {
	const key = tag.trim().toLowerCase();
	return KNOWN_TONES[key] ?? hashTone(key);
}

export function tagClassName(tag: string, extra = ''): string {
	return ['tag-chip', `tag-${tagTone(tag)}`, extra].filter(Boolean).join(' ');
}
