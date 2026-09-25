import { PRIORITIES } from '../constants';
import type { Priority } from '../types';

export function PriorityPills({
	value,
	onChange,
}: {
	value: Priority | null | undefined;
	onChange: (value: Priority | null) => void;
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
						onClick={() => onChange(value === entry.value ? null : entry.value)}
						title={entry.hint}
					>
						{entry.label}
					</button>
				))}
			</div>
		</>
	);
}
