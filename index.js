const express = require('express')
const app = express()
const port = process.env.PORT || 3131
const screenshot = require('./screenshot')
const resources = require('./resource-checker')
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
	const url = req.query.url
	;(async () => {
		const json = await resources(url)
		res.status(200).json(json)
	})()
})

app.listen(port, () => console.log(`app listening on port ${port}!`))
