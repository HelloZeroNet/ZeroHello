class Chart extends Class
	constructor: () ->
		@query = ""
		@title = ""
		@value = ""
		@line_data = []
		@details =  []
		@colorize = "cc00ff0a"
		@chart_ctx = null
		@chart_type_name = null
		@need_update = false

	initChart: (node) =>
		@chart_canvas = node
		@chart_ctx = node.getContext("2d")

	getTitle: =>
		@title

	update: =>
		Page.cmd "chartDbQuery", @getChartQuery(), (res) =>
			@line_data = []
			for row in res
				@line_data.push(row.value)
			@line_data.reverse()
			@updateChart()

		query_type_data = """
			SELECT * FROM data
			WHERE
			 type_id IN :type_ids AND
			 date_added = (SELECT date_added FROM data ORDER BY data_id DESC LIMIT 1)
		"""
		Page.cmd "chartDbQuery", [query_type_data, {type_ids: Page.page_stats.type_id_db[type_name] for type_name in @type_names}], (res) =>
			type_data = {}
			for row in res
				type_data[Page.page_stats.type_name_db[row.type_id]] = row.value
			@details = @formatDetails?(type_data)
			@value = @formatValue?(type_data)
			Page.projector.scheduleRender()

	updateChart: =>
		@chart_ctx.clearRect(0, 0, @chart_canvas.width, @chart_canvas.height)
		stroke = @chart_ctx.createLinearGradient(0, 0, 900, 0)
		stroke.addColorStop(0, @chart_stroke[0])
		stroke.addColorStop(1, @chart_stroke[1])

		#@chart_ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'
		#@chart_ctx.shadowBlur = 3
		#@chart_ctx.shadowOffsetY = 0

		@chart_ctx.lineWidth = 4
		@chart_ctx.strokeStyle = stroke
		@chart_ctx.fillStyle = '#66666611'
		gradient = @chart_ctx.createLinearGradient(0, 200, 0, 400)
		gradient.addColorStop(0, "#42324599")
		gradient.addColorStop(1, "#2C2E3700")
		@chart_ctx.fillStyle = gradient

		@chart_ctx.beginPath()

		@chart_ctx.moveTo(-10,0)
		step = 900 / (@line_data.length - 2)
		data_max = Math.max.apply(null, @line_data)
		data_min = Math.min.apply(null, @line_data)
		for data, i in @line_data
			line_y = 250 - ((data - data_min) / (data_max - data_min)) * 120
			@chart_ctx.lineTo((i - 1) * step, line_y)
		@chart_ctx.lineTo((i + 1) * step, line_y)
		@chart_ctx.lineTo(i * step, 450)
		@chart_ctx.lineTo(0, 450)

		@chart_ctx.fill()
		@chart_ctx.stroke()
		@chart_ctx.shadowBlur = 0

	render: =>
		if @need_update
			@update()
			@need_update = false

		h("div.Chart", {style: "background-image: radial-gradient(at 29% top, #eaaeda05, #{@colorize})"}, [
			h("div.titles", [
				h("div.title", @getTitle())
				h("div.value", @value)
				h("div.details", @details.map (detail) =>
					[detail, h("br", key: detail)]
				)
			]),
			h("canvas.canvas", {afterCreate: @initChart, width: 900, height: 400})
		])

window.Chart = Chart
