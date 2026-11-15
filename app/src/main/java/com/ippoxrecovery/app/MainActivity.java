package com.ippoxrecovery.app;

import android.app.Activity;
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

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
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
        super.onDestroy();
    }
}