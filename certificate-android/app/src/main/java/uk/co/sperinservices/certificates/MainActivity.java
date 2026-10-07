package uk.co.sperinservices.certificates;

import android.Manifest;
import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Color;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Rect;
import android.net.Uri;
import android.content.ClipData;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import org.json.JSONObject;
import org.json.JSONArray;

import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Locale;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public class MainActivity extends Activity {
    private static final String LIVE_URL = "https://sperinservices.co.uk/certificates/?app=1.7.7";
    private static final String LOCAL_URL = "file:///android_asset/certificates/index.html";
    private static final int FILE_CHOOSER_REQUEST = 1001;
    private static final int BACKUP_IMPORT_REQUEST = 1002;
    private static final int AUDIO_PERMISSION_REQUEST = 2001;
    private static final int NOTIFICATION_PERMISSION_REQUEST = 2002;
    private static final int SHEET_CAMERA_REQUEST = 3001;
    private static final String DOWNLOAD_CHANNEL = "sperin_downloads";

    private WebView webView;
    private String recoveredChamberlainBackup = null;
    private int recoveredChamberlainScore = -1;
    private ValueCallback<Uri[]> fileChooserCallback;
    private boolean usingLocalFallback = false;
    private SpeechRecognizer speechRecognizer;
    private TextToSpeech textToSpeech;
    private boolean ttsReady = false;
    private String pendingVoiceToken = "";
    private String pendingVoicePrompt = "";
    private Uri pendingNotificationUri;
    private String pendingNotificationName;
    private String pendingNotificationMime;
    private Uri pendingSheetPhotoUri;
    private String pendingSheetScanToken = "";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().setStatusBarColor(Color.rgb(7, 17, 31));
        getWindow().setNavigationBarColor(Color.rgb(7, 17, 31));
        createNotificationChannel();

        // IMPORTANT: forensic recovery runs before WebView is opened so Chromium
        // cannot compact/rotate the LevelDB log that may still contain the
        // pre-restore localStorage value.
        recoveredChamberlainBackup = recoverChamberlainFromWebViewStorage();
        exportForensicRecoveryBundle();

        webView = new WebView(this);
        webView.clearCache(true);
        webView.setBackgroundColor(Color.rgb(7, 17, 31));
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        }
        settings.setUserAgentString(settings.getUserAgentString() + " SperinCertificatesAndroid/1.7.7");

        setupVoice();

        webView.addJavascriptInterface(new AndroidBridge(), "Android");
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (fileChooserCallback != null) fileChooserCallback.onReceiveValue(null);
                fileChooserCallback = filePathCallback;
                Intent intent = fileChooserParams.createIntent();
                try {
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                    return true;
                } catch (Exception ex) {
                    fileChooserCallback = null;
                    Toast.makeText(MainActivity.this, "Could not open file picker", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String host = uri.getHost();
                if (host == null || host.endsWith("sperinservices.co.uk") || uri.toString().startsWith("file:///android_asset/")) {
                    return false;
                }
                try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) {}
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (recoveredChamberlainBackup != null && !recoveredChamberlainBackup.isEmpty()) {
                    final String json = recoveredChamberlainBackup;
                    recoveredChamberlainBackup = null;
                    // Save an untouched recovery copy before importing it.
                    saveBytes(json.getBytes(StandardCharsets.UTF_8),
                            "Sperin-Recovered-33-Chamberlain-Road.json",
                            "application/json", false);
                    String js = "if(window.sperinRestoreBackup){window.sperinRestoreBackup(" +
                            JSONObject.quote(json) + ",\"\");}";
                    view.evaluateJavascript(js, null);
                    Toast.makeText(MainActivity.this,
                            "Recovered 33 Chamberlain Road from pre-restore app storage",
                            Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame() && !usingLocalFallback) {
                    usingLocalFallback = true;
                    view.loadUrl(LOCAL_URL);
                }
            }
        });

        webView.loadUrl(LIVE_URL);
    }

    private void createNotificationChannel() {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        NotificationChannel channel = new NotificationChannel(
                DOWNLOAD_CHANNEL,
                "Certificate downloads",
                NotificationManager.IMPORTANCE_DEFAULT
        );
        channel.setDescription("PDF and certificate file downloads");
        manager.createNotificationChannel(channel);
    }

    private void setupVoice() {
        textToSpeech = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                textToSpeech.setLanguage(Locale.UK);
                textToSpeech.setSpeechRate(0.95f);
                ttsReady = true;
                textToSpeech.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override public void onStart(String utteranceId) {}
                    @Override public void onError(String utteranceId) {
                        if ("VOICE_QUESTION".equals(utteranceId)) runOnUiThread(MainActivity.this::startRecognitionNow);
                    }
                    @Override public void onDone(String utteranceId) {
                        if ("VOICE_QUESTION".equals(utteranceId)) runOnUiThread(MainActivity.this::startRecognitionNow);
                    }
                });
            }
        });

        if (SpeechRecognizer.isRecognitionAvailable(this)) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
            speechRecognizer.setRecognitionListener(new RecognitionListener() {
                @Override public void onReadyForSpeech(Bundle params) {}
                @Override public void onBeginningOfSpeech() {}
                @Override public void onRmsChanged(float rmsdB) {}
                @Override public void onBufferReceived(byte[] buffer) {}
                @Override public void onEndOfSpeech() {}
                @Override public void onPartialResults(Bundle partialResults) {}
                @Override public void onEvent(int eventType, Bundle params) {}

                @Override public void onError(int error) { sendVoiceResult("", speechError(error)); }

                @Override
                public void onResults(Bundle results) {
                    ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    String answer = matches != null && !matches.isEmpty() ? matches.get(0) : "";
                    sendVoiceResult(answer, answer.isEmpty() ? "Nothing heard" : "");
                }
            });
        }
    }

    private String speechError(int error) {
        switch (error) {
            case SpeechRecognizer.ERROR_AUDIO: return "Microphone audio error";
            case SpeechRecognizer.ERROR_CLIENT: return "Voice recognition stopped";
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: return "Microphone permission is required";
            case SpeechRecognizer.ERROR_NETWORK: return "Voice network error";
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: return "Voice network timeout";
            case SpeechRecognizer.ERROR_NO_MATCH: return "I did not catch that";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY: return "Voice recognizer is busy";
            case SpeechRecognizer.ERROR_SERVER: return "Voice service error";
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: return "No speech heard";
            default: return "Voice recognition error";
        }
    }

    private void startSpeakAndListen(String token, String prompt) {
        pendingVoiceToken = token == null ? "" : token;
        pendingVoicePrompt = prompt == null ? "" : prompt;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
                checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, AUDIO_PERMISSION_REQUEST);
            return;
        }
        if (ttsReady && !pendingVoicePrompt.isEmpty()) {
            textToSpeech.stop();
            textToSpeech.speak(pendingVoicePrompt, TextToSpeech.QUEUE_FLUSH, null, "VOICE_QUESTION");
        } else startRecognitionNow();
    }

    private void startRecognitionNow() {
        if (speechRecognizer == null) {
            sendVoiceResult("", "Speech recognition is not available on this phone");
            return;
        }
        try {
            speechRecognizer.cancel();
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-GB");
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "en-GB");
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
            intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
            intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, false);
            // Give long-form certificate descriptions more breathing room before
            // Android decides the speaker has finished.
            intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 7000L);
            intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 4500L);
            speechRecognizer.startListening(intent);
        } catch (Exception ex) {
            sendVoiceResult("", ex.getMessage() == null ? "Could not start voice recognition" : ex.getMessage());
        }
    }

    private void sendVoiceResult(String answer, String error) {
        final String token = pendingVoiceToken;
        pendingVoiceToken = "";
        String js = "window.sperinVoiceResult(" + JSONObject.quote(token) + "," +
                JSONObject.quote(answer == null ? "" : answer) + "," +
                JSONObject.quote(error == null ? "" : error) + ");";
        runOnUiThread(() -> webView.evaluateJavascript(js, null));
    }

    private void speakOnly(String text) {
        if (ttsReady && text != null && !text.isEmpty()) {
            textToSpeech.stop();
            textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, null, "VOICE_ONLY");
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == AUDIO_PERMISSION_REQUEST) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startSpeakAndListen(pendingVoiceToken, pendingVoicePrompt);
            } else sendVoiceResult("", "Microphone permission was not granted");
        } else if (requestCode == NOTIFICATION_PERMISSION_REQUEST) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED &&
                    pendingNotificationUri != null) {
                showFileNotification(pendingNotificationUri, pendingNotificationName, pendingNotificationMime);
            }
            pendingNotificationUri = null;
            pendingNotificationName = null;
            pendingNotificationMime = null;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == SHEET_CAMERA_REQUEST) {
            if (resultCode == RESULT_OK && pendingSheetPhotoUri != null) {
                scanSheetUri(pendingSheetScanToken, pendingSheetPhotoUri);
            } else {
                sendSheetScanResult(pendingSheetScanToken, null, "Photo cancelled");
            }
            pendingSheetPhotoUri = null;
            pendingSheetScanToken = "";
            return;
        }
        if (requestCode == BACKUP_IMPORT_REQUEST) {
            if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                try {
                    Uri uri = data.getData();
                    InputStream in = getContentResolver().openInputStream(uri);
                    if (in == null) throw new IllegalStateException("Could not open selected backup file");
                    String json = readFile(in);
                    sendBackupResult(json, "");
                } catch (Exception ex) {
                    sendBackupResult("", ex.getMessage() == null ? "Could not read selected backup" : ex.getMessage());
                }
            } else {
                sendBackupResult("", "Import cancelled");
            }
            return;
        }
        if (requestCode == FILE_CHOOSER_REQUEST) {
            Uri[] result = null;
            if (resultCode == RESULT_OK && data != null) {
                ClipData clip = data.getClipData();
                if (clip != null && clip.getItemCount() > 0) {
                    result = new Uri[clip.getItemCount()];
                    for (int i = 0; i < clip.getItemCount(); i++) result[i] = clip.getItemAt(i).getUri();
                } else {
                    Uri uri = data.getData();
                    if (uri != null) result = new Uri[]{uri};
                }
            }
            if (fileChooserCallback != null) fileChooserCallback.onReceiveValue(result);
            fileChooserCallback = null;
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onBackPressed() {
        if (webView == null) {
            super.onBackPressed();
            return;
        }
        webView.evaluateJavascript(
                "(window.sperinHandleBack ? window.sperinHandleBack() : false)",
                value -> {
                    if ("true".equals(value)) return;
                    if (webView.canGoBack()) webView.goBack();
                    else MainActivity.super.onBackPressed();
                }
        );
    }

    private void openBackupImportPicker() {
        try {
            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType("application/json");
            intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/json", "text/json", "text/plain", "application/octet-stream"});
            startActivityForResult(intent, BACKUP_IMPORT_REQUEST);
        } catch (Exception ex) {
            sendBackupResult("", ex.getMessage() == null ? "Could not open backup file picker" : ex.getMessage());
        }
    }

    private String safeName(String name, String fallback) {
        String value = name == null ? fallback : name.replaceAll("[\\/:*?\"<>|]+", "-").trim();
        return value.isEmpty() ? fallback : value;
    }


    private String recoverChamberlainFromWebViewStorage() {
        try {
            File levelDb = new File(getApplicationInfo().dataDir,
                    "app_webview/Default/Local Storage/leveldb");
            if (!levelDb.exists() || !levelDb.isDirectory()) return null;

            File[] files = levelDb.listFiles();
            if (files == null || files.length == 0) return null;

            // Preserve the exact pre-open database bytes once. Later launches can
            // re-run improved recovery logic against this untouched snapshot even
            // if Chromium compacts its live LevelDB after this launch.
            File snapshotDir = new File(getFilesDir(), "chamberlain-leveldb-snapshot-original");
            if (!snapshotDir.exists() && snapshotDir.mkdirs()) {
                for (File source : files) {
                    if (!source.isFile() || source.length() > 32L * 1024L * 1024L) continue;
                    File dest = new File(snapshotDir, source.getName());
                    copyFile(source, dest);
                }
            }

            Arrays.sort(files, Comparator.comparingLong(File::lastModified).reversed());

            // The active/recent *.log files are the best recovery source because
            // overwritten LevelDB values remain as older WriteBatch records until
            // Chromium compacts the log.
            for (File file : files) {
                if (!file.isFile() || !file.getName().endsWith(".log")) continue;
                if (file.length() <= 0 || file.length() > 16L * 1024L * 1024L) continue;
                byte[] bytes = readAllBytes(file);
                scanLevelDbLog(bytes);
            }

            // Fallback: scan other small LevelDB files for uncompressed value bytes.
            if (recoveredChamberlainBackup == null) {
                for (File file : files) {
                    if (!file.isFile() || file.getName().endsWith(".log")) continue;
                    if (file.length() <= 0 || file.length() > 8L * 1024L * 1024L) continue;
                    byte[] bytes = readAllBytes(file);
                    considerCandidateBytes(bytes);
                }
            }
            return recoveredChamberlainBackup;
        } catch (Exception ex) {
            return null;
        }
    }

    private void copyFile(File source, File dest) throws Exception {
        try (InputStream in = new FileInputStream(source);
             OutputStream out = new FileOutputStream(dest)) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) >= 0) out.write(buf, 0, n);
        }
    }


    private void exportForensicRecoveryBundle() {
        try {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            try (ZipOutputStream zip = new ZipOutputStream(bytes)) {
                String manifest =
                        "Sperin Certificates emergency recovery bundle\n" +
                        "Target: 33 Chamberlain Road / Tom Watson\n" +
                        "Package: " + getPackageName() + "\n" +
                        "Created: " + System.currentTimeMillis() + "\n" +
                        "Contains preserved pre-WebView LevelDB snapshot, current LevelDB and internal backups.\n";
                zip.putNextEntry(new ZipEntry("RECOVERY-README.txt"));
                zip.write(manifest.getBytes(StandardCharsets.UTF_8));
                zip.closeEntry();

                File preserved = new File(getFilesDir(), "chamberlain-leveldb-snapshot-original");
                addDirectoryToZip(zip, preserved, "preserved-original-leveldb");

                File current = new File(getApplicationInfo().dataDir,
                        "app_webview/Default/Local Storage/leveldb");
                addDirectoryToZip(zip, current, "current-leveldb");

                addDirectoryToZip(zip, new File(getFilesDir(), "backups"), "internal-backups");

                // Include other WebView Local Storage locations if Android/WebView
                // has used a different profile path on this device.
                File webview = new File(getApplicationInfo().dataDir, "app_webview");
                addMatchingLevelDbDirs(zip, webview, "app-webview");
            }
            saveBytes(bytes.toByteArray(),
                    "Sperin-Chamberlain-Raw-Recovery.zip",
                    "application/zip", false);
            Toast.makeText(this,
                    "Raw recovery ZIP saved to Downloads / Sperin Certificates",
                    Toast.LENGTH_LONG).show();
        } catch (Exception ex) {
            Toast.makeText(this,
                    "Could not export raw recovery ZIP: " + ex.getMessage(),
                    Toast.LENGTH_LONG).show();
        }
    }

    private void addMatchingLevelDbDirs(ZipOutputStream zip, File root, String prefix) throws Exception {
        if (root == null || !root.exists()) return;
        File[] children = root.listFiles();
        if (children == null) return;
        for (File child : children) {
            if (child.isDirectory()) {
                String lower = child.getAbsolutePath().toLowerCase(Locale.UK);
                if (child.getName().equalsIgnoreCase("leveldb") && lower.contains("local storage")) {
                    addDirectoryToZip(zip, child, prefix + "/" + safeZipPath(root, child));
                } else {
                    addMatchingLevelDbDirs(zip, child, prefix);
                }
            }
        }
    }

    private String safeZipPath(File root, File child) {
        String p = child.getAbsolutePath();
        String r = root.getAbsolutePath();
        if (p.startsWith(r)) p = p.substring(r.length());
        p = p.replace('\\', '/').replaceAll("^/+", "");
        return p.isEmpty() ? "leveldb" : p;
    }

    private void addDirectoryToZip(ZipOutputStream zip, File dir, String prefix) throws Exception {
        if (dir == null || !dir.exists()) return;
        if (dir.isFile()) {
            addFileToZip(zip, dir, prefix);
            return;
        }
        File[] children = dir.listFiles();
        if (children == null) return;
        Arrays.sort(children, Comparator.comparing(File::getName));
        for (File child : children) {
            String name = prefix + "/" + child.getName();
            if (child.isDirectory()) addDirectoryToZip(zip, child, name);
            else if (child.isFile() && child.length() <= 64L * 1024L * 1024L) addFileToZip(zip, child, name);
        }
    }

    private void addFileToZip(ZipOutputStream zip, File file, String name) throws Exception {
        ZipEntry entry = new ZipEntry(name.replace('\\', '/'));
        entry.setTime(file.lastModified());
        zip.putNextEntry(entry);
        try (InputStream in = new FileInputStream(file)) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) >= 0) zip.write(buf, 0, n);
        }
        zip.closeEntry();
    }

    private byte[] readAllBytes(File file) throws Exception {
        try (InputStream in = new FileInputStream(file);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) >= 0) out.write(buf, 0, n);
            return out.toByteArray();
        }
    }

    private void scanLevelDbLog(byte[] data) {
        final int BLOCK = 32768;
        ByteArrayOutputStream fragmented = null;
        for (int blockStart = 0; blockStart < data.length; blockStart += BLOCK) {
            int blockEnd = Math.min(data.length, blockStart + BLOCK);
            int p = blockStart;
            while (p + 7 <= blockEnd) {
                int len = (data[p + 4] & 0xff) | ((data[p + 5] & 0xff) << 8);
                int type = data[p + 6] & 0xff;
                if (len == 0 && type == 0) break;
                int payloadStart = p + 7;
                int payloadEnd = payloadStart + len;
                if (payloadEnd > blockEnd || payloadEnd > data.length) break;

                if (type == 1) { // FULL
                    byte[] rec = Arrays.copyOfRange(data, payloadStart, payloadEnd);
                    scanWriteBatch(rec);
                    fragmented = null;
                } else if (type == 2) { // FIRST
                    fragmented = new ByteArrayOutputStream();
                    fragmented.write(data, payloadStart, len);
                } else if (type == 3) { // MIDDLE
                    if (fragmented != null) fragmented.write(data, payloadStart, len);
                } else if (type == 4) { // LAST
                    if (fragmented != null) {
                        fragmented.write(data, payloadStart, len);
                        scanWriteBatch(fragmented.toByteArray());
                    }
                    fragmented = null;
                }
                p = payloadEnd;
            }
        }
    }

    private void scanWriteBatch(byte[] batch) {
        if (batch == null || batch.length < 12) return;
        int p = 12; // sequence (8) + count (4)
        while (p < batch.length) {
            int tag = batch[p++] & 0xff;
            int[] keyLen = readVarint32(batch, p);
            if (keyLen == null) return;
            p = keyLen[1];
            int kl = keyLen[0];
            if (kl < 0 || p + kl > batch.length) return;
            byte[] key = Arrays.copyOfRange(batch, p, p + kl);
            p += kl;

            if (tag == 1) { // kTypeValue
                int[] valLen = readVarint32(batch, p);
                if (valLen == null) return;
                p = valLen[1];
                int vl = valLen[0];
                if (vl < 0 || p + vl > batch.length) return;
                byte[] value = Arrays.copyOfRange(batch, p, p + vl);
                p += vl;
                considerCandidateBytes(key);
                considerCandidateBytes(value);
            } else if (tag == 0) { // deletion
                considerCandidateBytes(key);
            } else {
                return;
            }
        }
    }

    private int[] readVarint32(byte[] data, int p) {
        int result = 0;
        int shift = 0;
        for (int i = 0; i < 5 && p < data.length; i++, p++) {
            int b = data[p] & 0xff;
            result |= (b & 0x7f) << shift;
            if ((b & 0x80) == 0) return new int[]{result, p + 1};
            shift += 7;
        }
        return null;
    }

    private void considerCandidateBytes(byte[] bytes) {
        if (bytes == null || bytes.length < 20) return;
        tryCandidateString(new String(bytes, StandardCharsets.UTF_8));
        if (bytes.length > 1) {
            tryCandidateString(new String(bytes, 1, bytes.length - 1, StandardCharsets.UTF_8));
        }
        try {
            tryCandidateString(new String(bytes, "UTF-16LE"));
            if (bytes.length > 2) tryCandidateString(new String(bytes, 1, bytes.length - 1, "UTF-16LE"));
            tryCandidateString(new String(bytes, "UTF-16BE"));
            if (bytes.length > 2) tryCandidateString(new String(bytes, 1, bytes.length - 1, "UTF-16BE"));
        } catch (Exception ignored) {}
    }

    private void tryCandidateString(String decoded) {
        if (decoded == null || decoded.length() < 30) return;
        String lower = decoded.toLowerCase();
        if (!lower.contains("33 chamberlain road") && !lower.contains("tom watson")) return;

        // Chromium may prefix its localStorage string encoding byte. Pull out the
        // JSON object and validate it rather than trusting arbitrary byte matches.
        int first = decoded.indexOf('{');
        int last = decoded.lastIndexOf('}');
        if (first < 0 || last <= first) return;
        String json = decoded.substring(first, last + 1).replace("\u0000", "");
        try {
            JSONObject root = new JSONObject(json);
            JSONArray certs = root.optJSONArray("certificates");
            if (certs == null || certs.length() == 0) return;

            JSONObject target = null;
            for (int i = 0; i < certs.length(); i++) {
                JSONObject cert = certs.optJSONObject(i);
                if (cert == null) continue;
                String c = cert.toString().toLowerCase();
                if (c.contains("33 chamberlain road") || c.contains("tom watson")) {
                    target = cert;
                    break;
                }
            }
            if (target == null) return;

            int score = target.toString().length() + countPopulated(target) * 100;
            if (score > recoveredChamberlainScore) {
                recoveredChamberlainScore = score;
                recoveredChamberlainBackup = root.toString();
            }
        } catch (Exception ignored) {}
    }

    private int countPopulated(Object value) {
        if (value == null || value == JSONObject.NULL) return 0;
        if (value instanceof JSONObject) {
            int n = 0;
            JSONObject o = (JSONObject) value;
            java.util.Iterator<String> keys = o.keys();
            while (keys.hasNext()) n += countPopulated(o.opt(keys.next()));
            return n;
        }
        if (value instanceof JSONArray) {
            int n = 0;
            JSONArray a = (JSONArray) value;
            for (int i = 0; i < a.length(); i++) n += countPopulated(a.opt(i));
            return n;
        }
        String s = String.valueOf(value).trim();
        return s.isEmpty() || "null".equalsIgnoreCase(s) ? 0 : 1;
    }

    private Uri saveBytes(byte[] bytes, String requestedName, String mime, boolean notify) {
        final String fileName = safeName(requestedName, "Sperin-Certificate.pdf");
        try {
            Uri uri;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
                values.put(MediaStore.Downloads.MIME_TYPE, mime);
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Sperin Certificates");
                values.put(MediaStore.Downloads.IS_PENDING, 1);
                uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) throw new IllegalStateException("Could not create Downloads file");
                try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                    if (out == null) throw new IllegalStateException("Could not open Downloads file");
                    out.write(bytes);
                }
                values.clear();
                values.put(MediaStore.Downloads.IS_PENDING, 0);
                getContentResolver().update(uri, values, null, null);
            } else {
                File dir = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "Sperin Certificates");
                if (!dir.exists() && !dir.mkdirs()) throw new IllegalStateException("Could not create Downloads folder");
                File file = new File(dir, fileName);
                try (OutputStream out = new FileOutputStream(file)) { out.write(bytes); }
                uri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", file);
            }
            Uri finalUri = uri;
            runOnUiThread(() -> Toast.makeText(MainActivity.this, fileName + " saved", Toast.LENGTH_LONG).show());
            if (notify) requestFileNotification(uri, fileName, mime);
            return finalUri;
        } catch (Exception ex) {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, "Save failed: " + ex.getMessage(), Toast.LENGTH_LONG).show());
            return null;
        }
    }

    private void requestFileNotification(Uri uri, String fileName, String mime) {
        if (uri == null) return;
        if (Build.VERSION.SDK_INT >= 33 &&
                checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            pendingNotificationUri = uri;
            pendingNotificationName = fileName;
            pendingNotificationMime = mime;
            runOnUiThread(() -> requestPermissions(
                    new String[]{Manifest.permission.POST_NOTIFICATIONS},
                    NOTIFICATION_PERMISSION_REQUEST
            ));
            return;
        }
        showFileNotification(uri, fileName, mime);
    }

    private void showFileNotification(Uri uri, String fileName, String mime) {
        try {
            Intent openIntent = new Intent(Intent.ACTION_VIEW);
            openIntent.setDataAndType(uri, mime);
            openIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            PendingIntent openPending = PendingIntent.getActivity(
                    this,
                    (int) (System.currentTimeMillis() & 0xfffffff),
                    openIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            Notification notification = new Notification.Builder(this, DOWNLOAD_CHANNEL)
                    .setSmallIcon(R.drawable.ic_launcher)
                    .setContentTitle("PDF ready")
                    .setContentText(fileName + " — tap to open")
                    .setAutoCancel(true)
                    .setContentIntent(openPending)
                    .addAction(new Notification.Action.Builder(null, "Open PDF", openPending).build())
                    .build();
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            manager.notify((int) (System.currentTimeMillis() & 0x7fffffff), notification);
        } catch (Exception ex) {
            runOnUiThread(() -> Toast.makeText(this, "PDF saved to Downloads", Toast.LENGTH_LONG).show());
        }
    }

    private File backupDir() {
        File dir = new File(getFilesDir(), "backups");
        if (!dir.exists()) dir.mkdirs();
        return dir;
    }

    private void writeInternalBackup(String content) throws Exception {
        File file = new File(backupDir(), "latest.json");
        try (OutputStream out = new FileOutputStream(file)) {
            out.write(content.getBytes(StandardCharsets.UTF_8));
        }
    }

    private void writeRecoverySnapshot(String content, String requestedName) throws Exception {
        File dir = backupDir();
        File file = new File(dir, safeName(requestedName, "pre-restore-" + System.currentTimeMillis() + ".json"));
        try (OutputStream out = new FileOutputStream(file)) {
            out.write(content.getBytes(StandardCharsets.UTF_8));
        }
        File[] history = dir.listFiles((d, name) -> name.startsWith("pre-restore-") && name.endsWith(".json"));
        if (history != null && history.length > 12) {
            java.util.Arrays.sort(history, (a, b) -> Long.compare(a.lastModified(), b.lastModified()));
            for (int i = 0; i < history.length - 12; i++) history[i].delete();
        }
    }

    private String readFile(InputStream input) throws Exception {
        try (InputStream in = input; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int n;
            while ((n = in.read(buffer)) > 0) out.write(buffer, 0, n);
            return out.toString(StandardCharsets.UTF_8.name());
        }
    }

    private String readLatestBackup() throws Exception {
        File internal = new File(backupDir(), "latest.json");
        if (internal.exists()) return readFile(new FileInputStream(internal));

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            String[] projection = {
                    MediaStore.Downloads._ID,
                    MediaStore.Downloads.DISPLAY_NAME,
                    MediaStore.Downloads.DATE_MODIFIED
            };
            String selection = MediaStore.Downloads.DISPLAY_NAME + " LIKE ?";
            String[] args = new String[]{"sperin-certificates-backup-%"};
            try (Cursor cursor = getContentResolver().query(
                    MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                    projection,
                    selection,
                    args,
                    MediaStore.Downloads.DATE_MODIFIED + " DESC"
            )) {
                if (cursor != null && cursor.moveToFirst()) {
                    long id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Downloads._ID));
                    Uri uri = ContentUris.withAppendedId(MediaStore.Downloads.EXTERNAL_CONTENT_URI, id);
                    InputStream in = getContentResolver().openInputStream(uri);
                    if (in != null) {
                        String json = readFile(in);
                        writeInternalBackup(json);
                        return json;
                    }
                }
            }
        }
        throw new IllegalStateException("No Sperin Certificates backup was found");
    }

    private void sendBackupResult(String json, String error) {
        String js = "window.sperinRestoreBackup(" +
                JSONObject.quote(json == null ? "" : json) + "," +
                JSONObject.quote(error == null ? "" : error) + ");";
        runOnUiThread(() -> webView.evaluateJavascript(js, null));
    }

    private void shareBackupFile(String content, String requestedName) {
        try {
            File file = new File(getCacheDir(), safeName(requestedName, "sperin-certificates-backup.json"));
            try (OutputStream out = new FileOutputStream(file)) {
                out.write(content.getBytes(StandardCharsets.UTF_8));
            }
            Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", file);
            Intent share = new Intent(Intent.ACTION_SEND);
            share.setType("application/json");
            share.putExtra(Intent.EXTRA_STREAM, uri);
            share.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(Intent.createChooser(share, "Share certificate backup"));
        } catch (Exception ex) {
            Toast.makeText(this, "Could not share backup: " + ex.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    private void printCurrentPage() {
        PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
        PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter("Sperin Certificate");
        printManager.print("Sperin Certificate", adapter, null);
    }

    private Bitmap decodeSheetBitmap(byte[] bytes) {
        BitmapFactory.Options bounds = new BitmapFactory.Options();
        bounds.inJustDecodeBounds = true;
        BitmapFactory.decodeByteArray(bytes, 0, bytes.length, bounds);
        int max = Math.max(bounds.outWidth, bounds.outHeight);
        int sample = 1;
        while (max / sample > 2600) sample *= 2;
        BitmapFactory.Options opts = new BitmapFactory.Options();
        opts.inSampleSize = Math.max(1, sample);
        return BitmapFactory.decodeByteArray(bytes, 0, bytes.length, opts);
    }

    private void scanSheetUri(String token, Uri uri) {
        try {
            InputStream in = getContentResolver().openInputStream(uri);
            if (in == null) throw new IllegalStateException("Could not open photo");
            byte[] bytes;
            try (InputStream input = in; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[8192];
                int n;
                while ((n = input.read(buffer)) > 0) out.write(buffer, 0, n);
                bytes = out.toByteArray();
            }
            Bitmap bitmap = decodeSheetBitmap(bytes);
            if (bitmap == null) throw new IllegalStateException("Could not decode photo");
            scanSheetBitmap(token, bitmap);
        } catch (Exception ex) {
            sendSheetScanResult(token, null, ex.getMessage() == null ? "Could not read photo" : ex.getMessage());
        }
    }

    private void scanSheetBitmap(String token, Bitmap bitmap) {
        try {
            InputImage image = InputImage.fromBitmap(bitmap, 0);
            TextRecognizer recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
            recognizer.process(image)
                    .addOnSuccessListener(result -> {
                        try {
                            JSONObject payload = new JSONObject();
                            payload.put("fullText", result.getText());
                            payload.put("width", bitmap.getWidth());
                            payload.put("height", bitmap.getHeight());
                            JSONArray lines = new JSONArray();
                            for (Text.TextBlock block : result.getTextBlocks()) {
                                for (Text.Line line : block.getLines()) {
                                    JSONObject row = new JSONObject();
                                    row.put("text", line.getText());
                                    Rect box = line.getBoundingBox();
                                    if (box != null) {
                                        row.put("left", box.left);
                                        row.put("top", box.top);
                                        row.put("right", box.right);
                                        row.put("bottom", box.bottom);
                                    }
                                    lines.put(row);
                                }
                            }
                            payload.put("lines", lines);
                            sendSheetScanResult(token, payload, "");
                        } catch (Exception ex) {
                            sendSheetScanResult(token, null, "Could not package recognised text");
                        } finally {
                            recognizer.close();
                            bitmap.recycle();
                        }
                    })
                    .addOnFailureListener(ex -> {
                        recognizer.close();
                        bitmap.recycle();
                        sendSheetScanResult(token, null, ex.getMessage() == null ? "Text recognition failed" : ex.getMessage());
                    });
        } catch (Exception ex) {
            if (!bitmap.isRecycled()) bitmap.recycle();
            sendSheetScanResult(token, null, ex.getMessage() == null ? "Text recognition failed" : ex.getMessage());
        }
    }

    private void sendSheetScanResult(String token, JSONObject payload, String error) {
        String json = payload == null ? "" : payload.toString();
        String js = "window.sperinSheetScanResult(" +
                JSONObject.quote(token == null ? "" : token) + "," +
                JSONObject.quote(json) + "," +
                JSONObject.quote(error == null ? "" : error) + ");";
        runOnUiThread(() -> webView.evaluateJavascript(js, null));
    }

    private void captureAndScanSheetNative(String token) {
        try {
            File photo = new File(getCacheDir(), "site-sheet-" + System.currentTimeMillis() + ".jpg");
            Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", photo);
            Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            intent.putExtra(MediaStore.EXTRA_OUTPUT, uri);
            intent.setClipData(ClipData.newRawUri("Sperin Site Sheet", uri));
            intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            pendingSheetPhotoUri = uri;
            pendingSheetScanToken = token == null ? "" : token;
            startActivityForResult(intent, SHEET_CAMERA_REQUEST);
        } catch (Exception ex) {
            pendingSheetPhotoUri = null;
            pendingSheetScanToken = "";
            sendSheetScanResult(token, null, ex.getMessage() == null ? "Could not open camera" : ex.getMessage());
        }
    }

    @Override
    protected void onDestroy() {
        if (speechRecognizer != null) {
            speechRecognizer.cancel();
            speechRecognizer.destroy();
        }
        if (textToSpeech != null) {
            textToSpeech.stop();
            textToSpeech.shutdown();
        }
        super.onDestroy();
    }

    public class AndroidBridge {
        @JavascriptInterface
        public void savePdfBase64(String dataUri, String fileName) {
            try {
                int comma = dataUri.indexOf(',');
                String payload = comma >= 0 ? dataUri.substring(comma + 1) : dataUri;
                saveBytes(Base64.decode(payload, Base64.DEFAULT), fileName, "application/pdf", true);
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "PDF save failed", Toast.LENGTH_LONG).show());
            }
        }

        @JavascriptInterface
        public void saveTextFile(String content, String fileName, String mime) {
            saveBytes(content.getBytes(StandardCharsets.UTF_8), fileName, mime == null ? "text/plain" : mime, false);
        }

        @JavascriptInterface
        public void saveBackup(String content, String fileName) {
            try {
                writeInternalBackup(content);
                saveBytes(content.getBytes(StandardCharsets.UTF_8), fileName, "application/json", false);
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Backup saved automatically", Toast.LENGTH_LONG).show());
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Backup failed: " + ex.getMessage(), Toast.LENGTH_LONG).show());
            }
        }

        @JavascriptInterface
        public void importBackupFile() {
            runOnUiThread(MainActivity.this::openBackupImportPicker);
        }

        @JavascriptInterface
        public void restoreLatestBackup() {
            new Thread(() -> {
                try { sendBackupResult(readLatestBackup(), ""); }
                catch (Exception ex) { sendBackupResult("", ex.getMessage()); }
            }).start();
        }

        @JavascriptInterface
        public void saveRecoverySnapshot(String content, String fileName) {
            try { writeRecoverySnapshot(content, fileName); }
            catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Recovery snapshot failed: " + ex.getMessage(), Toast.LENGTH_LONG).show());
            }
        }

        @JavascriptInterface
        public void shareBackup(String content, String fileName) {
            runOnUiThread(() -> shareBackupFile(content, fileName));
        }

        @JavascriptInterface
        public void printPage() {
            runOnUiThread(MainActivity.this::printCurrentPage);
        }

        @JavascriptInterface
        public void captureAndScanSheet(String token) {
            runOnUiThread(() -> captureAndScanSheetNative(token));
        }

        @JavascriptInterface
        public void scanSheetImageBase64(String token, String dataUri) {
            try {
                int comma = dataUri == null ? -1 : dataUri.indexOf(',');
                String payload = comma >= 0 ? dataUri.substring(comma + 1) : dataUri;
                byte[] bytes = Base64.decode(payload, Base64.DEFAULT);
                Bitmap bitmap = decodeSheetBitmap(bytes);
                if (bitmap == null) throw new IllegalStateException("Could not decode photo");
                scanSheetBitmap(token, bitmap);
            } catch (Exception ex) {
                sendSheetScanResult(token, null, ex.getMessage() == null ? "Could not read photo" : ex.getMessage());
            }
        }

        @JavascriptInterface
        public void listen(String token) {
            runOnUiThread(() -> {
                pendingVoiceToken = token == null ? "" : token;
                pendingVoicePrompt = "";
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
                        checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, AUDIO_PERMISSION_REQUEST);
                } else startRecognitionNow();
            });
        }

        @JavascriptInterface
        public void speakAndListen(String token, String prompt) {
            runOnUiThread(() -> startSpeakAndListen(token, prompt));
        }

        @JavascriptInterface
        public void speak(String text) {
            runOnUiThread(() -> speakOnly(text));
        }

        @JavascriptInterface
        public void stopVoice() {
            runOnUiThread(() -> {
                if (speechRecognizer != null) speechRecognizer.cancel();
                if (textToSpeech != null) textToSpeech.stop();
            });
        }
    }
}
