import type { Completion } from '../types';
import { formatMinutes, lastNDates, todayKey, weekEnd, weekStart } from './time';

export const CRAFT_GOAL_HOURS = 10_000;
/** Closed deliberate minutes that make a day count as “in the chair.” */
export const CHAIR_FLOOR_MS = 45 * 60_000;

export type CraftClock = {
	weekMs: number;
	yearMs: number;
	lifetimeMs: number;
};

export type ChairDay = {
	date: string;
	elapsedMs: number;
	metFloor: boolean;
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

export function metChairFloor(elapsedMs: number, floorMs = CHAIR_FLOOR_MS): boolean {
	return Math.max(0, elapsedMs) >= floorMs;
}

export function chairDays(completions: Completion[], weeks = 16, now = todayKey()): ChairDay[] {
	const dates = lastNDates(weeks * 7, now);
	const byDate = new Map<string, number>();
	for (const row of completions) {
		const elapsed = Math.max(0, row.elapsedMs || 0);
		if (elapsed <= 0 || !row.date) {
			continue;
		}
		byDate.set(row.date, (byDate.get(row.date) ?? 0) + elapsed);
	}
	return dates.map((date) => {
		const elapsedMs = byDate.get(date) ?? 0;
		return {
			date,
			elapsedMs,
			metFloor: metChairFloor(elapsedMs),
		};
	});
}
