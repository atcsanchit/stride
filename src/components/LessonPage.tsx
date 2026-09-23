import { trackMeta } from '../constants';
import { lessonGuide } from '../lib/lessons';
import { challengeForItem } from '../lib/practical';
import { openingNote, readRecallDraft } from '../lib/recall';
import { topicGuide } from '../lib/topic-guides';
import { useStride } from '../store/StrideState';
import { BlurtPad } from './BlurtPad';
import { PracticalChallengeCard } from './PracticalChallengeCard';
import { TopicGuideCard } from './TopicGuideCard';

export function LessonPage({ itemId }: { itemId: string }) {
	const { items, startTask, requestComplete, openRevise, openClass, openTrack, openLab, activeSession, completions, reviews, saveLessonNote } =
		useStride();
	const item = items.find((entry) => entry.id === itemId);
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
	const savedRecall = openingNote(
		item.id,
		reviews.find((card) => card.itemId === item.id)?.blurt || last?.blurt,
		last?.notes,
	);
	const challenge = challengeForItem(item);

	return (
		<div className="page">
			<button className="ghost back" type="button" onClick={() => openClass(item.trackId, item.section)}>
				← {item.section}
			</button>
			<header className="page-head">
				<div>
					<p className="eyebrow" style={{ color: meta.accent }}>
						Lesson · {meta.short}
					</p>
					<h1>{item.title}</h1>
				</div>
			</header>
			<p className="muted" style={{ marginTop: '-1rem', marginBottom: '1.1rem' }}>
				Class {item.section}
				{item.subsection ? ` · ${item.subsection}` : ''}
				{item.done ? ' · completed' : ''}
				{running ? ' · timer on' : ''}
			</p>

			<BlurtPad
				itemId={item.id}
				topic={item.title}
				saved={savedRecall}
				onSave={(text) => {
					void saveLessonNote(item.id, text);
				}}
			/>

			{guide ? (
				<TopicGuideCard guide={guide} title="This lesson" accent={meta.accent} />
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

			<div className="log-actions" style={{ marginTop: '1.1rem' }}>
				{item.done ? (
					<button className="primary" type="button" onClick={() => openRevise(item.id)}>
						Revise
					</button>
				) : (
					<>
						<button
							type="button"
							disabled={running}
							onClick={() => {
								void saveLessonNote(item.id, readRecallDraft(item.id));
								void startTask(item.id);
							}}
						>
							Start
						</button>
						<button className="primary" type="button" onClick={() => requestComplete(item.id)}>
							Complete
						</button>
					</>
				)}
				{item.trackId === 'dsa' ? (
					<button type="button" onClick={openLab}>
						Open Lab
					</button>
				) : null}
				<button type="button" onClick={() => openTrack(item.trackId)}>
					All classes
				</button>
			</div>

			{last?.notes ? (
				<section className="plan" style={{ marginTop: '1rem' }}>
					<p className="eyebrow">Closing note</p>
					<p>{last.notes}</p>
				</section>
			) : null}
		</div>
	);
}
