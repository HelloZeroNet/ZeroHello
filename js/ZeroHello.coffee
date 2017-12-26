window.h = maquette.h

class ZeroHello extends ZeroFrame
	init: ->
		@params = {}
		@site_info = null
		@server_info = null
		@address = null

		@on_site_info = new Promise()
		@on_settings = new Promise()
		@on_loaded = new Promise()
		@settings = null

		@latest_version = "0.6.0"
		@mode = "Sites"
		@change_timer = null
		document.body.id = "Page#{@mode}"

	addRenderer: (node, renderer) ->
		@projector.replace(node, renderer)
		@renderers.push(renderer)

	detachRenderers: ->
		for renderer in @renderers
			@projector.detach(renderer)
		@renderers = []

	setProjectorMode: (mode) ->
		@log "setProjectorMode", mode
		@detachRenderers()
		if mode == "Files"
			@addRenderer($("#FileList"), @file_list.render)
		else if mode == "Stats"
			@addRenderer($("#StatList"), @stat_list.render)
		else
			mode = "Sites"
			@addRenderer($("#FeedList"), @feed_list.render)
			@addRenderer($("#SiteList"), @site_list.render)

		if @mode != mode
			@mode = mode
			setTimeout ( ->
				# Delayed to avoid loosing anmation because of dom re-creation
				document.body.id = "Page#{mode}"

				if @change_timer
					clearInterval @change_timer
				document.body.classList.add("changing")
				@change_timer = setTimeout ( ->
					document.body.classList.remove("changing")
				), 400

			), 60


	createProjector: ->
		@projector = maquette.createProjector()  # Dummy, will set later
		@projectors = {}
		@renderers = []

		@site_list = new SiteList()
		@feed_list = new FeedList()
		@file_list = new FileList()
		@stat_list = new StatList()
		@head = new Head()
		@dashboard = new Dashboard()
		@mute_list = new MuteList()
		@trigger = new Trigger()

		if base.href.indexOf("?") == -1
			@route("")
		else
			url = base.href.replace(/.*?\?/, "")
			@route(url)
			@history_state["url"] = url

		@loadSettings()
		@on_site_info.then =>
			@projector.replace($("#Head"), @head.render)
			@projector.replace($("#Dashboard"), @dashboard.render)
			@projector.merge($("#Trigger"), @trigger.render)
			@setProjectorMode(@mode)

		# Update every minute to keep time since fields up-to date
		setInterval ( ->
			Page.projector.scheduleRender()
		), 60*1000


	# Route site urls
	route: (query) ->
		@params = Text.parseQuery(query)
		@log "Route", @params
		@setProjectorMode(@params.url)

	# Add/remove/change parameter to current site url
	createUrl: (key, val) ->
		params = JSON.parse(JSON.stringify(@params))  # Clone
		if typeof key == "Object"
			vals = key
			for key, val of keys
				params[key] = val
		else
			params[key] = val
		return "?"+Text.encodeQuery(params)

	setUrl: (url, mode="push") ->
		url = url.replace(/.*?\?/, "")
		@log "setUrl", @history_state["url"], "->", url
		if @history_state["url"] == url
			return false
		@history_state["url"] = url
		if mode == "replace"
			@cmd "wrapperReplaceState", [@history_state, "", url]
		else
			@cmd "wrapperPushState", [@history_state, "", url]
		@route url
		return false

	handleLinkClick: (e) =>
		if e.which == 2
			# Middle click dont do anything
			return true
		else
			@log "save scrollTop", window.pageYOffset
			@history_state["scrollTop"] = window.pageYOffset
			@cmd "wrapperReplaceState", [@history_state, null]

			window.scroll(window.pageXOffset, 0)
			@history_state["scrollTop"] = 0

			@on_loaded.resolved = false
			document.body.className = ""

			@setUrl e.currentTarget.search
			return false

	loadSettings: ->
		@on_site_info.then =>
			@cmd "userGetSettings", [], (res) =>
				if not res or res.error
					@loadLocalStorage()
				else
					@settings = res
					@settings.sites_orderby ?= "peers"
					@settings.favorite_sites ?= {}
					@on_settings.resolve(@settings)

	loadLocalStorage: ->
		@cmd "wrapperGetLocalStorage", [], (@settings) =>
			@log "Loaded localstorage"
			@settings ?= {}
			@settings.sites_orderby ?= "peers"
			@settings.favorite_sites ?= {}
			@on_settings.resolve(@settings)

	saveSettings: (cb) ->
		if @settings
			if Page.server_info.rev > 2140
				@cmd "userSetSettings", [@settings], (res) =>
					if cb then cb(res)
			else
				@cmd "wrapperSetLocalStorage", @settings, (res) =>
					if cb then cb(res)


	onOpenWebsocket: (e) =>
		@reloadSiteInfo()
		@reloadServerInfo()

	reloadSiteInfo: =>
		@cmd "siteInfo", {}, (site_info) =>
			@address = site_info.address
			@setSiteInfo(site_info)

	reloadServerInfo: =>
		@cmd "serverInfo", {}, (server_info) =>
			@setServerInfo(server_info)

	# Parse incoming requests from UiWebsocket server
	onRequest: (cmd, params) ->
		if cmd == "setSiteInfo" # Site updated
			@setSiteInfo(params)
		else if cmd == "setServerInfo"
			@setServerInfo(params)
		else
			@log "Unknown command", params

	setSiteInfo: (site_info) ->
		if site_info.address == @address
			@site_info = site_info
		@site_list.onSiteInfo(site_info)
		@feed_list.onSiteInfo(site_info)
		@file_list.onSiteInfo(site_info)
		@on_site_info.resolve()

	setServerInfo: (server_info) ->
		@server_info = server_info
		@projector.scheduleRender()

	# Simple return false to avoid link clicks
	returnFalse: ->
		return false

window.Page = new ZeroHello()
window.Page.createProjector()
