class ChartRadar extends Class
	constructor: (@id) ->
		@configuration = {}
		@site_stats = []
		@need_update = false
		@order_by = "site_bw"
		@legends = [
			{id: "site_bw", title: "Transferred data (last 7 days)", color: "#608DECDD"},
			{id: "site_size", title: "Site size", color: "#9C27B0DD"}
		]

	update: =>
		query = """
			SELECT type_id, site_id, SUM(value) AS sum, value
			FROM data
			WHERE type_id IN :type_ids AND date_added > #{Time.timestamp() - 60 * 60 * 24 * 7}
			GROUP BY type_id, site_id
		"""
		type_ids = (Page.page_stats.type_id_db[type_name] for type_name in ["site_bytes_sent", "site_bytes_recv", "site_size"])
		Page.cmd "chartDbQuery", [query, {type_ids: type_ids}], (res) =>
			@logStart "Parse result"

			# Aggregate data from result
			data = {}
			for row in res
				address = Page.page_stats.site_address_db[row.site_id]
				type_name = Page.page_stats.type_name_db[row.type_id]
				site = Page.site_list.sites_byaddress[address]
				if not site
					continue
				data[address] ?= {address: address, site: site}
				if type_name == "site_size"
					data[address][type_name] = row.value
				else
					data[address][type_name] = row.sum or 0

			# Sort by bytes_sent
			@site_stats = []
			for address, stat of data
				stat.site_bw = stat.site_bytes_sent + stat.site_bytes_recv
				@site_stats.push(stat)

			@site_stats.sort (a, b) =>
				return b[@order_by] - a[@order_by]

			if @site_stats.length > 8
				@site_stats.length = 8

			max_site_bw = Math.max.apply(null, stat.site_bw for stat in @site_stats)
			max_site_size = Math.max.apply(null, stat.site_size for stat in @site_stats)
			for stat, i in @site_stats
				@configuration.data.labels[i] = stat.site.row.content.title
				@configuration.data.datasets[0].data[i] = Math.log(1 + (stat.site_bw / max_site_bw) * 100)
				@configuration.data.datasets[1].data[i] = Math.log(1 + (stat.site_size / max_site_size) * 100)

			@logEnd "Parse result", "sites: #{@site_stats.length}"
			Page.projector.scheduleRender()

			if @chart
				@chart.update()
			else
				@initChart()

	initCanvas: (node) =>
		if @chart
			@chart.clear()
			@chart.destroy()
			@chart = null

		@ctx = node.getContext("2d")
		@configuration = @getChartConfiguration()
		#setTimeout @initChart, 100  # Delay chart to add animation

	getChartConfiguration: =>
		fill = @ctx.createLinearGradient(0, 0, 900, 0)
		fill.addColorStop(0, "#608DECCC")
		fill.addColorStop(1, "#9C27B0CC")

		fill2 = @ctx.createLinearGradient(0, 0, 900, 0)
		fill2.addColorStop(0, "#9C27B0DD")
		fill2.addColorStop(1, "#608DECDD")

		shadowed = {
			beforeDatasetsDraw: (chart, options) ->
				chart.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
				chart.ctx.shadowBlur = 40
			afterDatasetsDraw: (chart, options) ->
				chart.ctx.shadowColor = 'rgba(0, 0, 0, 0)'
				chart.ctx.shadowBlur = 0
		}

		return {
			type: 'radar',
			data: {
				labels: [],
				datasets: [{
					label: "Transferred data",
					backgroundColor: fill,
					borderColor: "transparent",
					borderWidth: 0,
					pointBorderWidth: 0,
					pointRadius: 0
					data: []
				},{
					label: "Site size",
					backgroundColor: fill2,
					borderColor: "transparent",
					borderWidth: 0,
					pointBorderWidth: 0,
					pointRadius: 0,
					data: []
				}]
			},
			options: {
				legend: {
					display: false,
					position: "bottom",
					labels: { padding: 5 }
				},
				scale: {
					ticks: {
						display: false,
						maxTicksLimit: 5,
						beginAtZero: true
					},
					angleLines: {
						color: "#99999911"
					},
					gridLines: {
						color: "#99999911",
						tickMarkLength: 1
					},
					tooltips: { enabled: true },
					pointLabels: {
						fontColor: "rgba(200,210,232,1)",
						fontSize: 14,
						fontFamily: "Roboto"
						fontStyle: "lighter",
						padding: 10,
						callback: @formatLabel
					}
				}
			},
			plugins: [shadowed]
		}

	formatLabel: =>
		return [""]

	initChart: =>
		@chart = new Chart(@ctx, @configuration)
		timer_resize = null
		window.addEventListener "resize", =>
			@log "resize"
			clearInterval(timer_resize)
			setTimeout ( => @chart.resize()), 300

	handleLegendClick: (e) =>
		@order_by = e.currentTarget.getAttribute("href").replace("#", "")
		@update()
		return false

	renderLabel: (stat, i) =>
		if i % (@site_stats.length / 2) == 0
			r = 37
		else
			r = 40
		left = 50 + r * Math.sin(2 * Math.PI * i / @site_stats.length)
		top = 50 - r * Math.cos(2 * Math.PI * i / @site_stats.length)
		h("div.radar-label", {key: stat.address + i, style: "left: #{left}%; top: #{top}%", enterAnimation: Animation.show, exitAnimation: Animation.hide, delay: i*0.05},
			h("a.title", {href: stat.site.getHref()}, stat.site.row.content.title)
			" "
			h("span.value", " (#{Text.formatSize(stat[@order_by]) or "No data yet"})")
		)

	render: =>
		if @need_update
			@update()
			@need_update = false
		label_i = 0

		h("div.ChartRadar", [
			h("div.radar-container", [
				h("div.radar-labels", @site_stats.map (stat) =>
					label = @renderLabel(stat, label_i)
					label_i += 1
					return label
				)
				h("div.canvas-container",
					h("canvas", {width: 600, height: 600, afterCreate: @initCanvas})
				)
			])
			h("div.radar-legends", @legends.map (legend) =>
				h("a.radar-legend", {id: legend.id, classes: {active: @order_by == legend.id}, onclick: @handleLegendClick, href: "#" + legend.id}, [
					h("div.legend-box", {style: "background-color: #{legend.color}"}),
					h("span.title", legend.title)
				])
			)


		])

window.ChartRadar = ChartRadar
