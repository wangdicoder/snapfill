pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolution {
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "SnapfillExample"

include(":app")
include(":snapfill")
project(":snapfill").projectDir = file("../../packages/android")
