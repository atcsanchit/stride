import { TRACKS, trackMeta } from '../constants';
import type { Completion, DayCount, TrackId } from '../types';

export type DayBreakdown = {
	date: string;
	course: Completion[];
	other: Completion[];
	taskCount: number;
	minutes: number;
	avgEffort: number;
	avgReview: number;
	byTrack: Array<{ trackId: TrackId; label: string; accent: string; count: number; minutes: number }>;
};

function avg(values: number[]): number {
	if (values.length === 0) {
		return 0;
	}
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function isCourseCompletion(row: Completion): boolean {
	return Boolean(row.itemId);
}

export function dayBreakdown(date: string, completions: Completion[]): DayBreakdown {
	const rows = completions.filter((row) => row.date === date);
	const course = rows.filter(isCourseCompletion);
	const other = rows.filter((row) => !isCourseCompletion(row));
	const scored = course.length > 0 ? course : rows;
	return {
		date,
		course,
		other,
		taskCount: course.length,
		minutes: course.reduce((sum, row) => sum + row.minutes, 0),
		avgEffort: avg(scored.map((row) => row.effort)),
		avgReview: avg(scored.map((row) => row.review)),
		byTrack: TRACKS.map((track) => {
			const owned = course.filter((row) => row.trackId === track.id);
			return {
				trackId: track.id,
				label: trackMeta(track.id).short,
				accent: track.accent,
				count: owned.length,
				minutes: owned.reduce((sum, row) => sum + row.minutes, 0),
			};
		}),
	};
}

export function completionCounts(rows: Completion[], trackId: TrackId | 'all', dates: string[]): DayCount[] {
	const byDate = new Map<string, number>();
	for (const row of rows) {
		if (!isCourseCompletion(row)) {
			continue;
		}
		if (trackId !== 'all' && row.trackId !== trackId) {
			continue;
		}
		byDate.set(row.date, (byDate.get(row.date) ?? 0) + 1);
	}
	return dates.map((date) => ({ date, count: byDate.get(date) ?? 0 }));
}
