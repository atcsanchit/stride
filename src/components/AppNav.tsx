import { TRACKS } from '../constants';
import { useStride } from '../store/StrideState';

export function AppNav({ active }: { active: 'home' | 'sprint' | 'chores' | 'lab' | 'revise' | string }) {
	const { openHome, openTrack, openLab, openSprint, openChores, openRevise } = useStride();
	return (
		<nav className="nav">
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
			{TRACKS.map((track) => (
				<button
					key={track.id}
					className={active === track.id ? 'nav-link is-active' : 'nav-link'}
					type="button"
					onClick={() => openTrack(track.id)}
				>
					{track.short}
				</button>
			))}
			<button className={active === 'lab' ? 'nav-link is-active' : 'nav-link'} type="button" onClick={openLab}>
				Lab
			</button>
		</nav>
	);
}
