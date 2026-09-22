import { useRef, useState } from 'react';
import { TRACKS } from '../constants';
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
		<div className="gate-shell">
			<section className="gate-stage" aria-label="Stride">
				<div className="gate-aurora" aria-hidden="true">
					<span className="gate-orb gate-orb-a" />
					<span className="gate-orb gate-orb-b" />
					<span className="gate-orb gate-orb-c" />
				</div>
				<div className="gate-stage-copy">
					<p className="eyebrow">Personal · this device</p>
					<h1>Stride</h1>
					<p className="lede">
						Interview prep that counts hours, not checkmarks. Blurt, apply, write one sentence — then keep the
						craft clock honest.
					</p>
					<ul className="gate-tracks">
						{TRACKS.map((track) => (
							<li key={track.id} className={`gate-track gate-track-${track.id}`}>
								<span className="gate-track-dot" aria-hidden="true" />
								<div>
									<strong>{track.label}</strong>
									<small>{track.blurb}</small>
								</div>
							</li>
						))}
					</ul>
				</div>
			</section>

			<section className="gate-auth">
				<div className="gate-auth-inner">
					<header className="gate-auth-head">
						<p className="eyebrow">Enter</p>
						<h2>Pick how you start</h2>
						<p className="muted">Google keeps a Drive backup. Local stays on this browser only.</p>
					</header>

					{error ? <p className="error">{error}</p> : null}

					{drive.configured ? (
						<section className="gate-card is-hero">
							<div className="gate-card-kicker">
								<p className="eyebrow">Recommended</p>
								<span className="gate-badge">Google</span>
							</div>
							<h3>{drive.connected ? 'Welcome back' : 'Continue with Google'}</h3>
							{drive.connected && email ? (
								<div className="gate-identity">
									<span className="gate-avatar" aria-hidden="true">
										{email.slice(0, 1).toUpperCase()}
									</span>
									<div>
										<strong>{email}</strong>
										<p>Personal Drive linked. Continue opens this workspace, then courses if it is new.</p>
									</div>
								</div>
							) : (
								<p className="muted gate-copy">
									Use a personal Gmail. A different account opens that person’s Stride, not this one.
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
						<span>Or stay local</span>
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
								<p className="muted gate-copy">
									New name only. Courses are the next screen. Restore a backup if you already exported one.
								</p>
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
			</section>
		</div>
	);
}
