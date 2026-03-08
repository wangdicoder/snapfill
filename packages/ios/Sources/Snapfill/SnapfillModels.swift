import Foundation

public struct SnapfillCart: Codable, Sendable {
    public let total: Int
    public let currency: String?
    public let products: [SnapfillCartProduct]

    public init(total: Int, currency: String?, products: [SnapfillCartProduct]) {
        self.total = total
        self.currency = currency
        self.products = products
    }
}

public struct SnapfillCartProduct: Codable, Sendable {
    public let name: String?
    public let quantity: Int
    public let itemPrice: Int
    public let lineTotal: Int
    public let url: String?
    public let imageUrl: String?

    public init(
        name: String?,
        quantity: Int,
        itemPrice: Int,
        lineTotal: Int,
        url: String?,
        imageUrl: String?
    ) {
        self.name = name
        self.quantity = quantity
        self.itemPrice = itemPrice
        self.lineTotal = lineTotal
        self.url = url
        self.imageUrl = imageUrl
    }
}

public struct SnapfillFillResult: Codable, Sendable {
    public let filled: Int
    public let total: Int
    public let failed: [String]

    public init(filled: Int, total: Int, failed: [String]) {
        self.filled = filled
        self.total = total
        self.failed = failed
    }
}

public struct SnapfillOptions: Sendable {
    public var detectForms: Bool
    public var detectCart: Bool
    public var captureValues: Bool

    public init(
        detectForms: Bool = true,
        detectCart: Bool = true,
        captureValues: Bool = true
    ) {
        self.detectForms = detectForms
        self.detectCart = detectCart
        self.captureValues = captureValues
    }
}
