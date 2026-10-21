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
TEST_INSTRUMENTATION=$(adb shell pm list instrumentation | tr -d '\r' | grep -F '(target=uk.co.sperinservices.certificates.stable.preview.team.v190)' | sed -n 's/^instrumentation:\([^ ]*\) .*/\1/p')
test -n "$TEST_INSTRUMENTATION"
adb shell am instrument -w -r "$TEST_INSTRUMENTATION" | tee certificate-android/qa-output/native-photo/results.txt
grep -F "OK (1 test)" certificate-android/qa-output/native-photo/results.txt
