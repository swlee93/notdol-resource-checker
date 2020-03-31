const express = require('express')
const port = process.env.PORT || 3131
const screenshot = require('./screenshot')
const resources = require('./resource-checker')
const bodyParser = require('body-parser')
const cors = require('cors')

const whitelist = [
	'http://service.whatap.io',
	'https://service.whatap.io',
	'http://dev.whatap.io',
	'https://dev.whatap.io',
	'http://beta.whatap.io',
	'https://beta.whatap.io',
	'http://canary.whatap.io',
	'https://canary.whatap.io',
	'http://127.0.0.1',
]
const corsOptions = {
	origin: function(origin, callback) {
		if (origin && whitelist.find((wl) => origin.includes(wl))) {
			callback(null, true)
		} else {
			callback(new Error('Not allowed by CORS'))
		}
	},
}
/**
 * @app
 */
const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.all('/*', cors(corsOptions), function(request, response, next) {
	response.setHeader('Access-Control-Allow-Methods', 'POST, GET')
	response.setHeader('Access-Control-Max-Age', '3600')
	response.setHeader('Access-Control-Allow-Headers', 'Origin, Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-Auth-Token')

	next()
})

/**
 * @get
 */
app.get('/', (req, res) => res.status(200).json({ status: 'ok' }))
app.get('/screenshot', (req, res) => {
	const url = req.query.url
	;(async () => {
		const buffer = await screenshot(url)
		res.setHeader('Content-Disposition', 'attachment; filename="screenshot.png"')
		res.setHeader('Content-Type', 'image/png')
		res.send(buffer)
	})()
})

app.get('/resources', (req, res) => {
	const query = req.query
	;(async () => {
		const json = await resources(query)
		res.status(200).json(json)
	})()
})

/**
 * @post
 */
app.post('/resources', async (req, res) => {
	const query = req.body
	;(async () => {
		const json = await resources(query)
		res.status(200).json(json)
	})()
})

app.listen(port, () => console.log(`app listening on port ${port}!`))
