import { useEffect, useMemo, useState } from 'react';
import { TRACKS, enabledTrackIds, trackMeta } from '../constants';
import { lessonGuide } from '../lib/lessons';
import {
	DAILY_REVIEW_CAP,
	RECALL_GRADES,
	dueQueue,
	intervalAfterGrade,
	prettyInterval,
	recallPrompts,
	reviewedOn,
	upcomingQueue,
} from '../lib/revise';
import { prettyDate, todayKey, diffDays } from '../lib/time';
import type { RecallGrade, TrackId } from '../types';
import { useStride } from '../store/StrideState';
import { AppNav } from './AppNav';
import { TopicGuideCard } from './TopicGuideCard';

export function RevisePage() {
	const { view, items, reviews, completions, gradeReview, openLab, openRevise, openLesson, settings } = useStride();
	const today = todayKey();
	const focusId = view.name === 'revise' ? view.itemId : undefined;
	const [filter, setFilter] = useState<TrackId | 'all'>('all');
	const [allowExtra, setAllowExtra] = useState(Boolean(focusId));
	const [revealed, setRevealed] = useState(false);
	const [missed, setMissed] = useState('');

	const doneCount = items.filter((item) => item.done).length;
	const due = useMemo(() => dueQueue(reviews, items, today, filter), [filter, items, reviews, today]);
	const upcoming = useMemo(() => upcomingQueue(reviews, items, today, 7), [items, reviews, today]);
	const doneToday = reviews.filter((card) => reviewedOn(card, today)).length;
	const atCap = doneToday >= DAILY_REVIEW_CAP && !allowExtra && !focusId;

	const active = useMemo(() => {
		if (focusId) {
			const fromDue = due.find((row) => row.item.id === focusId);
			if (fromDue) {
				return fromDue;
			}
			const item = items.find((entry) => entry.id === focusId && entry.done);
			const card = reviews.find((entry) => entry.itemId === focusId);
			if (item && card && (filter === 'all' || card.trackId === filter)) {
				return { card, item, overdueDays: Math.max(0, diffDays(card.dueDate, today)) };
			}
			return null;
		}
		if (atCap) {
			return null;
		}
		return due[0] ?? null;
	}, [atCap, due, filter, focusId, items, reviews, today]);

	useEffect(() => {
		setRevealed(false);
		setMissed('');
	}, [active?.item.id]);

	const lastNote = active
		? completions.filter((row) => row.itemId === active.item.id && row.notes.trim()).at(-1)
		: undefined;
	const guide = active ? lessonGuide(active.item) : undefined;
	const meta = active ? trackMeta(active.item.trackId) : null;

	async function onGrade(grade: RecallGrade) {
		if (!active) {
			return;
		}
		await gradeReview(active.item.id, grade, missed);
		setAllowExtra(false);
		openRevise();
	}

	return (
		<div className="page">
			<header className="topbar">
				<div>
					<p className="eyebrow">Spaced retrieval</p>
					<h1>Revise</h1>
				</div>
				<AppNav active="revise" />
			</header>

			<p className="lede">
				How to learn anything: retrieve first. Blurt for ~10 minutes, then check notes, then rate. Rereading at the start
				only tests short-term memory. Expanding gaps beat cramming. Stop around {DAILY_REVIEW_CAP}.
			</p>

			<div className="revise-stats">
				<div className="heat-card">
					<p className="eyebrow">Due</p>
					<strong>{due.length}</strong>
					<p className="muted">including overdue</p>
				</div>
				<div className="heat-card">
					<p className="eyebrow">Today</p>
					<strong>
						{doneToday}/{DAILY_REVIEW_CAP}
					</strong>
					<p className="muted">recommended set</p>
				</div>
				<div className="heat-card">
					<p className="eyebrow">Next 7 days</p>
					<strong>{upcoming.length}</strong>
					<p className="muted">already scheduled</p>
				</div>
			</div>

			<div className="meta-row">
				<button className={filter === 'all' ? 'pill is-on' : 'pill'} type="button" onClick={() => setFilter('all')}>
					All tracks
				</button>
				{TRACKS.filter((track) => enabledTrackIds(settings).includes(track.id)).map((track) => (
					<button
						key={track.id}
						className={filter === track.id ? 'pill is-on' : 'pill'}
						type="button"
						onClick={() => setFilter(track.id)}
					>
						{track.short}
					</button>
				))}
			</div>

			{doneCount === 0 ? (
				<section className="plan">
					<p className="eyebrow">Nothing to revise yet</p>
					<h2>Complete a course item first</h2>
					<p className="muted">
						Revision only covers topics you have marked done. Start, complete, leave a note. That item shows up here
						tomorrow — the first gap is the point.
					</p>
				</section>
			) : atCap ? (
				<section className="plan">
					<p className="eyebrow">Protect the gap</p>
					<h2>Today&apos;s set is done</h2>
					<p className="muted">
						{due.length} still due. Clearing them tonight is massed practice. The forgetting curve needs the wait.
					</p>
					<button type="button" onClick={() => setAllowExtra(true)}>
						Do one more anyway
					</button>
				</section>
			) : active && meta ? (
				<section className="revise-card" style={{ ['--accent' as string]: meta.accent }}>
					<p className="eyebrow" style={{ color: meta.accent }}>
						{meta.label}
						{active.overdueDays > 0 ? ` · ${active.overdueDays}d overdue` : ' · due today'}
					</p>
					<h2>{active.item.title}</h2>
					<p className="muted">
						{active.item.section}
						{active.item.subsection ? ` · ${active.item.subsection}` : ''}
						{active.card.reviews > 0 ? ` · ${active.card.reviews} reviews` : ' · first retrieval'}
					</p>
					{active.card.cue ? (
						<p className="revise-cue">Last time you flagged: {active.card.cue}</p>
					) : null}

					{revealed ? null : (
						<>
							<p className="field-label">Blurt — cover the notes</p>
							<ol className="recall-prompts">
								{recallPrompts(active.item.trackId).map((prompt) => (
									<li key={prompt}>{prompt}</li>
								))}
							</ol>
							<div className="log-actions">
								<button className="primary" type="button" onClick={() => setRevealed(true)}>
									I blurted — reveal notes
								</button>
								{active.item.trackId === 'dsa' ? (
									<button type="button" onClick={openLab}>
										Open Lab
									</button>
								) : null}
								<button type="button" onClick={() => openLesson(active.item.id)}>
									Open lesson
								</button>
							</div>
						</>
					)}

					{revealed ? (
						<>
							{lastNote ? (
								<div className="revise-notes">
									<p className="field-label">Your notes from last time</p>
									<p>{lastNote.notes}</p>
								</div>
							) : (
								<p className="muted">No notes on file for this item. Grade the retrieval anyway.</p>
							)}
							{guide ? <TopicGuideCard guide={guide} accent={meta.accent} title="If you need a restudy pass" /> : null}
							<label className="field">
								What was fuzzy? (shown next time)
								<textarea
									value={missed}
									onChange={(event) => setMissed(event.target.value)}
									placeholder="One hole. Not a recap of the whole topic."
								/>
							</label>
							<p className="field-label">How was the retrieval?</p>
							<div className="grade-row">
								{RECALL_GRADES.map((entry) => (
									<button
										key={entry.id}
										className={`grade-btn grade-${entry.id}${entry.id === 'good' ? ' primary' : ''}`}
										type="button"
										onClick={() => void onGrade(entry.id)}
									>
										<strong>{entry.label}</strong>
										<small>
											{entry.hint} Next {prettyInterval(intervalAfterGrade(active.card, entry.id))}.
										</small>
									</button>
								))}
							</div>
						</>
					) : null}
				</section>
			) : (
				<section className="plan">
					<p className="eyebrow">Caught up</p>
					<h2>Nothing due {filter === 'all' ? '' : `on ${trackMeta(filter).label} `}today</h2>
					<p className="muted">
						{upcoming[0]
							? `Next is ${upcoming[0].item.title} on ${prettyDate(upcoming[0].card.dueDate)}. Waiting is the technique.`
							: 'Completed topics are on the 1-day box. Come back tomorrow.'}
					</p>
				</section>
			)}

			{upcoming.length > 0 ? (
				<section className="plan" style={{ marginTop: '0.9rem' }}>
					<div className="plan-head">
						<div>
							<p className="eyebrow">Scheduled</p>
							<h2>Coming up</h2>
						</div>
					</div>
					<ul className="plan-list">
						{upcoming.slice(0, 8).map((row) => (
							<li key={row.item.id}>
								<button className="revise-upcoming" type="button" onClick={() => openRevise(row.item.id)}>
									<span>
										<strong>{row.item.title}</strong>
										<small className="muted">
											{trackMeta(row.item.trackId).short} · {prettyDate(row.card.dueDate)} · box {row.card.intervalDays}d
										</small>
									</span>
								</button>
							</li>
						))}
					</ul>
				</section>
			) : null}

			{due.length > 1 && active ? (
				<p className="muted" style={{ marginTop: '0.8rem' }}>
					{due.length - 1} more in the queue after this card.
				</p>
			) : null}
		</div>
	);
}
