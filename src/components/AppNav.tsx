import { TRACKS, enabledTrackIds } from '../constants';
import type { View } from '../types';
import { useStride } from '../store/StrideState';

export function activeNavFromView(view: View, lessonTrackId?: string): string {
	switch (view.name) {
		case 'home':
		case 'day':
			return 'home';
		case 'sprint':
			return 'sprint';
		case 'chores':
			return 'chores';
		case 'revise':
			return 'revise';
		case 'lab':
			return 'lab';
		case 'settings':
			return 'settings';
		case 'track':
		case 'class':
			return view.trackId;
		case 'lesson':
			return lessonTrackId ?? 'home';
		default:
			return 'home';
	}
}

export function AppNav({
	active,
	layout = 'row',
}: {
	active: string;
	layout?: 'row' | 'side';
}) {
	const { openHome, openTrack, openLab, openSprint, openChores, openRevise, openSettings, settings } = useStride();
	const courses = TRACKS.filter((track) => enabledTrackIds(settings).includes(track.id));
	return (
		<nav className={layout === 'side' ? 'side-nav' : 'nav'} aria-label="Main">
			{layout === 'side' ? <p className="side-nav-label">Workspace</p> : null}
			<button className={active === 'home' ? 'nav-link is-active' : 'nav-link'} type="button" onClick={openHome}>
				Today
			</button>
			<button className={active === 'sprint' ? 'nav-link is-active' : 'nav-link'} type="button" onClick={openSprint}>
				Sprint
			</button>
			<button className={active === 'chores' ? 'nav-link is-active' : 'nav-link'} type="button" onClick={openChores}>
				Chores
			</button>
			<button className={active === 'revise' ? 'nav-link is-active' : 'nav-link'} type="button" onClick={() => openRevise()}>
				Revise
			</button>
			{layout === 'side' && courses.length > 0 ? <p className="side-nav-label">Courses</p> : null}
			{courses.map((track) => (
				<button
					key={track.id}
					className={active === track.id ? 'nav-link is-active' : 'nav-link'}
					type="button"
					onClick={() => openTrack(track.id)}
				>
					{track.short}
				</button>
			))}
			{layout === 'side' ? <p className="side-nav-label">Tools</p> : null}
			<button className={active === 'lab' ? 'nav-link is-active' : 'nav-link'} type="button" onClick={openLab}>
				Lab
			</button>
			<button className={active === 'settings' ? 'nav-link is-active' : 'nav-link'} type="button" onClick={openSettings}>
				Profile
			</button>
		</nav>
	);
}
