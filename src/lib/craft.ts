import type { Completion } from '../types';
import { formatMinutes, todayKey, weekEnd, weekStart } from './time';

export const CRAFT_GOAL_HOURS = 10_000;

export type CraftClock = {
	weekMs: number;
	yearMs: number;
	lifetimeMs: number;
};

function yearPrefix(now = todayKey()): string {
	return now.slice(0, 4);
}

export function craftClock(completions: Completion[], now = todayKey()): CraftClock {
	const weekFrom = weekStart(now);
	const weekTo = weekEnd(weekFrom);
	const year = yearPrefix(now);
	let weekMs = 0;
	let yearMs = 0;
	let lifetimeMs = 0;
	for (const row of completions) {
		const elapsed = Math.max(0, row.elapsedMs || 0);
		if (elapsed <= 0) {
			continue;
		}
		lifetimeMs += elapsed;
		if (row.date.startsWith(year)) {
			yearMs += elapsed;
		}
		if (row.date >= weekFrom && row.date <= weekTo) {
			weekMs += elapsed;
		}
	}
	return { weekMs, yearMs, lifetimeMs };
}

export function formatCraftHours(ms: number): string {
	return formatMinutes(Math.round(Math.max(0, ms) / 60_000));
}
