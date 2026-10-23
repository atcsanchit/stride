import type { Sprint, Ticket, TicketStatus } from '../types';
import { createId } from './id';
import { dedupeChoreTicketsForView } from './sprint';
import { isChoreTicket, isSprintTicket, ticketIsClosed } from './ticket';

/**
 * Canvas floaters are presentation-only pointers to real tickets: the ticket
 * record stays the single source of truth, so editing a floater edits the
 * ticket and any board edit shows up on the canvas for free. Layout lives in
 * localStorage per profile — same precedent as the last-view key — while the
 * durable data (tickets) keeps living in IndexedDB / Drive.
 */

export const CANVAS_ZOOM_MIN = 0.35;
export const CANVAS_ZOOM_MAX = 2.2;
export const CANVAS_CARD_W = 232;
/** Estimated floater height used by layout + fit math; cards auto-height in the DOM. */
export const CANVAS_CARD_H = 152;
export const CANVAS_LANE_GAP_X = 76;
export const CANVAS_ROW_GAP_Y = 44;

export type CanvasViewport = { x: number; y: number; zoom: number };

export type CanvasFloater = {
	id: string;
	/** `ticket` floaters mirror a real ticket; `note` floaters are free plan notes. */
	kind: 'ticket' | 'note';
	ticketId: string;
	/** Note body. Ticket floaters render the live ticket title instead. */
	text: string;
	x: number;
	y: number;
	w: number;
	/** 0 = auto height. */
	h: number;
	createdAt: number;
};

export type CanvasDoc = {
	version: 1;
	viewport: CanvasViewport;
	floaters: CanvasFloater[];
};

export const DEFAULT_VIEWPORT: CanvasViewport = { x: 48, y: 24, zoom: 1 };

export function canvasKey(profileId: string): string {
	return `stride-canvas:${profileId}`;
}

export function blankCanvas(): CanvasDoc {
	return { version: 1, viewport: { ...DEFAULT_VIEWPORT }, floaters: [] };
}

function clampZoomValue(zoom: number): number {
	if (!Number.isFinite(zoom)) {
		return 1;
	}
	return Math.min(CANVAS_ZOOM_MAX, Math.max(CANVAS_ZOOM_MIN, zoom));
}

export function clampZoom(zoom: number): number {
	return clampZoomValue(zoom);
}

export function normalizeViewport(value: unknown): CanvasViewport {
	if (!value || typeof value !== 'object') {
		return { ...DEFAULT_VIEWPORT };
	}
	const raw = value as { x?: unknown; y?: unknown; zoom?: unknown };
	const num = (input: unknown, fallback: number): number =>
		typeof input === 'number' && Number.isFinite(input) ? input : fallback;
	return {
		x: num(raw.x, DEFAULT_VIEWPORT.x),
		y: num(raw.y, DEFAULT_VIEWPORT.y),
		zoom: clampZoomValue(num(raw.zoom, DEFAULT_VIEWPORT.zoom)),
	};
}

export function normalizeFloater(value: unknown): CanvasFloater | null {
	if (!value || typeof value !== 'object') {
		return null;
	}
	const raw = value as Record<string, unknown>;
	const kind = raw.kind === 'note' ? 'note' : 'ticket';
	const ticketId = typeof raw.ticketId === 'string' ? raw.ticketId : '';
	if (kind === 'ticket' && !ticketId) {
		return null;
	}
	const num = (input: unknown, fallback: number): number =>
		typeof input === 'number' && Number.isFinite(input) ? input : fallback;
	return {
		id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
		kind,
		ticketId: kind === 'ticket' ? ticketId : '',
		text: typeof raw.text === 'string' ? raw.text : '',
		x: num(raw.x, 0),
		y: num(raw.y, 0),
		w: Math.min(560, Math.max(168, num(raw.w, CANVAS_CARD_W))),
		h: Math.max(0, num(raw.h, 0)),
		createdAt: num(raw.createdAt, Date.now()),
	};
}

export function normalizeCanvasDoc(value: unknown): CanvasDoc {
	if (!value || typeof value !== 'object') {
		return blankCanvas();
	}
	const raw = value as { viewport?: unknown; floaters?: unknown };
	const floaters = Array.isArray(raw.floaters)
		? raw.floaters.map(normalizeFloater).filter((row): row is CanvasFloater => row !== null)
		: [];
	// One floater per ticket — a stale duplicate must never win.
	const byTicket = new Set<string>();
	const unique = floaters.filter((row) => {
		if (row.kind === 'ticket') {
			if (byTicket.has(row.ticketId)) {
				return false;
			}
			byTicket.add(row.ticketId);
		}
		return true;
	});
	return { version: 1, viewport: normalizeViewport(raw.viewport), floaters: unique };
}

export function loadCanvasDoc(profileId: string): CanvasDoc {
	try {
		const raw = localStorage.getItem(canvasKey(profileId));
		if (!raw) {
			return blankCanvas();
		}
		return normalizeCanvasDoc(JSON.parse(raw));
	} catch {
		return blankCanvas();
	}
}

export function saveCanvasDoc(profileId: string, doc: CanvasDoc): void {
	try {
		localStorage.setItem(canvasKey(profileId), JSON.stringify(doc));
	} catch {
		// Private mode — layout is presentation-only, safe to drop.
	}
}

/** Keep the canvas point under `point` fixed while the zoom changes. */
export function zoomAtPoint(viewport: CanvasViewport, point: { x: number; y: number }, zoom: number): CanvasViewport {
	const next = clampZoomValue(zoom);
	const scale = next / viewport.zoom;
	return {
		zoom: next,
		x: point.x - (point.x - viewport.x) * scale,
		y: point.y - (point.y - viewport.y) * scale,
	};
}

export function screenToCanvas(viewport: CanvasViewport, x: number, y: number): { x: number; y: number } {
	return { x: (x - viewport.x) / viewport.zoom, y: (y - viewport.y) / viewport.zoom };
}

const BOX_PAD = 24;

function overlaps(a: CanvasFloater, x: number, y: number, w: number, h: number): boolean {
	return a.x < x + w + BOX_PAD && a.x + a.w + BOX_PAD > x && a.y < y + h + BOX_PAD && a.y + CANVAS_CARD_H + BOX_PAD > y;
}

/**
 * Scan outward from `start` (canvas coords) for a spot whose card box touches
 * no existing floater. Coarse grid, bounded — canvas placement is a nicety.
 */
export function findFreeSpot(floaters: CanvasFloater[], start: { x: number; y: number }): { x: number; y: number } {
	const w = CANVAS_CARD_W;
	const h = CANVAS_CARD_H;
	const sx = Math.round(start.x / 40) * 40;
	const sy = Math.round(start.y / 40) * 40;
	for (let radius = 0; radius < 24; radius += 1) {
		for (let ring = -radius; ring <= radius; ring += 1) {
			const candidates: Array<[number, number]> = [
				[sx + ring * (w + BOX_PAD), sy - radius * (h + BOX_PAD)],
				[sx + ring * (w + BOX_PAD), sy + radius * (h + BOX_PAD)],
				[sx - radius * (w + BOX_PAD), sy + ring * (h + BOX_PAD)],
				[sx + radius * (w + BOX_PAD), sy + ring * (h + BOX_PAD)],
			];
			for (const [x, y] of candidates) {
				if (x < 0 || y < 0) {
					continue;
				}
				if (!floaters.some((row) => overlaps(row, x, y, w, h))) {
					return { x, y };
				}
			}
		}
	}
	return { x: sx, y: sy };
}

export const CANVAS_LANES: TicketStatus[] = ['progress', 'review', 'blocked', 'ready', 'requirements'];

function planOrder(a: Ticket, b: Ticket): number {
	return (a.priority ?? 1) - (b.priority ?? 1) || a.createdAt - b.createdAt;
}

/**
 * The plan, generated from the tickets: one column per open status lane,
 * sprint tickets before chores. Only open tickets are placed — closed ones
 * stay wherever the user left them.
 */
export function planSprintLayout(
	tickets: Ticket[],
	currentSprint: Sprint | null,
): Array<{ ticketId: string; x: number; y: number }> {
	const scoped = tickets.filter((ticket) => isSprintTicket(ticket));
	const sprintPool = scoped.filter(
		(ticket) => !currentSprint || ticket.sprintId === currentSprint.id || !ticket.sprintId,
	);
	const chorePool = dedupeChoreTicketsForView(tickets.filter(isChoreTicket));
	const place: Array<{ ticketId: string; x: number; y: number }> = [];
	let laneIndex = 0;
	for (const status of CANVAS_LANES) {
		const lane = [
			...sprintPool.filter((ticket) => ticket.status === status).sort(planOrder),
			...chorePool.filter((ticket) => ticket.status === status).sort(planOrder),
		];
		lane.forEach((ticket, row) => {
			place.push({
				ticketId: ticket.id,
				x: 48 + laneIndex * (CANVAS_CARD_W + CANVAS_LANE_GAP_X),
				y: 96 + row * (CANVAS_CARD_H + CANVAS_ROW_GAP_Y),
			});
		});
		if (lane.length > 0) {
			laneIndex += 1;
		}
	}
	return place;
}

/** Rail ordering: open work first, closed last. */
export function railOrder(a: Ticket, b: Ticket): number {
	const aClosed = ticketIsClosed(a.status) ? 1 : 0;
	const bClosed = ticketIsClosed(b.status) ? 1 : 0;
	if (aClosed !== bClosed) {
		return aClosed - bClosed;
	}
	return planOrder(a, b);
}
