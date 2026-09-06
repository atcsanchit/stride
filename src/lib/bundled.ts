function asMarkdown(value: unknown): string {
	if (typeof value === 'string') {
		return value;
	}
	if (value && typeof value === 'object' && 'default' in value) {
		const nested = (value as { default: unknown }).default;
		if (typeof nested === 'string') {
			return nested;
		}
	}
	return '';
}

export function loadBundledRoadmaps(): Array<{ filename: string; source: string }> {
	const modules = import.meta.glob('../roadmaps/*.md', {
		query: '?raw',
		import: 'default',
		eager: true,
	}) as Record<string, unknown>;

	return Object.entries(modules).flatMap(([path, value]) => {
		const source = asMarkdown(value);
		if (!source.trim()) {
			return [];
		}
		return [{ filename: path.split('/').pop() ?? path, source }];
	});
}
