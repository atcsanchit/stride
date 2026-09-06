import { useEffect, useState } from 'react';

const SUGGESTED_MS = 10 * 60 * 1000;

export function BlurtPad({
	topic,
	unlocked,
	onUnlock,
}: {
	topic: string;
	unlocked: boolean;
	onUnlock: () => void;
}) {
	const [text, setText] = useState('');
	const [startedAt, setStartedAt] = useState<number | null>(null);
	const [now, setNow] = useState(Date.now());

	useEffect(() => {
		if (!startedAt || unlocked) {
			return;
		}
		const id = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(id);
	}, [startedAt, unlocked]);

	if (unlocked) {
		return (
			<section className="blurt-pad is-done">
				<p className="eyebrow">Blurt done</p>
				<p className="muted">Notes and links are unlocked. Compare what you missed, then apply — do not reread the whole class.</p>
			</section>
		);
	}

	const elapsed = startedAt ? now - startedAt : 0;
	const remain = Math.max(0, SUGGESTED_MS - elapsed);
	const mins = Math.floor(remain / 60000);
	const secs = Math.floor((remain % 60000) / 1000);

	return (
		<section className="blurt-pad">
			<p className="eyebrow">How to learn anything · step 1</p>
			<h2>Blurt {topic} first</h2>
			<p className="muted">
				Production, not consumption. Dump everything you remember for about 10 minutes before you open a solution, a
				paper, or the class notes. Opening them first only tests what you read 30 seconds ago.
			</p>
			<textarea
				value={text}
				onChange={(event) => {
					setText(event.target.value);
					if (!startedAt) {
						setStartedAt(Date.now());
					}
				}}
				placeholder="Topic in the middle. Spider out definitions, failure modes, the last bug, the API, the complexity… messy is correct."
			/>
			<div className="log-actions">
				<button
					className="primary"
					type="button"
					disabled={text.trim().length < 12}
					onClick={onUnlock}
				>
					I blurted — unlock notes
				</button>
				<span className="muted">
					{startedAt
						? remain > 0
							? `Suggested remaining ${mins}:${String(secs).padStart(2, '0')}`
							: 'Ten minutes in. Unlock whenever the dump is honest.'
						: 'Timer starts when you type.'}
				</span>
			</div>
		</section>
	);
}
