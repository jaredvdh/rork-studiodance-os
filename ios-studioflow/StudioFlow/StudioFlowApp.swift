//
//  StudioFlowApp.swift
//  StudioFlow
//

import SwiftUI

@main
struct StudioFlowApp: App {
    @State private var store = AppStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(store)
                .tint(store.accentColor)
                .preferredColorScheme(.light)
        }
    }
}
