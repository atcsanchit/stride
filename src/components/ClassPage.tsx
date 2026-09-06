import { trackMeta } from '../constants';
import { classGuide } from '../lib/lessons';
import { challengesForItems } from '../lib/practical';
import type { TrackId } from '../types';
import { useStride } from '../store/StrideState';
import { AppNav } from './AppNav';
import { PracticalChallengeCard } from './PracticalChallengeCard';
import { TaskRow } from './TaskRow';
import { TopicGuideCard } from './TopicGuideCard';

export function ClassPage({ trackId, section }: { trackId: TrackId; section: string }) {
	const { items, openTrack } = useStride();
	const meta = trackMeta(trackId);
	const lessons = items
		.filter((item) => item.trackId === trackId && item.section === section)
		.sort((a, b) => a.order - b.order);
	const guide = classGuide(trackId, section);
	const done = lessons.filter((item) => item.done).length;
	const bands = new Map<string, typeof lessons>();
	for (const lesson of lessons) {
		const key = lesson.subsection || '';
		const list = bands.get(key) ?? [];
		list.push(lesson);
		bands.set(key, list);
	}

	return (
		<div className="page">
			<button className="ghost back" type="button" onClick={() => openTrack(trackId)}>
				← {meta.short} classes
			</button>
			<header className="topbar">
				<div>
					<p className="eyebrow" style={{ color: meta.accent }}>
						Class
					</p>
					<h1>{section}</h1>
				</div>
				<AppNav active={trackId} />
			</header>
			<p className="lede">
				{done}/{lessons.length} lessons done. Open a lesson for the problem statement, the unblock article, and extra
				practice.
			</p>
			{guide ? <TopicGuideCard guide={guide} title="What this class is" accent={meta.accent} /> : null}
			<PracticalChallengeCard challenges={challengesForItems(lessons)} />
			<div className="bar" style={{ margin: '1rem 0' }}>
				<span
					style={{
						width: `${lessons.length ? Math.round((done / lessons.length) * 100) : 0}%`,
						background: meta.accent,
					}}
				/>
			</div>
			{lessons.length === 0 ? (
				<p className="muted">No lessons in this class yet.</p>
			) : (
				[...bands.entries()].map(([band, rows]) => (
					<section className="plan" key={band || 'root'} style={{ marginBottom: '0.8rem' }}>
						<div className="plan-head">
							<div>
								<p className="eyebrow">{band ? 'Band' : 'Lessons'}</p>
								<h2>{band || 'Lessons'}</h2>
							</div>
							<span className="muted">
								{rows.filter((row) => row.done).length}/{rows.length}
							</span>
						</div>
						<ul className="plan-list">
							{rows.map((item) => (
								<li key={item.id}>
									<TaskRow item={item} compact />
								</li>
							))}
						</ul>
					</section>
				))
			)}
		</div>
	);
}
