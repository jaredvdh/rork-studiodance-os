//
//  StudioFlowApp.swift
//  StudioFlow
//

import SwiftUI

@main
struct StudioFlowApp: App {
    /// Deferred init prevents the @Observable class from being re-created
    /// on every body recomposition — a known iOS 18 edge case that can
    /// cause launch hangs when @State wraps an @Observable reference type.
    @State private var store: AppStore?

    var body: some Scene {
        WindowGroup {
            if let store {
                ContentView()
                    .environment(store)
                    .tint(store.accentColor)
                    .preferredColorScheme(.light)
            } else {
                // Minimal placeholder shown for one frame while store
                // initialises; prevents the system launch screen from
                // appearing to hang.
                Color(.systemBackground)
                    .ignoresSafeArea()
                    .task {
                        store = AppStore()
                    }
            }
        }
    }
}
