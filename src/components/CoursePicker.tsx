import { listTrackMeta } from '../constants';
import type { TrackId } from '../types';
import { useStride } from '../store/StrideState';

export function CoursePicker({
	selected,
	onToggle,
}: {
	selected: TrackId[];
	onToggle: (trackId: TrackId) => void;
}) {
	const { settings } = useStride();
	const tracks = listTrackMeta(settings);
	return (
		<div className="course-grid">
			{tracks.map((track) => {
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
