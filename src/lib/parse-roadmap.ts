import { TRACK_IDS, trackMeta } from '../constants';
import type { TrackId } from '../types';

const TRACK_HINTS: Array<{ id: TrackId; needles: string[] }> = [
	{ id: 'dsa', needles: ['dsa', 'leetcode', 'algorithm', 'neetcode', 'coding-interview'] },
	{ id: 'system-design', needles: ['system-design', 'system_design', 'hld', 'lld', 'design'] },
	{ id: 'ai-engineering', needles: ['ai-eng', 'ai_eng', 'ml-eng', 'llm', 'agent', 'genai', 'rag'] },
];

export function inferTrack(filename: string, meta: Record<string, string>, fallback: TrackId): TrackId {
	const explicit = (meta.track ?? '').trim().toLowerCase().replace(/[_\s]+/g, '-');
	if (TRACK_IDS.includes(explicit as TrackId)) {
		return explicit as TrackId;
	}
	if (explicit === 'algorithms' || explicit === 'leetcode') {
		return 'dsa';
	}
	if (explicit === 'design' || explicit === 'hld') {
		return 'system-design';
	}
	if (explicit === 'ai' || explicit === 'ml' || explicit === 'genai') {
		return 'ai-engineering';
	}

	const blob = `${filename} ${meta.title ?? ''}`.toLowerCase();
	for (const hint of TRACK_HINTS) {
		if (hint.needles.some((needle) => blob.includes(needle))) {
			return hint.id;
		}
	}
	return fallback;
}

export function parseFrontmatter(markdown: string): { meta: Record<string, string>; body: string } {
	const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
	if (!match) {
		return { meta: {}, body: markdown };
	}
	const meta: Record<string, string> = {};
	for (const line of match[1].split(/\r?\n/)) {
		const cut = line.indexOf(':');
		if (cut === -1) {
			continue;
		}
		const key = line.slice(0, cut).trim().toLowerCase();
		const value = line.slice(cut + 1).trim().replace(/^['"]|['"]$/g, '');
		if (key) {
			meta[key] = value;
		}
	}
	return { meta, body: markdown.slice(match[0].length) };
}

function cleanText(value: string): string {
	return value
		.replace(/^\[[ xX]\]\s*/, '')
		.replace(/^#+\s*/, '')
		.replace(/\*\*(.*?)\*\*/g, '$1')
		.replace(/`([^`]+)`/g, '$1')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.trim();
}

function headingLevel(line: string): number {
	const match = line.match(/^(#{1,3})\s+\S/);
	return match ? match[1].length : 0;
}

function listItem(line: string): { title: string; done: boolean } | null {
	const match = line.match(/^\s*(?:[-*+]|\d+[.)])\s+(?:\[([ xX])\]\s+)?(.+)$/);
	if (!match) {
		return null;
	}
	return {
		done: match[1] ? match[1].toLowerCase() === 'x' : false,
		title: cleanText(match[2]),
	};
}

export function parseMarkdownRoadmap(markdown: string, filename: string, fallback: TrackId) {
	const { meta, body } = parseFrontmatter(markdown);
	const trackId = inferTrack(filename, meta, fallback);
	let title = meta.title?.trim() || '';
	let section = 'General';
	let subsection = '';
	let inCode = false;
	const items: Array<{
		section: string;
		subsection: string;
		title: string;
		done: boolean;
		order: number;
	}> = [];

	for (const raw of body.split(/\r?\n/)) {
		const line = raw.replace(/\t/g, '  ');
		const trimmed = line.trim();
		if (trimmed.startsWith('```')) {
			inCode = !inCode;
			continue;
		}
		if (inCode || !trimmed) {
			continue;
		}

		const level = headingLevel(trimmed);
		if (level === 1) {
			if (!title) {
				title = cleanText(trimmed);
			}
			continue;
		}
		if (level === 2) {
			section = cleanText(trimmed);
			subsection = '';
			continue;
		}
		if (level === 3) {
			subsection = cleanText(trimmed);
			continue;
		}

		const item = listItem(line);
		if (item?.title) {
			items.push({
				section,
				subsection,
				title: item.title,
				done: item.done,
				order: items.length,
			});
		}
	}

	if (!title) {
		title = filename.replace(/\.md$/i, '').replace(/[-_]/g, ' ');
	}

	return {
		title,
		trackId,
		label: trackMeta(trackId).label,
		items,
	};
}
