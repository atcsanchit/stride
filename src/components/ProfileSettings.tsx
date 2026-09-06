import { TRACKS, enabledTrackIds, trackMeta } from '../constants';
import type { TrackId } from '../types';
import { useStride } from '../store/StrideState';
import { AppNav } from './AppNav';
import { CoursePicker } from './CoursePicker';

export function ProfileSettings() {
	const { settings, saveCourses, profile } = useStride();
	const selected = enabledTrackIds(settings);

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

	return (
		<div className="page">
			<header className="topbar">
				<div>
					<p className="eyebrow">Account</p>
					<h1>Profile</h1>
				</div>
				<AppNav active="settings" />
			</header>
			<p className="lede">
				{profile ? `${profile.name} · ` : ''}Courses on this account. Turning one off hides it from the app; progress
				stays on this device if you add it back.
			</p>
			<section className="plan">
				<p className="eyebrow">Courses</p>
				<h2>Show in Stride</h2>
				<CoursePicker selected={selected} onToggle={(id) => void toggle(id)} />
				<p className="muted" style={{ marginTop: '0.85rem' }}>
					Keep at least one course on.
				</p>
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
