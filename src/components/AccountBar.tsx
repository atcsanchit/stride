import { useRef, useState } from 'react';
import { firstName } from '../constants';
import { hasPin } from '../lib/accounts';
import { useStride } from '../store/StrideState';

export function AccountBar() {
	const {
		profile,
		signOut,
		exportBackup,
		importBackupFile,
		setAccountPin,
		drive,
		connectDrive,
		syncDriveNow,
		disconnectDrive,
		openSettings,
	} = useStride();
	const fileRef = useRef<HTMLInputElement>(null);
	const [pinDraft, setPinDraft] = useState('');
	const [pinOpen, setPinOpen] = useState(false);
	if (!profile) {
		return null;
	}

	return (
		<div className="account-bar">
			<span>
				{firstName(profile.name)}
				<small className="muted">
					{' '}
					· {drive.connected ? drive.email ?? 'Google on' : 'this device'}
					{hasPin(profile) ? ' · PIN on' : ''}
					{drive.syncing ? ' · syncing' : ''}
				</small>
			</span>
			<div className="nav">
				{hasPin(profile) ? null : pinOpen ? (
					<form
						className="unlock-row"
						onSubmit={(event) => {
							event.preventDefault();
							void setAccountPin(pinDraft).then(() => {
								setPinDraft('');
								setPinOpen(false);
							});
						}}
					>
						<input
							type="password"
							inputMode="numeric"
							autoComplete="new-password"
							placeholder="New PIN"
							value={pinDraft}
							onChange={(event) => setPinDraft(event.target.value)}
							autoFocus
						/>
						<button className="primary" type="submit" disabled={!pinDraft.trim()}>
							Save PIN
						</button>
						<button className="ghost" type="button" onClick={() => setPinOpen(false)}>
							Cancel
						</button>
					</form>
				) : (
					<button type="button" onClick={() => setPinOpen(true)}>
						Set PIN
					</button>
				)}
				<button type="button" onClick={openSettings}>
					Profile
				</button>
				<button type="button" onClick={exportBackup}>
					Export
				</button>
				{drive.configured ? (
					drive.connected ? (
						<>
							<button type="button" disabled={drive.syncing} onClick={() => void syncDriveNow()}>
								Sync Drive
							</button>
							<button type="button" disabled={drive.syncing} onClick={() => void connectDrive({ pickAccount: true })}>
								Switch Google
							</button>
							<button type="button" onClick={disconnectDrive}>
								Disconnect Google
							</button>
						</>
					) : (
						<button type="button" disabled={drive.syncing} onClick={() => void connectDrive({ pickAccount: true })}>
							Log in with Google
						</button>
					)
				) : null}
				<button type="button" onClick={() => fileRef.current?.click()}>
					Import
				</button>
				<button type="button" onClick={signOut}>
					Log out
				</button>
			</div>
			{drive.lastError ? <p className="muted drive-error">{drive.lastError}</p> : null}
			<input
				ref={fileRef}
				className="sr-only"
				type="file"
				accept="application/json,.json"
				onChange={(event) => {
					const file = event.target.files?.[0];
					event.target.value = '';
					if (file) {
						void importBackupFile(file);
					}
				}}
			/>
		</div>
	);
}
