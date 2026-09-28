package io.github.aiaccountmanager.usage;

import android.app.Activity;
import android.content.Intent;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;

/**
 * Hosts the bundled usage UI (assets/index.html) in a WebView.
 *
 * Network calls go through {@link Bridge} rather than the page's fetch: the
 * page is a file:// origin, and a native request sidesteps CORS and private
 * network rules while letting this class refuse anything that is not a
 * Tailscale address.
 */
public class MainActivity extends Activity {
    private static final String PAGE = "file:///android_asset/index.html";
    private static final int MAX_RESPONSE_BYTES = 512 * 1024;
    private static final String PREFS = "aam-usage";
    private static final String STATE_KEY = "state";
    private static final int MAX_STATE_CHARS = 1024 * 1024;

    private final ExecutorService network = Executors.newFixedThreadPool(2);
    private final Handler main = new Handler(Looper.getMainLooper());
    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applySystemBars();
        web = new WebView(this);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        // android_asset stays readable; nothing else on the file system is.
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setGeolocationEnabled(false);
        web.setBackgroundColor(pageColor());
        web.addJavascriptInterface(new Bridge(), "AamNative");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("file".equals(uri.getScheme())) return false;
                if ("https".equals(uri.getScheme())) {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                }
                return true;
            }
        });
        setContentView(web);
        String url = PAGE + "?theme=" + themeName();
        String link = pairingLink(getIntent());
        if (link != null) url += "&pair=" + Uri.encode(link);
        web.loadUrl(url);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String link = pairingLink(intent);
        if (link != null && web != null) {
            web.evaluateJavascript(
                    "window.aamPair && window.aamPair(" + JSONObject.quote(link) + ")", null);
        }
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        applySystemBars();
        if (web != null) {
            web.setBackgroundColor(pageColor());
            web.evaluateJavascript(
                    "window.aamTheme && window.aamTheme('" + themeName() + "')", null);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.evaluateJavascript("window.aamResume && window.aamResume()", null);
    }

    @Override
    protected void onPause() {
        if (web != null) web.evaluateJavascript("window.aamPause && window.aamPause()", null);
        super.onPause();
    }

    @Override
    public void onBackPressed() {
        if (web == null) {
            super.onBackPressed();
            return;
        }
        // Let the page close an open sheet first.
        web.evaluateJavascript("window.aamBack ? String(window.aamBack()) : 'false'", value -> {
            if (!"\"true\"".equals(value)) finish();
        });
    }

    @Override
    protected void onDestroy() {
        network.shutdownNow();
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }

    private static String pairingLink(Intent intent) {
        if (intent == null || !Intent.ACTION_VIEW.equals(intent.getAction())) return null;
        Uri data = intent.getData();
        if (data == null || !"aamusage".equals(data.getScheme()) || !"pair".equals(data.getHost())) {
            return null;
        }
        return data.toString();
    }

    private boolean isNight() {
        int mode = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        return mode == Configuration.UI_MODE_NIGHT_YES;
    }

    private String themeName() {
        return isNight() ? "dark" : "light";
    }

    private int pageColor() {
        return isNight() ? 0xFF0D0D0D : 0xFFF9F9F7;
    }

    @SuppressWarnings("deprecation")
    private void applySystemBars() {
        Window window = getWindow();
        window.setStatusBarColor(pageColor());
        window.setNavigationBarColor(pageColor());
        View decor = window.getDecorView();
        int lightBars = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        int flags = decor.getSystemUiVisibility() & ~lightBars;
        if (!isNight()) flags |= lightBars;
        decor.setSystemUiVisibility(flags);
    }

    /** Only the paired PC's tailnet address, or a MagicDNS name, is reachable. */
    static boolean isTailnetHost(String host) {
        if (host == null) return false;
        String value = host.toLowerCase(Locale.ROOT);
        if (value.endsWith(".ts.net")) return true;
        String[] parts = value.split("\\.");
        if (parts.length != 4) return false;
        try {
            int[] octets = new int[4];
            for (int i = 0; i < 4; i++) {
                if (parts[i].isEmpty() || parts[i].length() > 3) return false;
                octets[i] = Integer.parseInt(parts[i]);
                if (octets[i] < 0 || octets[i] > 255) return false;
            }
            return octets[0] == 100 && octets[1] >= 64 && octets[1] <= 127;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private static String readLimited(InputStream in) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int total = 0;
        int read;
        while ((read = in.read(buffer)) != -1) {
            total += read;
            if (total > MAX_RESPONSE_BYTES) throw new IOException("Response too large");
            out.write(buffer, 0, read);
        }
        return new String(out.toByteArray(), StandardCharsets.UTF_8);
    }

    final class Bridge {
        /**
         * The pairing and the last snapshot live in the app's private
         * preferences, not WebView storage, so the last known figures
         * survive the app being closed, swiped away or updated.
         */
        @JavascriptInterface
        public String loadState() {
            return getSharedPreferences(PREFS, MODE_PRIVATE).getString(STATE_KEY, "");
        }

        @JavascriptInterface
        public boolean saveState(String json) {
            if (json == null || json.length() > MAX_STATE_CHARS) return false;
            // commit(), not apply(): the app may be swiped away right after a sync.
            return getSharedPreferences(PREFS, MODE_PRIVATE)
                    .edit()
                    .putString(STATE_KEY, json)
                    .commit();
        }

        @JavascriptInterface
        public String deviceName() {
            String name = Settings.Global.getString(getContentResolver(), "device_name");
            if (name == null || name.trim().isEmpty()) name = Build.MANUFACTURER + " " + Build.MODEL;
            return name.trim();
        }

        @JavascriptInterface
        public void request(final String id, final String method, final String url,
                final String token, final String body) {
            network.execute(() -> {
                int status = 0;
                String text;
                HttpURLConnection connection = null;
                try {
                    URL target = new URL(url);
                    String protocol = target.getProtocol();
                    if (!("http".equals(protocol) || "https".equals(protocol))
                            || !isTailnetHost(target.getHost())) {
                        throw new IOException("Only Tailscale addresses are allowed.");
                    }
                    connection = (HttpURLConnection) target.openConnection();
                    connection.setConnectTimeout(6000);
                    connection.setReadTimeout(12000);
                    connection.setUseCaches(false);
                    connection.setInstanceFollowRedirects(false);
                    boolean post = "POST".equals(method);
                    connection.setRequestMethod(post ? "POST" : "GET");
                    connection.setRequestProperty("Accept", "application/json");
                    if (token != null && !token.isEmpty()) {
                        connection.setRequestProperty("Authorization", "Bearer " + token);
                    }
                    if (post) {
                        byte[] bytes = (body == null ? "{}" : body).getBytes(StandardCharsets.UTF_8);
                        connection.setDoOutput(true);
                        connection.setRequestProperty("Content-Type", "application/json");
                        connection.setFixedLengthStreamingMode(bytes.length);
                        try (OutputStream out = connection.getOutputStream()) {
                            out.write(bytes);
                        }
                    }
                    status = connection.getResponseCode();
                    InputStream in = status >= 400 ? connection.getErrorStream() : connection.getInputStream();
                    text = in == null ? "" : readLimited(in);
                } catch (Exception e) {
                    status = 0;
                    text = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
                } finally {
                    if (connection != null) connection.disconnect();
                }
                final String script = "window.aamBridgeResult(" + JSONObject.quote(id) + ","
                        + status + "," + JSONObject.quote(text) + ")";
                main.post(() -> {
                    if (web != null) web.evaluateJavascript(script, null);
                });
            });
        }
    }
}
