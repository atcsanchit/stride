const MAX_EDGE = 256;
const MAX_DATA_URL = 180_000;

export function readProfilePhoto(file: File): Promise<string> {
	if (!file.type.startsWith('image/')) {
		return Promise.reject(new Error('Choose an image file.'));
	}
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const image = new Image();
		image.onload = () => {
			const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
			const canvas = document.createElement('canvas');
			canvas.width = Math.max(1, Math.round(image.width * scale));
			canvas.height = Math.max(1, Math.round(image.height * scale));
			const context = canvas.getContext('2d');
			if (!context) {
				URL.revokeObjectURL(url);
				reject(new Error('Could not read that image.'));
				return;
			}
			context.drawImage(image, 0, 0, canvas.width, canvas.height);
			URL.revokeObjectURL(url);
			const data = canvas.toDataURL('image/jpeg', 0.82);
			if (data.length > MAX_DATA_URL) {
				reject(new Error('That photo is still too large. Try a smaller image.'));
				return;
			}
			resolve(data);
		};
		image.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error('Could not read that image.'));
		};
		image.src = url;
	});
}
