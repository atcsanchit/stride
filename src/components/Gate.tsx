import { useRef, useState } from 'react';
import { useStride } from '../store/StrideState';

export function Gate() {
	const { profiles, createProfile, signInByName, importBackupFile, drive, connectDrive } = useStride();
	const [mode, setMode] = useState<'login' | 'signup'>(profiles.length > 0 ? 'login' : 'signup');
	const [name, setName] = useState('');
	const [pin, setPin] = useState('');
	const [error, setError] = useState('');
	const [busy, setBusy] = useState(false);
	const backupRef = useRef<HTMLInputElement>(null);
	const email = drive.email ?? '';
	const localPart = email.split('@')[0] || 'Google';

	async function run(action: () => Promise<void>) {
		setBusy(true);
		setError('');
		try {
			await action();
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : 'Something went wrong.');
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="page gate">
			<header className="gate-head">
				<p className="eyebrow">Personal · this device</p>
				<h1>Stride</h1>
				<p className="lede">Interview prep on this browser first. Google keeps it if you clear the cache.</p>
			</header>
			{error ? <p className="error">{error}</p> : null}

			{drive.configured ? (
				<section className="gate-card is-hero">
					<p className="eyebrow">Google</p>
					<h2>{drive.connected ? 'Welcome back' : 'Log in with Google'}</h2>
					{drive.connected && email ? (
						<div className="gate-identity">
							<span className="gate-avatar" aria-hidden="true">
								{email.slice(0, 1).toUpperCase()}
							</span>
							<div>
								<strong>{email}</strong>
								<p>Personal Drive linked. Continue opens this account, then you pick courses if it is new.</p>
							</div>
						</div>
					) : (
						<p className="muted gate-copy">
							Use a personal Gmail. A different Gmail opens that person’s Stride, not this one.
						</p>
					)}
					{drive.lastError ? <p className="error">{drive.lastError}</p> : null}
					<div className="gate-actions">
						<button
							className="primary"
							type="button"
							disabled={busy || drive.syncing}
							onClick={() => {
								void run(() => connectDrive({ pickAccount: !drive.connected }));
							}}
						>
							{drive.syncing
								? 'Opening…'
								: drive.connected
									? `Continue as ${localPart}`
									: 'Continue with Google'}
						</button>
						<button
							type="button"
							disabled={busy || drive.syncing}
							onClick={() => {
								void run(() => connectDrive({ pickAccount: true }));
							}}
						>
							Use a different Google account
						</button>
					</div>
				</section>
			) : (
				<p className="muted storage-note">
					Google login is off until <code>VITE_GOOGLE_CLIENT_ID</code> is set and the app is rebuilt.
				</p>
			)}

			<p className="gate-split">
				<span>This browser only</span>
			</p>

			<section className="gate-card">
				<div className="gate-seg" role="tablist" aria-label="Local account">
					<button
						className={mode === 'login' ? 'is-on' : undefined}
						type="button"
						role="tab"
						aria-selected={mode === 'login'}
						onClick={() => {
							setMode('login');
							setError('');
							setPin('');
						}}
					>
						Log in
					</button>
					<button
						className={mode === 'signup' ? 'is-on' : undefined}
						type="button"
						role="tab"
						aria-selected={mode === 'signup'}
						onClick={() => {
							setMode('signup');
							setError('');
							setPin('');
						}}
					>
						Sign up
					</button>
				</div>

				{mode === 'login' ? (
					<form
						onSubmit={(event) => {
							event.preventDefault();
							void run(() => signInByName(name, pin.trim()));
						}}
					>
						<p className="muted gate-copy">Username and PIN stay on this device if you skip Google.</p>
						<label className="field">
							Username
							<input
								value={name}
								onChange={(event) => setName(event.target.value)}
								placeholder="Your unique username"
								autoComplete="username"
								required
							/>
						</label>
						<label className="field">
							PIN
							<input
								type="password"
								inputMode="numeric"
								autoComplete="current-password"
								value={pin}
								onChange={(event) => setPin(event.target.value)}
								placeholder="If this username has a PIN"
							/>
						</label>
						{error && !drive.configured ? <p className="error">{error}</p> : null}
						<div className="gate-actions">
							<button className="primary" type="submit" disabled={busy || !name.trim()}>
								Log in
							</button>
						</div>
					</form>
				) : (
					<form
						onSubmit={(event) => {
							event.preventDefault();
							void run(() => createProfile({ name, pin: pin.trim() || undefined }));
						}}
					>
						<p className="muted gate-copy">New name only. Courses are the next screen. Restore a backup if you already exported one.</p>
						<label className="field">
							Username
							<input
								value={name}
								onChange={(event) => setName(event.target.value)}
								placeholder="Pick a unique username"
								autoComplete="username"
								required
							/>
						</label>
						<label className="field">
							<span className="field-line">
								PIN <span className="gate-optional">optional</span>
							</span>
							<input
								type="password"
								inputMode="numeric"
								autoComplete="new-password"
								value={pin}
								onChange={(event) => setPin(event.target.value)}
								placeholder="Ask for a PIN on this browser"
							/>
						</label>
						{error && !drive.configured ? <p className="error">{error}</p> : null}
						<div className="gate-actions">
							<button className="primary" type="submit" disabled={busy || !name.trim()}>
								Create account
							</button>
							<button type="button" onClick={() => backupRef.current?.click()}>
								Restore backup
							</button>
						</div>
					</form>
				)}
				<input
					ref={backupRef}
					className="sr-only"
					type="file"
					accept="application/json,.json"
					onChange={(event) => {
						const file = event.target.files?.[0];
						event.target.value = '';
						if (file) {
							void run(() => importBackupFile(file));
						}
					}}
				/>
			</section>
		</div>
	);
}
