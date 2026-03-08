import XCTest
@testable import Snapfill

final class SnapfillMessageParserTests: XCTestCase {

    func testParseCartComplete() {
        let dict: [String: Any] = [
            "total": 4999,
            "currency": "USD",
            "products": [
                [
                    "name": "Widget",
                    "quantity": 2,
                    "itemPrice": 1500,
                    "lineTotal": 3000,
                    "url": "https://example.com/widget",
                    "imageUrl": "https://example.com/widget.jpg"
                ],
                [
                    "name": "Gadget",
                    "quantity": 1,
                    "itemPrice": 1999,
                    "lineTotal": 1999
                ]
            ]
        ]

        let cart = Snapfill.parseCart(dict)
        XCTAssertNotNil(cart)
        XCTAssertEqual(cart?.total, 4999)
        XCTAssertEqual(cart?.currency, "USD")
        XCTAssertEqual(cart?.products.count, 2)

        let first = cart!.products[0]
        XCTAssertEqual(first.name, "Widget")
        XCTAssertEqual(first.quantity, 2)
        XCTAssertEqual(first.itemPrice, 1500)
        XCTAssertEqual(first.lineTotal, 3000)
        XCTAssertEqual(first.url, "https://example.com/widget")
        XCTAssertEqual(first.imageUrl, "https://example.com/widget.jpg")

        let second = cart!.products[1]
        XCTAssertEqual(second.name, "Gadget")
        XCTAssertEqual(second.quantity, 1)
        XCTAssertNil(second.url)
        XCTAssertNil(second.imageUrl)
    }

    func testParseCartMissingOptionalFields() {
        let dict: [String: Any] = [
            "total": 1000,
            "products": [] as [[String: Any]]
        ]

        let cart = Snapfill.parseCart(dict)
        XCTAssertNotNil(cart)
        XCTAssertEqual(cart?.total, 1000)
        XCTAssertNil(cart?.currency)
        XCTAssertEqual(cart?.products.count, 0)
    }

    func testParseFillResultComplete() {
        let dict: [String: Any] = [
            "filled": 3,
            "total": 5,
            "failed": ["ccNumber", "ccCCV"]
        ]

        let result = Snapfill.parseFillResult(dict)
        XCTAssertNotNil(result)
        XCTAssertEqual(result?.filled, 3)
        XCTAssertEqual(result?.total, 5)
        XCTAssertEqual(result?.failed, ["ccNumber", "ccCCV"])
    }

    func testParseFillResultEmptyFailed() {
        let dict: [String: Any] = [
            "filled": 3,
            "total": 3,
            "failed": [] as [String]
        ]

        let result = Snapfill.parseFillResult(dict)
        XCTAssertNotNil(result)
        XCTAssertEqual(result?.filled, 3)
        XCTAssertEqual(result?.total, 3)
        XCTAssertTrue(result?.failed.isEmpty ?? false)
    }

    // MARK: - Dispatch tests using a mock delegate

    private class MockDelegate: SnapfillDelegate {
        var detectedFields: [String]?
        var detectedCart: SnapfillCart?
        var capturedMappings: [String: String]?
        var fillResult: SnapfillFillResult?

        func snapfillDidDetectFields(_ snapfill: Snapfill, fields: [String]) {
            detectedFields = fields
        }

        func snapfillDidDetectCart(_ snapfill: Snapfill, cart: SnapfillCart) {
            detectedCart = cart
        }

        func snapfillDidCaptureValues(_ snapfill: Snapfill, mappings: [String: String]) {
            capturedMappings = mappings
        }

        func snapfillDidCompleteFill(_ snapfill: Snapfill, result: SnapfillFillResult) {
            fillResult = result
        }
    }

    private func makeSnapfillForTesting() -> Snapfill {
        // We create a Snapfill with a dummy WKWebView just for dispatch testing
        // The webView is not used in dispatchMessage
        let config = WKWebViewConfiguration()
        let webView = WKWebView(frame: .zero, configuration: config)
        return Snapfill(webView: webView)
    }

    func testDispatchFormDetected() {
        let mock = MockDelegate()
        let snapfill = makeSnapfillForTesting()

        let msg = #"{"type":"formDetected","fields":["email","firstName","lastName"]}"#
        Snapfill.dispatchMessage(msg, snapfill: snapfill, delegate: mock)

        XCTAssertEqual(mock.detectedFields, ["email", "firstName", "lastName"])
    }

    func testDispatchCartDetected() {
        let mock = MockDelegate()
        let snapfill = makeSnapfillForTesting()

        let msg = #"{"type":"cartDetected","cart":{"total":2500,"currency":"USD","products":[{"name":"Item","quantity":1,"itemPrice":2500,"lineTotal":2500}]}}"#
        Snapfill.dispatchMessage(msg, snapfill: snapfill, delegate: mock)

        XCTAssertNotNil(mock.detectedCart)
        XCTAssertEqual(mock.detectedCart?.total, 2500)
        XCTAssertEqual(mock.detectedCart?.currency, "USD")
        XCTAssertEqual(mock.detectedCart?.products.count, 1)
    }

    func testDispatchValuesCaptured() {
        let mock = MockDelegate()
        let snapfill = makeSnapfillForTesting()

        let msg = #"{"type":"valuesCaptured","mappings":{"email":"test@test.com"}}"#
        Snapfill.dispatchMessage(msg, snapfill: snapfill, delegate: mock)

        XCTAssertEqual(mock.capturedMappings?["email"], "test@test.com")
    }

    func testDispatchFormFillComplete() {
        let mock = MockDelegate()
        let snapfill = makeSnapfillForTesting()

        let msg = #"{"type":"formFillComplete","result":{"filled":2,"total":3,"failed":["ccCCV"]}}"#
        Snapfill.dispatchMessage(msg, snapfill: snapfill, delegate: mock)

        XCTAssertNotNil(mock.fillResult)
        XCTAssertEqual(mock.fillResult?.filled, 2)
        XCTAssertEqual(mock.fillResult?.total, 3)
        XCTAssertEqual(mock.fillResult?.failed, ["ccCCV"])
    }

    func testDispatchIgnoresMalformedJSON() {
        let mock = MockDelegate()
        let snapfill = makeSnapfillForTesting()

        // None of these should crash or trigger delegate calls
        Snapfill.dispatchMessage("not json", snapfill: snapfill, delegate: mock)
        Snapfill.dispatchMessage("{}", snapfill: snapfill, delegate: mock)
        Snapfill.dispatchMessage(#"{"type":"unknown"}"#, snapfill: snapfill, delegate: mock)

        XCTAssertNil(mock.detectedFields)
        XCTAssertNil(mock.detectedCart)
        XCTAssertNil(mock.capturedMappings)
        XCTAssertNil(mock.fillResult)
    }
}
