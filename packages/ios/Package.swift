// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "Snapfill",
    platforms: [
        .iOS(.v15)
    ],
    products: [
        .library(
            name: "Snapfill",
            targets: ["Snapfill"]
        ),
    ],
    targets: [
        .target(
            name: "Snapfill",
            resources: [
                .process("Resources")
            ]
        ),
        .testTarget(
            name: "SnapfillTests",
            dependencies: ["Snapfill"]
        ),
    ]
)
