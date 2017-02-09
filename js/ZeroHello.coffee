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

		@latest_version = "0.5.1"
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

		@loadLocalStorage()
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
		if @params.to
			@on_site_info.then =>
				@message_create.show(@params.to)
			@cmd "wrapperReplaceState", [{}, "", @createUrl("to", "")]  # Remove to parameter from url
		if @params.url == "Sent"
			@leftbar.folder_active = "sent"

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


	loadLocalStorage: ->
		@on_site_info.then =>
			@log "Loading localstorage"
			@cmd "wrapperGetLocalStorage", [], (@local_storage) =>
				@log "Loaded localstorage"
				@local_storage ?= {}
				@local_storage.sites_orderby ?= "peers"
				@local_storage.favorite_sites ?= {}
				@on_local_storage.resolve(@local_storage)

	saveLocalStorage: (cb) ->
		if @local_storage
			@cmd "wrapperSetLocalStorage", @local_storage, (res) =>
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
