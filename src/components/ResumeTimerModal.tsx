export function ResumeTimerModal({
	title,
	onResume,
	onLater,
}: {
	title: string;
	onResume: () => void;
	onLater: () => void;
}) {
	return (
		<div className="modal-root" role="dialog">
			<div className="modal">
				<p className="eyebrow">Timer paused</p>
				<h2>{title}</h2>
				<p className="muted">
					The timer for this ticket is paused, so it is not counting right now. Resume it, or leave it paused and come
					back later.
				</p>
				<div className="log-actions">
					<button className="primary" type="button" onClick={onResume}>
						Resume now
					</button>
					<button type="button" onClick={onLater}>
						Later
					</button>
				</div>
			</div>
		</div>
	);
}
