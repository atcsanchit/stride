import { useEffect, useState } from 'react';
import { formatElapsed } from '../lib/time';
import { isSessionPaused, sessionElapsed } from '../lib/work-session';
import { useStride } from '../store/StrideState';

export function TimerDock() {
	const { activeSession, pauseTimer, resumeTimer, startTask, requestComplete } = useStride();
	const [now, setNow] = useState(Date.now());
	const paused = Boolean(activeSession && isSessionPaused(activeSession));

	useEffect(() => {
		if (!activeSession || paused) {
			return;
		}
		const timer = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(timer);
	}, [activeSession, paused]);

	if (!activeSession) {
		return null;
	}

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
								void startTask(activeSession.itemId);
							}
						}}
					>
						Resume
					</button>
				) : (
					<button type="button" onClick={() => void pauseTimer(activeSession.ticketId)}>
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
