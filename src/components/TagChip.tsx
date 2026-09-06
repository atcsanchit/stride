import { tagClassName } from '../lib/tags';

export function TagChip({
	tag,
	selected = false,
	onClick,
	onRemove,
	title,
}: {
	tag: string;
	selected?: boolean;
	onClick?: () => void;
	onRemove?: () => void;
	title?: string;
}) {
	const className = tagClassName(tag, `${selected ? 'is-on' : ''} ${onClick || onRemove ? 'is-action' : ''}`.trim());
	if (onRemove) {
		return (
			<button type="button" className={className} onClick={onRemove} title={title ?? 'Remove tag'}>
				{tag}
				<em>×</em>
			</button>
		);
	}
	if (onClick) {
		return (
			<button type="button" className={className} onClick={onClick} title={title}>
				{tag}
			</button>
		);
	}
	return <span className={className}>{tag}</span>;
}
