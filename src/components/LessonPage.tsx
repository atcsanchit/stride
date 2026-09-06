import { useEffect, useState } from 'react';
import { trackMeta } from '../constants';
import { lessonGuide } from '../lib/lessons';
import { challengeForItem } from '../lib/practical';
import { topicGuide } from '../lib/topic-guides';
import { useStride } from '../store/StrideState';
import { AppNav } from './AppNav';
import { BlurtPad } from './BlurtPad';
import { PracticalChallengeCard } from './PracticalChallengeCard';
import { TopicGuideCard } from './TopicGuideCard';

export function LessonPage({ itemId }: { itemId: string }) {
	const { items, startTask, requestComplete, openRevise, openClass, openTrack, openLab, activeSession, completions } =
		useStride();
	const [unlocked, setUnlocked] = useState(false);
	const item = items.find((entry) => entry.id === itemId);
	useEffect(() => {
		setUnlocked(false);
	}, [itemId]);
	if (!item) {
		return (
			<div className="page">
				<p className="muted">That lesson is gone. It may have been removed with a roadmap.</p>
			</div>
		);
	}

	const meta = trackMeta(item.trackId);
	const guide = lessonGuide(item);
	const klass = topicGuide(item.trackId, item.section);
	const running = Boolean(activeSession && activeSession.itemId === item.id);
	const last = completions.filter((row) => row.itemId === item.id).at(-1);
	const challenge = challengeForItem(item);
	const ready = item.done || unlocked;

	return (
		<div className="page">
			<button className="ghost back" type="button" onClick={() => openClass(item.trackId, item.section)}>
				← {item.section}
			</button>
			<header className="topbar">
				<div>
					<p className="eyebrow" style={{ color: meta.accent }}>
						Lesson · {meta.short}
					</p>
					<h1>{item.title}</h1>
				</div>
				<AppNav active={item.trackId} />
			</header>
			<p className="muted" style={{ marginTop: '-1rem', marginBottom: '1.1rem' }}>
				Class {item.section}
				{item.subsection ? ` · ${item.subsection}` : ''}
				{item.done ? ' · completed' : ''}
				{running ? ' · timer on' : ''}
			</p>

			<BlurtPad topic={item.title} unlocked={item.done || unlocked} onUnlock={() => setUnlocked(true)} />

			{ready ? (
				<>
					{guide ? (
						<TopicGuideCard guide={guide} title="Unblock this lesson" accent={meta.accent} />
					) : (
						<section className="plan">
							<p className="muted">
								No dedicated write-up yet for this lesson. Open the class notes, or Start and leave your own notes on
								Complete.
							</p>
							{klass ? <TopicGuideCard guide={klass} title="Class notes" accent={meta.accent} /> : null}
						</section>
					)}

					{guide?.complexity ? <p className="lesson-complexity">Target: {guide.complexity}</p> : null}
					{challenge ? <PracticalChallengeCard challenges={[challenge]} /> : null}
				</>
			) : (
				<p className="muted">Notes and solution links stay covered until you blurt. That is the session, not a UI trick.</p>
			)}

			<div className="log-actions" style={{ marginTop: '1.1rem' }}>
				{item.done ? (
					<button className="primary" type="button" onClick={() => openRevise(item.id)}>
						Revise
					</button>
				) : (
					<>
						<button type="button" disabled={!ready || running} onClick={() => void startTask(item.id)}>
							Start
						</button>
						<button className="primary" type="button" disabled={!ready} onClick={() => requestComplete(item.id)}>
							Complete
						</button>
					</>
				)}
				{!item.done && !ready ? (
					<p className="muted" style={{ width: '100%', margin: '0.35rem 0 0' }}>
						Start and Complete stay locked until you blurt. That is the session.
					</p>
				) : null}
				{item.trackId === 'dsa' ? (
					<button type="button" onClick={openLab}>
						Open Lab
					</button>
				) : null}
				<button type="button" onClick={() => openTrack(item.trackId)}>
					All classes
				</button>
			</div>

			{ready && last?.notes ? (
				<section className="plan" style={{ marginTop: '1rem' }}>
					<p className="eyebrow">Your last notes</p>
					<p>{last.notes}</p>
				</section>
			) : null}
		</div>
	);
}
