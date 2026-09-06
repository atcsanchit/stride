import { useEffect } from 'react';
import { AccountBar } from './components/AccountBar';
import { CompleteModal } from './components/CompleteModal';
import { CourseSetup } from './components/CourseSetup';
import { Dashboard } from './components/Dashboard';
import { DayLog } from './components/DayLog';
import { Gate } from './components/Gate';
import { Lab } from './components/Lab';
import { ClassPage } from './components/ClassPage';
import { LessonPage } from './components/LessonPage';
import { ProfileSettings } from './components/ProfileSettings';
import { RevisePage } from './components/RevisePage';
import { ChoresPage } from './components/ChoresPage';
import { SprintPage } from './components/SprintPage';
import { TimerDock } from './components/TimerDock';
import { Toasts } from './components/Toasts';
import { TrackPage } from './components/TrackPage';
import { useStride } from './store/StrideState';

export default function App() {
	const { ready, phase, view, dragging, setDragging, importFiles } = useStride();

	useEffect(() => {
		if (phase !== 'app') {
			return;
		}
		const onDragOver = (event: DragEvent) => {
			if (![...(event.dataTransfer?.items ?? [])].some((item) => item.kind === 'file')) {
				return;
			}
			event.preventDefault();
			setDragging(true);
		};
		const onDragLeave = (event: DragEvent) => {
			if (event.relatedTarget) {
				return;
			}
			setDragging(false);
		};
		const onDrop = (event: DragEvent) => {
			event.preventDefault();
			setDragging(false);
			if (event.dataTransfer?.files?.length) {
				void importFiles(event.dataTransfer.files);
			}
		};
		window.addEventListener('dragover', onDragOver);
		window.addEventListener('dragleave', onDragLeave);
		window.addEventListener('drop', onDrop);
		return () => {
			window.removeEventListener('dragover', onDragOver);
			window.removeEventListener('dragleave', onDragLeave);
			window.removeEventListener('drop', onDrop);
		};
	}, [importFiles, phase, setDragging]);

	if (!ready || phase === 'boot') {
		return (
			<div className="boot">
				<p>Lacing up…</p>
			</div>
		);
	}

	if (phase === 'gate') {
		return (
			<>
				<Gate />
				<Toasts />
			</>
		);
	}

	if (phase === 'courses') {
		return (
			<>
				<CourseSetup />
				<Toasts />
			</>
		);
	}

	return (
		<>
			<AccountBar />
			{view.name === 'home' ? <Dashboard /> : null}
			{view.name === 'track' ? <TrackPage trackId={view.trackId} /> : null}
			{view.name === 'class' ? <ClassPage trackId={view.trackId} section={view.section} /> : null}
			{view.name === 'lesson' ? <LessonPage itemId={view.itemId} /> : null}
			{view.name === 'lab' ? <Lab /> : null}
			{view.name === 'sprint' ? <SprintPage /> : null}
			{view.name === 'chores' ? <ChoresPage /> : null}
			{view.name === 'revise' ? <RevisePage /> : null}
			{view.name === 'day' ? <DayLog date={view.date} /> : null}
			{view.name === 'settings' ? <ProfileSettings /> : null}
			<TimerDock />
			<CompleteModal />
			{dragging ? (
				<div className="drop-overlay">
					<span>Drop markdown roadmaps</span>
				</div>
			) : null}
			<Toasts />
		</>
	);
}
