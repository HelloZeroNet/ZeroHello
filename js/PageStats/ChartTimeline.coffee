class ChartTimeline extends Class
	constructor: ->
		@items = []
		for i in [6..0]
			@items.push {id: i, title: "\u200B", data: "\u200B", value: i, active: false}
		@active_id = 0
		@chart_ctx = null
		@need_update = false
		@line_data = null

	initChart: (node) =>
		@chart_canvas = node
		@chart_ctx = node.getContext("2d")

		if @line_data
			@updateChart()

	updateChart: =>
		@chart_ctx.clearRect(0, 0, @chart_canvas.width, @chart_canvas.height)

		@chart_ctx.lineWidth = 0
		@chart_ctx.fillStyle = '#EDC54B'

		@chart_ctx.beginPath()

		@chart_ctx.moveTo(-10,0)
		data_max = Math.max.apply(null, @line_data)
		data_last_i = (i for val, i in @line_data when val > 0).pop()
		line_width = 1400 / @line_data.length

		if not data_last_i?
			return  # No data yet

		for data, i in @line_data
			line_x = i * line_width
			line_y = parseInt(101 - (data / data_max) * 100)
			@chart_ctx.lineTo(line_x, line_y)
			if i == data_last_i
				break
		@chart_ctx.lineTo(line_x, 120)
		@chart_ctx.lineTo(0, 120)

		@chart_ctx.fill()

		# Dashed line at the end
		if data_last_i > 36
			@chart_ctx.beginPath()
			@chart_ctx.lineWidth = 0
			@chart_ctx.strokeStyle = '#EDC54B'
			@chart_ctx.setLineDash [0, 1, 1]
			@chart_ctx.moveTo(line_x, line_y)
			@chart_ctx.lineTo(1500, line_y)
			@chart_ctx.stroke()

	update: =>
		query = """
			SELECT
			MAX(date_added) AS date_added, AVG(value) AS avg, SUM(value) AS sum
			FROM data
			WHERE type_id = :type_id AND date_added >= :date_added_from AND date_added <= :date_added_to
			GROUP BY strftime('%Y-%m-%d %H', date_added, 'unixepoch', 'localtime')
			ORDER BY date_added DESC
		"""

		if Page.params.interval == "1w"
			c = new Date()
			c.setDate(c.getDate() - (c.getDay() or 7) + 7)
			date_added_to = c.setHours(23,59,59,0) / 1000
			interval_step = 60 * 60 * 24 * 7
			date_added_from = date_added_to - interval_step * 7
			group_steps = 6

		else if Page.params.interval == "1m"
			c = new Date()
			c.setDate(30)
			date_added_to = c.setHours(23,59,59,0) / 1000
			interval_step = 60 * 60 * 24 * 30
			date_added_from = date_added_to - interval_step * 30
			group_steps = 24 * 3
		else
			date_added_to = (new Date()).setHours(23,59,59,0) / 1000
			interval_step = 60 * 60 * 24
			date_added_from = date_added_to - interval_step * 7
			group_steps = 2

		step = 60 * 60
		type_id = Page.page_stats.type_id_db["file_bytes_sent"]
		data = {}
		day_total = {}
		Page.cmd "chartDbQuery", [query, {type_id: type_id, date_added_from: date_added_from, date_added_to: date_added_to}], (res) =>
			@logStart "Parse result", res.length

			@line_data = []
			for row in res
				data[Math.ceil(row.date_added / step) * step] = row.sum
				day_string = Time.dateIso(row.date_added * 1000)
				day_total[day_string] ?= 0
				day_total[day_string] += row.sum

			data_date_added = Math.ceil(date_added_from / step) * step
			while data_date_added <= date_added_to
				group_step_data = 0
				for i in [0..group_steps]
					group_step_data += data[data_date_added] or 0
					data_date_added += step
				@line_data.push(group_step_data)

			# Update links
			@items = []
			for i in [7..1]
				data_from = date_added_to - i * interval_step + 1
				data_to = data_from + interval_step - 1

				if Page.params.interval == "1w"
					day_data = 0
					for x in [0..6]
						day_data += day_total[Time.dateIso(data_from + (60 * 60 * 24 * x))] or 0
					day_from = Time.date(data_from, "day")
					day_to = Time.date(data_from + interval_step - 1, "day")
					day_to = day_to.replace(day_from.split(" ")[0], "")  # Only display month once if it's the same
					day_name = "#{day_from} - #{day_to}"
				else if Page.params.interval == "1m"
					day_data = 0
					for x in [0..30]
						day_data += day_total[Time.dateIso(data_from + (60 * 60 * 24 * x))] or 0
					day_name = Time.date(data_from, "month")
				else
					day_data = day_total[Time.dateIso(data_from)]
					day_name = Time.weekDay(data_from)
				@items.push {id: i, title: day_name, data: day_data, value: data_to}

			@logEnd "Parse result", "data: #{@line_data.length}"
			Page.projector.scheduleRender()
			@updateChart()

	renderItem: (item) ->
		date_added_to = Time.dateIso(item.value)
		if item.value >= Time.timestamp()
			date_added_to = ""
		classes = {active: (Page.params.date_added_to or "") == date_added_to}
		h("a.timeline-item", {key: item.title, enterAnimation: Animation.show, delay: item.id * 0.05, href: Page.createUrl("date_added_to", date_added_to), onclick: Page.handleLinkClick, classes: classes},
			h("span.title", item.title),
			h("span.data", Text.formatSize(item.data) or "0 MB")
		)

	render: =>
		if @need_update
			@update()
			@need_update = false

		h("div.ChartTimeline", [
			h("div.timeline-borders", @items.map (item) =>
				date_added_to = Time.dateIso(item.value)
				if item.value >= Time.timestamp()
					date_added_to = ""
				h("div.timeline-border", {key: item.id, classes: {active: (Page.params.date_added_to or "") == date_added_to }})
			),
			h("canvas.chart", {afterCreate: @initChart, width: 1400, height: 100, data: @line_data?.length, delay: 0.3, updateAnimation: Animation.show}),
			h("div.timeline-items", @items.map (item) =>
				@renderItem(item)
			)
		])

window.ChartTimeline = ChartTimeline
