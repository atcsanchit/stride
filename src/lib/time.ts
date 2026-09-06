export function todayKey(now = new Date()): string {
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function parseKey(key: string): Date {
	const [year, month, day] = key.split('-').map(Number);
	return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function addDays(key: string, days: number): string {
	const date = parseKey(key);
	date.setDate(date.getDate() + days);
	return todayKey(date);
}

export function diffDays(from: string, to: string): number {
	const start = parseKey(from).getTime();
	const end = parseKey(to).getTime();
	return Math.round((end - start) / 86_400_000);
}

export function lastNDates(n: number, end = todayKey()): string[] {
	return Array.from({ length: n }, (_, index) => addDays(end, index - (n - 1)));
}

export function weekdayLabel(key: string): string {
	return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(parseKey(key));
}

export function prettyDate(key: string): string {
	return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(parseKey(key));
}

export function prettyDateLong(key: string): string {
	return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).format(parseKey(key));
}

export function formatMinutes(minutes: number): string {
	if (minutes <= 0) {
		return '0m';
	}
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	if (hours <= 0) {
		return `${rest}m`;
	}
	return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function formatElapsed(ms: number): string {
	const total = Math.max(0, Math.floor(ms / 1000));
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const seconds = total % 60;
	if (hours > 0) {
		return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	}
	return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function weekStart(key = todayKey()): string {
	const date = parseKey(key);
	const weekday = date.getDay();
	const offset = weekday === 0 ? -6 : 1 - weekday;
	return addDays(key, offset);
}

export function weekEnd(start = weekStart()): string {
	return addDays(start, 6);
}

export function datesInclusive(start: string, end: string): string[] {
	let from = start;
	let to = end;
	if (to < from) {
		[from, to] = [to, from];
	}
	const days: string[] = [];
	let cursor = from;
	let guard = 0;
	while (cursor <= to && guard < 366) {
		days.push(cursor);
		cursor = addDays(cursor, 1);
		guard += 1;
	}
	return days;
}

export function clampDate(day: string, start: string, end: string): string {
	if (day < start) {
		return start;
	}
	if (day > end) {
		return end;
	}
	return day;
}
