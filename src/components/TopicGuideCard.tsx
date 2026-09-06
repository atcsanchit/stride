import { resourceKindLabel, type ResourceKind, type ResourceLink, type TopicGuide } from '../lib/topic-guides';

const ORDER: ResourceKind[] = ['problem', 'explainer', 'read', 'docs', 'paper', 'practice'];

function grouped(links: ResourceLink[]): Array<{ kind: ResourceKind; links: ResourceLink[] }> {
	return ORDER.map((kind) => ({ kind, links: links.filter((link) => link.kind === kind) })).filter(
		(group) => group.links.length > 0,
	);
}

export function TopicGuideCard({
	guide,
	title = 'About this topic',
	accent,
}: {
	guide: TopicGuide;
	title?: string;
	accent?: string;
}) {
	return (
		<details className="topic-guide" open style={accent ? { ['--topic-accent' as string]: accent } : undefined}>
			<summary className="eyebrow">{title}</summary>
			<p className="topic-blurb">{guide.blurb}</p>
			{guide.pattern ? (
				<p className="muted" style={{ marginTop: '0.45rem' }}>
					Pattern: {guide.pattern}
				</p>
			) : null}
			{guide.complexity ? (
				<p className="muted" style={{ marginTop: '0.2rem' }}>
					{guide.complexity}
				</p>
			) : null}
			{guide.layman ? (
				<div className="topic-layman">
					<p className="field-label">In plain language</p>
					<p>{guide.layman}</p>
				</div>
			) : null}
			{grouped(guide.links).map((group) => (
				<div key={group.kind} className="topic-link-group">
					<p className="field-label">{resourceKindLabel(group.kind)}</p>
					<ul className="topic-links">
						{group.links.map((link) => (
							<li key={link.href}>
								<a href={link.href} target="_blank" rel="noreferrer noopener">
									{link.label}
								</a>
							</li>
						))}
					</ul>
				</div>
			))}
		</details>
	);
}
