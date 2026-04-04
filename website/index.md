---
layout: home

hero:
  name: SnapFill
  text: WebView Autofill Engine
  tagline: Detect, classify, and fill form fields inside WebViews. Extract shopping cart data. Works across Web, React Native, Android, and iOS.
  image:
    src: /logo-icon.svg
    alt: SnapFill
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Live Demo
      link: /demo
    - theme: alt
      text: GitHub
      link: https://github.com/wangdicoder/snapfill

features:
  - icon: 🔍
    title: Smart Field Detection
    details: Four-signal classification — autocomplete attributes, regex heuristics, type attributes, and label text — with a two-pass scan that prioritizes high-confidence matches.
  - icon: ⚡
    title: Framework-Aware Filling
    details: Uses native property setters to bypass React, Vue, and Angular interceptors. Dispatches events in the correct order so framework state stays in sync.
  - icon: 🛒
    title: Cart Extraction
    details: Extracts shopping cart data from JSON-LD, Microdata, Open Graph, and DOM heuristics. Returns structured product info, totals, and currency.
  - icon: 📱
    title: Cross-Platform
    details: One core engine, four platform adapters. Works in any WebView — React Native, Android WebView, WKWebView, or a plain iframe.
  - icon: 🎯
    title: Billing Context Awareness
    details: Automatically distinguishes shipping and billing address fields by walking the DOM tree and inspecting parent containers.
  - icon: 🔒
    title: Privacy-Conscious
    details: Sensitive fields like passwords and SSNs are excluded from value capture. No data leaves the device — everything runs locally inside the WebView.
---
