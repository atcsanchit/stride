#!/usr/bin/env bash
# Creates (or reuses) a personal GCP project and enables Drive API.
# Google has no supported API for a normal "Web application" OAuth client ID,
# so this script stops at the Console URL and writes .env.local after you paste it.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"
PROJECT_ID="${STRIDE_GCP_PROJECT:-stride-personal-drive}"
ORIGINS="http://localhost:5174,https://stride-ten-psi.vercel.app"

if ! command -v gcloud >/dev/null 2>&1; then
	echo "Install Google Cloud SDK, then run this again."
	exit 1
fi

ACCOUNT="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' | head -n1)"
if [[ -z "$ACCOUNT" ]]; then
	echo "No active gcloud account. Run this, then retry:"
	echo "  gcloud auth login"
	echo "Use a personal Gmail. Not peakflo.co."
	exit 1
fi

if [[ "$ACCOUNT" == *@peakflo.co ]]; then
	echo "Active gcloud account is $ACCOUNT (work)."
	echo "This must be a personal Gmail. Run:"
	echo "  gcloud auth login"
	echo "Pick the personal account, then rerun this script."
	exit 1
fi

echo "Using $ACCOUNT"

if ! gcloud projects describe "$PROJECT_ID" >/dev/null 2>&1; then
	echo "Creating project $PROJECT_ID (free; Drive usage at this volume is \$0)"
	gcloud projects create "$PROJECT_ID" --name="Stride personal Drive" --quiet
fi

gcloud config set project "$PROJECT_ID" >/dev/null
echo "Enabling Drive API…"
gcloud services enable drive.googleapis.com --project="$PROJECT_ID"

CONSOLE="https://console.cloud.google.com/auth/clients/create?project=${PROJECT_ID}&pli=1"
echo
echo "Google does not let a script mint a Web OAuth client ID."
echo "Open this, Application type = Web application, name = Stride:"
echo "  $CONSOLE"
echo
echo "Authorized JavaScript origins (one per line):"
echo "  http://localhost:5174"
echo "  https://stride-ten-psi.vercel.app"
echo
echo "OAuth consent: External, Testing, test user = $ACCOUNT"
echo "Do not add a billing account for this. Do not use work Google."
echo
read -r -p "Paste the client ID (ends with .apps.googleusercontent.com): " CLIENT_ID
CLIENT_ID="$(echo "$CLIENT_ID" | tr -d '[:space:]')"
if [[ "$CLIENT_ID" != *.apps.googleusercontent.com ]]; then
	echo "That does not look like a Web client ID."
	exit 1
fi

{
	echo "# Personal Google Drive backup for Stride. Do not commit."
	echo "VITE_GOOGLE_CLIENT_ID=$CLIENT_ID"
} >"$ENV_FILE"
echo "Wrote $ENV_FILE"
echo "Restart npm run dev. For Vercel: add the same VITE_GOOGLE_CLIENT_ID and redeploy."
echo "(Origins for this client: $ORIGINS)"
