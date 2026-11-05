#!/usr/bin/env bash
set -euo pipefail
gradle -p certificate-android :app:assemblePreview :app:assemblePreviewAndroidTest --no-daemon
APP_APK=$(find certificate-android/app/build/outputs/apk/preview -maxdepth 1 -name '*.apk' -print -quit)
TEST_APK=$(find certificate-android/app/build/outputs/apk/androidTest -type f -name '*.apk' -print -quit)
test -s "$APP_APK"
test -s "$TEST_APK"
adb install -r "$APP_APK"
adb install -r "$TEST_APK"
adb shell pm list instrumentation
mkdir -p certificate-android/qa-output/native-photo
APP_ID=$("${ANDROID_HOME:-/usr/local/lib/android/sdk}/build-tools/35.0.0/aapt" dump badging "$APP_APK" | sed -n "s/^package: name='\\([^']*\\)'.*/\\1/p" | head -n 1)
test -n "$APP_ID"
TEST_INSTRUMENTATION=$(adb shell pm list instrumentation | tr -d '\r' | grep -F "(target=$APP_ID)" | sed -n 's/^instrumentation:\([^ ]*\) .*/\1/p')
test -n "$TEST_INSTRUMENTATION"
adb shell am instrument -w -r -e class uk.co.sperinservices.certificates.ConsumerUnitOcrTest "$TEST_INSTRUMENTATION" | tee certificate-android/qa-output/native-photo/results.txt
grep -F "OK (1 test)" certificate-android/qa-output/native-photo/results.txt

# Synthetic data survives a real package upgrade on this emulator. This validates
# app persistence on a QA package, not the production signer identity.
run_preservation() {
  adb shell am instrument -w -e class uk.co.sperinservices.certificates.UpgradePersistenceTest -e upgradeStage "$1" "$TEST_INSTRUMENTATION" | tee "certificate-android/qa-output/native-photo/preservation-$1.txt"
  grep -F "OK (1 test)" "certificate-android/qa-output/native-photo/preservation-$1.txt"
}
run_preservation seed
adb shell am force-stop "$APP_ID"
gradle -p certificate-android :app:assemblePreview -PreleaseVersionCode=201 --no-daemon
adb install -r "$APP_APK"
run_preservation check
adb shell am force-stop "$APP_ID"
run_preservation reopened
# Build-level missing-key gates must fail without generating replacements.
if gradle -p certificate-android :app:verifyPermanentSigner --no-daemon >certificate-android/qa-output/native-photo/missing-key.txt 2>&1; then
  echo 'Permanent release unexpectedly accepted missing signing material'; exit 1
fi
grep -E 'approved SHA-256 signing fingerprint is not configured|permanent signing material is missing' certificate-android/qa-output/native-photo/missing-key.txt
