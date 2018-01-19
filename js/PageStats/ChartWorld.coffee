class ChartWorld extends Class
	constructor: ->
		@points = []
		@need_update = false

	update: =>
		###
		@points = [
			{lat: 0, lon: 0},
			{lat: 30, lon: 30},
			{lat: 33.137551, lon: 129.902344},
			{lat: 0.351560, lon: 115.136719},
			{lat: 40.178873, lon: -8.261719},
			{lat: 52.482780, lon: -0.878906},
			{lat: 47.040182, lon: 19.511719},
			{lat: 38.548165, lon: -76.113281},
			{lat: 40.446947, lon: -122.871094}
			{lat: -16.972741, lon: 46.582031}
			{lat: -35.173808, lon: 19.511719}
			{lat: -33.431441, lon: 116.542969}
			{lat: -45.336702, lon: 168.222656}
			{lat: -54.977614, lon: -67.412109}
			{lat: 8.928487, lon: -62.314453}
			{lat: 65.20515, lon: -14.670696}
			{lat: 64.90863, lon: -21.70194625}
		]
		return false
		###

		Page.cmd "chartGetPeerLocations", [], (res) =>
			@points = res

			# Calculate country stat
			country_db = {}
			items = Page.page_stats.country_list.items
			items.length = 0
			for point in @points
				country_db[point.country] ?= 0
				country_db[point.country] += 1

			for country, num of country_db
				items.push({title: country, value: num})

			items.sort (a, b) =>
				return b.value - a.value

			if items.length > 15
				num_others = 0
				(num_others += item.value for item in items[14..])
				items.length = 14
				items.push({title: "Other", value: num_others, type: "other"})

			@drawPoints()
			Page.projector.scheduleRender()

	drawPoints: =>
		@ctx.clearRect(0, 0, @canvas.width, @canvas.height)
		for point in @points
			left = (47 + (point.lon / 3.65)) * @canvas.width / 100
			top = (59 - (point.lat / 1.52)) * @canvas.height / 100
			@ctx.fillRect(left, top, 2, 2)

	initCanvas: (node) =>
		@canvas = node
		@ctx = node.getContext("2d")
		@ctx.globalCompositeOperation = 'screen'
		@ctx.fillStyle = '#30758e';
		@drawPoints()

	render: =>
		if @need_update
			@update()
			@need_update = false

		h("div.ChartWorld", [
			h("canvas.map-points", {width: 878, height: 371, afterCreate: @initCanvas})
			h("img.map", {src: "img/world.png"})
		])

window.ChartWorld = ChartWorld