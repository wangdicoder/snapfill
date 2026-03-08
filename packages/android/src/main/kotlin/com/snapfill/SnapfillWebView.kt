package com.snapfill

import android.content.Context
import android.util.AttributeSet
import android.webkit.WebView

/**
 * Convenience WebView subclass with built-in Snapfill support.
 *
 * Usage:
 * ```kotlin
 * val webView = SnapfillWebView(context)
 * webView.snapfillListener = object : SnapfillListener {
 *     override fun onFormDetected(fields: List<String>) { ... }
 * }
 * webView.loadUrl("https://example.com/checkout")
 * ```
 */
class SnapfillWebView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : WebView(context, attrs, defStyleAttr) {

    private val snapfill = Snapfill(this)

    var snapfillListener: SnapfillListener?
        get() = snapfill.listener
        set(value) { snapfill.listener = value }

    var snapfillOptions: SnapfillOptions = SnapfillOptions()

    init {
        snapfill.attach()
    }

    fun fillForm(mappings: Map<String, String>) {
        snapfill.fillForm(mappings)
    }

    fun reinject() {
        snapfill.reinject()
    }
}
