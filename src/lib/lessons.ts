import { slug } from './id';
import { DSA_LESSONS } from './lessons/dsa';
import { topicGuide, type ResourceLink, type TopicGuide } from './topic-guides';
import type { RoadmapItem, TrackId } from '../types';

export type LessonGuide = TopicGuide;

function dedupe(links: ResourceLink[]): ResourceLink[] {
	const seen = new Set<string>();
	return links.filter((link) => {
		if (seen.has(link.href)) {
			return false;
		}
		seen.add(link.href);
		return true;
	});
}

export function classGuide(trackId: TrackId, section: string): LessonGuide | undefined {
	return topicGuide(trackId, section);
}

export function lessonGuide(item: Pick<RoadmapItem, 'trackId' | 'section' | 'title'>): LessonGuide | undefined {
	const specific = item.trackId === 'dsa' ? DSA_LESSONS[item.title] ?? DSA_LESSONS[slug(item.title)] : undefined;
	const klass = topicGuide(item.trackId, item.section);
	if (!specific && !klass) {
		return undefined;
	}
	return {
		blurb: specific?.blurb ?? klass?.blurb ?? '',
		layman: specific?.layman ?? klass?.layman,
		pattern: specific?.pattern ?? klass?.pattern,
		complexity: specific?.complexity,
		links: dedupe([...(specific?.links ?? []), ...(klass?.links ?? [])]),
	};
}
