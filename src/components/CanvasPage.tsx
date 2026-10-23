import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { listTrackMeta, PRIORITIES, STATUSES } from '../constants';
import {
	blankCanvas,
	CANVAS_CARD_H,
	CANVAS_CARD_W,
	clampZoom,
	findFreeSpot,
	loadCanvasDoc,
	planSprintLayout,
	railOrder,
	saveCanvasDoc,
	screenToCanvas,
	zoomAtPoint,
	type CanvasDoc,
	type CanvasFloater,
} from '../lib/canvas';
import { createId } from '../lib/id';
import { originalTicketTitle, sprintLabel, SPILOVER_MARK, withSpiloverTitle } from '../lib/sprint';
import { isChoreTicket, isSprintTicket, ticketIsClosed, ticketTopics } from '../lib/ticket';
import { isSessionRunning } from '../lib/work-session';
import type { Score, Ticket, TicketStatus } from '../types';
import { useStride } from '../store/StrideState';

const SHORT_STATUS: Record<TicketStatus, string> = {
	requirements: 'Req',
	ready: 'Ready',
	progress: 'Prog',
	review: 'Rev',
	blocked: 'Block',
	done: 'Done',
	cancelled: 'X',
};

type EditTarget = { id: string; kind: 'ticket-title' | 'note-text' };
type ReasonTarget = { id: string; status: TicketStatus };

function floaterHeight(floater: CanvasFloater): number {
	return floater.h > 0 ? floater.h : CANVAS_CARD_H;
}

export function CanvasPage() {
	const {
		tickets,
		items,
		sessions,
		settings,
		profile,
		currentSprint,
		updateTicket,
		setTicketStatus,
		linkTickets,
		unlinkTickets,
		pushToast,
	} = useStride();

	const [doc, setDoc] = useState<CanvasDoc>(() => blankCanvas());
	const [loadedFor, setLoadedFor] = useState<string | null>(null);
	const [railTab, setRailTab] = useState<'sprint' | 'chore'>('sprint');
	const [railOpen, setRailOpen] = useState(true);
	const [edit, setEdit] = useState<EditTarget | null>(null);
	const [draft, setDraft] = useState('');
	const [reasonFor, setReasonFor] = useState<ReasonTarget | null>(null);
	const [reasonDraft, setReasonDraft] = useState('');
	const [panning, setPanning] = useState(false);
	const [linkMode, setLinkMode] = useState(false);
	const [linkFrom, setLinkFrom] = useState<string | null>(null);

	const docRef = useRef(doc);
	docRef.current = doc;
	const stageRef = useRef<HTMLDivElement | null>(null);
	const panRef = useRef<{ pointerId: number; startX: number; startY: number; vx: number; vy: number } | null>(null);
	const cancelEditRef = useRef(false);

	const ticketsById = useMemo(() => new Map(tickets.map((ticket) => [ticket.id, ticket])), [tickets]);
	const trackMeta = useMemo(() => listTrackMeta(settings), [settings]);

	// ── load / save ────────────────────────────────────────────
	useEffect(() => {
		if (!profile?.id) {
			return;
		}
		setDoc(loadCanvasDoc(profile.id));
		setLoadedFor(profile.id);
	}, [profile?.id]);

	useEffect(() => {
		if (!loadedFor || !profile || profile.id !== loadedFor) {
			return;
		}
		const timer = setTimeout(() => saveCanvasDoc(profile.id, doc), 350);
		return () => clearTimeout(timer);
	}, [doc, loadedFor, profile]);

	// A floater without a ticket is drift — drop it.
	useEffect(() => {
		const live = new Set(tickets.map((ticket) => ticket.id));
		setDoc((prev) => {
			if (!prev.floaters.some((row) => row.kind === 'ticket' && !live.has(row.ticketId))) {
				return prev;
			}
			return { ...prev, floaters: prev.floaters.filter((row) => row.kind === 'note' || live.has(row.ticketId)) };
		});
	}, [tickets]);

	const bringToFront = useCallback((id: string) => {
		setDoc((prev) => {
			const index = prev.floaters.findIndex((row) => row.id === id);
			if (index < 0 || index === prev.floaters.length - 1) {
				return prev;
			}
			const row = prev.floaters[index];
			return { ...prev, floaters: [...prev.floaters.slice(0, index), ...prev.floaters.slice(index + 1), row] };
		});
	}, []);

	// ── viewport ───────────────────────────────────────────────
	const stagePoint = useCallback((clientX: number, clientY: number) => {
		const rect = stageRef.current?.getBoundingClientRect();
		return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) };
	}, []);

	const viewportCenterCanvas = useCallback(() => {
		const rect = stageRef.current?.getBoundingClientRect();
		return screenToCanvas(
			docRef.current.viewport,
			(rect?.width ?? 800) / 2,
			(rect?.height ?? 600) / 2,
		);
	}, []);

	const onBackgroundPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
		if (event.pointerType === 'mouse' && event.button !== 0) {
			return;
		}
		const target = event.target as HTMLElement;
		if (target.closest('.canvas-floater, .canvas-rail, .canvas-toolbar, .canvas-legend, .canvas-empty, .canvas-coords, button, input, textarea')) {
			return;
		}
		panRef.current = {
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			vx: docRef.current.viewport.x,
			vy: docRef.current.viewport.y,
		};
		setPanning(true);
		event.currentTarget.setPointerCapture(event.pointerId);
	}, []);

	const onBackgroundPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
		const pan = panRef.current;
		if (!pan || pan.pointerId !== event.pointerId) {
			return;
		}
		const x = pan.vx + (event.clientX - pan.startX);
		const y = pan.vy + (event.clientY - pan.startY);
		setDoc((prev) => ({ ...prev, viewport: { ...prev.viewport, x, y } }));
	}, []);

	const endBackgroundPan = useCallback(() => {
		panRef.current = null;
		setPanning(false);
	}, []);

	useEffect(() => {
		const stage = stageRef.current;
		if (!stage) {
			return;
		}
		const onWheel = (event: WheelEvent) => {
			event.preventDefault();
			const point = stagePoint(event.clientX, event.clientY);
			setDoc((prev) => {
				if (event.ctrlKey || event.metaKey) {
					const nextZoom = clampZoom(prev.viewport.zoom * Math.exp(-event.deltaY * 0.0016));
					return { ...prev, viewport: zoomAtPoint(prev.viewport, point, nextZoom) };
				}
				return {
					...prev,
					viewport: { ...prev.viewport, x: prev.viewport.x - event.deltaX, y: prev.viewport.y - event.deltaY },
				};
			});
		};
		stage.addEventListener('wheel', onWheel, { passive: false });
		return () => stage.removeEventListener('wheel', onWheel);
	}, [stagePoint]);

	const zoomBy = useCallback((factor: number) => {
		const rect = stageRef.current?.getBoundingClientRect();
		const point = { x: (rect?.width ?? 800) / 2, y: (rect?.height ?? 600) / 2 };
		setDoc((prev) => ({ ...prev, viewport: zoomAtPoint(prev.viewport, point, prev.viewport.zoom * factor) }));
	}, []);

	const fitAll = useCallback(() => {
		const rect = stageRef.current?.getBoundingClientRect();
		const width = rect?.width ?? 800;
		const height = rect?.height ?? 600;
		const floaters = docRef.current.floaters;
		setDoc((prev) => {
			if (!floaters.length) {
				return { ...prev, viewport: { x: 48, y: 24, zoom: 1 } };
			}
			const minX = Math.min(...floaters.map((row) => row.x));
			const minY = Math.min(...floaters.map((row) => row.y));
			const maxX = Math.max(...floaters.map((row) => row.x + row.w));
			const maxY = Math.max(...floaters.map((row) => row.y + floaterHeight(row)));
			const spanX = Math.max(1, maxX - minX);
			const spanY = Math.max(1, maxY - minY);
			const margin = 56;
			const zoom = clampZoom(Math.min((width - margin * 2) / spanX, (height - margin * 2) / spanY, 1.25));
			return {
				...prev,
				viewport: {
					zoom,
					x: (width - spanX * zoom) / 2 - minX * zoom,
					y: (height - spanY * zoom) / 2 - minY * zoom,
				},
			};
		});
	}, []);

	// ── floater mutations ──────────────────────────────────────
	const addTicketFloater = useCallback(
		(ticket: Ticket, at?: { x: number; y: number }) => {
			const spot = at ?? findFreeSpot(docRef.current.floaters, viewportCenterCanvas());
			setDoc((prev) => ({
				...prev,
				floaters: [
					...prev.floaters,
					{
						id: createId(),
						kind: 'ticket',
						ticketId: ticket.id,
						text: '',
						x: Math.round(spot.x),
						y: Math.round(spot.y),
						w: CANVAS_CARD_W,
						h: 0,
						createdAt: Date.now(),
					},
				],
			}));
		},
		[viewportCenterCanvas],
	);

	const addNote = useCallback(() => {
		const spot = findFreeSpot(docRef.current.floaters, viewportCenterCanvas());
		const id = createId();
		setDoc((prev) => ({
			...prev,
			floaters: [
				...prev.floaters,
				{
					id,
					kind: 'note',
					ticketId: '',
					text: 'Plan note — ',
					x: Math.round(spot.x),
					y: Math.round(spot.y),
					w: CANVAS_CARD_W,
					h: 0,
					createdAt: Date.now(),
				},
			],
		}));
		setEdit({ id, kind: 'note-text' });
		setDraft('Plan note — ');
	}, [viewportCenterCanvas]);

	const removeFloater = useCallback((id: string) => {
		setDoc((prev) => ({ ...prev, floaters: prev.floaters.filter((row) => row.id !== id) }));
	}, []);

	const clearClosed = useCallback(() => {
		setDoc((prev) => ({
			...prev,
			floaters: prev.floaters.filter((row) => {
				if (row.kind !== 'ticket') {
					return true;
				}
				const ticket = ticketsById.get(row.ticketId);
				return !ticket || !ticketIsClosed(ticket.status);
			}),
		}));
	}, [ticketsById]);

	const planSprint = useCallback(() => {
		const layout = planSprintLayout(tickets, currentSprint);
		const keep = new Set(layout.map((row) => row.ticketId));
		setDoc((prev) => {
			const next: CanvasFloater[] = prev.floaters.filter(
				(row) => row.kind === 'note' || (row.kind === 'ticket' && !keep.has(row.ticketId)),
			);
			const existing = new Map(prev.floaters.filter((row) => row.kind === 'ticket').map((row) => [row.ticketId, row]));
			for (const spot of layout) {
				const found = existing.get(spot.ticketId);
				if (found) {
					next.push({ ...found, x: spot.x, y: spot.y });
				} else {
					next.push({
						id: createId(),
						kind: 'ticket',
						ticketId: spot.ticketId,
						text: '',
						x: spot.x,
						y: spot.y,
						w: CANVAS_CARD_W,
						h: 0,
						createdAt: Date.now(),
					});
				}
			}
			return { ...prev, floaters: next };
		});
		requestAnimationFrame(() => fitAll());
	}, [currentSprint, fitAll, tickets]);

	const beginFloaterDrag = useCallback(
		(event: React.PointerEvent, floater: CanvasFloater) => {
			if (event.pointerType === 'mouse' && event.button !== 0) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			bringToFront(floater.id);
			const startX = event.clientX;
			const startY = event.clientY;
			const originX = floater.x;
			const originY = floater.y;
			const move = (moveEvent: PointerEvent) => {
				const zoom = docRef.current.viewport.zoom;
				const x = Math.round(originX + (moveEvent.clientX - startX) / zoom);
				const y = Math.round(originY + (moveEvent.clientY - startY) / zoom);
				setDoc((prev) => ({
					...prev,
					floaters: prev.floaters.map((row) => (row.id === floater.id ? { ...row, x, y } : row)),
				}));
			};
			const up = () => {
				window.removeEventListener('pointermove', move);
				window.removeEventListener('pointerup', up);
				window.removeEventListener('pointercancel', up);
			};
			window.addEventListener('pointermove', move);
			window.addEventListener('pointerup', up);
			window.addEventListener('pointercancel', up);
		},
		[bringToFront],
	);

	const beginFloaterResize = useCallback(
		(event: React.PointerEvent, floater: CanvasFloater) => {
			event.preventDefault();
			event.stopPropagation();
			const startX = event.clientX;
			const startY = event.clientY;
			const originW = floater.w;
			const originH = floater.h > 0 ? floater.h : CANVAS_CARD_H;
			const move = (moveEvent: PointerEvent) => {
				const zoom = docRef.current.viewport.zoom;
				const w = Math.min(560, Math.max(168, Math.round(originW + (moveEvent.clientX - startX) / zoom)));
				const h = Math.max(0, Math.round(originH + (moveEvent.clientY - startY) / zoom));
				setDoc((prev) => ({
					...prev,
					floaters: prev.floaters.map((row) => (row.id === floater.id ? { ...row, w, h } : row)),
				}));
			};
			const up = () => {
				window.removeEventListener('pointermove', move);
				window.removeEventListener('pointerup', up);
				window.removeEventListener('pointercancel', up);
			};
			window.addEventListener('pointermove', move);
			window.addEventListener('pointerup', up);
			window.addEventListener('pointercancel', up);
		},
		[],
	);

	// ── editing (writes go to the ticket — the floater is a view) ──
	const startTicketTitleEdit = useCallback((floater: CanvasFloater, ticket: Ticket) => {
		cancelEditRef.current = false;
		setEdit({ id: floater.id, kind: 'ticket-title' });
		setDraft(originalTicketTitle(ticket));
	}, []);

	const startNoteEdit = useCallback((floater: CanvasFloater) => {
		cancelEditRef.current = false;
		setEdit({ id: floater.id, kind: 'note-text' });
		setDraft(floater.text);
	}, []);

	const commitEdit = useCallback(() => {
		const target = edit;
		setEdit(null);
		if (!target || cancelEditRef.current) {
			return;
		}
		const floater = docRef.current.floaters.find((row) => row.id === target.id);
		if (!floater) {
			return;
		}
		if (target.kind === 'note-text') {
			const text = draft.trim();
			setDoc((prev) => ({
				...prev,
				floaters: prev.floaters.map((row) => (row.id === floater.id ? { ...row, text } : row)),
			}));
			return;
		}
		const ticket = ticketsById.get(floater.ticketId);
		if (!ticket) {
			return;
		}
		const spilled = ticket.title.trim().toUpperCase().startsWith(SPILOVER_MARK);
		const title = spilled ? withSpiloverTitle(draft) : draft;
		if (title.trim() && title !== ticket.title) {
			void updateTicket(ticket.id, { title });
		}
	}, [draft, edit, ticketsById, updateTicket]);

	const setStatus = useCallback(
		(ticketId: string, status: TicketStatus, reason = '') => {
			void setTicketStatus(ticketId, status, reason);
		},
		[setTicketStatus],
	);

	const cyclePriority = useCallback(
		(ticket: Ticket) => {
			const current = ticket.priority ?? 1;
			const next = ((current + 1) % 3) as 0 | 1 | 2;
			void updateTicket(ticket.id, { priority: next });
		},
		[updateTicket],
	);

	const cycleEffort = useCallback(
		(ticket: Ticket) => {
			const current = (ticket.estimatedEffort ?? 3) as Score;
			const next = (current % 5) + 1;
			void updateTicket(ticket.id, { estimatedEffort: next as Score });
		},
		[updateTicket],
	);

	// ── rail data ──────────────────────────────────────────────
	const onCanvasTicketIds = useMemo(
		() => new Set(doc.floaters.filter((row) => row.kind === 'ticket').map((row) => row.ticketId)),
		[doc.floaters],
	);
	const sprintPool = useMemo(
		() =>
			tickets
				.filter(isSprintTicket)
				.filter((ticket) => !currentSprint || ticket.sprintId === currentSprint.id || !ticket.sprintId)
				.sort(railOrder),
		[currentSprint, tickets],
	);
	const chorePool = useMemo(
		() => tickets.filter(isChoreTicket).sort(railOrder),
		[tickets],
	);
	const railTickets = railTab === 'sprint' ? sprintPool : chorePool;
	const offSprint = sprintPool.filter((ticket) => !onCanvasTicketIds.has(ticket.id)).length;
	const offChores = chorePool.filter((ticket) => !onCanvasTicketIds.has(ticket.id)).length;

	const focusFloater = useCallback((ticketId: string) => {
		const floater = docRef.current.floaters.find((row) => row.kind === 'ticket' && row.ticketId === ticketId);
		if (!floater) {
			return;
		}
		const rect = stageRef.current?.getBoundingClientRect();
		const width = rect?.width ?? 800;
		const height = rect?.height ?? 600;
		setDoc((prev) => ({
			...prev,
			viewport: {
				...prev.viewport,
				x: width / 2 - (floater.x + floater.w / 2) * prev.viewport.zoom,
				y: height / 2 - (floater.y + floaterHeight(floater) / 2) * prev.viewport.zoom,
			},
		}));
	}, []);

	const onRailRowClick = useCallback(
		(ticket: Ticket) => {
			if (onCanvasTicketIds.has(ticket.id)) {
				focusFloater(ticket.id);
				return;
			}
			addTicketFloater(ticket);
		},
		[addTicketFloater, focusFloater, onCanvasTicketIds],
	);

	const onStageDrop = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault();
			const raw = event.dataTransfer.getData('text/plain');
			if (!raw) {
				return;
			}
			let ticketId = '';
			try {
				ticketId = (JSON.parse(raw) as { ticketId?: string }).ticketId ?? '';
			} catch {
				return;
			}
			const ticket = ticketsById.get(ticketId);
			if (!ticket) {
				return;
			}
			const point = stagePoint(event.clientX, event.clientY);
			addTicketFloater(ticket, screenToCanvas(docRef.current.viewport, point.x, point.y));
		},
		[addTicketFloater, stagePoint, ticketsById],
	);

	const runningTicketIds = useMemo(() => {
		const ids = new Set<string>();
		for (const session of sessions) {
			if (session.ticketId && isSessionRunning(session)) {
				ids.add(session.ticketId);
			}
		}
		return ids;
	}, [sessions]);

	// ── links: edges between pinned ticket floaters ──
	const edges = useMemo(() => {
		const boxById = new Map<string, { x: number; y: number; w: number; h: number }>();
		for (const row of doc.floaters) {
			if (row.kind === 'ticket') {
				boxById.set(row.ticketId, { x: row.x, y: row.y, w: row.w, h: floaterHeight(row) });
			}
		}
		const seen = new Set<string>();
		const rows: {
			key: string;
			aId: string;
			bId: string;
			x1: number;
			y1: number;
			x2: number;
			y2: number;
			mx: number;
			my: number;
		}[] = [];
		for (const ticket of tickets) {
			for (const otherId of ticket.linkedIds ?? []) {
				const a = boxById.get(ticket.id);
				const b = boxById.get(otherId);
				if (!a || !b) {
					continue;
				}
				const key = [ticket.id, otherId].sort().join('~');
				if (seen.has(key)) {
					continue;
				}
				seen.add(key);
				const x1 = a.x + a.w / 2;
				const y1 = a.y + a.h / 2;
				const x2 = b.x + b.w / 2;
				const y2 = b.y + b.h / 2;
				rows.push({ key, aId: ticket.id, bId: otherId, x1, y1, x2, y2, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 });
			}
		}
		return rows;
	}, [doc.floaters, tickets]);

	const exitLinkMode = useCallback(() => {
		setLinkMode(false);
		setLinkFrom(null);
	}, []);

	const pickLinkTarget = useCallback(
		(ticketId: string) => {
			if (!linkFrom) {
				setLinkFrom(ticketId);
				return;
			}
			if (linkFrom === ticketId) {
				setLinkFrom(null);
				return;
			}
			const from = ticketsById.get(linkFrom);
			const to = ticketsById.get(ticketId);
			setLinkFrom(null);
			if (!from || !to) {
				return;
			}
			void linkTickets(from.id, to.id).then(() => {
				pushToast('Tickets linked', `${from.title} ↔ ${to.title}`);
			});
		},
		[linkFrom, linkTickets, pushToast, ticketsById],
	);

	useEffect(() => {
		if (!linkMode) {
			return;
		}
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setLinkMode(false);
				setLinkFrom(null);
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [linkMode]);

	const zoomPct = Math.round(doc.viewport.zoom * 100);

	return (
		<div className="canvas-page">
			<header className="canvas-head">
				<p className="eyebrow">Canvas</p>
				<h1>Plan the week</h1>
				<p className="canvas-hint">
					floaters from {currentSprint ? sprintLabel(currentSprint) : 'sprint'} + chores · editing a floater edits the ticket
				</p>
			</header>

			<div
				ref={stageRef}
				className={`canvas-stage${panning ? ' is-panning' : ''}${linkMode ? ' is-linking' : ''}`}
				onPointerDown={onBackgroundPointerDown}
				onPointerMove={onBackgroundPointerMove}
				onPointerUp={endBackgroundPan}
				onPointerCancel={endBackgroundPan}
				onDragOver={(event) => {
					if ([...event.dataTransfer.types].includes('text/plain')) {
						event.preventDefault();
					}
				}}
				onDrop={onStageDrop}
			>
				<div
					className="canvas-grid"
					style={{
						backgroundSize: `${36 * doc.viewport.zoom}px ${36 * doc.viewport.zoom}px`,
						backgroundPosition: `${doc.viewport.x}px ${doc.viewport.y}px`,
					}}
				/>

				<div
					className="canvas-plane"
					style={{
						transform: `translate(${doc.viewport.x}px, ${doc.viewport.y}px) scale(${doc.viewport.zoom})`,
					}}
				>
					<svg className="canvas-edges" width={1} height={1} aria-hidden="true">
						{edges.map((edge) => (
							<path
								key={edge.key}
								className="canvas-edge"
								d={`M ${edge.x1} ${edge.y1} C ${edge.x1} ${(edge.y1 + edge.y2) / 2}, ${edge.x2} ${
									(edge.y1 + edge.y2) / 2
								}, ${edge.x2} ${edge.y2}`}
							/>
						))}
					</svg>
					{edges.map((edge) => (
						<button
							key={edge.key}
							className="edge-unlink"
							style={{ left: edge.mx, top: edge.my }}
							type="button"
							title="Remove this link"
							onClick={() => {
								void unlinkTickets(edge.aId, edge.bId).then(() => pushToast('Link removed', 'The tickets stay on the canvas.'));
							}}
						>
							✕
						</button>
					))}

				{doc.floaters.map((floater, index) => {
					if (floater.kind === 'note') {
						return (
							<NoteFloater
								key={floater.id}
								floater={floater}
								z={index + 2}
								editing={edit?.id === floater.id && edit.kind === 'note-text'}
								draft={draft}
								onDraft={setDraft}
								onStartEdit={() => startNoteEdit(floater)}
								onCommit={commitEdit}
								onCancel={() => {
									cancelEditRef.current = true;
									setEdit(null);
								}}
								onRemove={() => removeFloater(floater.id)}
								onDragStart={(event) => beginFloaterDrag(event, floater)}
								onResizeStart={(event) => beginFloaterResize(event, floater)}
							/>
						);
					}
					const ticket = ticketsById.get(floater.ticketId);
					if (!ticket) {
						return null;
					}
					return (
						<TicketFloater
							key={floater.id}
							floater={floater}
							ticket={ticket}
							z={index + 2}
							trackShort={
								isChoreTicket(ticket)
									? ticket.tags[0] ?? ''
									: trackMeta.find((meta) => meta.id === ticketTopics(ticket, items)[0]?.trackId)?.short ?? ''
							}
							running={runningTicketIds.has(ticket.id)}
							editing={edit?.id === floater.id && edit.kind === 'ticket-title'}
							draft={draft}
							reasonActive={reasonFor?.id === floater.id}
							reasonStatus={reasonFor?.status}
							reasonDraft={reasonDraft}
							onDraft={setDraft}
							onReasonDraft={setReasonDraft}
							onStartTitleEdit={() => startTicketTitleEdit(floater, ticket)}
							onCommitEdit={commitEdit}
							onCancelEdit={() => {
								cancelEditRef.current = true;
								setEdit(null);
							}}
							onStatus={(status) => {
								if (status === 'blocked' || status === 'cancelled') {
									setReasonFor({ id: floater.id, status });
									setReasonDraft('');
									return;
								}
								setStatus(ticket.id, status);
							}}
							onCommitReason={() => {
								if (reasonFor) {
									setStatus(ticket.id, reasonFor.status, reasonDraft);
									setReasonFor(null);
								}
							}}
							onCancelReason={() => setReasonFor(null)}
							onPriority={() => cyclePriority(ticket)}
							onEffort={() => cycleEffort(ticket)}
							onRemove={() => removeFloater(floater.id)}
							onDragStart={(event) => beginFloaterDrag(event, floater)}
							onResizeStart={(event) => beginFloaterResize(event, floater)}
							linkMode={linkMode}
							isLinkSource={linkFrom === ticket.id}
							linkCount={(ticket.linkedIds ?? []).length}
							linkTitles={(ticket.linkedIds ?? [])
								.map((id) => ticketsById.get(id)?.title)
								.filter((title): title is string => Boolean(title))
								.join(' · ')}
							onPickLink={() => pickLinkTarget(ticket.id)}
						/>
					);
				})}
				</div>

				{linkMode ? (
					<div className="canvas-linkhint">
						{linkFrom
							? 'Now pick the second floater to link · Esc to cancel'
							: 'Pick the first floater to link · Esc to cancel'}
					</div>
				) : null}

				{doc.floaters.length === 0 ? (
					<div className="canvas-empty">
						<p className="eyebrow">Nothing pinned yet</p>
						<h2>Plan the week on one surface</h2>
						<p>
							Pull sprint tickets and chores onto the canvas, or let Stride lay the plan out for you. Editing a floater
							updates the ticket — the board and the canvas never disagree.
						</p>
						<button className="primary" type="button" onClick={planSprint}>
							✦ Plan the sprint
						</button>
					</div>
				) : null}

				<div className="canvas-toolbar" role="toolbar" aria-label="Canvas tools">
					<button className="primary" type="button" onClick={planSprint}>
						✦ Plan the sprint
					</button>
					<button type="button" onClick={addNote}>
						＋ Note
					</button>
					<button
						className={linkMode ? 'is-on' : undefined}
						type="button"
						onClick={linkMode ? exitLinkMode : () => setLinkMode(true)}
						title="Link two floaters with a line"
					>
						⛓ Link
					</button>
					<span className="canvas-sep" />
					<button className="ghost" type="button" onClick={() => zoomBy(1 / 1.2)} title="Zoom out">
						−
					</button>
					<span className="canvas-zoom">{zoomPct}%</span>
					<button className="ghost" type="button" onClick={() => zoomBy(1.2)} title="Zoom in">
						＋
					</button>
					<button className="ghost" type="button" onClick={fitAll} title="Fit all floaters">
						⤢ Fit
					</button>
					<span className="canvas-sep" />
					<button className="ghost" type="button" onClick={clearClosed} title="Remove floaters of closed tickets">
						Clear closed
					</button>
				</div>

				<div className="canvas-legend" aria-hidden="true">
					<span>
						<i className="canvas-dot" style={{ background: 'var(--ai)' }} />progress
					</span>
					<span>
						<i className="canvas-dot" style={{ background: 'var(--design)' }} />review
					</span>
					<span>
						<i className="canvas-dot" style={{ background: 'var(--rose)' }} />blocked
					</span>
					<span>
						<i className="canvas-dot" style={{ background: 'var(--manage)' }} />ready
					</span>
					<span>
						<i className="canvas-dot" style={{ background: 'var(--muted)' }} />requirements
					</span>
					<span>
						<i className="canvas-dot" style={{ background: 'var(--ground)' }} />done
					</span>
				</div>

				<button
					className={railOpen ? 'canvas-rail-toggle is-open' : 'canvas-rail-toggle'}
					type="button"
					onClick={() => setRailOpen((open) => !open)}
					title={railOpen ? 'Hide ticket rail' : 'Show ticket rail'}
				>
					{railOpen ? '›' : '‹'} Tickets
				</button>

				{railOpen ? (
					<aside className="canvas-rail" aria-label="Ticket rail">
						<div className="canvas-rail-head">
							<p className="canvas-rail-title">Pull tickets onto the canvas</p>
							<div className="canvas-tabs">
								<button
									className={railTab === 'sprint' ? 'is-on' : ''}
									type="button"
									onClick={() => setRailTab('sprint')}
								>
									Sprint{offSprint ? ` · ${offSprint}` : ''}
								</button>
								<button
									className={railTab === 'chore' ? 'is-on' : ''}
									type="button"
									onClick={() => setRailTab('chore')}
								>
									Chores{offChores ? ` · ${offChores}` : ''}
								</button>
							</div>
						</div>
						<div className="canvas-rail-list">
							{railTickets.map((ticket) => {
								const pinned = onCanvasTicketIds.has(ticket.id);
								return (
									<div
										key={ticket.id}
										className={pinned ? 'canvas-row is-on-canvas' : 'canvas-row'}
										draggable={!pinned}
										onDragStart={(event) => {
											event.dataTransfer.setData('text/plain', JSON.stringify({ ticketId: ticket.id }));
											event.dataTransfer.effectAllowed = 'copy';
										}}
										onClick={() => onRailRowClick(ticket)}
									>
										<span className={isChoreTicket(ticket) ? 'cf-kind chore' : 'cf-kind sprint'}>
											{isChoreTicket(ticket) ? 'CHORE' : 'SPRINT'}
										</span>
										<span className="canvas-row-title" title={originalTicketTitle(ticket)}>
											{originalTicketTitle(ticket)}
										</span>
										<button
											className="canvas-row-add"
											type="button"
											title={pinned ? 'On canvas — click to focus' : 'Add floater'}
											onClick={(event) => {
												event.stopPropagation();
												onRailRowClick(ticket);
											}}
										>
											{pinned ? '✓' : '＋'}
										</button>
									</div>
								);
							})}
							{railTickets.length === 0 ? <p className="canvas-rail-empty">Nothing here. All pinned.</p> : null}
						</div>
						<p className="canvas-rail-foot">
							Drag a row onto the canvas, or ＋ to drop it in a free spot. Chores dedupe per title, like the desk.
						</p>
					</aside>
				) : null}
			</div>
		</div>
	);
}

function NoteFloater({
	floater,
	z,
	editing,
	draft,
	onDraft,
	onStartEdit,
	onCommit,
	onCancel,
	onRemove,
	onDragStart,
	onResizeStart,
}: {
	floater: CanvasFloater;
	z: number;
	editing: boolean;
	draft: string;
	onDraft: (value: string) => void;
	onStartEdit: () => void;
	onCommit: () => void;
	onCancel: () => void;
	onRemove: () => void;
	onDragStart: (event: React.PointerEvent) => void;
	onResizeStart: (event: React.PointerEvent) => void;
}) {
	return (
		<article className="canvas-floater note" style={{ left: floater.x, top: floater.y, width: floater.w, height: floater.h > 0 ? floater.h : undefined, zIndex: z }}>
			<header className="cf-head" onPointerDown={onDragStart}>
				<span className="cf-kind note">NOTE</span>
				<button className="cf-x" type="button" title="Remove note" onClick={onRemove}>
					✕
				</button>
			</header>
			{editing ? (
				<textarea
					className="cf-input"
					value={draft}
					autoFocus
					rows={4}
					onChange={(event) => onDraft(event.target.value)}
					onBlur={onCommit}
					onKeyDown={(event) => {
						if (event.key === 'Escape') {
							onCancel();
							return;
						}
						if (event.key === 'Enter' && !event.shiftKey) {
							event.preventDefault();
							onCommit();
						}
					}}
				/>
			) : (
				<p className="cf-note-text" onClick={onStartEdit}>
					{floater.text.trim() || 'Plan note…'}
				</p>
			)}
			<span className="cf-resize" onPointerDown={onResizeStart} aria-hidden="true" />
		</article>
	);
}

function TicketFloater({
	floater,
	ticket,
	z,
	trackShort,
	running,
	editing,
	draft,
	reasonActive,
	reasonStatus,
	reasonDraft,
	onDraft,
	onReasonDraft,
	onStartTitleEdit,
	onCommitEdit,
	onCancelEdit,
	onStatus,
	onCommitReason,
	onCancelReason,
	onPriority,
	onEffort,
	onRemove,
	onDragStart,
	onResizeStart,
	linkMode,
	isLinkSource,
	linkCount,
	linkTitles,
	onPickLink,
}: {
	floater: CanvasFloater;
	ticket: Ticket;
	z: number;
	trackShort: string;
	running: boolean;
	editing: boolean;
	linkMode: boolean;
	isLinkSource: boolean;
	linkCount: number;
	linkTitles: string;
	onPickLink: () => void;
	draft: string;
	reasonActive: boolean;
	reasonStatus?: TicketStatus;
	reasonDraft: string;
	onDraft: (value: string) => void;
	onReasonDraft: (value: string) => void;
	onStartTitleEdit: () => void;
	onCommitEdit: () => void;
	onCancelEdit: () => void;
	onStatus: (status: TicketStatus) => void;
	onCommitReason: () => void;
	onCancelReason: () => void;
	onPriority: () => void;
	onEffort: () => void;
	onRemove: () => void;
	onDragStart: (event: React.PointerEvent) => void;
	onResizeStart: (event: React.PointerEvent) => void;
}) {
	const closed = ticketIsClosed(ticket.status);
	const priority = PRIORITIES.find((entry) => entry.value === ticket.priority);
	const done = ticket.status === 'done';
	const cancelled = ticket.status === 'cancelled';
	return (
		<article
			className={`canvas-floater st-${ticket.status}${closed ? ' is-closed' : ''}${
				isLinkSource ? ' is-link-source' : ''
			}${linkMode ? ' is-link-mode' : ''}`}
			style={{ left: floater.x, top: floater.y, width: floater.w, height: floater.h > 0 ? floater.h : undefined, zIndex: z }}
		>
			<header className="cf-head" onPointerDown={onDragStart}>
				<span className={isChoreTicket(ticket) ? 'cf-kind chore' : 'cf-kind sprint'}>
					{isChoreTicket(ticket) ? 'CHORE' : 'SPRINT'}
				</span>
				{running ? <span className="cf-live" title="Timer running" /> : null}
				{linkCount > 0 ? (
					<span className="cf-links" title={`Linked to: ${linkTitles}`}>
						⛓ {linkCount}
					</span>
				) : null}
				<button className="cf-x" type="button" title="Remove from canvas (ticket stays)" onClick={onRemove}>
					✕
				</button>
			</header>
			{linkMode ? (
				<button className="cf-linkpick" type="button" aria-label="Pick this ticket for linking" onClick={onPickLink} />
			) : null}
			<span className="cf-grabline" aria-hidden="true" />
			{editing ? (
				<input
					className="cf-input"
					value={draft}
					autoFocus
					onChange={(event) => onDraft(event.target.value)}
					onBlur={onCommitEdit}
					onKeyDown={(event) => {
						if (event.key === 'Escape') {
							onCancelEdit();
						}
						if (event.key === 'Enter') {
							onCommitEdit();
						}
					}}
				/>
			) : (
				<h3
					className={`cf-title${done || cancelled ? ' is-struck' : ''}`}
					onClick={closed ? undefined : onStartTitleEdit}
					title={closed ? undefined : 'Click to rename the ticket'}
				>
					{originalTicketTitle(ticket)}
				</h3>
			)}
			<div className="cf-meta">
				{closed ? (
					<span className="chip">{done ? '✓ Completed' : 'Triage / cancelled'}</span>
				) : (
					<>
						<button className="chip is-click" type="button" onClick={onPriority} title="Cycle priority">
							{priority?.label ?? 'Medium'}
						</button>
						<button className="chip is-click" type="button" onClick={onEffort} title="Cycle effort 1–5">
							Effort {ticket.estimatedEffort ?? '—'}
						</button>
						{trackShort ? <span className="chip">{trackShort}</span> : null}
					</>
				)}
			</div>
			{closed ? null : reasonActive ? (
				<div className="cf-reason">
					<input
						className="cf-input"
						value={reasonDraft}
						autoFocus
						placeholder={reasonStatus === 'blocked' ? 'Blocked — why?' : 'Why cancel?'}
						onChange={(event) => onReasonDraft(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === 'Escape') {
								onCancelReason();
							}
							if (event.key === 'Enter') {
								onCommitReason();
							}
						}}
					/>
					<button className="primary" type="button" onClick={onCommitReason}>
						Set
					</button>
				</div>
			) : (
				<div className="cf-status">
					{STATUSES.map((entry) => (
						<button
							key={entry.value}
							className={`cf-s st-chip-${entry.value}${ticket.status === entry.value ? ' is-on' : ''}`}
							type="button"
							title={entry.hint}
							onClick={() => onStatus(entry.value)}
						>
							{SHORT_STATUS[entry.value]}
						</button>
					))}
				</div>
			)}
			<span className="cf-resize" onPointerDown={onResizeStart} aria-hidden="true" />
		</article>
	);
}
