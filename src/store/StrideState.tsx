import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from 'react';
import { emptySettings, firstName, TRACKS } from '../constants';
import { deleteProfile as deleteProfileRecord, assertUniqueUsername, hasPin, loadProfiles, pickProfileForName, readAccountSession, reconcileAccounts, saveProfile, setPin, unlockProfile } from '../lib/accounts';
import { buildBackup, downloadBackup, parseBackup } from '../lib/backup';
import { loadBundledRoadmaps } from '../lib/bundled';
import { coachNote, todayPlan, trackStats } from '../lib/coach';
import {
	deleteRoadmap as deleteRoadmapRecord,
	deleteReview,
	deleteTicket,
	loadAll,
	migrateLegacyIfNeeded,
	putCompletion,
	putItem,
	putReview,
	putRoadmap,
	putSession,
	putSprint,
	putTicket,
	replaceAll,
	saveIdentity,
	saveSettings,
} from '../lib/db';
import { createId, hashText } from '../lib/id';
import { nameKey } from '../lib/identity';
import { mergeItems, reconcileItemsWithCompletions } from '../lib/merge';
import { parseMarkdownRoadmap } from '../lib/parse-roadmap';
import { applyGrade, prettyInterval, seedReviewCard, syncReviewCards } from '../lib/revise';
import { clearSession, readSession, writeSession } from '../lib/session';
import { addDays, todayKey, weekEnd, weekStart } from '../lib/time';
import { followingSprintRange, originalTicketTitle, previousSprintRange, sprintLabel, withSpiloverTitle } from '../lib/sprint';
import { ticketNeedsPracticalEvidence } from '../lib/practical';
import { isChoreTicket, ticketIsClosed } from '../lib/ticket';
import {
	endSession,
	isSessionPaused,
	isSessionRunning,
	openSessionForTicket,
	pauseSession,
	resumeSession,
	sessionElapsed,
} from '../lib/work-session';
import type {
	BackupFile,
	CoachNote,
	Completion,
	Drop,
	Priority,
	Profile,
	RecallGrade,
	ReviewCard,
	Roadmap,
	RoadmapItem,
	RoadmapOrigin,
	Score,
	Settings,
	Sprint,
	Ticket,
	TodayPlan,
	TicketKind,
	TicketStatus,
	ToastMessage,
	TrackId,
	TrackStats,
	View,
	WorkSession,
} from '../types';

type Phase = 'boot' | 'gate' | 'app';

interface StrideContextValue {
	ready: boolean;
	phase: Phase;
	profile: Profile | null;
	profiles: Profile[];
	view: View;
	roadmaps: Roadmap[];
	items: RoadmapItem[];
	drops: Drop[];
	completions: Completion[];
	sessions: WorkSession[];
	sprints: Sprint[];
	tickets: Ticket[];
	reviews: ReviewCard[];
	settings: Settings;
	stats: TrackStats[];
	plan: TodayPlan;
	coach: CoachNote;
	activeSession: WorkSession | null;
	pendingItemId: string | null;
	pendingTicketId: string;
	currentSprint: Sprint | null;
	toasts: ToastMessage[];
	dragging: boolean;
	openHome: () => void;
	goTo: (next: View) => void;
	openTrack: (trackId: TrackId) => void;
	openLab: () => void;
	openSprint: () => void;
	openChores: () => void;
	openRevise: (itemId?: string) => void;
	openClass: (trackId: TrackId, section: string) => void;
	openLesson: (itemId: string) => void;
	openDay: (date: string) => void;
	setActiveTrack: (trackId: TrackId) => Promise<void>;
	setTarget: (trackId: TrackId, target: number) => Promise<void>;
	startTask: (itemId: string, ticketId?: string) => Promise<void>;
	pauseTimer: (ticketId?: string) => Promise<void>;
	resumeTimer: (ticketId?: string) => Promise<void>;
	setTicketStatus: (id: string, status: TicketStatus) => Promise<void>;
	requestComplete: (itemId: string, ticketId?: string) => void;
	submitComplete: (input: {
		effort: Score;
		review: Score;
		notes: string;
		evidenceNotes?: string;
		evidenceUrls?: string[];
	}) => Promise<void>;
	gradeReview: (itemId: string, grade: RecallGrade, cue?: string) => Promise<void>;
	cancelComplete: () => void;
	addTicket: (input: {
		kind?: TicketKind;
		title: string;
		description: string;
		scope: string;
		topicIds: string[];
		tags?: string[];
		estimatedEffort: Score;
		priority: Priority;
		plannedDate: string;
		status?: TicketStatus;
	}) => Promise<Ticket | undefined>;
	updateTicket: (
		id: string,
		patch: Partial<
			Pick<Ticket, 'title' | 'description' | 'scope' | 'topicIds' | 'tags' | 'estimatedEffort' | 'priority' | 'plannedDate'>
		>,
	) => Promise<void>;
	spillTicket: (id: string) => Promise<void>;
	cloneTicket: (id: string) => Promise<Ticket | undefined>;
	selectSprint: (id: string) => void;
	shiftSprint: (direction: -1 | 1) => Promise<void>;
	updateSprint: (patch: { startDate?: string; endDate?: string; name?: string }) => Promise<void>;
	pickTicket: (id: string) => Promise<void>;
	removeTicket: (id: string) => Promise<void>;
	importMarkdown: (filename: string, source: string, origin?: RoadmapOrigin) => Promise<void>;
	importFiles: (files: FileList | File[]) => Promise<void>;
	removeRoadmap: (id: string) => Promise<void>;
	createProfile: (input: { name: string; focusTrack: TrackId; pin?: string }) => Promise<void>;
	signIn: (profileId: string, pin?: string) => Promise<void>;
	signInByName: (name: string, pin?: string) => Promise<void>;
	setAccountPin: (pin: string) => Promise<void>;
	signOut: () => void;
	removeAccount: (profileId: string) => Promise<void>;
	exportBackup: () => void;
	importBackupFile: (file: File) => Promise<void>;
	dismissToast: (id: string) => void;
	setDragging: (value: boolean) => void;
}

const StrideContext = createContext<StrideContextValue | null>(null);

function bundledId(filename: string): string {
	return `bundled:${filename}`;
}

function blankWorkspace(focusTrack: TrackId = 'ai-engineering') {
	return {
		roadmaps: [] as Roadmap[],
		items: [] as RoadmapItem[],
		drops: [] as Drop[],
		completions: [] as Completion[],
		sessions: [] as WorkSession[],
		sprints: [] as Sprint[],
		tickets: [] as Ticket[],
		reviews: [] as ReviewCard[],
		settings: emptySettings(focusTrack),
		view: { name: 'home' } as View,
	};
}

export function StrideProvider({ children }: { children: ReactNode }) {
	const [phase, setPhase] = useState<Phase>('boot');
	const [profile, setProfile] = useState<Profile | null>(null);
	const [profiles, setProfiles] = useState<Profile[]>([]);
	const [view, setView] = useState<View>({ name: 'home' });
	const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
	const [items, setItems] = useState<RoadmapItem[]>([]);
	const [drops, setDrops] = useState<Drop[]>([]);
	const [completions, setCompletions] = useState<Completion[]>([]);
	const [sessions, setSessions] = useState<WorkSession[]>([]);
	const [sprints, setSprints] = useState<Sprint[]>([]);
	const [activeSprintId, setActiveSprintId] = useState<string | null>(null);
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [reviews, setReviews] = useState<ReviewCard[]>([]);
	const [pendingItemId, setPendingItemId] = useState<string | null>(null);
	const [pendingTicketId, setPendingTicketId] = useState('');
	const [settings, setSettings] = useState<Settings>(emptySettings());
	const [toasts, setToasts] = useState<ToastMessage[]>([]);
	const [dragging, setDragging] = useState(false);

	const profileRef = useRef(profile);
	profileRef.current = profile;
	const itemsRef = useRef(items);
	itemsRef.current = items;
	const roadmapsRef = useRef(roadmaps);
	roadmapsRef.current = roadmaps;
	const settingsRef = useRef(settings);
	settingsRef.current = settings;
	const reviewsRef = useRef(reviews);
	reviewsRef.current = reviews;
	const ticketsRef = useRef(tickets);
	ticketsRef.current = tickets;
	const sessionsRef = useRef(sessions);
	sessionsRef.current = sessions;
	const sprintsRef = useRef(sprints);
	sprintsRef.current = sprints;

	const pushToast = useCallback((title: string, body: string) => {
		const id = createId();
		setToasts((current) => [...current, { id, title, body }]);
		window.setTimeout(() => {
			setToasts((current) => current.filter((toast) => toast.id !== id));
		}, 4200);
	}, []);

	const requireProfile = useCallback(() => {
		const current = profileRef.current;
		if (!current) {
			throw new Error('Signed out');
		}
		return current;
	}, []);

	const persistRoadmap = useCallback(
		async (roadmap: Roadmap, nextItems: RoadmapItem[]) => {
			await putRoadmap(requireProfile().id, roadmap, nextItems);
			setRoadmaps((current) => {
				const rest = current.filter((entry) => entry.id !== roadmap.id);
				return [...rest, roadmap].sort((a, b) => a.addedAt - b.addedAt);
			});
			setItems((current) => {
				const rest = current.filter((item) => item.roadmapId !== roadmap.id);
				return [...rest, ...nextItems].sort((a, b) => a.order - b.order);
			});
		},
		[requireProfile],
	);

	const seedBundled = useCallback(
		async (snapshot: { roadmaps: Roadmap[]; items: RoadmapItem[]; settings: Settings }, profileId: string) => {
			const bundled = loadBundledRoadmaps();
			for (const file of bundled) {
				try {
					const hash = await hashText(file.source);
					const parsed = parseMarkdownRoadmap(file.source, file.filename, snapshot.settings.activeTrack);
					const existing = snapshot.roadmaps.find((entry) => entry.id === bundledId(file.filename));
					if (existing && existing.hash === hash) {
						continue;
					}
					const now = Date.now();
					const roadmap: Roadmap = existing
						? { ...existing, id: existing.id || bundledId(file.filename), title: parsed.title, trackId: parsed.trackId, source: file.source, hash, updatedAt: now }
						: {
								id: bundledId(file.filename),
								trackId: parsed.trackId,
								title: parsed.title,
								filename: file.filename,
								source: file.source,
								hash,
								origin: 'bundled',
								addedAt: now,
								updatedAt: now,
							};
					const merged = mergeItems(roadmap, parsed.items, snapshot.items);
					try {
						await putRoadmap(profileId, roadmap, merged);
					} catch (error) {
						console.error(`Failed to persist ${file.filename}`, error);
					}
					snapshot.roadmaps = [...snapshot.roadmaps.filter((entry) => entry.id !== roadmap.id), roadmap];
					snapshot.items = [...snapshot.items.filter((item) => item.roadmapId !== roadmap.id), ...merged];
				} catch (error) {
					console.error(`Failed to seed ${file.filename}`, error);
				}
			}
			return snapshot;
		},
		[],
	);

	const enterWorkspace = useCallback(
		async (nextProfile: Profile) => {
			writeSession(nextProfile.id);
			const seen = { ...nextProfile, nameKey: nextProfile.nameKey || nameKey(nextProfile.name), lastSeenAt: Date.now() };
			await saveProfile(seen);
			try {
				await saveIdentity(seen.id, {
					userId: seen.id,
					name: seen.name,
					nameKey: seen.nameKey || nameKey(seen.name),
					focusTrack: seen.focusTrack,
					createdAt: seen.createdAt,
				});
			} catch (error) {
				console.error(error);
			}
			setProfile(seen);
			setProfiles((current) => {
				const rest = current.filter((entry) => entry.id !== seen.id);
				return [seen, ...rest].sort((a, b) => b.lastSeenAt - a.lastSeenAt);
			});
			try {
				await migrateLegacyIfNeeded(seen.id);
			} catch (error) {
				console.error(error);
			}
			const loaded = await loadAll(seen.id);
			loaded.settings = { ...loaded.settings, focusTrack: loaded.settings.focusTrack || seen.focusTrack };
			const seeded = await seedBundled(loaded, seen.id);
			const reconciled = reconcileItemsWithCompletions(seeded.items, loaded.completions);
			const previous = new Map(seeded.items.map((item) => [item.id, item]));
			for (const item of reconciled) {
				if (!item.done || previous.get(item.id)?.done) {
					continue;
				}
				try {
					await putItem(seen.id, item);
				} catch (error) {
					console.error(error);
				}
			}
			seeded.items = reconciled;
			setRoadmaps(seeded.roadmaps.sort((a, b) => a.addedAt - b.addedAt));
			setItems(seeded.items.sort((a, b) => a.order - b.order));
			setDrops(loaded.drops);
			const known = new Set(loaded.completions.map((row) => row.itemId).filter(Boolean));
			for (const item of seeded.items) {
				if (!item.done || !item.doneAt || known.has(item.id)) {
					continue;
				}
				const row: Completion = {
					id: createId(),
					itemId: item.id,
					ticketId: '',
					trackId: item.trackId,
					title: item.title,
					section: item.section,
					date: todayKey(new Date(item.doneAt)),
					elapsedMs: 0,
					minutes: 0,
					effort: 3,
					review: 3,
					notes: 'Completed before timed reviews existed',
					completedAt: item.doneAt,
				};
				try {
					await putCompletion(seen.id, row);
					loaded.completions.push(row);
					known.add(item.id);
				} catch (error) {
					console.error(error);
				}
			}
			setCompletions(loaded.completions);
			let nextSprints = loaded.sprints;
			const start = weekStart();
			let current = nextSprints.find((sprint) => sprint.startDate === start) ?? null;
			if (!current) {
				current = {
					id: createId(),
					title: `Week of ${start}`,
					name: '',
					startDate: start,
					endDate: weekEnd(start),
					createdAt: Date.now(),
				};
				nextSprints = [current, ...nextSprints];
				try {
					await putSprint(seen.id, current);
				} catch (error) {
					console.error(error);
				}
			}
			setSprints(nextSprints);
			setActiveSprintId(current.id);
			setTickets(loaded.tickets);
			const synced = syncReviewCards(seeded.items, loaded.reviews ?? [], todayKey());
			for (const card of synced.upserts) {
				try {
					await putReview(seen.id, card);
				} catch (error) {
					console.error(error);
				}
			}
			for (const id of synced.removed) {
				try {
					await deleteReview(seen.id, id);
				} catch (error) {
					console.error(error);
				}
			}
			setReviews(synced.cards);
			setSessions(loaded.sessions);
			setPendingItemId(null);
			setPendingTicketId('');
			setSettings(seeded.settings);
			setView({ name: 'home' });
			setPhase('app');
		},
		[seedBundled],
	);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			const list = await reconcileAccounts();
			if (cancelled) {
				return;
			}
			setProfiles(list);
			const sessionId = readSession() ?? (await readAccountSession());
			const existing = list.find((entry) => entry.id === sessionId) ?? null;
			if (existing && !hasPin(existing)) {
				await enterWorkspace(existing);
				return;
			}
			setPhase('gate');
		})().catch((error: unknown) => {
			console.error(error);
			if (!cancelled) {
				setPhase('gate');
			}
		});
		return () => {
			cancelled = true;
		};
	}, [enterWorkspace]);

	const importMarkdown = useCallback(
		async (filename: string, source: string, origin: RoadmapOrigin = 'dropped') => {
			const hash = await hashText(source);
			const fallback = settingsRef.current.activeTrack;
			const parsed = parseMarkdownRoadmap(source, filename, fallback);
			const currentMaps = roadmapsRef.current;
			const existing =
				origin === 'bundled'
					? currentMaps.find((entry) => entry.id === bundledId(filename))
					: currentMaps.find(
							(entry) =>
								entry.origin === 'dropped' &&
								entry.filename.toLowerCase() === filename.toLowerCase() &&
								entry.trackId === parsed.trackId,
						) ?? currentMaps.find((entry) => entry.hash === hash);

			if (existing && existing.hash === hash) {
				return;
			}

			const now = Date.now();
			const roadmap: Roadmap = existing
				? { ...existing, title: parsed.title, trackId: parsed.trackId, source, hash, updatedAt: now }
				: {
						id: origin === 'bundled' ? bundledId(filename) : createId(),
						trackId: parsed.trackId,
						title: parsed.title,
						filename,
						source,
						hash,
						origin,
						addedAt: now,
						updatedAt: now,
					};

			const merged = mergeItems(roadmap, parsed.items, itemsRef.current);
			await persistRoadmap(roadmap, merged);
			if (origin === 'dropped') {
				pushToast('Roadmap loaded', `${parsed.title} → ${TRACKS.find((track) => track.id === parsed.trackId)?.label}`);
			}
		},
		[persistRoadmap, pushToast],
	);

	const stats = useMemo(
		() => TRACKS.map((track) => trackStats(track.id, items, completions, settings)),
		[completions, items, settings],
	);
	const plan = useMemo(() => todayPlan(stats, settings), [settings, stats]);
	const coach = useMemo(() => coachNote(stats, completions, profile?.name ?? ''), [completions, profile?.name, stats]);
	const persistSession = useCallback(async (profileId: string, session: WorkSession) => {
		await putSession(profileId, session);
		const next = [session, ...sessionsRef.current.filter((entry) => entry.id !== session.id)];
		sessionsRef.current = next;
		setSessions(next);
	}, []);

	const persistTicket = useCallback(async (profileId: string, ticket: Ticket) => {
		await putTicket(profileId, ticket);
		const next = ticketsRef.current.map((entry) => (entry.id === ticket.id ? ticket : entry));
		ticketsRef.current = next;
		setTickets(next);
	}, []);

	const pauseOtherRunning = useCallback(
		async (profileId: string, exceptId?: string) => {
			const now = Date.now();
			const running = sessionsRef.current.filter((session) => isSessionRunning(session) && session.id !== exceptId);
			for (const session of running) {
				await persistSession(profileId, pauseSession(session, now));
			}
		},
		[persistSession],
	);

	const activeSession = useMemo(() => {
		const running = sessions.find((session) => isSessionRunning(session));
		if (running) {
			return running;
		}
		return (
			sessions.find((session) => {
				if (!isSessionPaused(session)) {
					return false;
				}
				if (!session.ticketId) {
					return true;
				}
				return tickets.find((ticket) => ticket.id === session.ticketId)?.status === 'progress';
			}) ?? null
		);
	}, [sessions, tickets]);
	const currentSprint = useMemo(
		() => sprints.find((sprint) => sprint.id === activeSprintId) ?? sprints[0] ?? null,
		[activeSprintId, sprints],
	);

	const startTask = useCallback(
		async (itemId: string, ticketId = '') => {
			const profileId = requireProfile().id;
			const item = itemId ? itemsRef.current.find((entry) => entry.id === itemId) : undefined;
			if (item?.done) {
				pushToast('Already done', 'That course item is already complete.');
				return;
			}
			const ticket = ticketId ? ticketsRef.current.find((entry) => entry.id === ticketId) : undefined;
			if (ticket && ticketIsClosed(ticket.status)) {
				pushToast('Ticket closed', 'Change status before starting a timer.');
				return;
			}
			const firstTopic = ticket
				? ticket.topicIds.map((id) => itemsRef.current.find((entry) => entry.id === id)).find(Boolean)
				: undefined;
			const title = item?.title ?? ticket?.title ?? 'Task';
			const trackId = item?.trackId ?? firstTopic?.trackId ?? settingsRef.current.activeTrack;
			const now = Date.now();
			const existing = ticketId
				? openSessionForTicket(sessionsRef.current, ticketId)
				: itemId
					? sessionsRef.current.find((session) => !session.endedAt && session.itemId === itemId)
					: undefined;
			if (existing && isSessionRunning(existing)) {
				if (ticket && ticket.status !== 'progress') {
					await persistTicket(profileId, { ...ticket, status: 'progress' });
				}
				return;
			}
			await pauseOtherRunning(profileId, existing?.id);
			if (existing) {
				await persistSession(profileId, resumeSession(existing, now));
			} else {
				const session: WorkSession = {
					id: createId(),
					itemId,
					ticketId,
					trackId,
					title,
					startedAt: now,
					elapsedMs: 0,
				};
				await persistSession(profileId, session);
			}
			if (ticket && ticket.status !== 'progress') {
				await persistTicket(profileId, { ...ticket, status: 'progress' });
			}
			pushToast('Timer on', title);
		},
		[pauseOtherRunning, persistSession, persistTicket, pushToast, requireProfile],
	);

	const requestComplete = useCallback((itemId: string, ticketId = '') => {
		if (!itemId && !ticketId) {
			return;
		}
		setPendingItemId(itemId || null);
		setPendingTicketId(ticketId);
	}, []);

	const pauseTimer = useCallback(
		async (ticketId = '') => {
			const profileId = requireProfile().id;
			const session = ticketId
				? openSessionForTicket(sessionsRef.current, ticketId)
				: sessionsRef.current.find((entry) => isSessionRunning(entry));
			if (!session || !isSessionRunning(session)) {
				return;
			}
			await persistSession(profileId, pauseSession(session));
			pushToast('Timer paused', session.title);
		},
		[persistSession, pushToast, requireProfile],
	);

	const resumeTimer = useCallback(
		async (ticketId = '') => {
			if (ticketId) {
				await startTask('', ticketId);
				return;
			}
			const paused = sessionsRef.current.find((session) => isSessionPaused(session));
			if (paused) {
				await startTask(paused.itemId, paused.ticketId);
			}
		},
		[startTask],
	);

	const setTicketStatus = useCallback(
		async (id: string, status: TicketStatus) => {
			const ticket = ticketsRef.current.find((entry) => entry.id === id);
			if (!ticket) {
				return;
			}
			if (ticket.status === status) {
				if (status === 'progress') {
					await startTask('', id);
				}
				return;
			}
			if (ticket.status === 'done') {
				return;
			}
			if (status === 'done') {
				requestComplete('', id);
				return;
			}
			const profileId = requireProfile().id;
			await persistTicket(profileId, { ...ticket, status });
			if (status === 'progress') {
				await startTask('', id);
				return;
			}
			const open = openSessionForTicket(sessionsRef.current, id);
			if (!open) {
				return;
			}
			if (status === 'cancelled') {
				await persistSession(profileId, endSession(open));
				return;
			}
			if (isSessionRunning(open)) {
				await persistSession(profileId, pauseSession(open));
			}
		},
		[persistSession, persistTicket, requestComplete, requireProfile, startTask],
	);

	const cancelComplete = useCallback(() => {
		setPendingItemId(null);
		setPendingTicketId('');
	}, []);

	const submitComplete = useCallback(
		async (input: {
			effort: Score;
			review: Score;
			notes: string;
			evidenceNotes?: string;
			evidenceUrls?: string[];
		}) => {
			const profileId = requireProfile().id;
			const itemId = pendingItemId ?? '';
			const ticketId = pendingTicketId;
			const item = itemId ? itemsRef.current.find((entry) => entry.id === itemId) : undefined;
			const ticket = ticketId ? ticketsRef.current.find((entry) => entry.id === ticketId) : undefined;
			if (!item && !ticket) {
				setPendingItemId(null);
				setPendingTicketId('');
				return;
			}
			const evidenceNotes = input.evidenceNotes?.trim() ?? '';
			const evidenceUrls = input.evidenceUrls ?? [];
			if (ticket && ticketNeedsPracticalEvidence(ticket, itemsRef.current)) {
				if (!evidenceNotes || evidenceUrls.length === 0) {
					pushToast(
						'Need practical evidence',
						'Finish the build, push it to GitHub, then paste a github.com link and a short description of what you shipped.',
					);
					return;
				}
			}
			try {
				const now = Date.now();
				const matching = sessionsRef.current.find(
					(session) =>
						!session.endedAt && (session.itemId === itemId || (ticketId && session.ticketId === ticketId)),
				);
				const elapsedMs = matching ? sessionElapsed(matching, now) : 0;
				if (matching) {
					await persistSession(profileId, endSession(matching, now));
				}

				const tagged =
					ticket && !isChoreTicket(ticket)
						? ticket.topicIds
								.map((id) => itemsRef.current.find((entry) => entry.id === id))
								.filter((entry): entry is RoadmapItem => entry !== undefined && !entry.done)
						: [];
				const targets = ticket ? tagged : item && !item.done ? [item] : [];
				const share = targets.length > 0 ? Math.round(elapsedMs / targets.length) : elapsedMs;
				const note = input.notes.trim();
				const written: Completion[] = [];

				for (const target of targets) {
					const next = { ...target, done: true, doneAt: now };
					await putItem(profileId, next);
					setItems((list) => list.map((entry) => (entry.id === target.id ? next : entry)));
					const completion: Completion = {
						id: createId(),
						itemId: target.id,
						ticketId: ticket?.id ?? '',
						trackId: target.trackId,
						title: target.title,
						section: target.section,
						date: todayKey(),
						elapsedMs: share,
						minutes: Math.round(share / 60000),
						effort: input.effort,
						review: input.review,
						notes: note,
						completedAt: now,
						evidenceNotes: evidenceNotes || undefined,
						evidenceUrls: evidenceUrls.length ? evidenceUrls : undefined,
					};
					await putCompletion(profileId, completion);
					written.push(completion);
					if (!reviewsRef.current.some((card) => card.itemId === next.id)) {
						const card = seedReviewCard(next);
						await putReview(profileId, card);
						setReviews((list) => [...list.filter((entry) => entry.itemId !== card.itemId), card]);
					}
				}

				if (written.length === 0) {
					const firstTopic = ticket
						? ticket.topicIds.map((id) => itemsRef.current.find((entry) => entry.id === id)).find(Boolean)
						: undefined;
					const completion: Completion = {
						id: createId(),
						itemId: '',
						ticketId: ticket?.id ?? '',
						trackId: item?.trackId ?? firstTopic?.trackId ?? settingsRef.current.activeTrack,
						title: item?.title ?? ticket?.title ?? 'Task',
						section: item?.section ?? 'Sprint',
						date: todayKey(),
						elapsedMs,
						minutes: Math.round(elapsedMs / 60000),
						effort: input.effort,
						review: input.review,
						notes: note,
						completedAt: now,
						evidenceNotes: evidenceNotes || undefined,
						evidenceUrls: evidenceUrls.length ? evidenceUrls : undefined,
					};
					await putCompletion(profileId, completion);
					written.push(completion);
				}

				setCompletions((list) => [...list, ...written]);
				if (ticket && ticket.status !== 'done') {
					await persistTicket(profileId, { ...ticket, status: 'done' });
				}
				setPendingItemId(null);
				setPendingTicketId('');
				if (ticket) {
					if (isChoreTicket(ticket)) {
						pushToast('Chore done', 'Logged. Course heatmap unchanged.');
					} else if (targets.length) {
						pushToast(
							'Ticket done',
							`${targets.length} tagged course ${targets.length === 1 ? 'item' : 'items'} recorded on the heatmap.`,
						);
					} else if (ticket.topicIds.length) {
						pushToast('Ticket done', 'Tagged course items were already complete. Heatmap unchanged.');
					} else {
						pushToast('Ticket done', 'Closed. Tag course topics if you want this on the heatmap.');
					}
				} else if (item) {
					pushToast('Course task done', `${item.title} is on today's record.`);
				}
			} catch (error) {
				console.error(error);
				pushToast('Could not save progress', 'IndexedDB rejected the write. Refresh and try Complete again.');
			}
		},
		[pendingItemId, pendingTicketId, persistSession, persistTicket, pushToast, requireProfile],
	);

	const gradeReview = useCallback(
		async (itemId: string, grade: RecallGrade, cue = '') => {
			const profileId = requireProfile().id;
			const item = itemsRef.current.find((entry) => entry.id === itemId);
			const current =
				reviewsRef.current.find((card) => card.itemId === itemId) ?? (item?.done ? seedReviewCard(item) : undefined);
			if (!current) {
				return;
			}
			const next = applyGrade(current, grade, todayKey(), cue);
			try {
				await putReview(profileId, next);
			} catch (error) {
				console.error(error);
				pushToast('Could not save review', 'IndexedDB rejected the write. Refresh and grade again.');
				return;
			}
			setReviews((list) => {
				const rest = list.filter((card) => card.itemId !== next.itemId);
				return [...rest, next].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
			});
			pushToast(
				grade === 'again' ? 'Back on the 1-day box' : 'Next review scheduled',
				`${item?.title ?? 'Topic'} returns ${prettyInterval(next.intervalDays)}.`,
			);
		},
		[pushToast, requireProfile],
	);

	const addTicket = useCallback(
		async (input: {
			kind?: TicketKind;
			title: string;
			description: string;
			scope: string;
			topicIds: string[];
			tags?: string[];
			estimatedEffort: Score;
			priority: Priority;
			plannedDate: string;
			status?: TicketStatus;
		}) => {
			const title = input.title.trim();
			const kind = input.kind === 'chore' ? 'chore' : 'sprint';
			if (!title || (kind === 'sprint' && !currentSprint)) {
				return;
			}
			const topicIds =
				kind === 'chore'
					? []
					: [...new Set(input.topicIds)].filter((id) => itemsRef.current.some((entry) => entry.id === id));
			const profileId = requireProfile().id;
			const ticket: Ticket = {
				id: createId(),
				kind,
				sprintId: kind === 'chore' ? '' : currentSprint?.id ?? '',
				title,
				description: input.description.trim(),
				scope: input.scope.trim(),
				topicIds,
				tags: kind === 'chore' ? [...new Set((input.tags ?? []).map((tag) => tag.trim()).filter(Boolean))] : [],
				estimatedEffort: input.estimatedEffort,
				priority: input.priority,
				plannedDate: input.plannedDate || todayKey(),
				status: input.status ?? 'requirements',
				createdAt: Date.now(),
				userId: profileId,
			};
			await putTicket(profileId, ticket);
			const next = [...ticketsRef.current, ticket].sort((a, b) => a.priority - b.priority || a.createdAt - b.createdAt);
			ticketsRef.current = next;
			setTickets(next);
			if (ticket.status === 'progress') {
				await startTask('', ticket.id);
			}
			return ticket;
		},
		[currentSprint, requireProfile, startTask],
	);

	const updateTicket = useCallback(
		async (
			id: string,
			patch: Partial<
				Pick<Ticket, 'title' | 'description' | 'scope' | 'topicIds' | 'tags' | 'estimatedEffort' | 'priority' | 'plannedDate'>
			>,
		) => {
			const ticket = ticketsRef.current.find((entry) => entry.id === id);
			if (!ticket || ticketIsClosed(ticket.status)) {
				return;
			}
			const chore = isChoreTicket(ticket);
			const next: Ticket = {
				...ticket,
				...patch,
				kind: ticket.kind,
				title: patch.title !== undefined ? patch.title.trim() || ticket.title : ticket.title,
				description: patch.description !== undefined ? patch.description.trim() : ticket.description,
				scope: patch.scope !== undefined ? patch.scope.trim() : ticket.scope,
				topicIds: chore
					? []
					: patch.topicIds
						? [...new Set(patch.topicIds)].filter((topicId) => itemsRef.current.some((entry) => entry.id === topicId))
						: ticket.topicIds,
				tags: chore
					? patch.tags
						? [...new Set(patch.tags.map((tag) => tag.trim()).filter(Boolean))]
						: ticket.tags
					: [],
			};
			await persistTicket(requireProfile().id, next);
		},
		[persistTicket, requireProfile],
	);

	const updateSprint = useCallback(
		async (patch: { startDate?: string; endDate?: string; name?: string }) => {
			if (!currentSprint) {
				return;
			}
			let startDate = patch.startDate ?? currentSprint.startDate;
			let endDate = patch.endDate ?? currentSprint.endDate;
			if (endDate < startDate) {
				const swap = startDate;
				startDate = endDate;
				endDate = swap;
			}
			const name = patch.name !== undefined ? patch.name : currentSprint.name ?? '';
			const next = {
				...currentSprint,
				name,
				startDate,
				endDate,
				title: name.trim() || `Week of ${startDate}`,
			};
			await putSprint(requireProfile().id, next);
			setSprints((list) => list.map((entry) => (entry.id === next.id ? next : entry)));
		},
		[currentSprint, requireProfile],
	);

	const selectSprint = useCallback((id: string) => {
		setActiveSprintId(id);
	}, []);

	const ensureSprintForRange = useCallback(
		async (range: { startDate: string; endDate: string }): Promise<Sprint> => {
			const existing =
				sprintsRef.current.find((sprint) => sprint.startDate === range.startDate && sprint.endDate === range.endDate) ??
				sprintsRef.current.find(
					(sprint) => sprint.startDate <= range.startDate && sprint.endDate >= range.startDate,
				);
			if (existing) {
				return existing;
			}
			const created: Sprint = {
				id: createId(),
				title: `Week of ${range.startDate}`,
				name: '',
				startDate: range.startDate,
				endDate: range.endDate,
				createdAt: Date.now(),
			};
			await putSprint(requireProfile().id, created);
			setSprints((list) => [created, ...list].sort((a, b) => b.createdAt - a.createdAt));
			sprintsRef.current = [created, ...sprintsRef.current.filter((entry) => entry.id !== created.id)];
			return created;
		},
		[requireProfile],
	);

	const shiftSprint = useCallback(
		async (direction: -1 | 1) => {
			if (!currentSprint) {
				return;
			}
			const range = direction === 1 ? followingSprintRange(currentSprint) : previousSprintRange(currentSprint);
			const next = await ensureSprintForRange(range);
			setActiveSprintId(next.id);
		},
		[currentSprint, ensureSprintForRange],
	);

	const spillTicket = useCallback(
		async (id: string) => {
			const ticket = ticketsRef.current.find((entry) => entry.id === id);
			if (!ticket || ticket.status === 'cancelled') {
				return;
			}
			const profileId = requireProfile().id;
			const originalTitle = originalTicketTitle(ticket);
			const spilledTitle = withSpiloverTitle(originalTitle);
			if (isChoreTicket(ticket)) {
				await persistTicket(profileId, {
					...ticket,
					originalTitle,
					title: spilledTitle,
					plannedDate: addDays(ticket.plannedDate, 1),
				});
				const siblings = ticketsRef.current.filter(
					(entry) =>
						entry.id !== id &&
						isChoreTicket(entry) &&
						originalTicketTitle(entry).toLowerCase() === originalTitle.toLowerCase(),
				);
				for (const sibling of siblings) {
					await deleteTicket(profileId, sibling.id);
				}
				if (siblings.length > 0) {
					const next = ticketsRef.current.filter(
						(entry) => !siblings.some((sibling) => sibling.id === entry.id),
					);
					ticketsRef.current = next;
					setTickets(next);
				}
				pushToast('Moved to next day', spilledTitle);
				return;
			}
			const from =
				sprintsRef.current.find((sprint) => sprint.id === ticket.sprintId) ?? currentSprint;
			if (!from) {
				return;
			}
			const nextSprint = await ensureSprintForRange(followingSprintRange(from));
			await persistTicket(profileId, {
				...ticket,
				originalTitle,
				title: spilledTitle,
				sprintId: nextSprint.id,
				plannedDate: nextSprint.startDate,
			});
			pushToast('Moved to next sprint', sprintLabel(nextSprint));
		},
		[currentSprint, ensureSprintForRange, persistTicket, pushToast, requireProfile],
	);

	const cloneTicket = useCallback(
		async (id: string) => {
			const ticket = ticketsRef.current.find((entry) => entry.id === id);
			if (!ticket) {
				return;
			}
			if (isChoreTicket(ticket)) {
				await spillTicket(id);
				return ticketsRef.current.find((entry) => entry.id === id);
			}
			const profileId = requireProfile().id;
			const status =
				ticket.status === 'done' || ticket.status === 'cancelled' || ticket.status === 'progress'
					? 'ready'
					: ticket.status;
			const clone: Ticket = {
				id: createId(),
				userId: profileId,
				kind: ticket.kind,
				sprintId: ticket.sprintId,
				title: ticket.title,
				description: ticket.description,
				scope: ticket.scope,
				topicIds: [...ticket.topicIds],
				tags: [...ticket.tags],
				estimatedEffort: ticket.estimatedEffort,
				priority: ticket.priority,
				plannedDate: ticket.plannedDate,
				status,
				createdAt: Date.now(),
			};
			{
				const from = sprintsRef.current.find((sprint) => sprint.id === ticket.sprintId) ?? currentSprint;
				if (!from) {
					return;
				}
				const nextSprint = await ensureSprintForRange(followingSprintRange(from));
				clone.sprintId = nextSprint.id;
				clone.plannedDate = nextSprint.startDate;
			}
			await putTicket(profileId, clone);
			const next = [...ticketsRef.current, clone].sort((a, b) => a.priority - b.priority || a.createdAt - b.createdAt);
			ticketsRef.current = next;
			setTickets(next);
			pushToast('Cloned to next sprint', clone.title);
			return clone;
		},
		[currentSprint, ensureSprintForRange, pushToast, requireProfile, spillTicket],
	);

	const pickTicket = useCallback(
		async (id: string) => {
			const ticket = ticketsRef.current.find((entry) => entry.id === id);
			if (!ticket || ticketIsClosed(ticket.status)) {
				return;
			}
			await startTask('', ticket.id);
		},
		[startTask],
	);

	const removeTicket = useCallback(
		async (id: string) => {
			const ticket = ticketsRef.current.find((entry) => entry.id === id);
			if (!ticket || ticket.status === 'done') {
				return;
			}
			await deleteTicket(requireProfile().id, id);
			setTickets((list) => list.filter((entry) => entry.id !== id));
		},
		[requireProfile],
	);

	const importFiles = useCallback(
		async (files: FileList | File[]) => {
			const markdown = [...files].filter((file) => file.name.toLowerCase().endsWith('.md'));
			if (markdown.length === 0) {
				pushToast('Need a .md file', 'Roadmaps are markdown. Drop a .md with headings and a checklist.');
				return;
			}
			for (const file of markdown) {
				await importMarkdown(file.name, await file.text(), 'dropped');
			}
		},
		[importMarkdown, pushToast],
	);

	const removeRoadmap = useCallback(
		async (id: string) => {
			await deleteRoadmapRecord(requireProfile().id, id);
			setRoadmaps((list) => list.filter((entry) => entry.id !== id));
			setItems((list) => list.filter((item) => item.roadmapId !== id));
		},
		[requireProfile],
	);

	const setActiveTrack = useCallback(
		async (trackId: TrackId) => {
			const next = { ...settingsRef.current, activeTrack: trackId };
			setSettings(next);
			await saveSettings(requireProfile().id, next);
		},
		[requireProfile],
	);

	const setTarget = useCallback(
		async (trackId: TrackId, target: number) => {
			const next = {
				...settingsRef.current,
				dailyTargets: { ...settingsRef.current.dailyTargets, [trackId]: Math.max(1, target) },
			};
			setSettings(next);
			await saveSettings(requireProfile().id, next);
		},
		[requireProfile],
	);

	const createProfile = useCallback(
		async (input: { name: string; focusTrack: TrackId; pin?: string }) => {
			const name = input.name.trim();
			if (!name) {
				throw new Error('Name is required');
			}
			await assertUniqueUsername(name);
			let next: Profile = {
				id: createId(),
				name,
				nameKey: nameKey(name),
				focusTrack: input.focusTrack,
				pinSalt: '',
				pinHash: '',
				createdAt: Date.now(),
				lastSeenAt: Date.now(),
			};
			if (input.pin) {
				next = await setPin(next, input.pin);
			} else {
				await saveProfile(next);
			}
			await saveSettings(next.id, emptySettings(input.focusTrack));
			await enterWorkspace(next);
			pushToast('Welcome', `${firstName(name)}, this browser keeps your record under one permanent user id.`);
		},
		[enterWorkspace, pushToast],
	);

	const signIn = useCallback(
		async (profileId: string, pin = '') => {
			const found = profiles.find((entry) => entry.id === profileId) ?? (await loadProfiles()).find((entry) => entry.id === profileId);
			if (!found) {
				throw new Error('Profile not found');
			}
			if (hasPin(found) && !pin.trim()) {
				throw new Error('This username has a PIN. Enter it to log in.');
			}
			if (hasPin(found) && !(await unlockProfile(found, pin))) {
				throw new Error('That PIN does not match.');
			}
			await enterWorkspace(found);
		},
		[enterWorkspace, profiles],
	);

	const signInByName = useCallback(
		async (name: string, pin = '') => {
			const trimmed = name.trim();
			if (!trimmed) {
				throw new Error('Enter your username.');
			}
			const found = await pickProfileForName(trimmed);
			if (!found) {
				throw new Error('No user with that name. Sign up instead.');
			}
			await signIn(found.id, pin);
		},
		[signIn],
	);

	const setAccountPin = useCallback(
		async (pin: string) => {
			const current = requireProfile();
			const next = pin.trim();
			if (!next) {
				throw new Error('Enter a PIN.');
			}
			const locked = await setPin(current, next);
			setProfile(locked);
			setProfiles((list) => list.map((entry) => (entry.id === locked.id ? locked : entry)));
			pushToast('PIN saved', 'Log in will always ask for this PIN.');
		},
		[pushToast, requireProfile],
	);

	const signOut = useCallback(() => {
		clearSession();
		setProfile(null);
		const blank = blankWorkspace();
		setRoadmaps(blank.roadmaps);
		setItems(blank.items);
		setDrops(blank.drops);
		setCompletions(blank.completions);
		setSessions(blank.sessions);
		setSprints(blank.sprints);
		setActiveSprintId(null);
		setTickets(blank.tickets);
		setReviews(blank.reviews);
		setPendingItemId(null);
		setPendingTicketId('');
		setSettings(blank.settings);
		setView(blank.view);
		setPhase('gate');
		void loadProfiles().then(setProfiles);
	}, []);

	const removeAccount = useCallback(
		async (profileId: string) => {
			await deleteProfileRecord(profileId);
			if (profileRef.current?.id === profileId) {
				signOut();
			}
			setProfiles((current) => current.filter((entry) => entry.id !== profileId));
			pushToast('Profile removed', 'That personal record was deleted from this browser.');
		},
		[pushToast, signOut],
	);

	const exportBackup = useCallback(() => {
		const current = requireProfile();
		downloadBackup(
			buildBackup({
				profile: current,
				settings: settingsRef.current,
				roadmaps: roadmapsRef.current,
				items: itemsRef.current,
				drops,
				completions,
				sessions,
				sprints,
				tickets,
				reviews,
			}),
		);
		pushToast('Backup saved', 'Keep the JSON in a personal folder. Not company Drive.');
	}, [completions, drops, pushToast, requireProfile, reviews, sessions, sprints, tickets]);

	const applyBackup = useCallback(
		async (backup: BackupFile, nextProfile: Profile) => {
			const settingsNext = { ...backup.settings, focusTrack: backup.profile.focusTrack };
			await replaceAll(nextProfile.id, {
				roadmaps: backup.roadmaps,
				items: backup.items,
				drops: backup.drops,
				completions: backup.completions ?? [],
				sessions: backup.sessions ?? [],
				sprints: backup.sprints ?? [],
				tickets: backup.tickets ?? [],
				reviews: backup.reviews ?? [],
				settings: settingsNext,
			});
			await enterWorkspace({ ...nextProfile, name: backup.profile.name, focusTrack: backup.profile.focusTrack });
			pushToast('Backup restored', `Welcome back, ${firstName(backup.profile.name)}.`);
		},
		[enterWorkspace, pushToast],
	);

	const importBackupFile = useCallback(
		async (file: File) => {
			const backup = parseBackup(await file.text());
			const current = profileRef.current;
			if (current && phase === 'app') {
				await applyBackup(backup, current);
				return;
			}
			const listed = await reconcileAccounts();
			const byId = backup.profile.id ? listed.find((entry) => entry.id === backup.profile.id) : undefined;
			const byName = await pickProfileForName(backup.profile.name);
			const existing = byId ?? byName;
			if (existing) {
				await applyBackup(backup, existing);
				return;
			}
			const created: Profile = {
				id: backup.profile.id || createId(),
				name: backup.profile.name,
				nameKey: nameKey(backup.profile.name),
				focusTrack: backup.profile.focusTrack,
				pinSalt: '',
				pinHash: '',
				createdAt: Date.now(),
				lastSeenAt: Date.now(),
			};
			await saveProfile(created);
			await applyBackup(backup, created);
		},
		[applyBackup, phase],
	);

	const value: StrideContextValue = {
		ready: phase !== 'boot',
		phase,
		profile,
		profiles,
		view,
		roadmaps,
		items,
		drops,
		completions,
		sessions,
		sprints,
		tickets,
		reviews,
		settings,
		stats,
		plan,
		coach,
		activeSession,
		pendingItemId,
		pendingTicketId,
		currentSprint,
		toasts,
		dragging,
		openHome: () => setView({ name: 'home' }),
		goTo: (next) => {
			setView(next);
			if (next.name === 'track' || next.name === 'class') {
				void setActiveTrack(next.trackId);
			}
		},
		openTrack: (trackId) => {
			setView({ name: 'track', trackId });
			void setActiveTrack(trackId);
		},
		openLab: () => setView({ name: 'lab' }),
		openSprint: () => setView({ name: 'sprint' }),
		openChores: () => setView({ name: 'chores' }),
		openRevise: (itemId) => setView({ name: 'revise', itemId }),
		openClass: (trackId, section) => setView({ name: 'class', trackId, section }),
		openLesson: (itemId) => setView({ name: 'lesson', itemId }),
		openDay: (date) => setView({ name: 'day', date }),
		setActiveTrack,
		setTarget,
		startTask,
		pauseTimer,
		resumeTimer,
		setTicketStatus,
		requestComplete,
		submitComplete,
		gradeReview,
		cancelComplete,
		addTicket,
		updateTicket,
		updateSprint,
		selectSprint,
		shiftSprint,
		spillTicket,
		cloneTicket,
		pickTicket,
		removeTicket,
		importMarkdown,
		importFiles,
		removeRoadmap,
		createProfile,
		signIn,
		signInByName,
		setAccountPin,
		signOut,
		removeAccount,
		exportBackup,
		importBackupFile,
		dismissToast: (id) => setToasts((current) => current.filter((toast) => toast.id !== id)),
		setDragging,
	};

	return <StrideContext.Provider value={value}>{children}</StrideContext.Provider>;
}

export function useStride() {
	const value = useContext(StrideContext);
	if (!value) {
		throw new Error('useStride must be used inside StrideProvider');
	}
	return value;
}
