type ProgressHook = (profileId: string) => void;
type AccountsHook = () => void;

let progressHook: ProgressHook | null = null;
let accountsHook: AccountsHook | null = null;

export function setDriveProgressHook(hook: ProgressHook): void {
	progressHook = hook;
}

export function setDriveAccountsHook(hook: AccountsHook): void {
	accountsHook = hook;
}

export function notifyProgressSaved(profileId: string): void {
	progressHook?.(profileId);
}

export function notifyAccountsSaved(): void {
	accountsHook?.();
}
