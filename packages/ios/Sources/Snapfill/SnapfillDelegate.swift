import Foundation

/// Delegate protocol for receiving Snapfill events.
/// All methods are optional via default implementations.
public protocol SnapfillDelegate: AnyObject {
    func snapfillDidDetectFields(_ snapfill: Snapfill, fields: [String])
    func snapfillDidDetectCart(_ snapfill: Snapfill, cart: SnapfillCart)
    func snapfillDidCaptureValues(_ snapfill: Snapfill, mappings: [String: String])
    func snapfillDidCompleteFill(_ snapfill: Snapfill, result: SnapfillFillResult)
}

public extension SnapfillDelegate {
    func snapfillDidDetectFields(_ snapfill: Snapfill, fields: [String]) {}
    func snapfillDidDetectCart(_ snapfill: Snapfill, cart: SnapfillCart) {}
    func snapfillDidCaptureValues(_ snapfill: Snapfill, mappings: [String: String]) {}
    func snapfillDidCompleteFill(_ snapfill: Snapfill, result: SnapfillFillResult) {}
}
