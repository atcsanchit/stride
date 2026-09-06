import { useMemo, useState } from 'react';
import { choreTagPalette, normalizeTags } from '../lib/ticket';
import { useStride } from '../store/StrideState';
import { TagChip } from './TagChip';

export function ChoreTagger({
	selected,
	onChange,
}: {
	selected: string[];
	onChange: (tags: string[]) => void;
}) {
	const { tickets } = useStride();
	const [draft, setDraft] = useState('');
	const palette = useMemo(() => choreTagPalette(tickets), [tickets]);
	const chosen = selected.filter(Boolean);

	function add(tag: string) {
		const next = normalizeTags([...selected, tag]);
		if (next.length === selected.length) {
			return;
		}
		onChange(next);
	}

	return (
		<div className="topic-tagger">
			{chosen.length > 0 ? (
				<div className="topic-chips">
					{chosen.map((tag) => (
						<TagChip
							key={tag}
							tag={tag}
							selected
							onRemove={() => onChange(selected.filter((entry) => entry !== tag))}
						/>
					))}
				</div>
			) : (
				<p className="muted" style={{ margin: '0 0 0.45rem' }}>
					No work tags yet. These are Peakflo / desk tags, not course lessons.
				</p>
			)}
			<p className="field-label">Tags</p>
			<div className="meta-row status-row">
				{palette.map((tag) => {
					const on = selected.includes(tag);
					return (
						<TagChip
							key={tag}
							tag={tag}
							selected={on}
							onClick={() => (on ? onChange(selected.filter((entry) => entry !== tag)) : add(tag))}
						/>
					);
				})}
			</div>
			<label className="field">
				Add a tag
				<input
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					onKeyDown={(event) => {
						if (event.key !== 'Enter') {
							return;
						}
						event.preventDefault();
						const tag = draft.trim();
						if (!tag) {
							return;
						}
						add(tag);
						setDraft('');
					}}
					placeholder="Type and press Enter"
				/>
			</label>
		</div>
	);
}
