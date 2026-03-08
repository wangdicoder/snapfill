package com.snapfill.example

import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.webkit.WebView
import androidx.appcompat.app.AppCompatActivity
import com.snapfill.Snapfill
import com.snapfill.SnapfillCart
import com.snapfill.SnapfillFillResult
import com.snapfill.SnapfillListener
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var snapfill: Snapfill
    private lateinit var eventLog: TextView

    private val sampleAddress = mapOf(
        "firstName" to "Jane",
        "lastName" to "Doe",
        "email" to "jane.doe@example.com",
        "phoneNumber" to "+1 555-867-5309",
        "postalAddressLine1" to "350 Fifth Avenue",
        "postalAddressLine2" to "Suite 3400",
        "postalSuburb" to "New York",
        "postalState" to "NY",
        "postalPostCode" to "10118",
        "postalCountry" to "US"
    )

    private val sampleCard = mapOf(
        "ccNumber" to "4111111111111111",
        "ccName" to "JANE DOE",
        "ccExpiryMonth" to "06",
        "ccExpiryYear" to "2028",
        "ccCCV" to "737"
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val webView = findViewById<WebView>(R.id.webview)
        eventLog = findViewById(R.id.event_log)

        snapfill = Snapfill(webView)
        snapfill.listener = object : SnapfillListener {
            override fun onFormDetected(fields: List<String>) {
                log("formDetected", "${fields.size} fields: ${fields.joinToString(", ")}")
            }

            override fun onCartDetected(cart: SnapfillCart) {
                val total = String.format("%.2f", cart.total / 100.0)
                log("cartDetected", "$$total ${cart.currency ?: ""} — ${cart.products.size} item(s)")
            }

            override fun onValuesCaptured(mappings: Map<String, String>) {
                log("valuesCaptured", "${mappings.size} values captured")
            }

            override fun onFormFillComplete(result: SnapfillFillResult) {
                log("formFillComplete", "${result.filled}/${result.total} filled")
            }
        }
        snapfill.attach()

        // Load the checkout HTML from assets
        webView.loadUrl("file:///android_asset/checkout.html")

        findViewById<Button>(R.id.btn_fill_address).setOnClickListener {
            snapfill.fillForm(sampleAddress)
        }
        findViewById<Button>(R.id.btn_fill_card).setOnClickListener {
            snapfill.fillForm(sampleCard)
        }
        findViewById<Button>(R.id.btn_fill_all).setOnClickListener {
            snapfill.fillForm(sampleAddress + sampleCard)
        }
    }

    private fun log(type: String, message: String) {
        val time = SimpleDateFormat("HH:mm:ss", Locale.US).format(Date())
        val line = "[$time] $type: $message\n"
        eventLog.text = "${line}${eventLog.text}"
    }
}
