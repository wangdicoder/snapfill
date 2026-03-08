package com.snapfill

/**
 * Callback interface for Snapfill events.
 * All methods have default no-op implementations so consumers only override what they need.
 */
interface SnapfillListener {
    fun onFormDetected(fields: List<String>) {}
    fun onCartDetected(cart: SnapfillCart) {}
    fun onValuesCaptured(mappings: Map<String, String>) {}
    fun onFormFillComplete(result: SnapfillFillResult) {}
}
