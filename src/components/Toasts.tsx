import { useStride } from '../store/StrideState';

export function Toasts() {
	const { toasts, dismissToast } = useStride();
	if (toasts.length === 0) {
		return null;
	}
	return (
		<div className="toasts">
			{toasts.map((toast) => (
				<button className="toast" type="button" key={toast.id} onClick={() => dismissToast(toast.id)}>
					<strong>{toast.title}</strong>
					<span className="muted">{toast.body}</span>
				</button>
			))}
		</div>
	);
}
