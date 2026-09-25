import { useMemo, useState } from 'react';
import { choreClientPalette } from '../lib/ticket';
import type { ChoreDomain, Settings, Ticket } from '../types';
import { useStride } from '../store/StrideState';

const DOMAINS: Array<{ value: ChoreDomain; label: string }> = [
	{ value: 'peakflo', label: 'Peakflo' },
	{ value: 'personal', label: 'Personal' },
];

export function ChoreDomainFields({
	ticket,
	settings,
	disabled = false,
	onChange,
	onAddClient,
}: {
	ticket: Pick<Ticket, 'choreDomain' | 'choreClient'>;
	settings: Settings;
	disabled?: boolean;
	onChange: (patch: { choreDomain?: ChoreDomain | null; choreClient?: string | null }) => void;
	onAddClient: (name: string) => Promise<void> | void;
}) {
	const { tickets } = useStride();
	const [draft, setDraft] = useState('');
	const clients = useMemo(() => choreClientPalette(tickets, settings.choreClients), [settings.choreClients, tickets]);
	const domain = ticket.choreDomain;
	const client = ticket.choreClient?.trim() || '';

	async function addClient() {
		const name = draft.trim();
		if (!name || disabled) {
			return;
		}
		await onAddClient(name);
		onChange({ choreDomain: 'peakflo', choreClient: name });
		setDraft('');
	}

	return (
		<div className="ticket-link">
			<section className="ticket-link-block">
				<p className="field-label">Category</p>
				<div className="meta-row">
					{DOMAINS.map((entry) => (
						<button
							key={entry.value}
							className={domain === entry.value ? 'pill is-on' : 'pill'}
							type="button"
							disabled={disabled}
							onClick={() => {
								if (domain === entry.value) {
									onChange({ choreDomain: null, choreClient: null });
									return;
								}
								onChange({
									choreDomain: entry.value,
									choreClient: entry.value === 'peakflo' ? ticket.choreClient ?? null : null,
								});
							}}
						>
							{entry.label}
						</button>
					))}
				</div>
			</section>

			{domain === 'peakflo' ? (
				<section className="ticket-link-block is-open">
					<p className="field-label">Client</p>
					{clients.length > 0 ? (
						<div className="meta-row status-row">
							{clients.map((name) => {
								const on = client.toLowerCase() === name.toLowerCase();
								return (
									<button
										key={name}
										className={on ? 'pill is-on' : 'pill'}
										type="button"
										disabled={disabled}
										onClick={() => onChange({ choreClient: on ? null : name })}
									>
										{name}
									</button>
								);
							})}
						</div>
					) : (
						<p className="muted">No clients yet. Add one below.</p>
					)}
					{disabled ? null : (
						<div className="ticket-pr-add" style={{ marginTop: '0.55rem' }}>
							<input
								value={draft}
								onChange={(event) => setDraft(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === 'Enter') {
										event.preventDefault();
										void addClient();
									}
								}}
								placeholder="Add a client"
							/>
							<button type="button" className="primary" disabled={!draft.trim()} onClick={() => void addClient()}>
								Add
							</button>
						</div>
					)}
				</section>
			) : null}
		</div>
	);
}
