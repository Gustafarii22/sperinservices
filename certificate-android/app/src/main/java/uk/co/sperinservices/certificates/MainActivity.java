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
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.os.Handler;
import android.os.Looper;
import android.print.PrintDocumentAdapter;
import android.print.PrintAttributes;
import android.print.PrintDocumentInfo;
import android.print.PageRange;
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
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Button;
import android.view.Gravity;
import android.view.View;
import android.util.TypedValue;

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
    private static final String APP_PATH = "/certificates-app";
    private static final String BUNDLED_BASE_URL = "https://sperinservices.co.uk" + APP_PATH + "/";
    private static final String APP_URL = BUNDLED_BASE_URL + "?app=1.7.17";
    private static final int FILE_CHOOSER_REQUEST = 1001;
    private static final int BACKUP_IMPORT_REQUEST = 1002;
    private static final int AUDIO_PERMISSION_REQUEST = 2001;
    private static final int NOTIFICATION_PERMISSION_REQUEST = 2002;
    private static final int SHEET_CAMERA_REQUEST = 3001;
    private static final String DOWNLOAD_CHANNEL = "sperin_downloads";

    private WebView webView;
    private FrameLayout appContainer;
    private LinearLayout pdfReadyBar;
    private Uri latestPdfUri;
    private int pdfBarGeneration = 0;
    private ValueCallback<Uri[]> fileChooserCallback;
    private long lastRollingAutoBackup = 0L;
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

        webView = new WebView(this);
        webView.clearCache(true);
        webView.setBackgroundColor(Color.rgb(7, 17, 31));
        appContainer = new FrameLayout(this);
        appContainer.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(appContainer);

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
        settings.setUserAgentString(settings.getUserAgentString() + " SperinCertificatesAndroid/1.7.17");

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
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse bundled = bundledCertificateResponse(request == null ? null : request.getUrl());
                return bundled != null ? bundled : super.shouldInterceptRequest(view, request);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String host = uri.getHost();
                String path = uri.getPath();
                boolean isBundledApp =
                        "sperinservices.co.uk".equalsIgnoreCase(host) &&
                        path != null &&
                        (path.equals(APP_PATH) || path.equals(APP_PATH + "/") || path.startsWith(APP_PATH + "/"));
                if (isBundledApp) return false;

                try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                catch (Exception ignored) {}
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
            }
        });

        loadBundledIndex();
    }

    private WebResourceResponse bundledCertificateResponse(Uri uri) {
        if (uri == null) return null;
        String host = uri.getHost();
        String path = uri.getPath();
        if (host == null || !"sperinservices.co.uk".equalsIgnoreCase(host) || path == null) return null;

        final String prefix = APP_PATH;
        if (!(path.equals(prefix) || path.equals(prefix + "/") || path.startsWith(prefix + "/"))) return null;

        String relative;
        if (path.equals(prefix) || path.equals(prefix + "/")) relative = "index.html";
        else relative = path.substring((prefix + "/").length());

        if (relative.isEmpty()) relative = "index.html";
        if (relative.contains("..") || relative.startsWith("/")) return null;

        String mime = "application/octet-stream";
        if (relative.endsWith(".html")) mime = "text/html";
        else if (relative.endsWith(".css")) mime = "text/css";
        else if (relative.endsWith(".js")) mime = "application/javascript";
        else if (relative.endsWith(".svg")) mime = "image/svg+xml";
        else if (relative.endsWith(".webmanifest")) mime = "application/manifest+json";

        try {
            return new WebResourceResponse(
                    mime,
                    "UTF-8",
                    getAssets().open("certificates/" + relative)
            );
        } catch (Exception ex) {
            return null;
        }
    }

    private void loadBundledIndex() {
        try {
            String html = readFile(getAssets().open("certificates/index.html"));
            webView.loadDataWithBaseURL(
                    BUNDLED_BASE_URL,
                    html,
                    "text/html",
                    "UTF-8",
                    APP_URL
            );
        } catch (Exception ex) {
            runOnUiThread(() -> Toast.makeText(
                    MainActivity.this,
                    "Certificate interface could not be opened",
                    Toast.LENGTH_LONG
            ).show());
        }
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


    // Emergency Chamberlain forensic recovery code was intentionally removed in v1.7.9.
    // Normal rolling backups and explicit import/restore now handle recovery safely.

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
            if (notify && "application/pdf".equals(mime)) {
                runOnUiThread(() -> showPdfReadyBar(uri, fileName));
            } else {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, fileName + " saved", Toast.LENGTH_SHORT).show());
            }
            if (notify) requestFileNotification(uri, fileName, mime);
            return uri;
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

    private void writeAutoBackup(String content) throws Exception {
        File dir = backupDir();
        File latest = new File(dir, "auto-latest.json");
        try (OutputStream out = new FileOutputStream(latest)) {
            out.write(content.getBytes(StandardCharsets.UTF_8));
        }

        long now = System.currentTimeMillis();
        if (lastRollingAutoBackup == 0L || now - lastRollingAutoBackup >= 5L * 60L * 1000L) {
            File rolling = new File(dir, "autosave-" + now + ".json");
            try (OutputStream out = new FileOutputStream(rolling)) {
                out.write(content.getBytes(StandardCharsets.UTF_8));
            }
            lastRollingAutoBackup = now;
            File[] history = dir.listFiles((d, name) -> name.startsWith("autosave-") && name.endsWith(".json"));
            if (history != null && history.length > 12) {
                Arrays.sort(history, (a, b) -> Long.compare(a.lastModified(), b.lastModified()));
                for (int i = 0; i < history.length - 12; i++) history[i].delete();
            }
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
        File manual = new File(backupDir(), "latest.json");
        File automatic = new File(backupDir(), "auto-latest.json");
        File newest = null;
        if (manual.exists()) newest = manual;
        if (automatic.exists() && (newest == null || automatic.lastModified() > newest.lastModified())) newest = automatic;
        if (newest != null) return readFile(new FileInputStream(newest));

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
                        // Reading a candidate must not replace the latest stored backup.
                        // The WebView presents a separate review/approval screen first.
                        return readFile(in);
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


    private int dp(int value) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value,
                getResources().getDisplayMetrics());
    }

    private void openSavedPdf(Uri uri) {
        if (uri == null) return;
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, "application/pdf");
            intent.setClipData(ClipData.newRawUri("Sperin Certificate", uri));
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(intent);
        } catch (android.content.ActivityNotFoundException ex) {
            Toast.makeText(this, "No PDF reader available. File is saved in Downloads.", Toast.LENGTH_LONG).show();
        } catch (Exception ex) {
            Toast.makeText(this, "Could not open PDF. Find it in Downloads.", Toast.LENGTH_LONG).show();
        }
    }

    private void showPdfReadyBar(Uri uri, String fileName) {
        if (appContainer == null || uri == null) return;
        latestPdfUri = uri;
        if (pdfReadyBar != null) appContainer.removeView(pdfReadyBar);
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(dp(14), dp(12), dp(14), dp(12));
        row.setBackgroundColor(Color.rgb(16, 34, 54));
        row.setElevation(dp(12));
        TextView label = new TextView(this);
        label.setText("PDF saved to Downloads");
        label.setTextColor(Color.WHITE);
        label.setTextSize(14f);
        label.setMaxLines(2);
        row.addView(label, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        Button open = new Button(this);
        open.setText("OPEN PDF");
        open.setContentDescription("Open saved PDF " + fileName);
        open.setAllCaps(false);
        open.setTextColor(Color.WHITE);
        open.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.rgb(29, 115, 215)));
        open.setOnClickListener(v -> {
            Uri selected = latestPdfUri;
            hidePdfReadyBar();
            openSavedPdf(selected);
        });
        row.addView(open, new LinearLayout.LayoutParams(dp(112), dp(50)));
        Button dismiss = new Button(this);
        dismiss.setText("×");
        dismiss.setContentDescription("Dismiss PDF saved message");
        dismiss.setTextColor(Color.WHITE);
        dismiss.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.rgb(34, 57, 80)));
        dismiss.setOnClickListener(v -> hidePdfReadyBar());
        row.addView(dismiss, new LinearLayout.LayoutParams(dp(44), dp(50)));
        FrameLayout.LayoutParams layout = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.BOTTOM);
        layout.setMargins(dp(8), dp(8), dp(8), dp(12));
        appContainer.addView(row, layout);
        pdfReadyBar = row;
        final int generation = ++pdfBarGeneration;
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            if (generation == pdfBarGeneration) hidePdfReadyBar();
        }, 15000);
    }

    private void hidePdfReadyBar() {
        pdfBarGeneration++;
        if (pdfReadyBar != null && appContainer != null) appContainer.removeView(pdfReadyBar);
        pdfReadyBar = null;
    }

    // Print the actual ink-friendly PDF, never the dark HTML form currently on screen.
    // Preselect landscape ISO A4. The printer app may still allow the user to override.
    private void printCertificatePdf(byte[] pdfBytes, String fileName) {
        if (pdfBytes == null || pdfBytes.length < 5
                || pdfBytes[0] != '%' || pdfBytes[1] != 'P'
                || pdfBytes[2] != 'D' || pdfBytes[3] != 'F') {
            Toast.makeText(this, "Unable to print: invalid PDF", Toast.LENGTH_LONG).show();
            return;
        }
        PrintManager manager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
        if (manager == null) {
            Toast.makeText(this, "Printing is not available", Toast.LENGTH_LONG).show();
            return;
        }
        PrintDocumentAdapter adapter = new PrintDocumentAdapter() {
            @Override
            public void onLayout(PrintAttributes oldAttributes, PrintAttributes newAttributes,
                    CancellationSignal cancellationSignal, LayoutResultCallback callback, Bundle extras) {
                if (cancellationSignal.isCanceled()) {
                    callback.onLayoutCancelled();
                    return;
                }
                PrintDocumentInfo info = new PrintDocumentInfo.Builder(fileName)
                        .setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT)
                        .setPageCount(PrintDocumentInfo.PAGE_COUNT_UNKNOWN)
                        .build();
                callback.onLayoutFinished(info, true);
            }

            @Override
            public void onWrite(PageRange[] pages, ParcelFileDescriptor destination,
                    CancellationSignal cancellationSignal, WriteResultCallback callback) {
                if (cancellationSignal.isCanceled()) {
                    callback.onWriteCancelled();
                    return;
                }
                try (FileOutputStream out = new FileOutputStream(destination.getFileDescriptor())) {
                    out.write(pdfBytes);
                    out.flush();
                    if (cancellationSignal.isCanceled()) callback.onWriteCancelled();
                    else callback.onWriteFinished(new PageRange[]{PageRange.ALL_PAGES});
                } catch (Exception ex) {
                    callback.onWriteFailed("Unable to prepare certificate PDF");
                }
            }
        };
        PrintAttributes attrs = new PrintAttributes.Builder()
                .setMediaSize(PrintAttributes.MediaSize.ISO_A4.asLandscape())
                .setColorMode(PrintAttributes.COLOR_MODE_COLOR)
                .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                .build();
        manager.print("Sperin Certificate", adapter, attrs);
    }

    private void printCurrentPage() {
        PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
        PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter("Sperin Certificate");
        PrintAttributes attrs = new PrintAttributes.Builder()
                .setMediaSize(PrintAttributes.MediaSize.ISO_A4.asLandscape())
                .setColorMode(PrintAttributes.COLOR_MODE_MONOCHROME)
                .build();
        printManager.print("Sperin Certificate", adapter, attrs);
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
        public boolean savePdfBase64(String dataUri, String fileName) {
            try {
                int comma = dataUri.indexOf(',');
                String payload = comma >= 0 ? dataUri.substring(comma + 1) : dataUri;
                Uri uri = saveBytes(Base64.decode(payload, Base64.DEFAULT), fileName, "application/pdf", true);
                return uri != null;
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "PDF save failed", Toast.LENGTH_LONG).show());
                return false;
            }
        }

        @JavascriptInterface
        public boolean printPdfBase64(String dataUri, String fileName) {
            try {
                if (dataUri == null || dataUri.length() > 28000000) return false;
                int comma = dataUri.indexOf(',');
                String payload = comma >= 0 ? dataUri.substring(comma + 1) : dataUri;
                byte[] bytes = Base64.decode(payload, Base64.DEFAULT);
                final String printableName = safeName(fileName, "Sperin-Certificate.pdf");
                runOnUiThread(() -> printCertificatePdf(bytes, printableName));
                return true;
            } catch (Exception ex) {
                android.util.Log.e("SperinCertificates", "PDF print preparation failed", ex);
                return false;
            }
        }

        @JavascriptInterface
        public void saveTextFile(String content, String fileName, String mime) {
            saveBytes(content.getBytes(StandardCharsets.UTF_8), fileName, mime == null ? "text/plain" : mime, false);
        }

        @JavascriptInterface
        public boolean saveBackup(String content, String fileName) {
            try {
                writeInternalBackup(content);
                Uri uri = saveBytes(content.getBytes(StandardCharsets.UTF_8), fileName, "application/json", false);
                if (uri == null) return false;
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Backup saved", Toast.LENGTH_LONG).show());
                return true;
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Backup failed: " + ex.getMessage(), Toast.LENGTH_LONG).show());
                return false;
            }
        }

        @JavascriptInterface
        public void saveAutoBackup(String content) {
            try { writeAutoBackup(content); }
            catch (Exception ex) { android.util.Log.w("SperinCertificates", "Auto backup failed", ex); }
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
