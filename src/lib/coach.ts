import { TRACK_IDS, enabledTrackIds, firstName, trackMeta } from '../constants';
import { happeningForDate } from './happenings';
import { completionCounts } from './day';
import { lastNDates, todayKey } from './time';
import type { CoachNote, Completion, DayCount, RoadmapItem, Settings, TodayPlan, TrackId, TrackStats } from '../types';

function mean(values: number[]): number {
	if (values.length === 0) {
		return 0;
	}
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdev(values: number[]): number {
	if (values.length < 2) {
		return 0;
	}
	const avg = mean(values);
	const variance = mean(values.map((value) => (value - avg) ** 2));
	return Math.sqrt(variance);
}

function median(values: number[]): number {
	if (values.length === 0) {
		return 0;
	}
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function countsFor(rows: Completion[], trackId: TrackId | 'all', dates: string[]): DayCount[] {
	return completionCounts(rows, trackId, dates);
}

export function streakFor(days: DayCount[], end = todayKey()): number {
	let streak = 0;
	for (let index = days.length - 1; index >= 0; index -= 1) {
		const day = days[index];
		if (day.date > end) {
			continue;
		}
		if (day.date === end && day.count === 0) {
			continue;
		}
		if (day.count > 0) {
			streak += 1;
		} else {
			break;
		}
	}
	return streak;
}

export function trackStats(
	trackId: TrackId,
	items: RoadmapItem[],
	completions: Completion[],
	settings: Settings,
): TrackStats {
	const owned = items.filter((item) => item.trackId === trackId);
	const done = owned.filter((item) => item.done).length;
	const nextItems = owned.filter((item) => !item.done).slice(0, 5);
	const last7 = countsFor(completions, trackId, lastNDates(7));
	return {
		trackId,
		total: owned.length,
		done,
		percent: owned.length === 0 ? 0 : Math.round((done / owned.length) * 100),
		currentSection: nextItems[0]?.section ?? (owned.length > 0 ? 'Complete' : 'Drop a roadmap'),
		nextItems,
		streak: streakFor(last7),
		todayCount: last7[last7.length - 1]?.count ?? 0,
		target: settings.dailyTargets[trackId],
		last7,
	};
}

export function sustainableTarget(days: DayCount[], current: number): number {
	const nonzero = days.map((day) => day.count).filter((count) => count > 0);
	if (nonzero.length === 0) {
		return current;
	}
	const floor = Math.max(1, Math.round(median(nonzero) * 0.75));
	return Math.min(current, floor) === 0 ? 1 : Math.max(1, Math.min(current, floor) || floor);
}

export function consistencyScore(days: DayCount[]): number {
	if (days.every((day) => day.count === 0)) {
		return 0;
	}
	const values = days.map((day) => day.count);
	const active = values.filter((count) => count > 0).length;
	const coverage = active / days.length;
	const avg = mean(values);
	const cv = avg === 0 ? 1 : stdev(values) / avg;
	const smoothness = Math.max(0, 1 - Math.min(cv, 1.6) / 1.6);
	return Math.round(100 * (0.55 * coverage + 0.45 * smoothness));
}

export function coachNote(stats: TrackStats[], completions: Completion[], name = ''): CoachNote {
	const today = todayKey();
	const all7 = countsFor(completions, 'all', lastNDates(7));
	const values = all7.map((day) => day.count);
	const activeDays = values.filter((count) => count > 0).length;
	const overallStreak = streakFor(all7);
	const score = consistencyScore(all7);
	const spiky = activeDays >= 2 && stdev(values) > mean(values) * 0.7;
	const neglected = stats
		.filter((track) => track.total > 0)
		.find((track) => track.last7.every((day) => day.count === 0));
	const dsa = stats.find((track) => track.trackId === 'dsa');
	const ai = stats.find((track) => track.trackId === 'ai-engineering');
	const first = name ? firstName(name) : '';

	if (completions.length === 0) {
		return {
			tone: 'start',
			headline: first ? `${first}, start in two minutes.` : 'Start in two minutes.',
			body: 'Activation energy is the blocker, not the syllabus. Open Lab or the next lesson, blurt one messy paragraph, then apply. Watching a video does not count. Complete with one sentence of what you learned.',
		};
	}

	if (overallStreak >= 5) {
		return {
			tone: 'protect',
			headline: `Day ${overallStreak}. Protect it${first ? `, ${first}` : ''}.`,
			body: 'Do not raise volume tonight. Hit the floor, mark the next checklist item, stop. Streaks break when people get ambitious on a good day.',
		};
	}

	if (spiky) {
		const sample = values.filter((count) => count > 0);
		const high = Math.max(...sample);
		const suggested = Math.max(1, Math.round(median(sample) * 0.8));
		return {
			tone: 'floor',
			headline: 'The volume is there. The floor is not.',
			body: `${first ? `${first}: a` : 'A'} ${high}-item day next to a zero does not compound. Set ${suggested} as the number you still do when energy is low. Extra on a good day is a bonus, not the plan.`,
		};
	}

	if (neglected && activeDays >= 3) {
		const meta = trackMeta(neglected.trackId);
		return {
			tone: 'rotate',
			headline: `${meta.label} has been quiet.`,
			body: `DSA will get you the interview. ${meta.label} is what you actually ship. One ${meta.unit} today keeps the resume field warm without crowding the grind.`,
		};
	}

	if (dsa && ai && dsa.todayCount + dsa.last7.slice(0, 6).reduce((sum, day) => sum + day.count, 0) > 0) {
		const weekDsa = dsa.last7.reduce((sum, day) => sum + day.count, 0);
		const weekAi = ai.last7.reduce((sum, day) => sum + day.count, 0);
		if (weekDsa >= 8 && weekAi === 0) {
			return {
				tone: 'rotate',
				headline: 'DSA is moving. AI engineering is the job.',
				body: `${first ? `${first}, you` : 'You'} are applying as an ML engineer. Keep the DSA floor, then spend one block on evals, agents, or a production write-up. That is the field on the resume.`,
			};
		}
	}

	if (score >= 70 && overallStreak >= 3) {
		return {
			tone: 'steady',
			headline: 'This is what compounding looks like.',
			body: `Coverage is ${score} on a 100-point cadence score. Keep the same target. When it feels automatic for a week, bump one track by 1.`,
		};
	}

	if (all7[all7.length - 1]?.count === 0 && today) {
		return {
			tone: 'start',
			headline: first ? `${first}, today is still open.` : 'Today is still open.',
			body: 'Do the happening, not a new playlist. Blurt, apply, one sentence on Complete. Familiarizing with a video is not the session.',
		};
	}

	return {
		tone: 'steady',
		headline: first ? `${first}: produce it, then stop.` : 'Produce it, then stop.',
		body: 'Cover the notes. Dump what you remember. Do the thing you will be tested on. Write what you learned so next week you can see the interest, not just the streak.',
	};
}

export function todayPlan(stats: TrackStats[], settings: Settings): TodayPlan {
	const empty: TodayPlan = {
		trackId: settings.focusTrack,
		reason: 'Pick a course to get a plan.',
		target: 1,
		items: [],
		also: null,
	};
	if (stats.length === 0) {
		return empty;
	}
	const today = todayKey();
	const weekday = new Date().getDay();
	const weekend = weekday === 0 || weekday === 6;
	const enabled = enabledTrackIds(settings);
	const ids = enabled.length > 0 ? enabled : TRACK_IDS;
	const focus = ids.includes(settings.focusTrack) ? settings.focusTrack : ids[0];
	const rotation: TrackId[] = weekend
		? [focus, ...ids.filter((id) => id !== focus)]
		: focus === 'dsa'
			? ['dsa', ...ids.filter((id) => id !== 'dsa')]
			: ids.includes('dsa')
				? ['dsa', focus, ...ids.filter((id) => id !== 'dsa' && id !== focus)]
				: [focus, ...ids.filter((id) => id !== focus)];

	const quiet = stats
		.filter((track) => track.total > 0 && track.percent < 100)
		.sort((a, b) => {
			const aQuiet = a.last7.filter((day) => day.count === 0).length;
			const bQuiet = b.last7.filter((day) => day.count === 0).length;
			return bQuiet - aQuiet || rotation.indexOf(a.trackId) - rotation.indexOf(b.trackId);
		});

	const happeningTrack = happeningForDate(today).trackId;
	const happeningOk = happeningTrack && ids.includes(happeningTrack) ? happeningTrack : undefined;

	const preferred =
		(happeningOk
			? quiet.find((track) => track.trackId === happeningOk && track.todayCount < track.target)
			: undefined) ??
		quiet.find((track) => track.trackId === settings.activeTrack && track.todayCount < track.target) ??
		quiet.find((track) => track.todayCount < track.target) ??
		quiet[0] ??
		stats.find((track) => track.trackId === settings.activeTrack) ??
		stats[0];

	const also =
		stats.find(
			(track) =>
				track.trackId !== preferred.trackId &&
				track.total > 0 &&
				track.percent < 100 &&
				track.last7.every((day) => day.date === today || day.count === 0),
		)?.trackId ?? null;

	const reason =
		preferred.todayCount >= preferred.target
			? 'Floor is already hit. If you have leftover energy, take the next item and stop.'
			: happeningOk && preferred.trackId === happeningOk
				? `Today’s happening is ${trackMeta(preferred.trackId).label}. Blurt, apply, then one sentence of what you learned.`
				: preferred.last7.slice(0, 6).every((day) => day.count === 0)
					? `${trackMeta(preferred.trackId).label} needs a day so it does not go cold.`
					: `Stay on ${trackMeta(preferred.trackId).label}. Next unfinished section: ${preferred.currentSection}.`;

	return {
		trackId: preferred.trackId,
		reason,
		target: Math.max(1, preferred.target - preferred.todayCount),
		items: preferred.nextItems.slice(0, 4),
		also,
	};
}

export function suggestedFloor(days: DayCount[], current: number): number {
	return sustainableTarget(days, current);
}

export function heatmapDays(completions: Completion[], weeks = 16): DayCount[] {
	return countsFor(completions, 'all', lastNDates(weeks * 7));
}
