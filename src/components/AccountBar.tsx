import { useEffect, useId, useRef, useState } from 'react';
import { firstName, profileLabel } from '../constants';
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
		openHome,
	} = useStride();
	const fileRef = useRef<HTMLInputElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);
	const [pinDraft, setPinDraft] = useState('');
	const [pinOpen, setPinOpen] = useState(false);
	const menuId = useId();

	useEffect(() => {
		if (!open) {
			return;
		}
		const onPointer = (event: MouseEvent) => {
			if (!menuRef.current?.contains(event.target as Node)) {
				setOpen(false);
				setPinOpen(false);
			}
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setOpen(false);
				setPinOpen(false);
			}
		};
		window.addEventListener('mousedown', onPointer);
		window.addEventListener('keydown', onKey);
		return () => {
			window.removeEventListener('mousedown', onPointer);
			window.removeEventListener('keydown', onKey);
		};
	}, [open]);

	if (!profile) {
		return null;
	}

	const status = drive.connected
		? drive.email ?? 'Google on'
		: drive.configured
			? 'Device only'
			: 'This device';

	return (
		<header className="app-top">
			<button className="brand-mark" type="button" onClick={openHome}>
				<span className="eyebrow">Skill cadence</span>
				<strong>Stride</strong>
			</button>
			<div className="app-top-end" ref={menuRef}>
				<span className="app-top-status muted">
					{status}
					{hasPin(profile) ? ' · PIN' : ''}
					{drive.syncing ? ' · syncing' : ''}
				</span>
				<button
					className={`account-trigger${open ? ' is-open' : ''}`}
					type="button"
					aria-expanded={open}
					aria-controls={menuId}
					onClick={() => setOpen((value) => !value)}
				>
					<span className="account-avatar" aria-hidden="true">
						{profile.photo ? (
							<img src={profile.photo} alt="" />
						) : (
							firstName(profileLabel(profile)).slice(0, 1).toUpperCase()
						)}
					</span>
					<span className="account-trigger-copy">
						<strong>{firstName(profileLabel(profile))}</strong>
						<small>Account</small>
					</span>
				</button>
				{open ? (
					<div className="account-menu" id={menuId} role="menu">
						<div className="account-menu-head">
							<strong>{profileLabel(profile)}</strong>
							<small className="muted">{status}</small>
						</div>
						<button type="button" role="menuitem" onClick={() => { setOpen(false); openSettings(); }}>
							Profile
						</button>
						<button type="button" role="menuitem" onClick={() => { setOpen(false); exportBackup(); }}>
							Export backup
						</button>
						<button
							type="button"
							role="menuitem"
							onClick={() => {
								fileRef.current?.click();
								setOpen(false);
							}}
						>
							Import backup
						</button>
						{drive.configured ? (
							drive.connected ? (
								<>
									<button
										type="button"
										role="menuitem"
										disabled={drive.syncing}
										onClick={() => {
											void syncDriveNow();
											setOpen(false);
										}}
									>
										Sync Drive
									</button>
									<button
										type="button"
										role="menuitem"
										disabled={drive.syncing}
										onClick={() => {
											void connectDrive({ pickAccount: true });
											setOpen(false);
										}}
									>
										Switch Google
									</button>
									<button
										type="button"
										role="menuitem"
										onClick={() => {
											disconnectDrive();
											setOpen(false);
										}}
									>
										Disconnect Google
									</button>
								</>
							) : (
								<button
									type="button"
									role="menuitem"
									disabled={drive.syncing}
									onClick={() => {
										void connectDrive({ pickAccount: true });
										setOpen(false);
									}}
								>
									Log in with Google
								</button>
							)
						) : null}
						{hasPin(profile) ? null : pinOpen ? (
							<form
								className="account-pin-form"
								onSubmit={(event) => {
									event.preventDefault();
									void setAccountPin(pinDraft).then(() => {
										setPinDraft('');
										setPinOpen(false);
										setOpen(false);
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
									Save
								</button>
							</form>
						) : (
							<button type="button" role="menuitem" onClick={() => setPinOpen(true)}>
								Set PIN
							</button>
						)}
						<button
							type="button"
							role="menuitem"
							className="account-menu-danger"
							onClick={() => {
								setOpen(false);
								signOut();
							}}
						>
							Log out
						</button>
					</div>
				) : null}
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
		</header>
	);
}
