class Head extends Class
	constructor: ->
		@menu_settings = new Menu()

	formatUpdateInfo: ->
		if parseFloat(Page.server_info.version.replace(".", "0")) < parseFloat(Page.latest_version.replace(".", "0"))
			return "New version avalible!"
		else
			return "Up to date!"

	handleSettingsClick: =>
		Page.local_storage.sites_orderby ?= "peers"
		orderby = Page.local_storage.sites_orderby

		@menu_settings.items = []
		@menu_settings.items.push ["Update all sites", @handleUpdateAllClick]
		@menu_settings.items.push ["---"]
		@menu_settings.items.push ["Order sites by peers", @handleOrderbyPeers, (orderby == "peers")]
		@menu_settings.items.push ["Order sites by update time", @handleOrderbyModified, (orderby == "modified")]
		@menu_settings.items.push ["---"]
		# @menu_settings.items.push ["Help to keep this project alive", "https://zeronet.readthedocs.org/en/latest/help_zeronet/donate/"]
		@menu_settings.items.push ["Version #{Page.server_info.version} (rev#{Page.server_info.rev}): #{@formatUpdateInfo()}", @handleUpdateZeronetClick]
		@menu_settings.items.push ["Shut down ZeroNet", @handleShutdownZeronetClick]

		if @menu_settings.visible
			@menu_settings.hide()
		else
			@menu_settings.show()
		return false

	handleUpdateAllClick: =>
		for site in Page.site_list.sites
			if site.row.settings.serving
				Page.cmd "siteUpdate", {"address": site.row.address}

	handleOrderbyPeers: =>
		Page.local_storage.sites_orderby = "peers"
		Page.site_list.reorder()
		Page.saveLocalStorage()

	handleOrderbyModified: =>
		Page.local_storage.sites_orderby = "modified"
		Page.site_list.reorder()
		Page.saveLocalStorage()

	handleTorClick: =>
		return true

	handleUpdateZeronetClick: =>
		Page.cmd "wrapperConfirm", ["Update to latest development version?", "Update ZeroNet #{Page.latest_version}"], =>
			Page.cmd "wrapperNotification", ["info", "Updating to latest version...<br>Please restart ZeroNet manually if it does not come back in the next few minutes.", 8000]
			Page.cmd "serverUpdate"
			@log "Updating..."
		return false


	handleShutdownZeronetClick: =>
		Page.cmd "wrapperConfirm", ["Are you sure?", "Shut down ZeroNet"], =>
			Page.cmd "serverShutdown"


	render: =>
		h("div#Head",
			h("a.settings", {href: "#Settings", onmousedown: @handleSettingsClick, onclick: Page.returnFalse}, ["\u22EE"])
			@menu_settings.render()
			h("a.logo", {href: "?Home"}, [
				h("img", {src: 'img/logo.png', width: 50, height: 50}),
				h("span", ["Hello ZeroNet_"])
			])
		)

window.Head = Head