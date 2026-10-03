import { useEffect, useState } from 'react';
import { TRACKS, firstName, profileLabel } from '../constants';
import { useStride } from '../store/StrideState';
import type { TrackId } from '../types';

export function CourseUploadModal() {
	const { pendingCourseUpload, confirmCourseUpload, cancelCourseUpload, profile } = useStride();
	const draft = pendingCourseUpload;
	const [title, setTitle] = useState('');
	const [trackId, setTrackId] = useState<TrackId>('ai-engineering');
	const [summary, setSummary] = useState('');
	const [details, setDetails] = useState('');
	const [goal, setGoal] = useState('');
	const [exam, setExam] = useState('');
	const [mode, setMode] = useState<'add' | 'replace'>('add');
	const [error, setError] = useState('');
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (!draft) {
			return;
		}
		setTitle(draft.title);
		setTrackId(draft.trackId);
		setSummary(draft.summary);
		setDetails(draft.details);
		setGoal(draft.goal);
		setExam(draft.exam);
		setMode(draft.existingId ? 'replace' : 'add');
		setError('');
		setBusy(false);
	}, [draft]);

	if (!draft) {
		return null;
	}

	const workspaceName = profile ? firstName(profileLabel(profile)) : 'this workspace';
	const extraKeys = Object.keys(draft.meta);

	return (
		<div className="modal-root" role="dialog" aria-labelledby="course-upload-title">
			<form
				className="modal modal-course"
				onSubmit={(event) => {
					event.preventDefault();
					setBusy(true);
					setError('');
					void confirmCourseUpload({
						title,
						trackId,
						summary,
						details,
						goal,
						exam,
						mode: draft.existingId ? mode : 'add',
					})
						.catch((caught: unknown) => {
							setError(caught instanceof Error ? caught.message : 'Could not save course.');
						})
						.finally(() => setBusy(false));
				}}
			>
				<p className="eyebrow">New course · {workspaceName} only</p>
				<h2 id="course-upload-title">Add course details</h2>
				<p className="muted course-upload-lede">
					Name this course and fill the metadata before it is saved. Other workspaces keep their own courses —
					nothing here is shared across them.
				</p>

				<div className="course-upload-stats">
					<span>
						<strong>{draft.itemCount}</strong>
						<small>checklist items</small>
					</span>
					<span>
						<strong>{draft.filename}</strong>
						<small>source file</small>
					</span>
				</div>

				<label className="field">
					Course name
					<input
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						placeholder="e.g. AAI JE ATC prep"
						required
						autoFocus
					/>
				</label>

				<label className="field">
					Field
					<select value={trackId} onChange={(event) => setTrackId(event.target.value as TrackId)}>
						{TRACKS.map((track) => (
							<option key={track.id} value={track.id}>
								{track.label}
							</option>
						))}
					</select>
				</label>

				<label className="field">
					Summary
					<input
						value={summary}
						onChange={(event) => setSummary(event.target.value)}
						placeholder="One line: what this course is for"
					/>
				</label>

				<label className="field">
					Details
					<textarea
						value={details}
						onChange={(event) => setDetails(event.target.value)}
						placeholder="Syllabus notes, books, how you will run this course…"
						rows={4}
					/>
				</label>

				<div className="course-upload-grid">
					<label className="field">
						Goal
						<input
							value={goal}
							onChange={(event) => setGoal(event.target.value)}
							placeholder="e.g. 110+/120"
						/>
					</label>
					<label className="field">
						Exam / target
						<input
							value={exam}
							onChange={(event) => setExam(event.target.value)}
							placeholder="e.g. AAI JE ATC 2026"
						/>
					</label>
				</div>

				{extraKeys.length > 0 ? (
					<p className="muted course-upload-extra">
						Also keeping from the file: {extraKeys.map((key) => `${key}=${draft.meta[key]}`).join(' · ')}
					</p>
				) : null}

				{draft.existingId ? (
					<fieldset className="course-upload-mode">
						<legend>This file already exists in this workspace</legend>
						<label>
							<input
								type="radio"
								name="course-mode"
								checked={mode === 'replace'}
								onChange={() => setMode('replace')}
							/>
							Update the existing course (keep progress on matching items)
						</label>
						<label>
							<input
								type="radio"
								name="course-mode"
								checked={mode === 'add'}
								onChange={() => setMode('add')}
							/>
							Add as a separate course
						</label>
					</fieldset>
				) : null}

				{error ? <p className="error">{error}</p> : null}

				<div className="modal-actions">
					<button type="button" disabled={busy} onClick={cancelCourseUpload}>
						Cancel
					</button>
					<button className="primary" type="submit" disabled={busy || !title.trim()}>
						{busy ? 'Saving…' : mode === 'replace' && draft.existingId ? 'Update course' : 'Add course'}
					</button>
				</div>
			</form>
		</div>
	);
}
