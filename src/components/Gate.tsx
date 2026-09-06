import { useRef, useState } from 'react';
import { TRACKS } from '../constants';
import type { TrackId } from '../types';
import { useStride } from '../store/StrideState';

export function Gate() {
	const { profiles, createProfile, signInByName, importBackupFile } = useStride();
	const [mode, setMode] = useState<'login' | 'signup'>(profiles.length > 0 ? 'login' : 'signup');
	const [name, setName] = useState('');
	const [focusTrack, setFocusTrack] = useState<TrackId>('ai-engineering');
	const [pin, setPin] = useState('');
	const [error, setError] = useState('');
	const [busy, setBusy] = useState(false);
	const backupRef = useRef<HTMLInputElement>(null);

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
			<p className="eyebrow">Personal · this device</p>
			<h1>Stride</h1>
			<p className="lede">
				Username is unique. If that name already has a PIN, you must enter it every time you log in — a saved session
				will not skip it.
			</p>

			<div className="gate-tabs">
				<button
					className={mode === 'login' ? 'pill is-on' : 'pill'}
					type="button"
					onClick={() => {
						setMode('login');
						setError('');
						setPin('');
					}}
				>
					Log in
				</button>
				<button
					className={mode === 'signup' ? 'pill is-on' : 'pill'}
					type="button"
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
				<section className="gate-card">
					<p className="eyebrow">Log in</p>
					<h2>Welcome back</h2>
					<form
						onSubmit={(event) => {
							event.preventDefault();
							void run(() => signInByName(name, pin.trim()));
						}}
					>
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
								placeholder="Required if this username already has a PIN"
							/>
						</label>
						{error ? <p className="error">{error}</p> : null}
						<div className="log-actions">
							<button className="primary" type="submit" disabled={busy || !name.trim()}>
								Log in
							</button>
						</div>
					</form>
				</section>
			) : (
				<section className="gate-card">
					<p className="eyebrow">Sign up</p>
					<h2>Create an account</h2>
					<form
						onSubmit={(event) => {
							event.preventDefault();
							void run(() => createProfile({ name, focusTrack, pin: pin.trim() || undefined }));
						}}
					>
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
						<p className="muted" style={{ margin: '0 0 0.55rem' }}>
							This name is unique. If it is already in the system, change it — Sign up will not log you into that
							account.
						</p>
						<p className="muted" style={{ margin: '0 0 0.55rem' }}>
							Career field — coach protects this if DSA takes over
						</p>
						<div className="meta-row">
							{TRACKS.map((track) => (
								<button
									key={track.id}
									className={track.id === focusTrack ? 'pill is-on' : 'pill'}
									type="button"
									onClick={() => setFocusTrack(track.id)}
								>
									{track.short}
								</button>
							))}
						</div>
						<label className="field">
							PIN
							<input
								type="password"
								inputMode="numeric"
								autoComplete="new-password"
								value={pin}
								onChange={(event) => setPin(event.target.value)}
								placeholder="Set a PIN now if you want login to always ask for it"
							/>
						</label>
						{error ? <p className="error">{error}</p> : null}
						<div className="log-actions">
							<button className="primary" type="submit" disabled={busy || !name.trim()}>
								Sign up
							</button>
							<button type="button" onClick={() => backupRef.current?.click()}>
								Restore backup
							</button>
						</div>
					</form>
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
			)}

			<p className="muted storage-note">
				Username is the unique key. Master login is <code>data/accounts.json</code>; tickets and courses sit under{' '}
				<code>data/users/&lt;user-id&gt;/</code>. Stay on <code>http://localhost:5174</code>.
			</p>
		</div>
	);
}
