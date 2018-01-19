class PageStats extends Class
	constructor: ->
		@need_update = false
		@need_load_chartjs = true
		@chartjs_loaded = false
		@chart_timeline = new ChartTimeline()

		@chart_big = new ChartBig()
		@chart_big.types = [
			{name: "file_bytes_sent", dataset_id: 0}
			{name: "file_bytes_recv", dataset_id: 1, negative: true}
			{name: "request_num_sent", dataset_id: 2, negative: true}
			{name: "request_num_recv", dataset_id: 3}
		]

		@chart_legend = new ChartLegend()
		@chart_legend.items_left = [
			{title: "Upload", getValue: ( => Text.formatSize(@chart_big.data_total.file_bytes_sent) ), color: "#1dfc59"},
			{title: "Download", getValue: ( => Text.formatSize(@chart_big.data_total.file_bytes_recv) ), color: "#c94d47"},
			{title: "Ratio", getValue: ( => @chart_big.data_total.file_bytes_sent / @chart_big.data_total.file_bytes_recv), type: "ratio", color: "#16ffe9"}
		]
		@chart_legend.items_right = [
			{title: "Sent", getValue: ( => @chart_big.data_total.request_num_sent ), post: "requests", dot: "\u2500", color: "#2da3b3"},
			{title: "Received", getValue: ( => @chart_big.data_total.request_num_recv ), post: "requests", dot: "\u2500", color: "#80623f"}
		]

		@chart_radar = new ChartRadar()

		@chart_connections = new Chart()
		@chart_connections.title = "Connections"
		@chart_connections.type_names = ["peer", "peer_onion", "connection", "connection_onion", "connection_in", "connection_ping_avg", "connection_ping_min"]
		@chart_connections.formatValue = (type_data) ->
			return "#{type_data.connection} of #{type_data.peer} peers"
		@chart_connections.formatDetails = (type_data) ->
			back = []
			back.push "Onion: #{type_data.peer_onion} peers (#{type_data.connection_onion or 0} connections)"
			back.push "Incoming: #{Math.round(type_data.connection_in / type_data.connection * 100)}%"
			back.push "Ping avg: #{type_data.connection_ping_avg}ms (min: #{type_data.connection_ping_min}ms)"
			return back
		@chart_connections.chart_stroke = ["#608DECAA", "#D74C58FF"]
		@chart_connections.getChartQuery = ->
			"SELECT * FROM data WHERE type_id = #{Page.page_stats.type_id_db['connection']} ORDER BY date_added DESC LIMIT 50"

		@chart_size = new Chart()
		@chart_size.title = "Total size"
		@chart_size.chart_stroke = ["#F99739AA", "#51B8F2"]
		@chart_size.type_names = ["size", "size_optional", "optional_limit", "optional_used", "content"]
		@chart_size.formatValue = (type_data) ->
			return Text.formatSize(type_data.size)
		@chart_size.formatDetails = (type_data) ->
			back = []
			back.push "Content sources: #{type_data.content} files"
			back.push "Optional downloaded: #{Text.formatSize(type_data.optional_used) or '0 MB'} of #{Text.formatSize(type_data.size_optional) or '0 MB'} (limit: #{Text.formatSize(type_data.optional_limit)})"
			return back
		@chart_size.getChartQuery = ->
			"SELECT AVG(value) / 1024 / 1024 AS value FROM data WHERE type_id = #{Page.page_stats.type_id_db['size']} GROUP BY ROUND(data_id / 1000) ORDER BY date_added DESC LIMIT 50"

		@chart_world = new ChartWorld()
		@country_list = new StatList()

		@type_name_db = {}
		@type_id_db = {}

		@site_address_db = {}
		@site_id_db = {}

		setInterval ( =>
			@need_update = true
			Page.projector.scheduleRender()
		), 5 * 60 * 1000

	handleChartjsLoad: =>
		@chartjs_loaded = true
		Page.projector.scheduleRender()

	update: =>
		Page.cmd "chartDbQuery", "SELECT * FROM type", (res) =>
			@type_id_db = {}
			@type_name_db = {}
			for row in res
				@type_id_db[row.name] = row.type_id
				@type_name_db[row.type_id] = row.name

		Page.cmd "chartDbQuery", "SELECT * FROM site", (res) =>
			sites = {}
			@sites_by_id = {}
			for row in res
				@site_id_db[row.address] = row.site_id
				@site_address_db[row.site_id] = row.address

			@chart_big.need_update = true
			@chart_timeline.need_update = true
			@chart_connections.need_update = true
			@chart_size.need_update = true
			@chart_radar.need_update = true
			@chart_world.need_update = true
			Page.projector.scheduleRender()

	loadChartjs: =>
		e = document.createElement("script")
		e.type = "text/javascript"
		e.src = "chartjs/chart.bundle.min.js"
		e.onload = @handleChartjsLoad
		document.body.appendChild e

	render: =>
		if Page.server_info?.rev < 3220
			return h("div#PageStats",
				h("div.empty", [
					h("h4", "Need update"),
					h("small", "You have to update to ZeroNet version 0.6.1 to use this feature.")
				])
			)

		if @need_update
			@update()
			@need_update = false

		if not @need_update and document.body.className != "loaded"
			setTimeout ( -> document.body.className = "loaded" ), 1000

		if @need_load_chartjs
			setTimeout @loadChartjs, 500
			@need_load_chartjs = false

		intervals = ["1w", "1d"]

		h("div#PageStats", [
			h("div.intervals", intervals.map (interval) =>
				if interval == "1d"
					interval_param = undefined
				else
					interval_param = interval
				h("a.interval", {href: Page.createUrl("interval", interval_param), onclick: Page.handleLinkClick, classes: {active: interval_param == Page.params.interval}}, interval)
			)
			@chart_timeline.render(),
			if @chartjs_loaded then [
				@chart_big.render()
				@chart_legend.render()
				@chart_radar.render()
				h("div.Charts", [
					@chart_connections.render(),
					@chart_size.render()
				])
				@chart_world.render()
				@country_list.render()
			]
		])


window.PageStats = PageStats