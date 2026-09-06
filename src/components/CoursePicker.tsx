import { TRACKS } from '../constants';
import type { TrackId } from '../types';

export function CoursePicker({
	selected,
	onToggle,
}: {
	selected: TrackId[];
	onToggle: (trackId: TrackId) => void;
}) {
	return (
		<div className="course-grid">
			{TRACKS.map((track) => {
				const on = selected.includes(track.id);
				return (
					<button
						key={track.id}
						className={on ? 'course-card is-on' : 'course-card'}
						type="button"
						aria-pressed={on}
						onClick={() => onToggle(track.id)}
						style={{ ['--accent' as string]: track.accent }}
					>
						<span className="course-check" aria-hidden="true">
							{on ? '✓' : ''}
						</span>
						<span className="course-copy">
							<span className="kicker">{on ? 'On this account' : 'Hidden until you add it'}</span>
							<strong>{track.label}</strong>
							<p>{track.blurb}</p>
						</span>
					</button>
				);
			})}
		</div>
	);
}
