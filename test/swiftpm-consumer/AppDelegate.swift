import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import UIKit

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    private var reactNativeDelegate: ReactNativeDelegate?
    fileprivate var reactNativeFactory: RCTReactNativeFactory?
    fileprivate var launchOptions: [UIApplication.LaunchOptionsKey: Any]?

    func application(
        _: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        let delegate = ReactNativeDelegate()
        let factory = RCTReactNativeFactory(delegate: delegate)
        delegate.dependencyProvider = RCTAppDependencyProvider()
        reactNativeDelegate = delegate
        reactNativeFactory = factory
        self.launchOptions = launchOptions
        return true
    }
}

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(
        _ scene: UIScene,
        willConnectTo _: UISceneSession,
        options _: UIScene.ConnectionOptions
    ) {
        guard let windowScene = scene as? UIWindowScene,
              let appDelegate = UIApplication.shared.delegate as? AppDelegate,
              let factory = appDelegate.reactNativeFactory else { return }
        window = UIWindow(windowScene: windowScene)
        factory.startReactNative(
            withModuleName: "CheckoutSheetKitSwiftPMConsumer",
            in: window,
            launchOptions: appDelegate.launchOptions
        )
    }
}

final class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
    override func sourceURL(for _: RCTBridge) -> URL? {
        bundleURL()
    }

    override func bundleURL() -> URL? {
        Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    }
}
