import Foundation
import WebKit

/// Convenience WKWebView subclass with built-in Snapfill support.
///
/// Usage:
/// ```swift
/// let webView = SnapfillWebView()
/// webView.snapfillDelegate = self
/// webView.load(URLRequest(url: URL(string: "https://example.com/checkout")!))
/// ```
public class SnapfillWebView: WKWebView {

    private lazy var snapfill: Snapfill = {
        let s = Snapfill(webView: self, options: snapfillOptions)
        return s
    }()

    public weak var snapfillDelegate: SnapfillDelegate? {
        get { snapfill.delegate }
        set { snapfill.delegate = newValue }
    }

    public var snapfillOptions: SnapfillOptions = SnapfillOptions()

    public override init(frame: CGRect = .zero, configuration: WKWebViewConfiguration = WKWebViewConfiguration()) {
        super.init(frame: frame, configuration: configuration)
        snapfill.attach()
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    public func fillForm(_ mappings: [String: String]) {
        snapfill.fillForm(mappings)
    }

    public func reinject() {
        snapfill.reinject()
    }
}
