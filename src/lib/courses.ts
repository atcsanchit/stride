import { TRACK_IDS, sanitizeEnabledTracks } from '../constants';
import type { ProgressSnapshot } from './db';
import type { Settings, TrackId } from '../types';

export function hasOwnProgress(snapshot: Pick<ProgressSnapshot, 'tickets' | 'completions' | 'items' | 'roadmaps' | 'sprints'>): boolean {
	return (
		snapshot.tickets.length > 0 ||
		snapshot.completions.length > 0 ||
		snapshot.sprints.length > 0 ||
		snapshot.items.some((item) => item.done) ||
		snapshot.roadmaps.some((roadmap) => roadmap.origin === 'dropped')
	);
}

export function withEnabledTracks(settings: Settings, tracks: TrackId[]): Settings {
	const enabledTracks = sanitizeEnabledTracks(tracks);
	if (enabledTracks.length === 0) {
		throw new Error('Pick at least one course.');
	}
	const focusTrack = enabledTracks.includes(settings.focusTrack) ? settings.focusTrack : enabledTracks[0];
	const activeTrack = enabledTracks.includes(settings.activeTrack) ? settings.activeTrack : enabledTracks[0];
	return { ...settings, enabledTracks, focusTrack, activeTrack };
}

export function grandfatherEnabledTracks(settings: Settings): Settings {
	if (sanitizeEnabledTracks(settings.enabledTracks).length > 0) {
		return { ...settings, enabledTracks: sanitizeEnabledTracks(settings.enabledTracks) };
	}
	return withEnabledTracks(settings, TRACK_IDS);
}
