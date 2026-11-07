#!/usr/bin/env bash
# CI emulator only. Never uninstall/clear to make a failed upgrade pass.
set -euo pipefail
pkg=uk.co.sperinservices.certificates.stable.permanent
adb shell getprop ro.kernel.qemu | tr -d '\r' | grep -qx 1
adb install certificate-android/dist/first.apk
adb install certificate-android/app/build/outputs/apk/androidTest/permanent/app-permanent-androidTest.apk
run_test() {
  adb shell am instrument -w -e class uk.co.sperinservices.certificates.UpgradePersistenceTest -e upgradeStage "$1" "$pkg.test/androidx.test.runner.AndroidJUnitRunner" | tee "certificate-android/dist/upgrade-$1.txt"
  grep -F 'OK (1 test)' "certificate-android/dist/upgrade-$1.txt"
}
run_test seed
adb shell am force-stop "$pkg"
adb install -r certificate-android/dist/update.apk
run_test check
adb shell am force-stop "$pkg"
run_test reopened
adb shell am instrument -w -e class uk.co.sperinservices.certificates.CertificateOrientationTest "$pkg.test/androidx.test.runner.AndroidJUnitRunner" | tee certificate-android/dist/orientation-pdf-check.txt
grep -F 'OK (1 test)' certificate-android/dist/orientation-pdf-check.txt
# Exercise actual built-in PDF Open, asynchronous page rendering and navigation
# on the same newly installed permanent APK (not a mocked browser button).
adb shell am instrument -w -e class uk.co.sperinservices.certificates.PdfPreviewActivityTest "$pkg.test/androidx.test.runner.AndroidJUnitRunner" | tee certificate-android/dist/pdf-open-check.txt
grep -F 'OK (1 test)' certificate-android/dist/pdf-open-check.txt
