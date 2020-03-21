const puppeteer = require('puppeteer')

module.exports = function(url) {
	return new Promise((resolve, reject) => {
		console.info('executablePath: ', puppeteer.executablePath())
		;(async () => {
			const browser = await puppeteer.launch({
				// headless: true, // debug only
				args: ['--no-sandbox'],
				executablePath: puppeteer.executablePath(),
			})

			const page = await browser.newPage()

			await page.goto(url, {
				waitUntil: ['load', 'networkidle0', 'domcontentloaded'],
			})

			await page.waitFor(1000)

			await page.emulateMedia('screen')

			const buffer = await page.screenshot({
				fullPage: true,
				type: 'png',
			})

			await browser.close()

			resolve(buffer)
		})()
	})
}
