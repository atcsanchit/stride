import type { WorkSession } from '../types';

export function isSessionOpen(session: WorkSession): boolean {
	return !session.endedAt;
}

export function isSessionPaused(session: WorkSession): boolean {
	return !session.endedAt && Boolean(session.pausedAt);
}

export function isSessionRunning(session: WorkSession): boolean {
	return !session.endedAt && !session.pausedAt;
}

export function sessionElapsed(session: WorkSession, now = Date.now()): number {
	const base = session.elapsedMs ?? 0;
	if (session.endedAt) {
		if (session.elapsedMs != null) {
			return Math.max(0, session.elapsedMs);
		}
		return Math.max(0, session.endedAt - session.startedAt);
	}
	if (session.pausedAt) {
		return Math.max(0, base);
	}
	return Math.max(0, base + (now - session.startedAt));
}

export function pauseSession(session: WorkSession, now = Date.now()): WorkSession {
	if (!isSessionRunning(session)) {
		return session;
	}
	return {
		...session,
		elapsedMs: sessionElapsed(session, now),
		pausedAt: now,
	};
}

export function resumeSession(session: WorkSession, now = Date.now()): WorkSession {
	if (!isSessionOpen(session)) {
		return session;
	}
	return {
		...session,
		startedAt: now,
		pausedAt: undefined,
		elapsedMs: sessionElapsed(session, now),
	};
}

export function endSession(session: WorkSession, now = Date.now()): WorkSession {
	if (session.endedAt) {
		return session;
	}
	return {
		...session,
		elapsedMs: sessionElapsed(session, now),
		pausedAt: undefined,
		endedAt: now,
	};
}

export function openSessionForTicket(sessions: WorkSession[], ticketId: string): WorkSession | undefined {
	return sessions.find((session) => isSessionOpen(session) && session.ticketId === ticketId);
}
