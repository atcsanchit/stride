import { heatmapDays } from '../lib/coach';
import { prettyDate } from '../lib/time';
import { useStride } from '../store/StrideState';

function shade(count: number, max: number): string {
	if (count <= 0 || max <= 0) {
		return '#243044';
	}
	const t = Math.min(1, count / max);
	if (t < 0.25) {
		return '#2f5a6a';
	}
	if (t < 0.5) {
		return '#3f8a60';
	}
	if (t < 0.75) {
		return '#54b87e';
	}
	return '#6ecf9a';
}

export function Heatmap() {
	const { completions, openDay } = useStride();
	const days = heatmapDays(completions, 16);
	const max = Math.max(1, ...days.map((day) => day.count));

	return (
		<section className="heat-card">
			<div className="shelf-head">
				<div>
					<p className="eyebrow">Record</p>
					<h2>Daily course completions</h2>
				</div>
				<span className="muted">Click a day · only finished roadmap items</span>
			</div>
			<div className="heat-wrap">
				<div className="heat" role="list">
					{days.map((day) => (
						<button
							key={day.date}
							className="cell"
							type="button"
							role="listitem"
							title={`${prettyDate(day.date)} · ${day.count} course task${day.count === 1 ? '' : 's'}`}
							style={{ background: shade(day.count, max) }}
							onClick={() => openDay(day.date)}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
