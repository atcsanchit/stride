import { formatElapsed } from '../lib/time';
import type { RoadmapItem } from '../types';
import { useStride } from '../store/StrideState';

export function TaskRow({ item, compact = false }: { item: RoadmapItem; compact?: boolean }) {
	const { requestComplete, openRevise, openLesson, activeSession, completions } = useStride();
	const running = Boolean(activeSession && activeSession.itemId === item.id);
	const completion = completions.filter((row) => row.itemId === item.id).at(-1);

	return (
		<div className={`task-row${item.done ? ' is-done' : ''}${running ? ' is-running' : ''}`}>
			<button className="task-open" type="button" onClick={() => openLesson(item.id)}>
				<strong>{item.title}</strong>
				<small className="muted" style={{ display: 'block' }}>
					Class {item.section}
					{item.subsection ? ` · ${item.subsection}` : ''}
					{running ? ' · timer on' : ''}
					{item.done && completion
						? ` · ${formatElapsed(completion.elapsedMs)} · effort ${completion.effort} · review ${completion.review}`
						: ''}
				</small>
			</button>
			{item.done ? (
				<div className="task-actions">
					<button type="button" onClick={() => openRevise(item.id)}>
						Revise
					</button>
				</div>
			) : (
				<div className="task-actions">
					<button type="button" onClick={() => openLesson(item.id)}>
						Session
					</button>
					{running ? (
						<button className={compact ? undefined : 'primary'} type="button" onClick={() => requestComplete(item.id)}>
							Complete
						</button>
					) : null}
				</div>
			)}
		</div>
	);
}
