#!/usr/bin/env bash
set -euo pipefail
PKG=uk.co.sperinservices.certificates.stable.preview.scanfix
OLD_PREVIEW=uk.co.sperinservices.certificates.stable.preview
STABLE=uk.co.sperinservices.certificates.stable
APK=certificate-android/dist/Sperin-Certificates-v1.8.1-OCR-FIX.apk
OUT=certificate-android/qa-output/preview-android
mkdir -p "$OUT"
trap 'adb logcat -d > "$OUT/logcat.txt" || true; adb exec-out screencap -p > "$OUT/final-screen.png" || true' EXIT

# Run both packages on one Android emulator. The preview must not overwrite stable.
curl -fLsS --retry 3 --max-time 90 \
  https://github.com/Gustafarii22/sperinservices/releases/download/certificates-v1.7.11/Sperin-Certificates-v1.7.11.apk \
  -o /tmp/stable-old.apk
adb install /tmp/stable-old.apk
# Prove this installation cannot collide with the previously released temporary-signed preview.
curl -fLsS --retry 3 --max-time 90 \
  https://github.com/Gustafarii22/sperinservices/releases/download/certificates-v1.8.0-preview/Sperin-Certificates-v1.8.0-PREVIEW.apk \
  -o /tmp/previous-preview.apk
adb install /tmp/previous-preview.apk
adb install "$APK"
adb shell pm path "$STABLE" | grep -q 'package:'
adb shell pm path "$PKG" | grep -q 'package:'
adb shell pm path "$OLD_PREVIEW" | grep -q 'package:'
adb shell am start -n "$PKG/uk.co.sperinservices.certificates.MainActivity"

for n in $(seq 1 35); do
  adb shell uiautomator dump /sdcard/preview-window.xml >/dev/null 2>&1 || true
  adb pull /sdcard/preview-window.xml "$OUT/launch.xml" >/dev/null 2>&1 || true
  if grep -q 'Sperin Certificates' "$OUT/launch.xml"; then break; fi
  sleep 1
done
grep -q 'Sperin Certificates' "$OUT/launch.xml"
adb exec-out screencap -p > "$OUT/portrait.png"

adb shell settings put system accelerometer_rotation 0
adb shell settings put system user_rotation 1
sleep 3
adb shell uiautomator dump /sdcard/preview-landscape.xml >/dev/null 2>&1
adb pull /sdcard/preview-landscape.xml "$OUT/landscape.xml" >/dev/null
grep -q 'Sperin Certificates' "$OUT/landscape.xml"
adb exec-out screencap -p > "$OUT/landscape.png"

adb shell am force-stop "$PKG"
adb shell am start -n "$PKG/uk.co.sperinservices.certificates.MainActivity"
sleep 3
adb shell pidof "$PKG" | grep -q '[0-9]'
adb shell pm path "$STABLE" | grep -q 'package:'
echo STABLE_OLD_PREVIEW_AND_OCR_SCANFIX_COEXIST_ANDROID_LAUNCH_ROTATE_RELAUNCH_PASS
