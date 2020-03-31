const delay = (time) => new Promise((resolve, reject) => setTimeout(resolve, time))
const puppeteer = require('puppeteer')
const fs = require('fs')
module.exports = function resourceChecker(query) {
	let testActions = {
		baseUrl: 'http://dev.whatap.io:8080',
		actions: [
			{ type: 'keyboard', target: '#id_email', input: 'sa@whatap.io' },
			{ type: 'keyboard', target: '#id_password', input: '1qaz@WSX' },
			{ type: 'click', target: '[type="submit"]' },
			// { type: 'wait', until: 'networkidle0' },
		],
	}

	return new Promise((resolve, reject) => {
		try {
			;(async () => {
				if (!query || (query && !query.baseUrl)) {
					query = testActions
				}

				let { baseUrl, actions } = query

				const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
				const page = await browser.newPage()

				await page.goto(baseUrl)

				let metrics = {}
				let urls = {}
				let reqCnt = 0
				let to = undefined

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

				for (let { type, target, until, input } of actions) {
					switch (type) {
						case 'keyboard':
							await page.focus(target)
							await page.keyboard.type(input)
							break

						case 'click':
							await page.setDefaultNavigationTimeout(0)
							await page.setRequestInterception(true)
							let reformatFirstRequest = true
							await page.metrics().then((mtrx) => {
								metrics = mtrx
							})
							page.on('request', (req) => {
								let { _url, _resourceType } = req
								// document, stylesheet, image, media, font, script, texttrack, xhr, fetch, eventsource, websocket, manifest, other
								urls[_url] = { stime: Date.now(), resourceType: _resourceType }
								reqCnt++
								req.continue()
							})

							page.on('response', (res) => {
								let { _url, _status, _contentType } = res
								let contentLength = res.headers()['content-length']

								if (urls[_url]) {
									urls[_url].etime = Date.now()
									urls[_url].duration = urls[_url].etime - urls[_url].stime
									urls[_url].status = _status
									urls[_url].contentType = _contentType
									urls[_url].contentLength = contentLength

									reqCnt--

									networkIdle(async () => {
										await delay(1000)

										// fs.writeFileSync('urls.json', JSON.stringify(urls, undefined, 2))
										// await page.screenshot({ path: 'screenshot.png' })
										await browser.close()

										resolve({ metrics, urls })
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
			})()
		} catch (error) {
			reject('failed')
		}
	})
}
