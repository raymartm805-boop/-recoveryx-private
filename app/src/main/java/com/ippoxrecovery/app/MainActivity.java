package com.ippoxrecovery.app;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.WeakReference;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient.FileChooserParams;
import android.content.Intent;
import android.net.Uri;

import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

public class MainActivity extends Activity {
    private static final int OCR_PICK_IMAGE = 4107;
    private static final int WEB_FILE_PICKER = 4108;
    private WebView webView;
    private TextRecognizer textRecognizer;
    private ValueCallback<Uri[]> pendingFileCallback;
    private static WeakReference<MainActivity> activeActivity = new WeakReference<>(null);
    private static final int TERMUX_PERMISSION_REQUEST = 6101;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        activeActivity = new WeakReference<>(this);
        textRecognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
        webView = new WebView(this);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setAllowFileAccess(true);
        // Required for WebView to read the content:// URI returned by Android's photo picker.
        webView.getSettings().setAllowContentAccess(true);
        webView.getSettings().setAllowFileAccessFromFileURLs(false);
        webView.getSettings().setAllowUniversalAccessFromFileURLs(false);
        webView.addJavascriptInterface(new OcrBridge(), "AndroidOcr");
        webView.addJavascriptInterface(new TermuxBridge(), "AndroidTermux");
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> filePathCallback,
                                             FileChooserParams fileChooserParams) {
                if (pendingFileCallback != null) {
                    pendingFileCallback.onReceiveValue(null);
                    pendingFileCallback = null;
                }
                pendingFileCallback = filePathCallback;
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("image/*");
                try {
                    startActivityForResult(Intent.createChooser(intent, "Choose profile photo"), WEB_FILE_PICKER);
                } catch (Exception error) {
                    pendingFileCallback.onReceiveValue(null);
                    pendingFileCallback = null;
                    return false;
                }
                return true;
            }
        });
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme())) {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    return true;
                }
                return false;
            }
        });
        setContentView(webView);
        webView.loadUrl("file:///android_asset/public/index.html");
    }


    private class TermuxBridge {
        @JavascriptInterface
        public boolean isInstalled() {
            try {
                if (Build.VERSION.SDK_INT >= 33) getPackageManager().getPackageInfo("com.termux", PackageManager.PackageInfoFlags.of(0));
                else getPackageManager().getPackageInfo("com.termux", 0);
                return true;
            } catch (Exception error) { return false; }
        }

        @JavascriptInterface
        public boolean hasRunPermission() {
            return checkSelfPermission("com.termux.permission.RUN_COMMAND") == PackageManager.PERMISSION_GRANTED;
        }

        @JavascriptInterface
        public void requestRunPermission() {
            runOnUiThread(() -> requestPermissions(new String[]{"com.termux.permission.RUN_COMMAND"}, TERMUX_PERMISSION_REQUEST));
        }

        @JavascriptInterface
        public void runDiagnostic(String commandId) {
            runOnUiThread(() -> executeApprovedDiagnostic(commandId));
        }
    }

    private void executeApprovedDiagnostic(String commandId) {
        if (checkSelfPermission("com.termux.permission.RUN_COMMAND") != PackageManager.PERMISSION_GRANTED) {
            sendTermuxResult("permission", "Grant the Run commands in Termux permission in Android Settings, then try again.", -1);
            return;
        }
        if (!isTermuxInstalled()) {
            sendTermuxResult("error", "Termux is not installed. Install the official F-Droid build first.", -1);
            return;
        }
        String executable;
        String[] args;
        String label;
        switch (commandId == null ? "" : commandId) {
            case "pwd": executable="/data/data/com.termux/files/usr/bin/pwd"; args=new String[]{}; label="Print working directory"; break;
            case "identity": executable="/data/data/com.termux/files/usr/bin/id"; args=new String[]{}; label="Show Termux user identity"; break;
            case "system": executable="/data/data/com.termux/files/usr/bin/uname"; args=new String[]{"-a"}; label="Show kernel and device architecture"; break;
            case "date": executable="/data/data/com.termux/files/usr/bin/date"; args=new String[]{}; label="Show device date"; break;
            case "storage": executable="/data/data/com.termux/files/usr/bin/df"; args=new String[]{"-h"}; label="Show filesystem usage"; break;
            case "files": executable="/data/data/com.termux/files/usr/bin/ls"; args=new String[]{"-la"}; label="List Termux home files"; break;
            default: sendTermuxResult("error", "Command not allowed. Choose one of the built-in diagnostics.", -1); return;
        }
        int requestCode = (int)(System.currentTimeMillis() & 0x7fffffff);
        Intent callback = new Intent(this, TermuxResultReceiver.class);
        callback.putExtra("termux_request_code", requestCode);
        int flags = PendingIntent.FLAG_ONE_SHOT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
        PendingIntent pending = PendingIntent.getBroadcast(this, requestCode, callback, flags);
        Intent intent = new Intent();
        intent.setClassName("com.termux", "com.termux.app.RunCommandService");
        intent.setAction("com.termux.RUN_COMMAND");
        intent.putExtra("com.termux.RUN_COMMAND_PATH", executable);
        intent.putExtra("com.termux.RUN_COMMAND_ARGUMENTS", args);
        intent.putExtra("com.termux.RUN_COMMAND_WORKDIR", "/data/data/com.termux/files/home");
        intent.putExtra("com.termux.RUN_COMMAND_BACKGROUND", true);
        intent.putExtra("com.termux.RUN_COMMAND_PENDING_INTENT", pending);
        intent.putExtra("com.termux.RUN_COMMAND_COMMAND_LABEL", label);
        intent.putExtra("com.termux.RUN_COMMAND_COMMAND_DESCRIPTION", "Built-in, read-only device diagnostic requested from MALWARE BYPASSING TOOLS.");
        try {
            startService(intent);
            sendTermuxResult("started", "Sent approved diagnostic to Termux: " + label, 0);
        } catch (Exception error) {
            sendTermuxResult("error", "Could not start Termux command service: " + error.getMessage(), -1);
        }
    }

    private boolean isTermuxInstalled() {
        try {
            if (Build.VERSION.SDK_INT >= 33) getPackageManager().getPackageInfo("com.termux", PackageManager.PackageInfoFlags.of(0));
            else getPackageManager().getPackageInfo("com.termux", 0);
            return true;
        } catch (Exception error) { return false; }
    }

    private static void sendTermuxResult(String status, String output, int exitCode) {
        MainActivity activity = activeActivity.get();
        if (activity == null || activity.webView == null) return;
        String js = "if(window.onTermuxResult){window.onTermuxResult(" +
            org.json.JSONObject.quote(status) + "," + org.json.JSONObject.quote(output) + "," + exitCode + ");}";
        activity.runOnUiThread(() -> { if (activity.webView != null) activity.webView.evaluateJavascript(js, null); });
    }

    public static void deliverTermuxResult(String stdout, String stderr, int exitCode, String error) {
        String combined = (stdout == null ? "" : stdout);
        if (stderr != null && !stderr.isEmpty()) combined += "\\n[stderr]\\n" + stderr;
        if (error != null && !error.isEmpty()) combined += "\\n[Termux] " + error;
        sendTermuxResult("result", combined, exitCode);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == TERMUX_PERMISSION_REQUEST) {
            boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            sendTermuxResult(granted ? "permission-granted" : "permission-denied",
                granted ? "Termux command permission granted. Select a diagnostic to run." :
                "Permission not granted. You can enable it later in App info > Permissions > Additional permissions.", -1);
        }
    }

    private class OcrBridge {
        @JavascriptInterface
        public void chooseImageAndRead() {
            runOnUiThread(() -> {
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.setType("image/*");
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                startActivityForResult(Intent.createChooser(intent, "Choose account notice screenshot"), OCR_PICK_IMAGE);
            });
        }
    }

    private Uri[] extractSelectedUris(int resultCode, Intent data) {
        if (resultCode != RESULT_OK || data == null) return null;
        if (data.getClipData() != null && data.getClipData().getItemCount() > 0) {
            return new Uri[]{data.getClipData().getItemAt(0).getUri()};
        }
        Uri uri = data.getData();
        return uri == null ? null : new Uri[]{uri};
    }

    private void sendOcrResult(String text, String error) {
        if (webView == null) return;
        String safeText = org.json.JSONObject.quote(text == null ? "" : text);
        String safeError = org.json.JSONObject.quote(error == null ? "" : error);
        runOnUiThread(() -> webView.evaluateJavascript(
            "if(window.onNativeOcrResult){window.onNativeOcrResult(" + safeText + "," + safeError + ");}", null));
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == WEB_FILE_PICKER) {
            if (pendingFileCallback != null) {
                pendingFileCallback.onReceiveValue(extractSelectedUris(resultCode, data));
                pendingFileCallback = null;
            }
            return;
        }
        if (requestCode != OCR_PICK_IMAGE) return;
        if (resultCode != RESULT_OK || data == null || data.getData() == null) {
            sendOcrResult("", "Walang napiling larawan.");
            return;
        }
        try {
            InputImage image = InputImage.fromFilePath(this, data.getData());
            textRecognizer.process(image)
                .addOnSuccessListener(result -> sendOcrResult(result.getText(), ""))
                .addOnFailureListener(error -> sendOcrResult("", "Hindi mabasa ang larawan. Subukan ang malinaw na screenshot."));
        } catch (Exception error) {
            sendOcrResult("", "Hindi mabuksan ang larawan. Pumili ng JPG o PNG screenshot.");
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (pendingFileCallback != null) {
            pendingFileCallback.onReceiveValue(null);
            pendingFileCallback = null;
        }
        if (textRecognizer != null) {
            textRecognizer.close();
            textRecognizer = null;
        }
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        activeActivity.clear();
        super.onDestroy();
    }
}