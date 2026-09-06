import { useMemo, useRef } from 'react';
import { trackMeta } from '../constants';
import { topicGuide, trackSourceGuide } from '../lib/topic-guides';
import type { TrackId } from '../types';
import { useStride } from '../store/StrideState';
import { AppNav } from './AppNav';
import { TaskRow } from './TaskRow';
import { TopicGuideCard } from './TopicGuideCard';

function groupItems(items: { section: string; subsection: string; id: string }[]) {
	const sections: Array<{ name: string; subs: Array<{ name: string; ids: string[] }> }> = [];
	for (const item of items) {
		let section = sections.find((entry) => entry.name === item.section);
		if (!section) {
			section = { name: item.section, subs: [] };
			sections.push(section);
		}
		const subName = item.subsection || '';
		let sub = section.subs.find((entry) => entry.name === subName);
		if (!sub) {
			sub = { name: subName, ids: [] };
			section.subs.push(sub);
		}
		sub.ids.push(item.id);
	}
	return sections;
}

export function TrackPage({ trackId }: { trackId: TrackId }) {
	const { stats, items, roadmaps, openHome, openClass, setTarget, removeRoadmap, importFiles } = useStride();
	const fileRef = useRef<HTMLInputElement>(null);
	const meta = trackMeta(trackId);
	const track = stats.find((entry) => entry.trackId === trackId);
	const owned = useMemo(
		() => items.filter((item) => item.trackId === trackId),
		[items, trackId],
	);
	const groups = useMemo(() => groupItems(owned), [owned]);
	const byId = useMemo(() => new Map(owned.map((item) => [item.id, item])), [owned]);
	const maps = roadmaps.filter((entry) => entry.trackId === trackId);

	if (!track) {
		return null;
	}

	return (
		<div className="page">
			<button className="ghost back" type="button" onClick={openHome}>
				← Today
			</button>
			<header className="topbar">
				<div>
					<p className="eyebrow" style={{ color: meta.accent }}>
						{meta.label}
					</p>
					<h1>{track.percent}%</h1>
				</div>
				<AppNav active={trackId} />
			</header>

			<p className="lede">
				{meta.blurb} A <strong>class</strong> is a pattern group. A <strong>lesson</strong> is one problem or drill —
				click it for the statement, the unblock notes, and practice links.
			</p>

			<TopicGuideCard guide={trackSourceGuide(trackId)} title="Course sources" accent={meta.accent} />

			<div className="bar">
				<span style={{ width: `${track.percent}%`, background: meta.accent }} />
			</div>
			<p className="muted">
				{track.done} of {track.total} · {track.currentSection} · today {track.todayCount}/{track.target} · streak{' '}
				{track.streak}
			</p>

			<div className="meta-row">
				<span className="muted">Daily floor</span>
				<div className="stepper">
					<button type="button" onClick={() => void setTarget(trackId, track.target - 1)}>
						−
					</button>
					<strong>{track.target}</strong>
					<button type="button" onClick={() => void setTarget(trackId, track.target + 1)}>
						+
					</button>
				</div>
				<span className="muted">{track.target === 1 ? meta.unit : meta.unitPlural}</span>
			</div>

			<div className="home-grid">
				<section className="plan">
					<div className="plan-head">
						<div>
							<p className="eyebrow">Next class</p>
							<h2>{track.currentSection}</h2>
						</div>
					</div>
					<ul className="plan-list">
						{track.nextItems.map((item) => (
							<li key={item.id}>
								<TaskRow item={item} />
							</li>
						))}
					</ul>
				</section>
			</div>

			<div className="shelf-head" style={{ marginTop: '1.4rem' }}>
				<h2>Roadmap files</h2>
				<button type="button" onClick={() => fileRef.current?.click()}>
					Drop .md
				</button>
				<input
					ref={fileRef}
					className="sr-only"
					type="file"
					accept=".md,text/markdown"
					multiple
					onChange={(event) => {
						if (event.target.files) {
							void importFiles(event.target.files);
							event.target.value = '';
						}
					}}
				/>
			</div>

			<ul className="roadmap-list">
				{maps.map((roadmap) => (
					<li className="roadmap-card" key={roadmap.id}>
						<div>
							<strong>{roadmap.title}</strong>
							<p className="muted">
								{roadmap.filename} · {roadmap.origin}
							</p>
						</div>
						{roadmap.origin === 'dropped' ? (
							<button className="ghost" type="button" onClick={() => void removeRoadmap(roadmap.id)}>
								Remove
							</button>
						) : null}
					</li>
				))}
			</ul>

			<div className="shelf-head" style={{ marginTop: '1.2rem' }}>
				<h2>Classes</h2>
				<span className="muted">Pattern groups. Lessons are the problems inside.</span>
			</div>
			<div className="sections" style={{ marginTop: '0.6rem' }}>
				{groups.map((section) => {
					const sectionItems = section.subs.flatMap((sub) => sub.ids.map((id) => byId.get(id)!).filter(Boolean));
					const done = sectionItems.filter((item) => item.done).length;
					const guide = topicGuide(trackId, section.name);
					return (
						<section className="section-card" key={section.name}>
							<div className="section-head">
								<button className="class-open" type="button" onClick={() => openClass(trackId, section.name)}>
									<p className="eyebrow">Class</p>
									<h3>{section.name}</h3>
								</button>
								<span>
									{done}/{sectionItems.length} lessons
								</span>
							</div>
							<div className="bar">
								<span
									style={{
										width: `${sectionItems.length ? Math.round((done / sectionItems.length) * 100) : 0}%`,
										background: meta.accent,
									}}
								/>
							</div>
							{guide ? <TopicGuideCard guide={guide} title="About this class" accent={meta.accent} /> : null}
							{section.subs.map((sub) => (
								<div key={sub.name || 'root'}>
									{sub.name ? <p className="subhead">{sub.name}</p> : null}
									<ul className="checklist">
										{sub.ids.map((id) => {
											const item = byId.get(id);
											if (!item) {
												return null;
											}
											return (
												<li key={item.id}>
													<TaskRow item={item} compact />
												</li>
											);
										})}
									</ul>
								</div>
							))}
						</section>
					);
				})}
			</div>
		</div>
	);
}
