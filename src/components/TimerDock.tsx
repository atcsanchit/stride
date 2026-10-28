import { useEffect, useState } from 'react';
import { formatElapsed } from '../lib/time';
import { isSessionPaused, sessionElapsed } from '../lib/work-session';
import type { WorkSession } from '../types';
import { useStride } from '../store/StrideState';

export function TimerDock() {
	const { runningSessions, sessions, pauseTimer, resumeTimer, pauseTimerSession, resumeTimerSession, requestComplete } =
		useStride();
	const [now, setNow] = useState(Date.now());
	const [expanded, setExpanded] = useState(false);

	// Running sessions, newest first; then paused open-work sessions below them.
	const pausedOpen = sessions
		.filter((session) => isSessionPaused(session) && !session.endedAt)
		.sort((a, b) => b.startedAt - a.startedAt);
	const rows: WorkSession[] = [...runningSessions, ...pausedOpen];
	const runningCount = runningSessions.length;
	const pausedCount = rows.length - runningCount;
	const totalMs = rows.reduce((sum, session) => sum + sessionElapsed(session, now), 0);

	useEffect(() => {
		if (runningCount === 0) {
			return;
		}
		const timer = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(timer);
	}, [runningCount]);

	if (rows.length === 0) {
		return null;
	}

	if (rows.length === 1) {
		const activeSession = rows[0];
		const paused = isSessionPaused(activeSession);
		return (
			<div className={`timer-dock${paused ? ' is-paused' : ''}`}>
				<div>
					<p className="eyebrow">{paused ? 'Paused' : 'In progress'}</p>
					<strong>{activeSession.title}</strong>
				</div>
				<span className="timer-readout">{formatElapsed(sessionElapsed(activeSession, now))}</span>
				<div className="timer-dock-actions">
					{paused ? (
						<button
							type="button"
							onClick={() => {
								if (activeSession.ticketId) {
									void resumeTimer(activeSession.ticketId);
								} else {
									void resumeTimerSession(activeSession.id);
								}
							}}
						>
							Resume
						</button>
					) : (
						<button
							type="button"
							onClick={() => {
								if (activeSession.ticketId) {
									void pauseTimer(activeSession.ticketId);
								} else {
									void pauseTimerSession(activeSession.id);
								}
							}}
						>
							Pause
						</button>
					)}
					<button
						className="primary"
						type="button"
						onClick={() => requestComplete(activeSession.itemId, activeSession.ticketId)}
					>
						Complete
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className={`timer-dock timer-dock-stack${expanded ? ' is-open' : ''}`}>
			<button
				className="timer-dock-head"
				type="button"
				onClick={() => setExpanded((current) => !current)}
				aria-expanded={expanded}
			>
				<span className="timer-dock-dot" aria-hidden="true" />
				<span className="timer-dock-count">
					<strong>{runningCount}</strong> timer{runningCount === 1 ? '' : 's'} running
					{pausedCount > 0 ? ` · ${pausedCount} paused` : ''}
				</span>
				<span className="timer-readout">{formatElapsed(totalMs)}</span>
				<span className="timer-dock-chevron" aria-hidden="true">
					{expanded ? '▾' : '▸'}
				</span>
			</button>
			{expanded ? (
				<div className="timer-stack">
					{rows.map((session) => {
						const paused = isSessionPaused(session);
						return (
							<div key={session.id} className={`timer-row${paused ? ' is-paused' : ''}`}>
								<div className="timer-row-main">
									<span className={`timer-row-state${paused ? ' is-paused' : ''}`}>
										{paused ? 'paused' : 'running'}
									</span>
									<strong>{session.title}</strong>
									<span className="timer-readout">{formatElapsed(sessionElapsed(session, now))}</span>
								</div>
								<div className="timer-row-actions">
									{paused ? (
										<button
											type="button"
											onClick={() => {
												if (session.ticketId) {
													void resumeTimer(session.ticketId);
												} else {
													void resumeTimerSession(session.id);
												}
											}}
										>
											Resume
										</button>
									) : (
										<button
											type="button"
											onClick={() => {
												if (session.ticketId) {
													void pauseTimer(session.ticketId);
												} else {
													void pauseTimerSession(session.id);
												}
											}}
										>
											Pause
										</button>
									)}
									<button
										className="primary"
										type="button"
										onClick={() => requestComplete(session.itemId, session.ticketId)}
									>
										Complete
									</button>
								</div>
							</div>
						);
					})}
				</div>
			) : null}
		</div>
	);
}
