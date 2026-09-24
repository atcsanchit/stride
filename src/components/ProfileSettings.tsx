import { useEffect, useRef, useState } from 'react';
import { TRACKS, enabledTrackIds, firstName, profileLabel, trackMeta } from '../constants';
import { readProfilePhoto } from '../lib/photo';
import type { Settings, TrackId } from '../types';
import { useStride } from '../store/StrideState';
import { CoursePicker } from './CoursePicker';

export function ProfileSettings() {
	const { settings, saveCourses, saveCourseRepo, profile, updateProfile } = useStride();
	const selected = enabledTrackIds(settings);
	const fileRef = useRef<HTMLInputElement>(null);
	const [displayName, setDisplayName] = useState('');
	const [headline, setHeadline] = useState('');
	const [about, setAbout] = useState('');
	const [location, setLocation] = useState('');
	const [link, setLink] = useState('');
	const [photo, setPhoto] = useState('');
	const [error, setError] = useState('');
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (!profile) {
			return;
		}
		setDisplayName(profile.displayName ?? '');
		setHeadline(profile.headline ?? '');
		setAbout(profile.about ?? '');
		setLocation(profile.location ?? '');
		setLink(profile.link ?? '');
		setPhoto(profile.photo ?? '');
	}, [profile]);

	async function toggle(trackId: TrackId) {
		const next = selected.includes(trackId) ? selected.filter((id) => id !== trackId) : [...selected, trackId];
		if (next.length === 0) {
			return;
		}
		await saveCourses(next);
	}

	async function setFocus(trackId: TrackId) {
		if (!selected.includes(trackId)) {
			return;
		}
		await saveCourses(selected, trackId);
	}

	async function onPhoto(file: File | undefined) {
		if (!file) {
			return;
		}
		setError('');
		try {
			setPhoto(await readProfilePhoto(file));
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : 'Could not use that photo.');
		}
	}

	const initial = profile ? firstName(profileLabel({ ...profile, displayName })).slice(0, 1).toUpperCase() : 'S';

	return (
		<div className="page">
			<header className="page-head">
				<div>
					<p className="eyebrow">Account</p>
					<h1>Profile</h1>
				</div>
			</header>
			<p className="lede">
				{profile ? `${profile.name} is the login name. ` : ''}Display name, photo, and the notes below stay with this
				account and sync with Google Drive when it is connected.
			</p>

			<section className="plan">
				<p className="eyebrow">You</p>
				<h2>Personal details</h2>
				<form
					className="profile-form"
					onSubmit={(event) => {
						event.preventDefault();
						setBusy(true);
						setError('');
						void updateProfile({ displayName, headline, about, location, link, photo })
							.catch((caught: unknown) => {
								setError(caught instanceof Error ? caught.message : 'Could not save profile.');
							})
							.finally(() => setBusy(false));
					}}
				>
					<div className="profile-photo-row">
						<button className="profile-photo" type="button" onClick={() => fileRef.current?.click()}>
							{photo ? <img src={photo} alt="" /> : <span>{initial}</span>}
						</button>
						<div>
							<p className="muted">Shown on Today and in the account menu.</p>
							<div className="profile-photo-actions">
								<button type="button" onClick={() => fileRef.current?.click()}>
									{photo ? 'Change photo' : 'Add photo'}
								</button>
								{photo ? (
									<button type="button" onClick={() => setPhoto('')}>
										Remove
									</button>
								) : null}
							</div>
						</div>
					</div>
					<label className="field">
						Display name
						<input
							value={displayName}
							onChange={(event) => setDisplayName(event.target.value)}
							placeholder={profile?.name ?? 'How you want to be greeted'}
							autoComplete="name"
						/>
					</label>
					<label className="field">
						Headline
						<input
							value={headline}
							onChange={(event) => setHeadline(event.target.value)}
							placeholder="What you are working toward"
						/>
					</label>
					<label className="field">
						About
						<textarea
							value={about}
							onChange={(event) => setAbout(event.target.value)}
							placeholder="A few lines about you. Only you see this."
							rows={4}
						/>
					</label>
					<div className="profile-split">
						<label className="field">
							Location
							<input
								value={location}
								onChange={(event) => setLocation(event.target.value)}
								placeholder="City"
								autoComplete="address-level2"
							/>
						</label>
						<label className="field">
							Link
							<input
								value={link}
								onChange={(event) => setLink(event.target.value)}
								placeholder="https://"
								inputMode="url"
							/>
						</label>
					</div>
					{error ? <p className="error">{error}</p> : null}
					<button className="primary" type="submit" disabled={busy || !profile}>
						{busy ? 'Saving…' : 'Save details'}
					</button>
					<input
						ref={fileRef}
						className="sr-only"
						type="file"
						accept="image/*"
						onChange={(event) => {
							const file = event.target.files?.[0];
							event.target.value = '';
							void onPhoto(file);
						}}
					/>
				</form>
			</section>

			<section className="plan">
				<p className="eyebrow">Courses</p>
				<h2>Show in Stride</h2>
				<CoursePicker selected={selected} onToggle={(id) => void toggle(id)} />
				<p className="muted" style={{ marginTop: '0.85rem' }}>
					Keep at least one course on. Turning one off hides it; progress stays if you add it back.
				</p>
			</section>
			<section className="plan">
				<p className="eyebrow">GitHub</p>
				<h2>One repository per course</h2>
				<p className="muted">
					A ticket belongs to one course and only accepts pull requests from that course’s repository.
				</p>
				<CourseRepos settings={settings} onSave={saveCourseRepo} />
			</section>
			<section className="plan">
				<p className="eyebrow">Career field</p>
				<h2>Coach protects this if DSA takes over</h2>
				<div className="meta-row">
					{selected.map((id) => {
						const track = TRACKS.find((entry) => entry.id === id) ?? trackMeta(id);
						return (
							<button
								key={id}
								className={settings.focusTrack === id ? 'pill is-on' : 'pill'}
								type="button"
								onClick={() => void setFocus(id)}
							>
								{track.short}
							</button>
						);
					})}
				</div>
			</section>
		</div>
	);
}

function CourseRepos({
	settings,
	onSave,
}: {
	settings: Settings;
	onSave: (courseId: TrackId, slug: string) => Promise<boolean>;
}) {
	const [drafts, setDrafts] = useState<Partial<Record<TrackId, string>>>({});
	const [error, setError] = useState('');

	return (
		<div className="course-repos">
			{TRACKS.map((track) => {
				const saved = settings.courseRepos?.[track.id] ?? '';
				const value = drafts[track.id] ?? saved;
				return (
					<label className="field" key={track.id}>
						{track.label}
						<input
							value={value}
							placeholder="owner/repo"
							onChange={(event) => {
								setDrafts((current) => ({ ...current, [track.id]: event.target.value }));
								setError('');
							}}
							onBlur={() => {
								const next = (drafts[track.id] ?? saved).trim();
								if (next === saved) {
									return;
								}
								void onSave(track.id, next).then((ok) => {
									if (!ok) {
										setError(`${track.label} needs owner/repo, like you/dsa.`);
										return;
									}
									setDrafts((current) => {
										const copy = { ...current };
										delete copy[track.id];
										return copy;
									});
								});
							}}
						/>
					</label>
				);
			})}
			{error ? <p className="error">{error}</p> : null}
		</div>
	);
}
