import { useState } from 'react';
import { REVIEWS } from '../constants';
import { parseGitHubUrls, ticketNeedsPracticalEvidence, ticketPracticalChallenges } from '../lib/practical';
import { formatElapsed } from '../lib/time';
import { ticketTopics } from '../lib/ticket';
import { sessionElapsed } from '../lib/work-session';
import type { Score } from '../types';
import { useStride } from '../store/StrideState';
import { EffortPills } from './EffortPills';
import { PracticalChallengeCard } from './PracticalChallengeCard';

export function CompleteModal() {
	const { pendingItemId, pendingTicketId, items, tickets, activeSession, submitComplete, cancelComplete } = useStride();
	const [effort, setEffort] = useState<Score>(3);
	const [review, setReview] = useState<Score>(3);
	const [notes, setNotes] = useState('');
	const [evidenceNotes, setEvidenceNotes] = useState('');
	const [evidenceLinks, setEvidenceLinks] = useState('');
	if (pendingItemId === null && !pendingTicketId) {
		return null;
	}

	const item = pendingItemId ? items.find((entry) => entry.id === pendingItemId) : undefined;
	const ticket = pendingTicketId ? tickets.find((entry) => entry.id === pendingTicketId) : undefined;
	const tagged = ticket && ticket.kind !== 'chore' ? ticketTopics(ticket, items).filter((entry) => !entry.done) : [];
	const challenges = ticket ? ticketPracticalChallenges(ticket, items) : [];
	const needsEvidence = Boolean(ticket && ticketNeedsPracticalEvidence(ticket, items));
	const githubUrls = parseGitHubUrls(evidenceLinks);
	const title = item?.title ?? ticket?.title ?? 'Task';
	const elapsed =
		activeSession &&
		((pendingItemId && activeSession.itemId === pendingItemId) || (ticket && activeSession.ticketId === ticket.id))
			? sessionElapsed(activeSession)
			: 0;

	return (
		<div className="modal-root" role="dialog">
			<form
				className="modal"
				onSubmit={(event) => {
					event.preventDefault();
					if (needsEvidence && (!evidenceNotes.trim() || githubUrls.length === 0)) {
						return;
					}
					if (notes.trim().length < 12) {
						return;
					}
					void submitComplete({
						effort,
						review,
						notes,
						evidenceNotes: evidenceNotes.trim(),
						evidenceUrls: githubUrls,
					});
				}}
			>
				<p className="eyebrow">Close the loop</p>
				<h2>{title}</h2>
				<p className="muted">Familiarizing is not learning. If you only watched or reread, do not complete this yet.</p>
				{ticket ? (
					<p className="muted">
						Time on this ticket: {formatElapsed(elapsed)}.
						{ticket.kind === 'chore'
							? ' This is desk work, so the course heatmap will not change.'
							: tagged.length
								? ` Completing it will mark ${tagged.length} tagged course ${tagged.length === 1 ? 'item' : 'items'} done and count them on the heatmap.`
								: ' No open tagged course items, so the heatmap will not change.'}
					</p>
				) : (
					<p className="muted">Time on this task: {formatElapsed(elapsed)}. Heatmap only counts loaded course items.</p>
				)}
				{tagged.length > 0 ? (
					<ul className="topic-chips" style={{ marginBottom: '0.8rem' }}>
						{tagged.map((entry) => (
							<li key={entry.id} className={`topic-chip is-static tag-chip tag-track-${entry.trackId}`}>
								{entry.title}
							</li>
						))}
					</ul>
				) : null}
				<PracticalChallengeCard challenges={challenges} />
				<p className="field-label">Review</p>
				<div className="meta-row">
					{REVIEWS.map((entry) => (
						<button
							key={entry.value}
							className={review === entry.value ? 'pill is-on' : 'pill'}
							type="button"
							onClick={() => setReview(entry.value)}
						>
							{entry.label}
						</button>
					))}
				</div>
				<EffortPills value={effort} onChange={setEffort} label="Effort" />
				<label className="field">
					What I learned
					<textarea
						value={notes}
						onChange={(event) => setNotes(event.target.value)}
						placeholder="One honest sentence. This is how you track the interest over weeks — not which video you watched."
						required
						minLength={12}
					/>
				</label>
				{needsEvidence ? (
					<>
						<label className="field">
							What you shipped
							<textarea
								value={evidenceNotes}
								onChange={(event) => setEvidenceNotes(event.target.value)}
								placeholder="What you built, how you tested it, and the number or failure you can point to."
								required
							/>
						</label>
						<label className="field">
							GitHub evidence
							<textarea
								value={evidenceLinks}
								onChange={(event) => setEvidenceLinks(event.target.value)}
								placeholder="https://github.com/you/repo or a gist — one URL per line"
								required
							/>
						</label>
						{evidenceLinks.trim() && githubUrls.length === 0 ? (
							<p className="muted">Need at least one github.com or gist.github.com link. The ticket stays open until then.</p>
						) : null}
					</>
				) : null}
				<div className="log-actions">
					<button
						className="primary"
						type="submit"
						disabled={needsEvidence && (!evidenceNotes.trim() || githubUrls.length === 0)}
					>
						Save
					</button>
					<button type="button" onClick={cancelComplete}>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
}
