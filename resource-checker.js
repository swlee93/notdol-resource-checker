const delay = (time) => new Promise((resolve, reject) => setTimeout(resolve, time))
const puppeteer = require('puppeteer')
const fs = require('fs')
module.exports = function resourceChecker(actions) {
	var testActions = {
		baseUrl: 'http://dev.whatap.io:8080',
		actions: [
			{ type: 'keyboard', target: '#id_email', input: 'sa@whatap.io' },
			{ type: 'keyboard', target: '#id_password', input: '1qaz@WSX' },
			{ type: 'click', target: '[type="submit"]' },
			{ type: 'wait', until: 'networkidle0' },
		],
	}

	return new Promise((resolve, reject) => {
		if (!actions) {
			actions = testActions
		}
		try {
			;(async (json) => {
				var { baseUrl, actions } = json

				const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
				const page = await browser.newPage()
				await page.goto(baseUrl)

				var urls = {}
				var reqCnt = 0
				var to = undefined

				function networkIdle(fn) {
					if (reqCnt <= 0) {
						if (to) clearTimeout(to)
						to = setTimeout(() => {
							if (fn) fn()
						}, 1000)
					} else {
						if (to) clearTimeout(to)
						to = undefined
					}
				}

				for (var { type, target, until, input } of actions) {
					switch (type) {
						case 'keyboard':
							await page.focus(target)
							await page.keyboard.type(input)
							break

						case 'click':
							await page.setDefaultNavigationTimeout(0)
							await page.setRequestInterception(true)
							let reformatFirstRequest = true

							page.on('request', (req) => {
								var { _url } = req
								urls[_url] = { stime: Date.now() }
								reqCnt++
								req.continue()
							})

							page.on('response', (res) => {
								var { _url, _status } = res

								if (urls[_url]) {
									urls[_url].etime = Date.now()
									urls[_url].duration = urls[_url].etime - urls[_url].stime
									urls[_url].status = _status
									reqCnt--

									networkIdle(async () => {
										await delay(1000)

										// fs.writeFileSync('urls.json', JSON.stringify(urls, undefined, 2))
										// await page.screenshot({ path: 'screenshot.png' })
										await browser.close()

										resolve(urls)
									})
								}
							})

							await page.click(target)
							break

						case 'wait':
							await page.waitForNavigation({ waitUntil: until })
							break
					}
				}
			})(actions)
		} catch (error) {
			reject(error)
		}
	})
}
