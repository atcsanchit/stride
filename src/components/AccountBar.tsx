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
		googleWorkspaces,
		refreshGoogleWorkspaces,
		openGoogleWorkspace,
		createGoogleWorkspace,
		mergeGoogleWorkspaces,
	} = useStride();
	const fileRef = useRef<HTMLInputElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);
	const [pinDraft, setPinDraft] = useState('');
	const [pinOpen, setPinOpen] = useState(false);
	const [workspacePanel, setWorkspacePanel] = useState<'none' | 'switch' | 'create'>('none');
	const [newWorkspaceName, setNewWorkspaceName] = useState('');
	const [busy, setBusy] = useState(false);
	const menuId = useId();

	useEffect(() => {
		if (!open) {
			return;
		}
		const onPointer = (event: MouseEvent) => {
			if (!menuRef.current?.contains(event.target as Node)) {
				setOpen(false);
				setPinOpen(false);
				setWorkspacePanel('none');
			}
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setOpen(false);
				setPinOpen(false);
				setWorkspacePanel('none');
			}
		};
		window.addEventListener('mousedown', onPointer);
		window.addEventListener('keydown', onKey);
		return () => {
			window.removeEventListener('mousedown', onPointer);
			window.removeEventListener('keydown', onKey);
		};
	}, [open]);

	useEffect(() => {
		if (open && drive.connected) {
			void refreshGoogleWorkspaces();
		}
	}, [open, drive.connected, refreshGoogleWorkspaces]);

	if (!profile) {
		return null;
	}

	const status = drive.connected
		? drive.email ?? 'Google on'
		: drive.configured
			? 'Device only'
			: 'This device';
	const siblings = googleWorkspaces.filter((row) => row.profile.id !== profile.id);
	const canMerge = drive.connected && siblings.some((row) => row.tickets > 0 || row.completions > 0 || row.sessions > 0);

	async function run(action: () => Promise<void>) {
		setBusy(true);
		try {
			await action();
		} finally {
			setBusy(false);
		}
	}

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
										disabled={drive.syncing || busy}
										onClick={() => {
											void syncDriveNow();
											setOpen(false);
										}}
									>
										Sync this workspace
									</button>
									<button
										type="button"
										role="menuitem"
										disabled={busy}
										onClick={() => setWorkspacePanel((value) => (value === 'switch' ? 'none' : 'switch'))}
									>
										Switch workspace
									</button>
									{workspacePanel === 'switch' ? (
										<div className="account-workspace-list">
											{googleWorkspaces.map((row) => {
												const active = row.profile.id === profile.id;
												return (
													<button
														key={row.profile.id}
														type="button"
														disabled={busy || active}
														onClick={() => {
															void run(async () => {
																await openGoogleWorkspace(row.profile.id);
																setOpen(false);
																setWorkspacePanel('none');
															});
														}}
													>
														<span>
															<strong>{row.profile.name}</strong>
															<small>
																{row.tickets} tickets · {row.completions} reviews
																{active ? ' · open' : ''}
															</small>
														</span>
													</button>
												);
											})}
										</div>
									) : null}
									<button
										type="button"
										role="menuitem"
										disabled={busy}
										onClick={() => setWorkspacePanel((value) => (value === 'create' ? 'none' : 'create'))}
									>
										New workspace
									</button>
									{workspacePanel === 'create' ? (
										<form
											className="account-pin-form"
											onSubmit={(event) => {
												event.preventDefault();
												void run(async () => {
													await createGoogleWorkspace(newWorkspaceName);
													setNewWorkspaceName('');
													setWorkspacePanel('none');
													setOpen(false);
												});
											}}
										>
											<input
												placeholder="Workspace name"
												value={newWorkspaceName}
												onChange={(event) => setNewWorkspaceName(event.target.value)}
												autoFocus
											/>
											<button className="primary" type="submit" disabled={busy || !newWorkspaceName.trim()}>
												Create
											</button>
										</form>
									) : null}
									{canMerge ? (
										<button
											type="button"
											role="menuitem"
											disabled={busy || drive.syncing}
											onClick={() => {
												if (
													!window.confirm(
														`Merge tickets and progress from ${siblings.length} other workspace(s) into “${profile.name}”? Other workspace files stay on Drive; you can still open them separately.`,
													)
												) {
													return;
												}
												void run(async () => {
													await mergeGoogleWorkspaces();
													setOpen(false);
												});
											}}
										>
											Merge others into this
										</button>
									) : null}
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
