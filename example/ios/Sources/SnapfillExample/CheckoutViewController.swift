import UIKit
import WebKit
import Snapfill

class CheckoutViewController: UIViewController, SnapfillDelegate {

    private var webView: WKWebView!
    private var snapfill: Snapfill!
    private var logTextView: UITextView!

    private let sampleAddress: [String: String] = [
        "firstName": "Jane",
        "lastName": "Doe",
        "email": "jane.doe@example.com",
        "phoneNumber": "+1 555-867-5309",
        "postalAddressLine1": "350 Fifth Avenue",
        "postalAddressLine2": "Suite 3400",
        "postalSuburb": "New York",
        "postalState": "NY",
        "postalPostCode": "10118",
        "postalCountry": "US",
    ]

    private let sampleCard: [String: String] = [
        "ccNumber": "4111111111111111",
        "ccName": "JANE DOE",
        "ccExpiryMonth": "06",
        "ccExpiryYear": "2028",
        "ccCCV": "737",
    ]

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white
        setupUI()
        setupSnapfill()
        loadCheckoutPage()
    }

    // MARK: - UI Setup

    private func setupUI() {
        // WebView
        let config = WKWebViewConfiguration()
        webView = WKWebView(frame: .zero, configuration: config)
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)

        // Bottom panel
        let panel = UIView()
        panel.backgroundColor = UIColor(red: 0.11, green: 0.11, blue: 0.12, alpha: 1)
        panel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(panel)

        // Title
        let title = UILabel()
        title.text = "Snapfill Example"
        title.textColor = .white
        title.font = .boldSystemFont(ofSize: 14)
        title.translatesAutoresizingMaskIntoConstraints = false
        panel.addSubview(title)

        // Buttons
        let buttonStack = UIStackView()
        buttonStack.axis = .horizontal
        buttonStack.spacing = 8
        buttonStack.distribution = .fillEqually
        buttonStack.translatesAutoresizingMaskIntoConstraints = false
        panel.addSubview(buttonStack)

        let fillAddressBtn = makeButton(title: "Fill Address", color: .systemGreen)
        fillAddressBtn.addTarget(self, action: #selector(fillAddress), for: .touchUpInside)
        buttonStack.addArrangedSubview(fillAddressBtn)

        let fillCardBtn = makeButton(title: "Fill Card", color: .systemBlue)
        fillCardBtn.addTarget(self, action: #selector(fillCard), for: .touchUpInside)
        buttonStack.addArrangedSubview(fillCardBtn)

        let fillAllBtn = makeButton(title: "Fill All", color: .systemPurple)
        fillAllBtn.addTarget(self, action: #selector(fillAll), for: .touchUpInside)
        buttonStack.addArrangedSubview(fillAllBtn)

        // Log view
        logTextView = UITextView()
        logTextView.isEditable = false
        logTextView.backgroundColor = .clear
        logTextView.textColor = UIColor(red: 0.68, green: 0.68, blue: 0.7, alpha: 1)
        logTextView.font = .monospacedSystemFont(ofSize: 11, weight: .regular)
        logTextView.text = "Waiting for events..."
        logTextView.translatesAutoresizingMaskIntoConstraints = false
        panel.addSubview(logTextView)

        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),

            panel.topAnchor.constraint(equalTo: webView.bottomAnchor),
            panel.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            panel.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            panel.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            panel.heightAnchor.constraint(equalToConstant: 220),

            title.topAnchor.constraint(equalTo: panel.topAnchor, constant: 12),
            title.leadingAnchor.constraint(equalTo: panel.leadingAnchor, constant: 12),

            buttonStack.topAnchor.constraint(equalTo: title.bottomAnchor, constant: 8),
            buttonStack.leadingAnchor.constraint(equalTo: panel.leadingAnchor, constant: 12),
            buttonStack.trailingAnchor.constraint(equalTo: panel.trailingAnchor, constant: -12),
            buttonStack.heightAnchor.constraint(equalToConstant: 36),

            logTextView.topAnchor.constraint(equalTo: buttonStack.bottomAnchor, constant: 8),
            logTextView.leadingAnchor.constraint(equalTo: panel.leadingAnchor, constant: 12),
            logTextView.trailingAnchor.constraint(equalTo: panel.trailingAnchor, constant: -12),
            logTextView.bottomAnchor.constraint(equalTo: panel.bottomAnchor, constant: -8),
        ])
    }

    private func makeButton(title: String, color: UIColor) -> UIButton {
        let btn = UIButton(type: .system)
        btn.setTitle(title, for: .normal)
        btn.setTitleColor(.white, for: .normal)
        btn.titleLabel?.font = .systemFont(ofSize: 12, weight: .semibold)
        btn.backgroundColor = color
        btn.layer.cornerRadius = 6
        return btn
    }

    // MARK: - Snapfill Setup

    private func setupSnapfill() {
        snapfill = Snapfill(webView: webView)
        snapfill.delegate = self
        snapfill.attach()
    }

    private func loadCheckoutPage() {
        guard let url = Bundle.module.url(forResource: "checkout", withExtension: "html") else {
            log("error", "checkout.html not found in bundle")
            return
        }
        webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
    }

    // MARK: - Actions

    @objc private func fillAddress() {
        snapfill.fillForm(sampleAddress)
    }

    @objc private func fillCard() {
        snapfill.fillForm(sampleCard)
    }

    @objc private func fillAll() {
        snapfill.fillForm(sampleAddress.merging(sampleCard) { _, new in new })
    }

    // MARK: - SnapfillDelegate

    func snapfillDidDetectFields(_ snapfill: Snapfill, fields: [String]) {
        log("formDetected", "\(fields.count) fields: \(fields.joined(separator: ", "))")
    }

    func snapfillDidDetectCart(_ snapfill: Snapfill, cart: SnapfillCart) {
        let total = String(format: "%.2f", Double(cart.total) / 100.0)
        log("cartDetected", "$\(total) \(cart.currency ?? "") — \(cart.products.count) item(s)")
    }

    func snapfillDidCaptureValues(_ snapfill: Snapfill, mappings: [String: String]) {
        log("valuesCaptured", "\(mappings.count) values captured")
    }

    func snapfillDidCompleteFill(_ snapfill: Snapfill, result: SnapfillFillResult) {
        log("formFillComplete", "\(result.filled)/\(result.total) filled")
    }

    // MARK: - Logging

    private func log(_ type: String, _ message: String) {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        let time = formatter.string(from: Date())
        let line = "[\(time)] \(type): \(message)\n"
        logTextView.text = line + (logTextView.text ?? "")
    }
}
