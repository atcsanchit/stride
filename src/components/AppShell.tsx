import type { ReactNode } from 'react';
import { activeNavFromView, AppNav } from './AppNav';
import { AccountBar } from './AccountBar';
import { ContextRail } from './ContextRail';
import { useStride } from '../store/StrideState';

export function AppShell({ children }: { children: ReactNode }) {
	const { view, items } = useStride();
	const lessonTrack =
		view.name === 'lesson' ? items.find((item) => item.id === view.itemId)?.trackId : undefined;
	const active = activeNavFromView(view, lessonTrack);

	return (
		<div className="app-shell">
			<AccountBar />
			<div className="app-body">
				<aside className="app-side" aria-label="Navigation">
					<AppNav active={active} layout="side" />
				</aside>
				<main className="app-main">{children}</main>
				<ContextRail />
			</div>
		</div>
	);
}
