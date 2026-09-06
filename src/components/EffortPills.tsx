import { EFFORTS } from '../constants';
import type { Score } from '../types';

export function EffortPills({
	value,
	onChange,
	label = 'Estimated effort',
}: {
	value: Score;
	onChange: (value: Score) => void;
	label?: string;
}) {
	return (
		<>
			<p className="field-label">{label}</p>
			<div className="meta-row">
				{EFFORTS.map((entry) => (
					<button
						key={entry.value}
						className={`pill effort-pill effort-${entry.value}${value === entry.value ? ' is-on' : ''}`}
						type="button"
						onClick={() => onChange(entry.value)}
					>
						{entry.label}
					</button>
				))}
			</div>
		</>
	);
}
