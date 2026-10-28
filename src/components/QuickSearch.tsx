import { useEffect, useMemo, useRef, useState } from 'react';
import { enabledTrackIds, trackMeta } from '../constants';
import { isSprintTicket } from '../lib/ticket';
import { ticketIsClosed } from '../lib/ticket';
import type { RoadmapItem, Ticket } from '../types';
import { useStride } from '../store/StrideState';

const STATUS_SHORT: Record<Ticket['status'], string> = {
	requirements: 'Req',
	ready: 'Ready',
	progress: 'Prog',
	review: 'Rev',
	blocked: 'Block',
	done: 'Done',
	cancelled: 'X',
};

type Row =
	| { type: 'ticket'; id: string; label: string; meta: string; ticket: Ticket }
	| { type: 'lesson'; id: string; label: string; meta: string; item: RoadmapItem }
	| { type: 'course'; id: string; label: string; meta: string };

function scoreMatch(haystack: string, needle: string): number {
	const h = haystack.toLowerCase();
	const n = needle.toLowerCase().trim();
	if (!n) {
		return 0;
	}
	const idx = h.indexOf(n);
	if (idx === 0) {
		return 100;
	}
	if (idx > 0) {
		return 60;
	}
	// All query words present somewhere (loose multi-word match).
	const words = n.split(/\s+/).filter(Boolean);
	if (words.length > 1 && words.every((word) => h.includes(word))) {
		return 40;
	}
	return 0;
}

export function QuickSearch() {
	const { tickets, items, settings, focusTicket, openLesson, openTrack, ticketFocus } = useStride();
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [scope, setScope] = useState<'tickets' | 'courses'>('tickets');
	const [cursor, setCursor] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		function onKey(event: KeyboardEvent) {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				setOpen((current) => !current);
			}
			if (event.key === 'Escape') {
				setOpen(false);
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, []);

	useEffect(() => {
		if (open) {
			setQuery('');
			setCursor(0);
			window.setTimeout(() => inputRef.current?.focus(), 0);
		}
	}, [open]);

	// A ticket opened via search closes the dialog implicitly through navigation;
	// also close if the focus channel fired.
	useEffect(() => {
		if (ticketFocus) {
			setOpen(false);
		}
	}, [ticketFocus]);

	const rows = useMemo<(Row | { type: 'none'; label: string })[]>(() => {
		const q = query.trim();
		if (scope === 'tickets') {
			const scored = tickets
				.map((ticket) => {
					const hay = `${ticket.title} ${ticket.tags.join(' ')} ${ticket.choreClient ?? ''}`;
					return { ticket, score: scoreMatch(hay, q) };
				})
				.filter((row) => row.score > 0)
				.sort(
					(a, b) =>
						b.score - a.score ||
						Number(ticketIsClosed(a.ticket.status)) - Number(ticketIsClosed(b.ticket.status)) ||
						(b.ticket.updatedAt ?? 0) - (a.ticket.updatedAt ?? 0),
				)
				.slice(0, 12);
			if (scored.length === 0) {
				return [{ type: 'none', label: q ? 'No tickets match.' : 'No tickets yet.' }];
			}
			return scored.map(({ ticket, score }) => ({
				type: 'ticket' as const,
				id: ticket.id,
				label: ticket.title,
				meta: `${isSprintTicket(ticket) ? 'Sprint' : 'Chore'} · ${STATUS_SHORT[ticket.status]}${score === 100 ? ' · top' : ''}`,
				ticket,
			}));
		}
		const courseIds = enabledTrackIds(settings);
		const courseRows: Row[] = [];
		for (const trackId of courseIds) {
			const meta = trackMeta(trackId, settings);
			const courseScore = scoreMatch(meta.label, q);
			const lessonRows: Row[] = [];
			for (const item of items) {
				if (item.trackId !== trackId) {
					continue;
				}
				const s = scoreMatch(item.title, q);
				if (s > 0) {
					lessonRows.push({
						type: 'lesson',
						id: item.id,
						label: item.title,
						meta: `${meta.short} · ${item.section}${item.done ? ' · done' : ''}`,
						item,
					});
				}
			}
			lessonRows.sort((a, b) => a.label.localeCompare(b.label));
			if (courseScore > 0 || lessonRows.length > 0) {
				courseRows.push({
					type: 'course',
					id: trackId,
					label: meta.label,
					meta: courseScore > 0 ? 'Course' : 'Course · lessons below',
				});
			}
			courseRows.push(...lessonRows.sort((a, b) => a.meta.localeCompare(b.meta)).slice(0, 6));
		}
		if (courseRows.length === 0) {
			return [{ type: 'none', label: q ? 'No lessons match.' : 'No courses enabled.' }];
		}
		return courseRows.slice(0, 16);
	}, [items, query, scope, settings, tickets]);

	const pickable = rows.filter((row) => row.type !== 'none') as Row[];

	useEffect(() => {
		setCursor(0);
	}, [query, scope]);

	function activate(row: Row | undefined) {
		if (!row) {
			return;
		}
		if (row.type === 'ticket') {
			focusTicket(row.id);
			setOpen(false);
		} else if (row.type === 'lesson') {
			openLesson(row.id);
			setOpen(false);
		} else {
			openTrack(row.id);
			setOpen(false);
		}
	}

	if (!open) {
		return (
			<button
				className="qs-trigger"
				type="button"
				onClick={() => setOpen(true)}
				aria-label="Quick search — Ctrl K"
				title="Quick search (Ctrl K)"
			>
				⌕ Search
				<kbd>Ctrl K</kbd>
			</button>
		);
	}

	return (
		<div className="qs-root" role="dialog" aria-label="Quick search" onMouseDown={() => setOpen(false)}>
			<div className="qs-panel" onMouseDown={(event) => event.stopPropagation()}>
				<input
					ref={inputRef}
					className="qs-input"
					value={query}
					placeholder={scope === 'tickets' ? 'Search sprint & chores…' : 'Search courses & lessons…'}
					onChange={(event) => setQuery(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === 'ArrowDown') {
							event.preventDefault();
							setCursor((c) => Math.min(c + 1, Math.max(pickable.length - 1, 0)));
						} else if (event.key === 'ArrowUp') {
							event.preventDefault();
							setCursor((c) => Math.max(c - 1, 0));
						} else if (event.key === 'Enter') {
							event.preventDefault();
							activate(pickable[cursor]);
						}
					}}
				/>
				<div className="qs-scopes" role="tablist">
					<button
						type="button"
						className={scope === 'tickets' ? 'qs-scope is-on' : 'qs-scope'}
						onClick={() => setScope('tickets')}
					>
						Tasks · sprint + chores
					</button>
					<button
						type="button"
						className={scope === 'courses' ? 'qs-scope is-on' : 'qs-scope'}
						onClick={() => setScope('courses')}
					>
						Courses · lessons
					</button>
				</div>
				<ul className="qs-list">
					{rows.map((row, index) =>
						row.type === 'none' ? (
							<li key="none" className="qs-none">
								{row.label}
							</li>
						) : (
							<li key={`${row.type}:${row.id}`}>
								<button
									className={index === cursor ? 'qs-row is-active' : 'qs-row'}
									type="button"
									onMouseEnter={() => setCursor(index)}
									onClick={() => activate(row)}
								>
									<span className="qs-kind">{row.type === 'ticket' ? (isSprintTicket(row.ticket) ? 'Sprint' : 'Chore') : row.type === 'lesson' ? 'Lesson' : 'Course'}</span>
									<span className="qs-label">{row.label}</span>
									<span className="qs-meta">{row.meta}</span>
								</button>
							</li>
						),
					)}
				</ul>
				<p className="qs-hint">↑↓ move · Enter open · Esc close</p>
			</div>
		</div>
	);
}
