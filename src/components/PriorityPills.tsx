import { PRIORITIES } from '../constants';
import type { Priority } from '../types';

export function PriorityPills({
	value,
	onChange,
}: {
	value: Priority;
	onChange: (value: Priority) => void;
}) {
	return (
		<>
			<p className="field-label">Priority</p>
			<div className="meta-row">
				{PRIORITIES.map((entry) => (
					<button
						key={entry.value}
						className={`pill prio-pill prio-${entry.value}${value === entry.value ? ' is-on' : ''}`}
						type="button"
						onClick={() => onChange(entry.value)}
						title={entry.hint}
					>
						{entry.label}
					</button>
				))}
			</div>
		</>
	);
}
