export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export function transactionDone(tx: IDBTransaction): Promise<void> {
	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
		tx.onabort = () => reject(tx.error);
	});
}

export function deleteDatabase(name: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.deleteDatabase(name);
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
		request.onblocked = () => resolve();
	});
}

export async function databaseExists(name: string): Promise<boolean> {
	if (!('databases' in indexedDB)) {
		return new Promise((resolve) => {
			const request = indexedDB.open(name);
			let existed = true;
			request.onupgradeneeded = () => {
				existed = false;
			};
			request.onsuccess = () => {
				request.result.close();
				if (!existed) {
					indexedDB.deleteDatabase(name);
				}
				resolve(existed);
			};
			request.onerror = () => resolve(false);
		});
	}
	const dbs = await indexedDB.databases();
	return dbs.some((entry) => entry.name === name);
}
