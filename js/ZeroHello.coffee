window.h = maquette.h

class ZeroHello extends ZeroFrame
	init: ->
		@params = {}
		@site_info = null
		@server_info = null
		@address = null

		@on_site_info = new Promise()
		@on_local_storage = new Promise()
		@local_storage = null

		@latest_version = "0.5.4"
		@mode = "Sites"
		@change_timer = null
		document.body.id = "Page#{@mode}"

	setProjectorMode: (mode) ->
		@log "setProjectorMode", mode
		if mode == "Sites"
			try
				@projector.detach(@file_list.render)
			catch
				@
			@projector.replace($("#FeedList"), @feed_list.render)
			@projector.replace($("#SiteList"), @site_list.render)
		else if mode == "Files"
			try
				@projector.detach(@feed_list.render)
				@projector.detach(@site_list.render)
			catch
				@
			@projector.replace($("#FileList"), @file_list.render)
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

		@site_list = new SiteList()
		@feed_list = new FeedList()
		@file_list = new FileList()
		@head = new Head()
		@dashboard = new Dashboard()
		@mute_list = new MuteList()

		@route("")

		@loadSettings()
		@on_site_info.then =>
			@projector.replace($("#Head"), @head.render)
			@projector.replace($("#Dashboard"), @dashboard.render)
			@setProjectorMode(@mode)

		# Update every minute to keep time since fields up-to date
		setInterval ( ->
			Page.projector.scheduleRender()
		), 60*1000


	# Route site urls
	route: (query) ->
		@params = Text.parseQuery(query)
		@log "Route", @params

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
			@content.update()
			return false
		@history_state["url"] = url
		if mode == "replace"
			@cmd "wrapperReplaceState", [@history_state, "", url]
		else
			@cmd "wrapperPushState", [@history_state, "", url]
		@route url
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
