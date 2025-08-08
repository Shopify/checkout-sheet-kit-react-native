/*
MIT License

Copyright 2023 - Present, Shopify Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import UIKit

// MARK: - UIColor Extensions

extension UIColor {
	convenience init(hex: String) {
		let hexString: String = hex.trimmingCharacters(in: CharacterSet.whitespacesAndNewlines)
		let start = hexString.index(hexString.startIndex, offsetBy: hexString.hasPrefix("#") ? 1 : 0)
		let hexColor = String(hexString[start...])

		let scanner = Scanner(string: hexColor)
		var hexNumber: UInt64 = 0

		if scanner.scanHexInt64(&hexNumber) {
			let red = (hexNumber & 0xff0000) >> 16
			let green = (hexNumber & 0x00ff00) >> 8
			let blue = hexNumber & 0x0000ff

			self.init(
				red: CGFloat(red) / 0xff,
				green: CGFloat(green) / 0xff,
				blue: CGFloat(blue) / 0xff,
				alpha: 1
			)
		} else {
			self.init(red: 0, green: 0, blue: 0, alpha: 1)
		}
	}
}
