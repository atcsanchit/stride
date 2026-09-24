import { STATUSES } from '../constants';
import type { TicketStatus } from '../types';

export function StatusPills({
	value,
	onChange,
	locked = false,
	omit = [],
}: {
	value: TicketStatus;
	onChange: (status: TicketStatus) => void;
	locked?: boolean;
	omit?: TicketStatus[];
}) {
	return (
		<>
			<p className="field-label">Status</p>
			<div className="meta-row status-row">
				{STATUSES.filter((entry) => !omit.includes(entry.value)).map((entry) => (
					<button
						key={entry.value}
						className={`pill status-pill status-${entry.value}${value === entry.value ? ' is-on' : ''}`}
						type="button"
						disabled={locked && entry.value !== value}
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
