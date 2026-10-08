#!/usr/bin/env bash
set -euxo pipefail
PKG=uk.co.sperinservices.certificates.stable
APK=certificate-android/dist/Sperin-Certificates-v1.7.17.apk
curl -fL --retry 3 https://github.com/Gustafarii22/sperinservices/releases/download/certificates-v1.7.16/Sperin-Certificates-v1.7.16.apk -o /tmp/previous-certificates.apk
mkdir -p certificate-android/qa-output/android
trap 'adb logcat -d > certificate-android/qa-output/android/logcat.txt; adb exec-out screencap -p > certificate-android/qa-output/android/last-screen.png; adb shell uiautomator dump /sdcard/window.xml >/dev/null; adb pull /sdcard/window.xml certificate-android/qa-output/android/last-window.xml >/dev/null' EXIT
adb install /tmp/previous-certificates.apk
adb shell monkey -p "$PKG" 1
for i in $(seq 1 30); do
  pid="$(adb shell pidof "$PKG" | tr -d '\r' || true)"
  if [ -n "$pid" ]; then
    adb forward tcp:9222 localabstract:webview_devtools_remote_"$pid"
    if curl -fsS http://127.0.0.1:9222/json/version >/dev/null; then break; fi
  fi
  sleep 1
done
node certificate-android/qa/seed-upgrade.mjs
# Give Android WebView time to commit the test certificate to disk before
# killing the old process. Otherwise the test can report a false upgrade loss
# from a fixture written immediately before force-stop.
adb shell input keyevent KEYCODE_HOME
sleep 8
adb shell am force-stop "$PKG"

# Prove the ORIGINAL APK itself can cold-start with the preserved fixture.
# Only then is the new APK eligible for an upgrade/data-retention check.
adb shell monkey -p "$PKG" 1
for i in $(seq 1 35); do
  pid="$(adb shell pidof "$PKG" | tr -d '\r' || true)"
  if [ -n "$pid" ]; then
    adb forward tcp:9222 localabstract:webview_devtools_remote_"$pid"
    if curl -fsS http://127.0.0.1:9222/json/version >/dev/null; then break; fi
  fi
  sleep 1
done
node certificate-android/qa/check-upgrade.mjs
echo OLD_APK_COLD_RESTART_PERSISTENCE_PASS

adb shell am force-stop "$PKG"
adb install -r "$APK"
adb shell monkey -p "$PKG" 1
# Inspect the same storage origin after upgrading, without seeding or modifying data.
for i in $(seq 1 35); do
  pid="$(adb shell pidof "$PKG" | tr -d '\r' || true)"
  if [ -n "$pid" ]; then
    adb forward tcp:9222 localabstract:webview_devtools_remote_"$pid"
    if curl -fsS http://127.0.0.1:9222/json/version >/dev/null; then break; fi
  fi
  sleep 1
done
node certificate-android/qa/check-upgrade.mjs
mkdir -p certificate-android/qa-output/android
for i in $(seq 1 30); do
  adb shell rm -f /sdcard/window.xml
  if ! adb shell uiautomator dump /sdcard/window.xml >/dev/null || ! adb pull /sdcard/window.xml certificate-android/qa-output/android/window.xml >/dev/null; then
    sleep 1
    continue
  fi
  # Android Emulator can show a system ANR for Pixel Launcher over a healthy app.
  # Dismiss only known Android system ANR dialogs, then repeat the app check.
  # Never click controls inside the Sperin Certificates WebView.
  anr_coords="$(python3 - <<'PY'
import re
import xml.etree.ElementTree as ET
try:
    root=ET.parse('certificate-android/qa-output/android/window.xml').getroot()
    nodes=list(root.iter('node'))
    android_dialog=any(n.get('package')=='android' and "isn't responding" in n.get('text','') for n in nodes)
    if android_dialog:
        for n in nodes:
            if n.get('package')=='android' and n.get('resource-id')=='android:id/aerr_close':
                m=re.fullmatch(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]',n.get('bounds',''))
                if m:
                    x1,y1,x2,y2=map(int,m.groups())
                    print(f'{(x1+x2)//2} {(y1+y2)//2}')
                    break
except (ET.ParseError,OSError):
    pass
PY
)"
  if [ -n "$anr_coords" ]; then
    echo "Android launcher ANR overlay detected; dismissing the system dialog before re-checking certificate UI"
    adb shell input tap $anr_coords
    sleep 2
    continue
  fi
  if grep -q 'Upgrade preservation check' certificate-android/qa-output/android/window.xml; then break; fi
  sleep 1
done
grep -q 'Sperin Certificates' certificate-android/qa-output/android/window.xml
grep -q 'Upgrade preservation check' certificate-android/qa-output/android/window.xml
sleep 2
adb exec-out screencap -p > certificate-android/qa-output/android/release-launch.png
adb shell settings put system accelerometer_rotation 0
adb shell settings put system user_rotation 1
sleep 2
adb shell uiautomator dump /sdcard/window.xml >/dev/null
adb pull /sdcard/window.xml certificate-android/qa-output/android/rotated.xml >/dev/null
grep -q 'Upgrade preservation check' certificate-android/qa-output/android/rotated.xml
adb exec-out screencap -p > certificate-android/qa-output/android/release-rotated.png
adb logcat -d > certificate-android/qa-output/android/logcat.txt
echo APK_INSTALL_UPGRADE_LAUNCH_ROTATION_PASS
python3 certificate-android/qa/android-keyboard.py
