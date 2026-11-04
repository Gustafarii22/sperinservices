#!/usr/bin/env bash
# Read-only: does not install, uninstall, reset, grant permissions or clear data.
set -euo pipefail
command -v adb >/dev/null
command -v apksigner >/dev/null
out="${1:?Supply a private output directory for installed APK evidence}"
mkdir -p "$out"
umask 077
adb shell pm list packages | tr -d '\r' | sed -n 's/^package:\(uk\.co\.sperinservices\.certificates[^ ]*\)$/\1/p' > "$out/packages.txt"
while IFS= read -r pkg; do
  [[ "$pkg" =~ ^uk\.co\.sperinservices\.certificates[a-zA-Z0-9_.]*$ ]] || exit 1
  adb shell dumpsys package "$pkg" > "$out/$pkg-package.txt"
  apk_path="$(adb shell pm path "$pkg" | tr -d '\r' | sed -n 's/^package://p' | head -1)"
  test -n "$apk_path"
  adb pull "$apk_path" "$out/$pkg.apk"
  apksigner verify --print-certs "$out/$pkg.apk" > "$out/$pkg-signature.txt"
  sha256sum "$out/$pkg.apk" > "$out/$pkg.sha256"
done < "$out/packages.txt"
echo 'Read-only APK identity collection complete. This is NOT a certificate-data backup.'
