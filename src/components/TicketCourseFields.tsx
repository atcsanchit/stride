import { useState } from 'react';
import { TRACKS, enabledTrackIds, trackMeta } from '../constants';
import {
	courseRepo,
	mismatchedPullRequests,
	parsePullRequest,
	sameRepo,
	ticketPrKey,
} from '../lib/github-pr';
import type { Settings, Ticket, TicketPullRequest, TrackId } from '../types';

export function TicketCourseFields({
	ticket,
	settings,
	disabled = false,
	onChange,
}: {
	ticket: Pick<Ticket, 'id' | 'prKey' | 'courseId' | 'needsPr' | 'pullRequests'>;
	settings: Settings;
	disabled?: boolean;
	onChange: (patch: { courseId?: TrackId; needsPr?: boolean; pullRequests?: TicketPullRequest[] }) => void;
}) {
	const [draft, setDraft] = useState('');
	const [error, setError] = useState('');
	const [copied, setCopied] = useState(false);
	const pulls = ticket.pullRequests ?? [];
	const needsPr = ticket.needsPr === true;
	const repo = courseRepo(settings, ticket.courseId);
	const wrong = mismatchedPullRequests(ticket, settings);
	const key = ticketPrKey(ticket);
	const enabled = enabledTrackIds(settings);
	const courses = TRACKS.filter((track) => enabled.length === 0 || enabled.includes(track.id));
	const courseLabel = ticket.courseId ? trackMeta(ticket.courseId).label : 'this course';

	function addPull() {
		setError('');
		if (!ticket.courseId) {
			setError('Choose a course first.');
			return;
		}
		const parsed = parsePullRequest(draft);
		if (!parsed) {
			setError('Paste a pull request URL.');
			return;
		}
		if (pulls.some((row) => row.url === parsed.url)) {
			setError('Already linked.');
			return;
		}
		onChange({ pullRequests: [...pulls, parsed] });
		setDraft('');
	}

	async function copyKey() {
		if (!ticket.id) {
			return;
		}
		try {
			await navigator.clipboard.writeText(key);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1200);
		} catch {
			setError('Could not copy the tag.');
		}
	}

	return (
		<div className="ticket-link">
			<section className="ticket-link-block">
				<div className="ticket-link-head">
					<p className="field-label">Course</p>
					{ticket.id ? (
						<button
							type="button"
							className="ticket-pr-tag"
							disabled={disabled}
							onClick={() => void copyKey()}
							title="Copy into each pull request title"
						>
							{copied ? 'Copied' : key}
						</button>
					) : (
						<span className="ticket-pr-tag is-pending">Tag on create</span>
					)}
				</div>
				<div className="meta-row">
					{courses.map((track) => (
						<button
							key={track.id}
							className={ticket.courseId === track.id ? 'pill is-on' : 'pill'}
							type="button"
							disabled={disabled}
							onClick={() => onChange({ courseId: track.id })}
						>
							{track.short}
						</button>
					))}
				</div>
			</section>

			<section className={`ticket-link-block${needsPr ? ' is-open' : ''}${wrong.length > 0 ? ' has-wrong-pr' : ''}`}>
				<button
					type="button"
					className={`ticket-pr-toggle${needsPr ? ' is-on' : ''}`}
					disabled={disabled}
					aria-pressed={needsPr}
					onClick={() => onChange({ needsPr: !needsPr })}
				>
					<span>
						<strong>Pull requests</strong>
						<em>{needsPr ? 'Required to complete' : 'Optional'}</em>
					</span>
					<span className="ticket-pr-switch" aria-hidden />
				</button>

				{needsPr ? (
					<div className="ticket-prs">
						<p className="muted ticket-pr-repo">
							{repo ? (
								<>
									Expected repo: {repo.owner}/{repo.repo}
								</>
							) : ticket.courseId ? (
								<>Set this course’s repository in Profile.</>
							) : (
								<>Choose a course first.</>
							)}
						</p>

						{wrong.length > 0 ? (
							<p className="ticket-pr-wrong" role="alert">
								{wrong.length === 1 ? (
									<>
										Wrong pull request for {courseLabel}.{' '}
										<a href={wrong[0].url} target="_blank" rel="noreferrer">
											{wrong[0].owner}/{wrong[0].repo}#{wrong[0].number}
										</a>{' '}
										is not from {repo ? `${repo.owner}/${repo.repo}` : 'this course’s repository'}.
									</>
								) : (
									<>
										{wrong.length} pull requests are tagged to the wrong repository for {courseLabel}.
										{repo ? ` Use ${repo.owner}/${repo.repo}.` : ''}
									</>
								)}
							</p>
						) : null}

						{pulls.length > 0 ? (
							<ul className="ticket-pr-list">
								{pulls.map((row) => {
									const ok = Boolean(repo && sameRepo(row, repo));
									return (
										<li key={row.url} className={ok ? undefined : 'is-wrong'}>
											<a href={row.url} target="_blank" rel="noreferrer">
												{row.owner}/{row.repo}#{row.number}
											</a>
											{ok ? null : <span className="ticket-pr-badge">Wrong repo</span>}
											{disabled ? null : (
												<button
													type="button"
													className="ticket-pr-remove"
													onClick={() =>
														onChange({ pullRequests: pulls.filter((entry) => entry.url !== row.url) })
													}
												>
													×
												</button>
											)}
										</li>
									);
								})}
							</ul>
						) : (
							<p className="muted">None linked yet.</p>
						)}

						{disabled ? null : (
							<div className="ticket-pr-add">
								<input
									value={draft}
									onChange={(event) => {
										setDraft(event.target.value);
										if (error) {
											setError('');
										}
									}}
									onKeyDown={(event) => {
										if (event.key === 'Enter') {
											event.preventDefault();
											addPull();
										}
									}}
									placeholder="github.com/…/pull/12"
								/>
								<button type="button" className="primary" onClick={addPull} disabled={!draft.trim()}>
									Add
								</button>
							</div>
						)}
						{error ? <p className="error">{error}</p> : null}
					</div>
				) : null}
			</section>
		</div>
	);
}
