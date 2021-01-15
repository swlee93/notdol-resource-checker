const express = require('express')
const port = process.env.PORT || 3131
const screenshot = require('./screenshot')
const resources = require('./resource-checker')
const bodyParser = require('body-parser')

/**
 * @app
 */
const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.all('/*', function(request, response, next) {
	response.header('Access-Control-Allow-Origin', '*')

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
app.post('/resources', (req, res) => {
	const query = req.body
	tryCatch(
		(async () => {
			const json = await resources(query)
			res.status(200).json(json)
		})()
	)
})

function tryCatch(fetch) {
	try {
		fetch && fetch()
	} catch (error) {
		console.error(error)
	}
}

app.listen(port, () => console.log(`app listening on port ${port}!`))
