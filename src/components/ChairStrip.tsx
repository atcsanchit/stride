import { CHAIR_FLOOR_MS, chairDays, formatCraftHours } from '../lib/craft';
import { prettyDate, todayKey } from '../lib/time';
import { useStride } from '../store/StrideState';

function shade(elapsedMs: number, floorMs: number): string {
	if (elapsedMs <= 0) {
		return '#243044';
	}
	if (elapsedMs < floorMs) {
		return '#2f5a6a';
	}
	const t = Math.min(1, elapsedMs / (floorMs * 3));
	if (t < 0.34) {
		return '#3f8a60';
	}
	if (t < 0.67) {
		return '#54b87e';
	}
	return '#6ecf9a';
}

export function ChairStrip() {
	const { completions, openDay } = useStride();
	const days = chairDays(completions, 16);
	const today = days.find((day) => day.date === todayKey());
	const todayMs = today?.elapsedMs ?? 0;
	const todayMet = today?.metFloor ?? false;
	const floorLabel = formatCraftHours(CHAIR_FLOOR_MS);

	return (
		<section className="heat-card chair-strip" aria-label="Daily chair time">
			<div className="shelf-head">
				<div>
					<p className="eyebrow">Chair time</p>
					<h2>Daily closed hours</h2>
				</div>
				<span className="muted">
					Today {formatCraftHours(todayMs)}
					{todayMet ? ' · floor met' : ` · floor ${floorLabel}`}
				</span>
			</div>
			<p className="muted chair-strip-note">
				Green when a day closes ≥{floorLabel}. Course heatmap still counts finished lessons; this counts timer time.
			</p>
			<div className="heat-wrap">
				<div className="heat" role="list">
					{days.map((day) => (
						<button
							key={day.date}
							className={`cell${day.metFloor ? ' is-chair' : ''}${day.date === todayKey() ? ' is-today' : ''}`}
							type="button"
							role="listitem"
							title={`${prettyDate(day.date)} · ${formatCraftHours(day.elapsedMs)}${day.metFloor ? ' · floor met' : ''}`}
							style={{ background: shade(day.elapsedMs, CHAIR_FLOOR_MS) }}
							onClick={() => openDay(day.date)}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
