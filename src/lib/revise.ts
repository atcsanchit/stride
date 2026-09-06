import type { RecallGrade, ReviewCard, RoadmapItem, TrackId } from '../types';
import { addDays, diffDays, todayKey } from './time';

/** Expanding retrieval gaps used in medical education and interview prep. Cap at ~4 months. */
export const REVIEW_STEPS = [1, 3, 7, 14, 30, 60, 120];

/** Retrieval is tiring. Clearing a backlog in one sitting is massed practice, which decays faster. */
export const DAILY_REVIEW_CAP = 8;

export const RECALL_GRADES: Array<{ id: RecallGrade; label: string; hint: string }> = [
	{ id: 'again', label: 'Again', hint: 'Blank. Reset to 1 day.' },
	{ id: 'hard', label: 'Hard', hint: 'Shaky. Stay or step back.' },
	{ id: 'good', label: 'Good', hint: 'Retrieved. Next gap.' },
	{ id: 'easy', label: 'Easy', hint: 'Automatic. Skip a gap.' },
];

export type ReviewQueueItem = {
	card: ReviewCard;
	item: RoadmapItem;
	overdueDays: number;
};

export function seedReviewCard(item: RoadmapItem, today = todayKey()): ReviewCard {
	const learned = item.doneAt ? todayKey(new Date(item.doneAt)) : today;
	const firstDue = addDays(learned, 1);
	return {
		id: item.id,
		itemId: item.id,
		trackId: item.trackId,
		step: 0,
		intervalDays: REVIEW_STEPS[0],
		dueDate: firstDue <= today ? today : firstDue,
		lapses: 0,
		reviews: 0,
	};
}

function stepAfterGrade(step: number, grade: RecallGrade): number {
	if (grade === 'again') {
		return 0;
	}
	if (grade === 'hard') {
		return Math.max(0, step - 1);
	}
	if (grade === 'good') {
		return Math.min(REVIEW_STEPS.length - 1, step + 1);
	}
	return Math.min(REVIEW_STEPS.length - 1, step + 2);
}

export function applyGrade(card: ReviewCard, grade: RecallGrade, today = todayKey(), cue = ''): ReviewCard {
	const step = stepAfterGrade(card.step, grade);
	const intervalDays = REVIEW_STEPS[step];
	return {
		...card,
		step,
		intervalDays,
		dueDate: addDays(today, intervalDays),
		lastReviewedAt: Date.now(),
		lastGrade: grade,
		lapses: grade === 'again' ? card.lapses + 1 : card.lapses,
		reviews: card.reviews + 1,
		cue: cue.trim() || undefined,
	};
}

export function intervalAfterGrade(card: ReviewCard, grade: RecallGrade): number {
	return REVIEW_STEPS[stepAfterGrade(card.step, grade)];
}

export function prettyInterval(days: number): string {
	if (days <= 1) {
		return 'tomorrow';
	}
	if (days < 14) {
		return `in ${days} days`;
	}
	if (days < 60) {
		const weeks = Math.max(1, Math.round(days / 7));
		return `in ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
	}
	const months = Math.max(1, Math.round(days / 30));
	return `in ${months} ${months === 1 ? 'month' : 'months'}`;
}

export function recallPrompts(trackId: TrackId): string[] {
	if (trackId === 'dsa') {
		return [
			'Name the pattern in one sentence. Do not read the title back.',
			'Time and space? Which input makes the naive version fall over?',
			'Recite the steps, then code them in Lab if the steps will not come.',
		];
	}
	if (trackId === 'system-design') {
		return [
			'Who is the user, and what is the scale that actually hurts?',
			'Where is the bottleneck? What do you store, and why that shape?',
			'Name one failure mode and how you would notice it in production.',
		];
	}
	return [
		'What would you measure first, before touching the prompt?',
		'What would a weak eval hide that a production trace would not?',
		'Explain the idea to a teammate who has not read the paper or the doc.',
	];
}

export function reviewedOn(card: ReviewCard, day: string): boolean {
	return Boolean(card.lastReviewedAt && todayKey(new Date(card.lastReviewedAt)) === day);
}

function pack(card: ReviewCard, item: RoadmapItem, today: string): ReviewQueueItem {
	return {
		card,
		item,
		overdueDays: Math.max(0, diffDays(card.dueDate, today)),
	};
}

function interleave(rows: ReviewQueueItem[]): ReviewQueueItem[] {
	const buckets = new Map<TrackId, ReviewQueueItem[]>();
	for (const row of rows) {
		const list = buckets.get(row.item.trackId) ?? [];
		list.push(row);
		buckets.set(row.item.trackId, list);
	}
	const keys = [...buckets.keys()];
	const out: ReviewQueueItem[] = [];
	let leftover = rows.length;
	while (leftover > 0) {
		for (const key of keys) {
			const next = buckets.get(key)?.shift();
			if (next) {
				out.push(next);
				leftover -= 1;
			}
		}
	}
	return out;
}

export function dueQueue(
	cards: ReviewCard[],
	items: RoadmapItem[],
	today = todayKey(),
	trackId: TrackId | 'all' = 'all',
): ReviewQueueItem[] {
	const byId = new Map(items.filter((item) => item.done).map((item) => [item.id, item]));
	const due = cards
		.filter((card) => card.dueDate <= today && byId.has(card.itemId))
		.filter((card) => trackId === 'all' || card.trackId === trackId)
		.map((card) => pack(card, byId.get(card.itemId)!, today))
		.sort((a, b) => b.overdueDays - a.overdueDays || a.item.order - b.item.order);
	return interleave(due);
}

export function upcomingQueue(
	cards: ReviewCard[],
	items: RoadmapItem[],
	today = todayKey(),
	horizonDays = 7,
): ReviewQueueItem[] {
	const byId = new Map(items.filter((item) => item.done).map((item) => [item.id, item]));
	const end = addDays(today, horizonDays);
	return cards
		.filter((card) => card.dueDate > today && card.dueDate <= end && byId.has(card.itemId))
		.map((card) => pack(card, byId.get(card.itemId)!, today))
		.sort((a, b) => a.card.dueDate.localeCompare(b.card.dueDate) || a.item.order - b.item.order);
}

export function syncReviewCards(
	items: RoadmapItem[],
	cards: ReviewCard[],
	today = todayKey(),
): { cards: ReviewCard[]; upserts: ReviewCard[]; removed: string[] } {
	const existing = new Map(cards.filter((card) => card?.id).map((card) => [card.itemId, card]));
	const upserts: ReviewCard[] = [];
	const next: ReviewCard[] = [];
	const keep = new Set<string>();
	for (const item of items) {
		if (!item.done) {
			continue;
		}
		keep.add(item.id);
		const prior = existing.get(item.id);
		if (prior) {
			const aligned = prior.trackId === item.trackId ? prior : { ...prior, trackId: item.trackId };
			next.push(aligned);
			if (aligned !== prior) {
				upserts.push(aligned);
			}
			continue;
		}
		const seeded = seedReviewCard(item, today);
		next.push(seeded);
		upserts.push(seeded);
	}
	const removed = cards.filter((card) => card?.id && !keep.has(card.itemId)).map((card) => card.id);
	return { cards: next, upserts, removed };
}
