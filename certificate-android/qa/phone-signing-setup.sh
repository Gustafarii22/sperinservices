#!/usr/bin/env bash
# Official Sperin Certificates owner-run signing provisioner for Termux.
# Never commit, share or screenshot your keystore, recovery.env or passwords.
set -euo pipefail
umask 077
export LC_ALL=C
REPO='Gustafarii22/sperinservices'
BRANCH='fix/certificates-v197-data-safe-ux'
ENVIRONMENT='certificates-production'
ALIAS='sperin-certificates-permanent-2026'
ROOT="$HOME/.local/share/sperin-certificates-signing"
KEYSTORE="$ROOT/sperin-certificates-permanent.jks"
RECOVERY="$ROOT/recovery.env"
BACKUP="$HOME/storage/downloads/Sperin-Certificates-signing-key-ENCRYPTED.bin"

for cmd in openssl keytool gh sha256sum base64; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    printf 'Missing %s. Run: pkg install -y openjdk-17 gh openssl coreutils\n' "$cmd" >&2
    exit 1
  fi
done
if [[ ! -d "$HOME/storage/downloads" ]]; then
  printf 'Allow Downloads access first: termux-setup-storage\n' >&2
  exit 1
fi
if ! gh auth status --hostname github.com >/dev/null 2>&1; then
  printf 'Sign in: gh auth login -h github.com -p https -w\n' >&2
  exit 1
fi
if [[ "$(gh api "repos/$REPO" --jq '.permissions.admin')" != 'true' ]]; then
  printf 'GitHub account must have administrator access to %s.\n' "$REPO" >&2
  exit 1
fi

mkdir -p "$ROOT"
chmod 700 "$ROOT"
if [[ ! -f "$RECOVERY" ]]; then
  if [[ -e "$KEYSTORE" ]]; then
    printf 'Existing keystore without recovery credentials: refusing to overwrite.\n' >&2
    exit 1
  fi
  SPERIN_STORE_PASSWORD="$(openssl rand -hex 32)"
  SPERIN_KEY_PASSWORD="$(openssl rand -hex 32)"
  SPERIN_BACKUP_PASSWORD="$(openssl rand -hex 32)"
  export SPERIN_STORE_PASSWORD SPERIN_KEY_PASSWORD SPERIN_BACKUP_PASSWORD
  {
    printf 'SPERIN_STORE_PASSWORD=%s\n' "$SPERIN_STORE_PASSWORD"
    printf 'SPERIN_KEY_PASSWORD=%s\n' "$SPERIN_KEY_PASSWORD"
    printf 'SPERIN_BACKUP_PASSWORD=%s\n' "$SPERIN_BACKUP_PASSWORD"
  } > "$RECOVERY"
  chmod 600 "$RECOVERY"
  printf 'Generating permanent RSA 3072-bit Android signing key...\n'
  keytool -genkeypair -alias "$ALIAS" -keyalg RSA -keysize 3072 \
    -validity 10000 -storetype JKS -keystore "$KEYSTORE" \
    -dname 'CN=Sperin Services, O=Sperin Services, C=GB' \
    -storepass:env SPERIN_STORE_PASSWORD -keypass:env SPERIN_KEY_PASSWORD -noprompt >/dev/null
else
  # This owner-local file is generated solely by this script with hex secrets.
  # shellcheck disable=SC1090
  source "$RECOVERY"
  export SPERIN_STORE_PASSWORD SPERIN_KEY_PASSWORD SPERIN_BACKUP_PASSWORD
  if [[ ! -f "$KEYSTORE" ]]; then
    printf 'Recovery file present but keystore missing. Restore the backup; do not regenerate.\n' >&2
    exit 1
  fi
fi
FINGERPRINT="$(keytool -list -v -alias "$ALIAS" -keystore "$KEYSTORE" \
  -storepass:env SPERIN_STORE_PASSWORD 2>/dev/null \
  | sed -n 's/.*SHA256: //p' | head -1 | tr -d ':[:space:]' | tr 'A-F' 'a-f')"
if [[ ! "$FINGERPRINT" =~ ^[a-f0-9]{64}$ ]]; then
  printf 'Unable to read signer fingerprint. Stopping.\n' >&2
  exit 1
fi
if [[ ! -f "$BACKUP" ]]; then
  printf 'Creating AES-256 encrypted signing-key backup in Downloads...\n'
  openssl enc -aes-256-cbc -salt -pbkdf2 -iter 300000 \
    -in "$KEYSTORE" -out "$BACKUP" -pass env:SPERIN_BACKUP_PASSWORD
fi

RESTORED="$ROOT/restore-check.jks"
trap 'rm -f "$RESTORED"' EXIT
openssl enc -d -aes-256-cbc -pbkdf2 -iter 300000 \
  -in "$BACKUP" -out "$RESTORED" -pass env:SPERIN_BACKUP_PASSWORD
if [[ "$(sha256sum "$KEYSTORE" | cut -d' ' -f1)" != "$(sha256sum "$RESTORED" | cut -d' ' -f1)" ]]; then
  printf 'Encrypted backup does not match signing key. Stopping.\n' >&2
  exit 1
fi
keytool -list -alias "$ALIAS" -keystore "$RESTORED" \
  -storepass:env SPERIN_STORE_PASSWORD >/dev/null 2>&1
rm -f "$RESTORED"

printf '\nBACKUP RESTORED AND VERIFIED. To retain the signing identity forever:\n'
printf '1. In Samsung My Files > Downloads, upload %s to your Google Drive.\n' "$(basename "$BACKUP")"
printf '2. Save the following three recovery passwords in a password manager separately.\n'
printf '   Never send them in chat or store them in the GitHub repository.\n\n'
cat "$RECOVERY"
printf '\nType BACKEDUP ONLY after both independent copies are saved: '
read -r CONFIRMED
if [[ "$CONFIRMED" != 'BACKEDUP' ]]; then
  printf 'Stopped safely. Your local signing key is retained; rerun this script to continue.\n'
  exit 0
fi

printf '\nRestricting GitHub production-signing environment to the reviewed branches...\n'
gh api --method PUT "repos/$REPO/environments/$ENVIRONMENT" \
  -F 'deployment_branch_policy[protected_branches]=false' \
  -F 'deployment_branch_policy[custom_branch_policies]=true' >/dev/null
for policy_branch in "$BRANCH" main; do
  if ! gh api "repos/$REPO/environments/$ENVIRONMENT/deployment-branch-policies" \
    --jq '.branch_policies[].name' | grep -Fxq "$policy_branch"; then
    gh api --method POST "repos/$REPO/environments/$ENVIRONMENT/deployment-branch-policies" \
      -f name="$policy_branch" -f type=branch >/dev/null
  fi
done
printf 'Saving encrypted release secrets to GitHub...\n'
base64 "$KEYSTORE" | tr -d '\n' | gh secret set SPERIN_PERMANENT_JKS_BASE64 --env "$ENVIRONMENT" -R "$REPO"
printf '%s' "$SPERIN_STORE_PASSWORD" | gh secret set SPERIN_STORE_PASSWORD --env "$ENVIRONMENT" -R "$REPO"
printf '%s' "$SPERIN_KEY_PASSWORD" | gh secret set SPERIN_KEY_PASSWORD --env "$ENVIRONMENT" -R "$REPO"
printf '%s' "$ALIAS" | gh secret set SPERIN_KEY_ALIAS --env "$ENVIRONMENT" -R "$REPO"
printf '%s' "$FINGERPRINT" | gh secret set SPERIN_BACKUP_VERIFIED_SHA256 --env "$ENVIRONMENT" -R "$REPO"

printf '\nSIGNING SETUP COMPLETE. PUBLIC fingerprint (safe to share):\n%s\n' "$FINGERPRINT"
printf '\nSend ChatGPT ONLY this 64-character fingerprint. Keep all passwords private.\n'
