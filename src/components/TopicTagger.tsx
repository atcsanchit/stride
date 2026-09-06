import { useMemo, useState } from 'react';
import { TRACKS, enabledTrackIds, trackMeta } from '../constants';
import type { RoadmapItem, TrackId } from '../types';
import { useStride } from '../store/StrideState';

export function TopicTagger({
	selected,
	onChange,
	items,
}: {
	selected: string[];
	onChange: (ids: string[]) => void;
	items: RoadmapItem[];
}) {
	const { settings } = useStride();
	const [query, setQuery] = useState('');
	const [trackId, setTrackId] = useState<TrackId | 'all'>('all');
	const courses = TRACKS.filter((track) => enabledTrackIds(settings).includes(track.id));
	const chosen = useMemo(() => {
		const byId = new Map(items.map((item) => [item.id, item]));
		return selected.map((id) => byId.get(id)).filter((item): item is RoadmapItem => Boolean(item));
	}, [items, selected]);
	const matches = useMemo(() => {
		const needle = query.trim().toLowerCase();
		return items
			.filter((item) => !selected.includes(item.id))
			.filter((item) => enabledTrackIds(settings).includes(item.trackId))
			.filter((item) => trackId === 'all' || item.trackId === trackId)
			.filter((item) => {
				if (!needle) {
					return true;
				}
				return `${item.section} ${item.subsection} ${item.title}`.toLowerCase().includes(needle);
			})
			.slice(0, 8);
	}, [items, query, selected, settings, trackId]);

	return (
		<div className="topic-tagger">
			{chosen.length > 0 ? (
				<div className="topic-chips">
					{chosen.map((item) => (
						<button
							key={item.id}
							className={`topic-chip tag-chip tag-track-${item.trackId} is-action`}
							type="button"
							onClick={() => onChange(selected.filter((id) => id !== item.id))}
							title="Remove topic"
						>
							<span>{trackMeta(item.trackId).short}</span>
							{item.title}
							<em>×</em>
						</button>
					))}
				</div>
			) : (
				<p className="muted" style={{ margin: '0 0 0.45rem' }}>
					No topics tagged yet. Search the loaded course and add them as tags.
				</p>
			)}
			<div className="meta-row" style={{ marginTop: 0 }}>
				<button className={trackId === 'all' ? 'pill is-on' : 'pill'} type="button" onClick={() => setTrackId('all')}>
					All
				</button>
				{courses.map((track) => (
					<button
						key={track.id}
						className={trackId === track.id ? 'pill is-on' : 'pill'}
						type="button"
						onClick={() => setTrackId(track.id)}
					>
						{track.short}
					</button>
				))}
			</div>
			<label className="field">
				Tag course topics
				<input
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					onKeyDown={(event) => {
						if (event.key !== 'Enter') {
							return;
						}
						event.preventDefault();
						const first = matches[0];
						if (!first) {
							return;
						}
						onChange([...selected, first.id]);
						setQuery('');
					}}
					placeholder="Search modules and checklist items"
				/>
			</label>
			{matches.length > 0 ? (
				<ul className="topic-suggest">
					{matches.map((item) => (
						<li key={item.id}>
							<button
								type="button"
								onClick={() => {
									onChange([...selected, item.id]);
									setQuery('');
								}}
							>
								<strong>{item.title}</strong>
								<small>
									{trackMeta(item.trackId).short} · {item.section}
									{item.subsection ? ` · ${item.subsection}` : ''}
									{item.done ? ' · done' : ''}
								</small>
							</button>
						</li>
					))}
				</ul>
			) : query.trim() ? (
				<p className="muted">No matching course items.</p>
			) : null}
		</div>
	);
}
