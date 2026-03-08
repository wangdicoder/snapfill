package com.snapfill

import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

class SnapfillMessageParserTest {

    @Test
    fun `parseCart parses complete cart`() {
        val json = JSONObject("""
            {
                "total": 4999,
                "currency": "USD",
                "products": [
                    {
                        "name": "Widget",
                        "quantity": 2,
                        "itemPrice": 1500,
                        "lineTotal": 3000,
                        "url": "https://example.com/widget",
                        "imageUrl": "https://example.com/widget.jpg"
                    },
                    {
                        "name": "Gadget",
                        "quantity": 1,
                        "itemPrice": 1999,
                        "lineTotal": 1999,
                        "url": null,
                        "imageUrl": null
                    }
                ]
            }
        """.trimIndent())

        val cart = Snapfill.parseCart(json)

        assertEquals(4999, cart.total)
        assertEquals("USD", cart.currency)
        assertEquals(2, cart.products.size)

        val first = cart.products[0]
        assertEquals("Widget", first.name)
        assertEquals(2, first.quantity)
        assertEquals(1500, first.itemPrice)
        assertEquals(3000, first.lineTotal)
        assertEquals("https://example.com/widget", first.url)
        assertEquals("https://example.com/widget.jpg", first.imageUrl)

        val second = cart.products[1]
        assertEquals("Gadget", second.name)
        assertEquals(1, second.quantity)
        assertEquals(1999, second.itemPrice)
    }

    @Test
    fun `parseCart handles missing optional fields`() {
        val json = JSONObject("""
            {
                "total": 1000,
                "products": []
            }
        """.trimIndent())

        val cart = Snapfill.parseCart(json)

        assertEquals(1000, cart.total)
        assertNull(cart.currency)
        assertTrue(cart.products.isEmpty())
    }

    @Test
    fun `parseFillResult parses complete result`() {
        val json = JSONObject("""
            {
                "filled": 3,
                "total": 5,
                "failed": ["ccNumber", "ccCCV"]
            }
        """.trimIndent())

        val result = Snapfill.parseFillResult(json)

        assertEquals(3, result.filled)
        assertEquals(5, result.total)
        assertEquals(listOf("ccNumber", "ccCCV"), result.failed)
    }

    @Test
    fun `parseFillResult handles empty failed list`() {
        val json = JSONObject("""
            {
                "filled": 3,
                "total": 3,
                "failed": []
            }
        """.trimIndent())

        val result = Snapfill.parseFillResult(json)

        assertEquals(3, result.filled)
        assertEquals(3, result.total)
        assertTrue(result.failed.isEmpty())
    }

    @Test
    fun `parseStringMap parses mappings`() {
        val json = JSONObject("""
            {
                "firstName": "John",
                "lastName": "Doe",
                "email": "john@example.com"
            }
        """.trimIndent())

        val map = Snapfill.parseStringMap(json)

        assertEquals(3, map.size)
        assertEquals("John", map["firstName"])
        assertEquals("Doe", map["lastName"])
        assertEquals("john@example.com", map["email"])
    }

    @Test
    fun `dispatchMessage dispatches formDetected`() {
        var detectedFields: List<String>? = null
        val listener = object : SnapfillListener {
            override fun onFormDetected(fields: List<String>) {
                detectedFields = fields
            }
        }

        val msg = """{"type":"formDetected","fields":["email","firstName","lastName"]}"""
        Snapfill.dispatchMessage(msg, listener)

        assertNotNull(detectedFields)
        assertEquals(listOf("email", "firstName", "lastName"), detectedFields)
    }

    @Test
    fun `dispatchMessage dispatches cartDetected`() {
        var detectedCart: SnapfillCart? = null
        val listener = object : SnapfillListener {
            override fun onCartDetected(cart: SnapfillCart) {
                detectedCart = cart
            }
        }

        val msg = """{"type":"cartDetected","cart":{"total":2500,"currency":"USD","products":[{"name":"Item","quantity":1,"itemPrice":2500,"lineTotal":2500}]}}"""
        Snapfill.dispatchMessage(msg, listener)

        assertNotNull(detectedCart)
        assertEquals(2500, detectedCart!!.total)
        assertEquals("USD", detectedCart!!.currency)
        assertEquals(1, detectedCart!!.products.size)
    }

    @Test
    fun `dispatchMessage dispatches valuesCaptured`() {
        var capturedMappings: Map<String, String>? = null
        val listener = object : SnapfillListener {
            override fun onValuesCaptured(mappings: Map<String, String>) {
                capturedMappings = mappings
            }
        }

        val msg = """{"type":"valuesCaptured","mappings":{"email":"test@test.com"}}"""
        Snapfill.dispatchMessage(msg, listener)

        assertNotNull(capturedMappings)
        assertEquals("test@test.com", capturedMappings!!["email"])
    }

    @Test
    fun `dispatchMessage dispatches formFillComplete`() {
        var fillResult: SnapfillFillResult? = null
        val listener = object : SnapfillListener {
            override fun onFormFillComplete(result: SnapfillFillResult) {
                fillResult = result
            }
        }

        val msg = """{"type":"formFillComplete","result":{"filled":2,"total":3,"failed":["ccCCV"]}}"""
        Snapfill.dispatchMessage(msg, listener)

        assertNotNull(fillResult)
        assertEquals(2, fillResult!!.filled)
        assertEquals(3, fillResult!!.total)
        assertEquals(listOf("ccCCV"), fillResult!!.failed)
    }

    @Test
    fun `dispatchMessage ignores malformed JSON`() {
        val listener = object : SnapfillListener {
            override fun onFormDetected(fields: List<String>) {
                fail("Should not be called")
            }
        }

        // Should not throw
        Snapfill.dispatchMessage("not json", listener)
        Snapfill.dispatchMessage("{}", listener)
        Snapfill.dispatchMessage("""{"type":"unknown"}""", listener)
    }
}
