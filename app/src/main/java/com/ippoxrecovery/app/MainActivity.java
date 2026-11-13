package com.ippoxrecovery.app;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.JavascriptInterface;
import android.content.Intent;
import android.net.Uri;

import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

public class MainActivity extends Activity {
    private static final int OCR_PICK_IMAGE = 4107;
    private WebView webView;
    private TextRecognizer textRecognizer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        textRecognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
        webView = new WebView(this);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setAllowFileAccess(true);
        webView.getSettings().setAllowContentAccess(false);
        webView.getSettings().setAllowFileAccessFromFileURLs(false);
        webView.getSettings().setAllowUniversalAccessFromFileURLs(false);
        webView.addJavascriptInterface(new OcrBridge(), "AndroidOcr");
        webView.setWebChromeClient(new WebChromeClient());
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
