import { useEffect, useRef, useState } from 'react';
import { readRecallDraft, writeRecallDraft } from '../lib/recall';

export function BlurtPad({
	itemId,
	topic,
	saved = '',
	onSave,
}: {
	itemId: string;
	topic: string;
	saved?: string;
	onSave?: (text: string) => void;
}) {
	const [text, setText] = useState(() => readRecallDraft(itemId) || saved);
	const saveTimer = useRef<number | null>(null);

	useEffect(() => {
		setText(readRecallDraft(itemId) || saved);
	}, [itemId, saved]);

	useEffect(() => {
		return () => {
			if (saveTimer.current) {
				window.clearTimeout(saveTimer.current);
			}
		};
	}, []);

	return (
		<section className="blurt-pad">
			<p className="eyebrow">Blurt note</p>
			<h2>What you already know about {topic}</h2>
			<p className="muted">
				Write this before you press Start. It is stored with the lesson, separate from the closing note you write on
				Complete. Revise shows both.
			</p>
			<textarea
				value={text}
				onChange={(event) => {
					const next = event.target.value;
					setText(next);
					writeRecallDraft(itemId, next);
					if (saveTimer.current) {
						window.clearTimeout(saveTimer.current);
					}
					saveTimer.current = window.setTimeout(() => onSave?.(next), 400);
				}}
				placeholder="Write the idea in your own words. It stays on this lesson and on Revise."
			/>
			<p className="muted" style={{ margin: '0.55rem 0 0' }}>
				{text.trim() ? 'Saved with this lesson.' : 'Nothing saved yet.'}
			</p>
		</section>
	);
}
