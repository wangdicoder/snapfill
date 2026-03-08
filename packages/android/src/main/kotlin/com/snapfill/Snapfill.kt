package com.snapfill

import android.annotation.SuppressLint
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import org.json.JSONArray
import org.json.JSONObject

/**
 * Snapfill helper — attach to any Android WebView to enable form detection,
 * cart detection, value capture, and form filling.
 *
 * Usage:
 * ```kotlin
 * val snapfill = Snapfill(webView)
 * snapfill.listener = object : SnapfillListener {
 *     override fun onFormDetected(fields: List<String>) { ... }
 * }
 * snapfill.attach()
 * ```
 */
class Snapfill(
    private val webView: WebView,
    private val options: SnapfillOptions = SnapfillOptions()
) {
    var listener: SnapfillListener? = null

    private val mainHandler = Handler(Looper.getMainLooper())
    private var attached = false
    private var originalClient: WebViewClient? = null

    private val bridgeShim: String by lazy {
        "window.ReactNativeWebView={postMessage:function(m){SnapfillBridge.onMessage(m);}};"
    }

    private val detectionScript: String by lazy {
        loadAsset("snapfill.js")
    }

    private val fillTemplate: String by lazy {
        loadAsset("snapfill-fill.js")
    }

    /**
     * Attaches Snapfill to the WebView. Sets up the JavaScript bridge and
     * installs a WebViewClient that injects scripts on page load.
     */
    @SuppressLint("SetJavaScriptEnabled", "AddJavascriptInterface")
    fun attach() {
        if (attached) return
        attached = true

        webView.settings.javaScriptEnabled = true
        webView.addJavascriptInterface(Bridge(), "SnapfillBridge")

        val wrappedClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                super.onPageStarted(view, url, favicon)
                view?.evaluateJavascript(bridgeShim, null)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                injectDetectionScripts(view)
            }
        }

        webView.webViewClient = wrappedClient
    }

    /**
     * Fills form fields in the current page using the provided field-to-value mappings.
     */
    fun fillForm(mappings: Map<String, String>) {
        val json = JSONObject(mappings).toString()
        val script = fillTemplate.replace("__SNAPFILL_MAPPINGS__", json)
        webView.evaluateJavascript(script, null)
    }

    /**
     * Re-injects detection scripts into the current page.
     * Useful after single-page navigation that doesn't trigger a full page load.
     */
    fun reinject() {
        webView.evaluateJavascript(bridgeShim, null)
        injectDetectionScripts(webView)
    }

    /**
     * Detaches Snapfill from the WebView, removing the JavaScript bridge.
     */
    fun detach() {
        if (!attached) return
        attached = false
        webView.removeJavascriptInterface("SnapfillBridge")
    }

    private fun injectDetectionScripts(view: WebView?) {
        if (view == null) return
        val scripts = buildString {
            if (options.detectForms || options.captureValues) {
                append(detectionScript)
            }
        }
        if (scripts.isNotEmpty()) {
            view.evaluateJavascript(scripts, null)
        }
    }

    private fun loadAsset(filename: String): String {
        return webView.context.assets.open(filename).bufferedReader().use { it.readText() }
    }

    private inner class Bridge {
        @JavascriptInterface
        fun onMessage(msg: String) {
            val listener = this@Snapfill.listener ?: return
            mainHandler.post {
                dispatchMessage(msg, listener)
            }
        }
    }

    internal companion object {
        fun dispatchMessage(msg: String, listener: SnapfillListener) {
            try {
                val json = JSONObject(msg)
                when (json.getString("type")) {
                    "formDetected" -> {
                        val arr = json.getJSONArray("fields")
                        val fields = (0 until arr.length()).map { arr.getString(it) }
                        listener.onFormDetected(fields)
                    }
                    "cartDetected" -> {
                        val cart = parseCart(json.getJSONObject("cart"))
                        listener.onCartDetected(cart)
                    }
                    "valuesCaptured" -> {
                        val mappings = parseStringMap(json.getJSONObject("mappings"))
                        listener.onValuesCaptured(mappings)
                    }
                    "formFillComplete" -> {
                        val result = parseFillResult(json.getJSONObject("result"))
                        listener.onFormFillComplete(result)
                    }
                }
            } catch (_: Exception) {
                // Ignore malformed messages
            }
        }

        fun parseCart(obj: JSONObject): SnapfillCart {
            val products = mutableListOf<SnapfillCartProduct>()
            val arr = obj.optJSONArray("products") ?: JSONArray()
            for (i in 0 until arr.length()) {
                val p = arr.getJSONObject(i)
                products.add(
                    SnapfillCartProduct(
                        name = p.optString("name", null),
                        quantity = p.optInt("quantity", 1),
                        itemPrice = p.optInt("itemPrice", 0),
                        lineTotal = p.optInt("lineTotal", 0),
                        url = p.optString("url", null),
                        imageUrl = p.optString("imageUrl", null)
                    )
                )
            }
            return SnapfillCart(
                total = obj.optInt("total", 0),
                currency = obj.optString("currency", null),
                products = products
            )
        }

        fun parseFillResult(obj: JSONObject): SnapfillFillResult {
            val failed = mutableListOf<String>()
            val arr = obj.optJSONArray("failed") ?: JSONArray()
            for (i in 0 until arr.length()) {
                failed.add(arr.getString(i))
            }
            return SnapfillFillResult(
                filled = obj.optInt("filled", 0),
                total = obj.optInt("total", 0),
                failed = failed
            )
        }

        fun parseStringMap(obj: JSONObject): Map<String, String> {
            val map = mutableMapOf<String, String>()
            obj.keys().forEach { key ->
                map[key] = obj.getString(key)
            }
            return map
        }
    }
}
