import Foundation
import WebKit

/// Snapfill helper — attach to any WKWebView to enable form detection,
/// cart detection, value capture, and form filling.
///
/// Usage:
/// ```swift
/// let snapfill = Snapfill(webView: webView)
/// snapfill.delegate = self
/// snapfill.attach()
/// ```
public class Snapfill: NSObject, WKScriptMessageHandler {

    public weak var delegate: SnapfillDelegate?

    private weak var webView: WKWebView?
    private let options: SnapfillOptions
    private var attached = false

    private static let messageHandlerName = "snapfill"

    private static let bridgeShim = """
    window.ReactNativeWebView={postMessage:function(m){webkit.messageHandlers.snapfill.postMessage(m);}};
    """

    private lazy var detectionScript: String = {
        Self.loadResource("snapfill", ext: "js") ?? ""
    }()

    private lazy var fillTemplate: String = {
        Self.loadResource("snapfill-fill", ext: "js") ?? ""
    }()

    public init(webView: WKWebView, options: SnapfillOptions = SnapfillOptions()) {
        self.webView = webView
        self.options = options
        super.init()
    }

    /// Attaches Snapfill to the WKWebView. Adds user scripts and a message handler.
    public func attach() {
        guard let webView = webView, !attached else { return }
        attached = true

        let controller = webView.configuration.userContentController

        // Bridge shim — inject at document start so it's available before any scripts run
        let bridgeUserScript = WKUserScript(
            source: Self.bridgeShim,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        controller.addUserScript(bridgeUserScript)

        // Detection scripts — inject at document end
        if options.detectForms || options.captureValues {
            let detectUserScript = WKUserScript(
                source: detectionScript,
                injectionTime: .atDocumentEnd,
                forMainFrameOnly: true
            )
            controller.addUserScript(detectUserScript)
        }

        // Message handler
        controller.add(self, name: Self.messageHandlerName)
    }

    /// Fills form fields in the current page using the provided field-to-value mappings.
    public func fillForm(_ mappings: [String: String]) {
        guard let webView = webView else { return }
        guard let jsonData = try? JSONSerialization.data(withJSONObject: mappings),
              let json = String(data: jsonData, encoding: .utf8) else { return }
        let script = fillTemplate.replacingOccurrences(of: "__SNAPFILL_MAPPINGS__", with: json)
        webView.evaluateJavaScript(script, completionHandler: nil)
    }

    /// Re-injects detection scripts into the current page.
    /// Useful after single-page navigation that doesn't trigger a full page load.
    public func reinject() {
        guard let webView = webView else { return }
        webView.evaluateJavaScript(Self.bridgeShim, completionHandler: nil)
        if options.detectForms || options.captureValues {
            webView.evaluateJavaScript(detectionScript, completionHandler: nil)
        }
    }

    /// Detaches Snapfill from the WKWebView, removing scripts and the message handler.
    public func detach() {
        guard let webView = webView, attached else { return }
        attached = false

        let controller = webView.configuration.userContentController
        controller.removeAllUserScripts()
        controller.removeScriptMessageHandler(forName: Self.messageHandlerName)
    }

    // MARK: - WKScriptMessageHandler

    public func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard message.name == Self.messageHandlerName else { return }
        guard let body = message.body as? String else { return }

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            Self.dispatchMessage(body, snapfill: self, delegate: self.delegate)
        }
    }

    // MARK: - Message parsing (internal for testing)

    static func dispatchMessage(_ msg: String, snapfill: Snapfill, delegate: SnapfillDelegate?) {
        guard let delegate = delegate else { return }
        guard let data = msg.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String else { return }

        switch type {
        case "formDetected":
            if let fields = json["fields"] as? [String] {
                delegate.snapfillDidDetectFields(snapfill, fields: fields)
            }
        case "cartDetected":
            if let cartDict = json["cart"] as? [String: Any],
               let cart = parseCart(cartDict) {
                delegate.snapfillDidDetectCart(snapfill, cart: cart)
            }
        case "valuesCaptured":
            if let mappings = json["mappings"] as? [String: String] {
                delegate.snapfillDidCaptureValues(snapfill, mappings: mappings)
            }
        case "formFillComplete":
            if let resultDict = json["result"] as? [String: Any],
               let result = parseFillResult(resultDict) {
                delegate.snapfillDidCompleteFill(snapfill, result: result)
            }
        default:
            break
        }
    }

    static func parseCart(_ dict: [String: Any]) -> SnapfillCart? {
        let total = dict["total"] as? Int ?? 0
        let currency = dict["currency"] as? String
        var products: [SnapfillCartProduct] = []

        if let productDicts = dict["products"] as? [[String: Any]] {
            for p in productDicts {
                products.append(SnapfillCartProduct(
                    name: p["name"] as? String,
                    quantity: p["quantity"] as? Int ?? 1,
                    itemPrice: p["itemPrice"] as? Int ?? 0,
                    lineTotal: p["lineTotal"] as? Int ?? 0,
                    url: p["url"] as? String,
                    imageUrl: p["imageUrl"] as? String
                ))
            }
        }

        return SnapfillCart(total: total, currency: currency, products: products)
    }

    static func parseFillResult(_ dict: [String: Any]) -> SnapfillFillResult? {
        let filled = dict["filled"] as? Int ?? 0
        let total = dict["total"] as? Int ?? 0
        let failed = dict["failed"] as? [String] ?? []
        return SnapfillFillResult(filled: filled, total: total, failed: failed)
    }

    static func loadResource(_ name: String, ext: String) -> String? {
        guard let url = Bundle.module.url(forResource: name, withExtension: ext) else { return nil }
        return try? String(contentsOf: url, encoding: .utf8)
    }
}
