function toHex(bytes: Uint8Array): string {
	return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): ArrayBuffer {
	const buffer = new ArrayBuffer(Math.floor(hex.length / 2));
	const bytes = new Uint8Array(buffer);
	for (let index = 0; index < bytes.length; index += 1) {
		bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
	}
	return buffer;
}

export function randomSalt(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return toHex(bytes);
}

export async function hashPin(pin: string, saltHex: string): Promise<string> {
	const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
	const bits = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt: fromHex(saltHex),
			iterations: 120_000,
			hash: 'SHA-256',
		},
		key,
		256,
	);
	return toHex(new Uint8Array(bits));
}

export async function verifyPin(pin: string, saltHex: string, expectedHex: string): Promise<boolean> {
	if (!saltHex || !expectedHex) {
		return pin.length === 0;
	}
	const actual = await hashPin(pin, saltHex);
	if (actual.length !== expectedHex.length) {
		return false;
	}
	let mismatch = 0;
	for (let index = 0; index < actual.length; index += 1) {
		mismatch |= actual.charCodeAt(index) ^ expectedHex.charCodeAt(index);
	}
	return mismatch === 0;
}
