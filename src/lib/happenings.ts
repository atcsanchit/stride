import type { Completion, TrackId, View } from '../types';
import { addDays, todayKey, weekStart, weekdayLabel } from './time';

export type HappeningId = 'spark' | 'dsa-apply' | 'ai-ship' | 'design-board' | 'blurt' | 'public' | 'trail';

export type Happening = {
	id: HappeningId;
	date: string;
	weekday: string;
	chip: string;
	kicker: string;
	title: string;
	body: string;
	cta: string;
	view: View;
	trackId?: TrackId;
};

/** Erin Meryl: learning is production. One live event per weekday, not a pile of todos. */
const SCRIPT: Array<Omit<Happening, 'date' | 'weekday'>> = [
	{
		id: 'trail',
		chip: 'Trail',
		kicker: 'Sunday · interest trail',
		title: 'What did you actually learn this week?',
		body: 'Read the sentences you logged. The point of tracking is to see which topics keep pulling you, then double down there instead of collecting more classes.',
		cta: 'Open Revise',
		view: { name: 'revise' },
	},
	{
		id: 'spark',
		chip: 'Spark',
		kicker: 'Monday · activation energy',
		title: 'Start in two minutes. Do not plan the hour.',
		body: 'Procrastination is emotion + distance + ambiguity + friction. Open Lab or the next lesson, type one function or one blurt line, then the session has already begun.',
		cta: 'Open Lab',
		view: { name: 'lab' },
		trackId: 'dsa',
	},
	{
		id: 'dsa-apply',
		chip: 'DSA',
		kicker: 'Tuesday · apply DSA',
		title: 'One problem from a blank editor.',
		body: 'Familiarizing is not learning. Do not reread the pattern notes first. Blurt the approach, then code. The solution tab is for after you are stuck, not before.',
		cta: 'Open DSA',
		view: { name: 'track', trackId: 'dsa' },
		trackId: 'dsa',
	},
	{
		id: 'ai-ship',
		chip: 'Ship',
		kicker: 'Wednesday · ship AI',
		title: 'A tiny artifact, not another lecture.',
		body: 'Watching a RAG video is familiarity. Pushing a traced eval, a retrieval table, or a failing test is learning. One GitHub URL beats three certificates.',
		cta: 'Open AI Eng',
		view: { name: 'track', trackId: 'ai-engineering' },
		trackId: 'ai-engineering',
	},
	{
		id: 'design-board',
		chip: 'Board',
		kicker: 'Thursday · whiteboard',
		title: 'Twenty minutes, then wipe it.',
		body: 'Impermanence first: sketch the API, the data, the bottleneck, one tradeoff. Timed like the interview. Then redo it so the real one is not the first time.',
		cta: 'Open Design',
		view: { name: 'track', trackId: 'system-design' },
		trackId: 'system-design',
	},
	{
		id: 'blurt',
		chip: 'Blurt',
		kicker: 'Friday · 24-hour revisit',
		title: 'Blurt completed topics. Do not reread first.',
		body: 'After first contact you lose about half in a day unless you retrieve. Cover the notes, dump what you remember for 10 minutes, then check the holes.',
		cta: 'Open Revise',
		view: { name: 'revise' },
	},
	{
		id: 'public',
		chip: 'Public',
		kicker: 'Saturday · learn in public',
		title: 'One messy sentence the internet can see.',
		body: 'You do not wait until it is impressive. A README line, a gist, or a post about the miss you found is the proof. Private notes do not compound the same way.',
		cta: 'Open write-ups',
		view: { name: 'track', trackId: 'ai-engineering' },
		trackId: 'ai-engineering',
	},
];

export function happeningForDate(date = todayKey()): Happening {
	const weekday = new Date(`${date}T12:00:00`).getDay();
	const script = SCRIPT[weekday];
	return {
		...script,
		date,
		weekday: weekdayLabel(date),
	};
}

export function weekHappenings(date = todayKey()): Happening[] {
	const start = weekStart(date);
	return Array.from({ length: 7 }, (_, index) => happeningForDate(addDays(start, index)));
}

export function learnedThisWeek(completions: Completion[], date = todayKey()): Completion[] {
	const start = weekStart(date);
	return completions
		.filter((row) => row.date >= start && row.date <= date && row.notes.trim())
		.sort((a, b) => b.completedAt - a.completedAt);
}
