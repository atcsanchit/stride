import { itemKey } from './id';
import type { Completion, ParsedItem, Roadmap, RoadmapItem } from '../types';

export function mergeItems(
	roadmap: Roadmap,
	parsed: ParsedItem[],
	existing: RoadmapItem[],
): RoadmapItem[] {
	const previous = new Map(existing.filter((item) => item.roadmapId === roadmap.id).map((item) => [item.id, item]));
	const byTitle = new Map(
		existing
			.filter((item) => item.roadmapId === roadmap.id)
			.map((item) => [`${item.section}::${item.subsection}::${item.title}`.toLowerCase(), item]),
	);
	const byName = new Map(
		existing.filter((item) => item.roadmapId === roadmap.id).map((item) => [item.title.toLowerCase(), item]),
	);

	return parsed.map((entry) => {
		const id = `${roadmap.id}:${itemKey(entry.section, entry.subsection, entry.title)}`;
		const prior =
			previous.get(id) ??
			byTitle.get(`${entry.section}::${entry.subsection}::${entry.title}`.toLowerCase()) ??
			byName.get(entry.title.toLowerCase());
		const done = prior?.done || entry.done;
		return {
			id,
			trackId: roadmap.trackId,
			roadmapId: roadmap.id,
			section: entry.section,
			subsection: entry.subsection,
			title: entry.title,
			order: entry.order,
			done,
			doneAt: done ? prior?.doneAt ?? Date.now() : undefined,
		};
	});
}

export function reconcileItemsWithCompletions(items: RoadmapItem[], completions: Completion[]): RoadmapItem[] {
	const byId = new Map<string, number>();
	const bySectionTitle = new Map<string, number>();
	const byTitle = new Map<string, number>();
	for (const row of completions) {
		if (!row.title && !row.itemId) {
			continue;
		}
		const when = row.completedAt || 0;
		if (row.itemId) {
			byId.set(row.itemId, Math.max(byId.get(row.itemId) ?? 0, when));
		}
		if (row.title) {
			const titleKey = `${row.trackId}::${row.title}`.toLowerCase();
			byTitle.set(titleKey, Math.max(byTitle.get(titleKey) ?? 0, when));
			if (row.section) {
				const sectionKey = `${row.trackId}::${row.section}::${row.title}`.toLowerCase();
				bySectionTitle.set(sectionKey, Math.max(bySectionTitle.get(sectionKey) ?? 0, when));
			}
		}
	}
	return items.map((item) => {
		if (item.done) {
			return item;
		}
		const when =
			byId.get(item.id) ??
			bySectionTitle.get(`${item.trackId}::${item.section}::${item.title}`.toLowerCase()) ??
			byTitle.get(`${item.trackId}::${item.title}`.toLowerCase());
		if (!when) {
			return item;
		}
		return { ...item, done: true, doneAt: when };
	});
}
