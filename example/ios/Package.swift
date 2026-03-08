// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "SnapfillExample",
    platforms: [
        .iOS(.v15)
    ],
    dependencies: [
        .package(path: "../../packages/ios"),
    ],
    targets: [
        .executableTarget(
            name: "SnapfillExample",
            dependencies: [
                .product(name: "Snapfill", package: "ios"),
            ],
            resources: [
                .process("Resources")
            ]
        ),
    ]
)
