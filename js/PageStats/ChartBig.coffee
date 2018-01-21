class ChartBig extends Class
	constructor: () ->
		@need_update = false
		@data = {}
		@data_max = {}
		@data_total = {}
		types = {}

	update: (cb) =>
		if Page.params.interval == "1w"
			interval = 60 * 60 * 24 * 7
			step = 60 * 60
			query_select = "MAX(date_added) AS date_added, type_id, SUM(value) AS value"
			query_group = "GROUP BY type_id, strftime('%Y-%m-%d %H', date_added, 'unixepoch', 'localtime')"
		else
			interval = 60 * 60 * 24
			step = 60 * 5
			query_select = "*"
			query_group = ""

		if Page.params.date_added_to
			date_added_to = (new Date(Page.params.date_added_to + " 23:59")).getTime() / 1000
			date_added_from = date_added_to - interval
		else
			date_added_to = Time.timestamp()
			date_added_from = Time.timestamp() - interval

		query = """
			SELECT #{query_select} FROM data
			WHERE type_id IN :type_ids AND date_added >= :date_added_from AND date_added <= :date_added_to
			#{query_group}
			ORDER BY date_added
		"""
		type_ids = (Page.page_stats.type_id_db[type.name] for type in @types)

		Page.cmd "chartDbQuery", [query, {type_ids: type_ids, date_added_from: date_added_from, date_added_to: date_added_to}], (res) =>
			@logStart "Parse result"
			@data = {labels: []}
			@data_max = {}
			@data_total = {}
			for type_id in type_ids
				@data[type_id] = {}
				@data_max[Page.page_stats.type_name_db[type_id]] = 0
				@data_total[Page.page_stats.type_name_db[type_id]] = 0

			# Index data by closest step date
			for row in res
				type_name = Page.page_stats.type_name_db[row.type_id]
				@data[row.type_id][Math.ceil(row.date_added / step) * step] = row.value
				@data_max[type_name] = Math.max(row.value, @data_max[type_name])
				@data_total[type_name] += row.value

			# Make the graph symmetric
			@configuration.options.scales.yAxes[0].ticks.suggestedMax = Math.max(@data_max["file_bytes_sent"], @data_max["file_bytes_recv"])
			@configuration.options.scales.yAxes[0].ticks.suggestedMin = 0 - @configuration.options.scales.yAxes[0].ticks.suggestedMax

			@configuration.options.scales.yAxes[1].ticks.suggestedMax = Math.max(@data_max["request_num_sent"], @data_max["request_num_recv"])
			@configuration.options.scales.yAxes[1].ticks.suggestedMin = 0 - @configuration.options.scales.yAxes[1].ticks.suggestedMax

			# Reset data values
			for type_id, i in type_ids
				dataset = @configuration.data.datasets[@types[i].dataset_id]

				dataset.data.length = 0
				dataset.data_i = 0
			@configuration.data.labels.length = 0
			@configuration.data.labels_i = 0

			# Update data values
			data_date_added = Math.ceil(date_added_from / step) * step
			while data_date_added <= date_added_to
				# Skip empty data from chart beginning
				if not data_found
					for type_id, i in type_ids
						if @data[type_id][data_date_added]
							data_found = true
							break

					if not data_found
						data_date_added += step
						continue


				for type_id, i in type_ids
					data_value = @data[type_id][data_date_added]
					dataset = @configuration.data.datasets[@types[i].dataset_id]
					# scale = @chart.scales[dataset.yAxisID]
					type = @types[i]
					if type.negative
						data_value = 0 - data_value
					dataset.data[dataset.data_i] = data_value
					dataset.data_i += 1

				@configuration.data.labels.push(data_date_added * 1000)
				@configuration.data.labels_i += 1
				data_date_added += step

			@logEnd "Parse result", "labels: #{@configuration.data.labels.length}"

			if @chart
				@chart.update()
			else
				@initChart()
			cb?()
			Page.projector.scheduleRender()

	storeCanvasNode: (node) =>
		if @chart
			@chart.clear()
			@chart.destroy()
			@chart = null
		node.parentNode.style.height = node.getBoundingClientRect().height + "px"
		# node.parentNode.style.overflow = "hidden"
		@ctx = node.getContext("2d")
		@chart_node = node
		@configuration ?= @getChartConfiguration()

	initChart: =>
		@log "initChart"
		@chart = new Chart(@ctx, @configuration)
		setTimeout ( =>
			@chart_node.parentNode.style.height = ""
		), 100
		timer_resize = null
		window.addEventListener "resize", =>
			clearInterval(timer_resize)
			setTimeout ( => @chart.resize()), 300

	testDataAddition: ->
		timer_i = 0
		setInterval ( =>
		# Reset data values
			new_labels = @configuration.data.labels.slice()
			new_data = @configuration.data.datasets[@types[0].dataset_id].data.slice()

			#for type_id, i in type_ids
			#	@configuration.data.datasets[@types[i].dataset_id].data = []
			@configuration.data.labels = []
			timer_i += 1
			for type_id, i in type_ids
				dataset = @configuration.data.datasets[@types[i].dataset_id]
				dataset.data.push(Math.round(Math.random() * 10))
				dataset.data.shift()

			#new_data.push(Math.random() * 10)
			#new_data.shift()
			#@configuration.data.datasets[@types[0].dataset_id].data.splice(0, @configuration.data.datasets[@types[0].dataset_id].data.length)
			for data in new_data
				@configuration.data.datasets[@types[0].dataset_id].data.push(data)

			@configuration.data.labels = new_labels
			@configuration.data.labels.push(1000 * (Time.timestamp() + (timer_i * 60 * 5)))
			@configuration.data.labels.shift()
			@chart.update()
		), 5000

	createGradientStroke: (stops) ->
		gradient = @ctx.createLinearGradient(0, 0, 900, 0)
		for color, i in stops
			gradient.addColorStop(i * (1 / (stops.length - 1)), color)
		return gradient

	createGradientFill: (stops, mode="normal") ->
		if mode == "lower"
			gradient = @ctx.createLinearGradient(0, 0, 0, 300)
		else
			gradient = @ctx.createLinearGradient(0, 50, 0, 200)

		for color, i in stops
			gradient.addColorStop(i * (1 / (stops.length - 1)), color)
		return gradient

	getChartConfiguration: ->
		gradient_stroke = @createGradientStroke(["#5A46DF", "#8F49AA", "#D64C57"])
		gradient_stroke_bgline_up = @createGradientStroke(["#EEAAFF11", "#EEAAFF33", "#2da3b366"])
		gradient_stroke_bgline_down = @createGradientStroke(["#EEAAFF11", "#EEAAFF33", "#80623f88"])
		gradient_stroke_up = @createGradientStroke(["#2b68d9", "#2f99be", "#1dfc59"])
		gradient_stroke_down = @createGradientStroke(["#bac735", "#c2a548", "#f1294b"])

		gradient_fill = @createGradientFill(["#50455DEE", "#26262C33"])
		gradient_fill_up = @createGradientFill(["#1dfc5922", "#2f373333"])
		gradient_fill_down = @createGradientFill(["#45353533", "#f1294b22"], "lower")

		configuration = {
			type: 'line',
			data: {
				labels: [],
				datasets: [
					{
						type: 'line',
						label: "Upload",
						borderColor: gradient_stroke_up,
						pointBorderColor: gradient_stroke_up,
						pointBackgroundColor: gradient_stroke_up,
						pointHoverBackgroundColor: gradient_stroke_up,
						pointHoverBorderColor: gradient_stroke_up,
						pointHoverRadius: 2,
						pointRadius: 0,
						steppedLine: true,
						fill: true,
						backgroundColor: gradient_fill_up,
						borderWidth: 1,
						lineTension: 0,
						data: []
					}
					{
						type: 'line',
						label: "Download",
						borderColor: gradient_stroke_down,
						pointBorderColor: gradient_stroke_down,
						pointBackgroundColor: gradient_stroke_down,
						pointHoverBackgroundColor: gradient_stroke_down,
						pointHoverBorderColor: gradient_stroke_down,
						pointHoverRadius: 2,
						pointRadius: 0,
						steppedLine: true,
						fill: true,
						backgroundColor: gradient_fill_down,
						borderWidth: 1,
						lineTension: 0,
						data: []
					},
					{
						type: 'line',
						label: 'Sent',
						borderColor: gradient_stroke_bgline_up,
						backgroundColor: "rgba(255,255,255,0.0)",
						pointRadius: 0,
						borderWidth: 1,
						pointHoverRadius: 2,
						pointHoverBackgroundColor: gradient_stroke_bgline_up,
						pointHoverBorderColor: gradient_stroke_bgline_up,
						fill: true,
						yAxisID: 'Request',
						steppedLine: true,
						lineTension: 0,
						data: []
					},
					{
						type: 'line',
						label: 'Received',
						borderColor: gradient_stroke_bgline_down,
						backgroundColor: "rgba(255,255,255,0.0)",
						pointRadius: 0,
						borderWidth: 1,
						pointHoverRadius: 2,
						pointHoverBackgroundColor: gradient_stroke_bgline_down,
						pointHoverBorderColor: gradient_stroke_bgline_down,
						fill: true,
						yAxisID: 'Request',
						steppedLine: true,
						lineTension: 0,
						data: []
					}
				]
			},
			options: {
				animation: {
					easing: "easeOutExpo",
					duration: 2000
				},
				legend: {
					display: false,
					position: "top",
					labels: {
						fontColor: 'white'
					}
				},
				title: {
					display: false
				},
				tooltips: {
					mode: "index",
					intersect: false,
					displayColors: false,
					xPadding: 10,
					yPadding: 10,
					cornerRadius: 0,
					caretPadding: 10,
					bodyFontColor: "rgba(255,255,255,0.6)",
					callbacks: {
						title: (tootlip_items, data) ->
							Time.date(tootlip_items[0].xLabel, "long").replace(/:00$/, "")

						label: (tootlip_items, data) ->
							if data.datasets[tootlip_items.datasetIndex].yAxisID == "Request"
								return data.datasets[tootlip_items.datasetIndex].label+": " + Math.abs(tootlip_items.yLabel) + " requests"
							else
								return data.datasets[tootlip_items.datasetIndex].label+": " + Text.formatSize(Math.abs(tootlip_items.yLabel))
					}

				},
				hover: { mode: "index", intersect: false },
				scales: {
					yAxes: [{
						id: 'Transfer',
						ticks: {
							fontColor: "rgba(100,110,132,1)",
							fontStyle: "bold",
							beginAtZero: true,
							suggestedMax: 30000000,
							suggestedMin: -30000000,
							display: true,
							padding: 30,
							callback: (value) ->
								return Text.formatSize(Math.abs(value))
						},
						gridLines: {
							drawTicks: true,
							drawBorder: false,
							display: true,
							zeroLineColor: "rgba(255,255,255,0.1)",
							tickMarkLength: 20,
							zeroLineBorderDashOffset: 100,
							color: "rgba(255,255,255,0.05)"
						}

					},
					{
						id: 'Request',
						position: "right",
						ticks: {
							beginAtZero: true,
							maxTicksLimit: 5,
							suggestedMax: 180,
							suggestedMin: -180,
							display: false
						},
						gridLines: {
							display: false,
							zeroLineColor: "rgba(255,255,255,0)",
							drawBorder: false
						}
					}],
					xAxes: [{
						type: "time",
						gridLines: {
							color: "rgba(255,255,255,0.1)",
							display: false,
							offsetGridLines: true,
							drawBorder: false
						},
						ticks: {
							padding: 15,
							fontColor: "rgba(100,110,132,1)",
							fontStyle: "bold",
							callback: (data_label, index) =>
								@last_data_label ?= "None 00 00:00"
								if @last_data_label.match(/.* /)[0] == data_label.match(/.* /)[0]
									back = ["", data_label.replace(/.* /, "")]
								else
									parts = data_label.split(" ")
									if parts.length != 3
										return data_label
									back = [parts[0] + " " + parts[1], parts[2]]

								@last_data_label = data_label
								return back
						},
						time: {
							displayFormats: {
								'second': 'MMM DD HH:mm',
								'minute': 'MMM DD HH:mm',
								'hour': 'MMM DD HH:mm',
								'day': 'MMM DD HH:mm',
								'week': 'MMM DD HH:mm',
								'month': 'MMM DD HH:mm',
								'quarter': 'MMM DD HH:mm',
								'year': 'MMM DD HH:mm'
							}
						}
					}]
				}
			}
		}
		return configuration

	render: =>
		if @need_update
			@update()
			@need_update = false

		h("div.ChartBig", [
			h("canvas.#{Page.params.interval}", {width: 1350, height: 450, afterCreate: @storeCanvasNode, updateAnimation: Animation.show, mode: Page.params.interval})
		])

window.ChartBig = ChartBig