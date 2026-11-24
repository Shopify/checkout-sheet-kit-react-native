import XCTest

final class ConsumerUITests: XCTestCase {
    func test_packedTurboModulePreservesV3PromisesAndConfiguration() {
        let app = XCUIApplication()
        app.launch()
        defer { app.terminate() }
        XCTAssertTrue(app.staticTexts["native-module-ready"].waitForExistence(timeout: 30), app.debugDescription)
        XCTAssertEqual(app.staticTexts["native-module-ready"].label, "SwiftPM configuration applied")
    }

    func test_packedNativeViewSendsEventsAndSurvivesConfigurationUpdates() {
        let app = XCUIApplication()
        app.launch()
        defer { app.terminate() }
        XCTAssertTrue(app.staticTexts["native-view-ready"].waitForExistence(timeout: 30), app.debugDescription)
        XCTAssertTrue(app.otherElements["accelerated-checkout-buttons"].exists)
        app.buttons["update-configuration"].tap()
        XCTAssertTrue(app.staticTexts["configuration-updated"].waitForExistence(timeout: 30), app.debugDescription)
        XCTAssertTrue(app.otherElements["accelerated-checkout-buttons"].exists)
    }
}
