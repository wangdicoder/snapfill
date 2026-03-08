package com.snapfill

data class SnapfillCart(
    val total: Int,
    val currency: String?,
    val products: List<SnapfillCartProduct>
)

data class SnapfillCartProduct(
    val name: String?,
    val quantity: Int,
    val itemPrice: Int,
    val lineTotal: Int,
    val url: String?,
    val imageUrl: String?
)

data class SnapfillFillResult(
    val filled: Int,
    val total: Int,
    val failed: List<String>
)

data class SnapfillOptions(
    val detectForms: Boolean = true,
    val detectCart: Boolean = true,
    val captureValues: Boolean = true
)
