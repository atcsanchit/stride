import { useState } from 'react';
import type { TrackId } from '../types';
import { useStride } from '../store/StrideState';
import { CoursePicker } from './CoursePicker';

export function CourseSetup() {
	const { saveCourses, profile } = useStride();
	const [selected, setSelected] = useState<TrackId[]>([]);
	const [error, setError] = useState('');
	const [busy, setBusy] = useState(false);
	const count = selected.length;

	function toggle(trackId: TrackId) {
		setError('');
		setSelected((current) => (current.includes(trackId) ? current.filter((id) => id !== trackId) : [...current, trackId]));
	}

	return (
		<div className="page gate">
			<header className="gate-head">
				<p className="eyebrow">Courses · next step</p>
				<h1>What are you training?</h1>
				<p className="lede">
					{profile ? `${profile.name}, p` : 'P'}ick every course this account should show. Change them later in
					Profile.
				</p>
			</header>
			<section className="gate-card">
				<CoursePicker selected={selected} onToggle={toggle} />
				{error ? <p className="error">{error}</p> : null}
				<div className="gate-actions" style={{ marginTop: '1.1rem' }}>
					<button
						className="primary"
						type="button"
						disabled={busy || count === 0}
						onClick={() => {
							setBusy(true);
							setError('');
							void saveCourses(selected)
								.catch((caught) => {
									setError(caught instanceof Error ? caught.message : 'Could not save courses.');
								})
								.finally(() => setBusy(false));
						}}
					>
						{busy ? 'Saving…' : count === 0 ? 'Select at least one' : `Continue with ${count} course${count === 1 ? '' : 's'}`}
					</button>
				</div>
			</section>
		</div>
	);
}
