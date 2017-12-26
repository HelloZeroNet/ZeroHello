class Head extends Class
	constructor: ->
		@menu_settings = new Menu()

	formatUpdateInfo: ->
		if parseFloat(Page.server_info.version.replace(".", "0")) < parseFloat(Page.latest_version.replace(".", "0"))
			return "New version available!"
		else
			return "Up to date!"

	handleLanguageClick: (e) =>
		if Page.server_info.rev < 1750
			return Page.cmd "wrapperNotification", ["info", "You need ZeroNet 0.5.1 to change the interface's language"]
		lang = e.target.hash.replace("#", "")
		Page.cmd "configSet", ["language", lang], ->
			Page.server_info.language = lang
			top.location = "?Home"
		return false

	renderMenuLanguage: =>
		langs = ["da", "de", "en", "es", "fr", "hu", "it", "nl", "pl", "pt", "pt-br", "ru", "sk", "tr", "uk", "zh", "zh-tw"]
		if Page.server_info.language and Page.server_info.language not in langs
			langs.push Page.server_info.language

		h("div.menu-radio",
			h("div", "Language: "),
			for lang in langs
				[
					h("a", {href: "#"+lang, onclick: @handleLanguageClick, classes: {selected: Page.server_info.language == lang, long: lang.length > 2}}, lang),
					" "
				]
		)

	handleCreateSiteClick: =>
		if Page.server_info.rev < 1770
			return Page.cmd "wrapperNotification", ["info", "You need to update your ZeroNet client to use this feature"]
		Page.cmd("siteClone", [Page.site_info.address, "template-new"])

	handleBackupClick: =>
		if Page.server_info.rev < 2165
			return Page.cmd "wrapperNotification", ["info", "You need to update your ZeroNet client to use this feature"]
		Page.cmd("serverShowdirectory", "backup")
		return Page.cmd "wrapperNotification", ["info", "Backup <b>users.json</b> file to keep your identity safe."]



	handleSettingsClick: =>
		Page.settings.sites_orderby ?= "peers"
		orderby = Page.settings.sites_orderby

		@menu_settings.items = []
		@menu_settings.items.push ["Update all sites", @handleUpdateAllClick]
		@menu_settings.items.push ["---"]
		@menu_settings.items.push ["Order sites by peers", ( => @handleOrderbyClick("peers") ), (orderby == "peers")]
		@menu_settings.items.push ["Order sites by update time", ( => @handleOrderbyClick("modified") ), (orderby == "modified")]
		@menu_settings.items.push ["Order sites by add time", ( => @handleOrderbyClick("addtime") ), (orderby == "addtime")]
		@menu_settings.items.push ["Order sites by size", ( => @handleOrderbyClick("size") ), (orderby == "size")]
		@menu_settings.items.push ["---"]
		@menu_settings.items.push [@renderMenuLanguage(), null ]
		@menu_settings.items.push ["---"]
		@menu_settings.items.push ["Create new, empty site", @handleCreateSiteClick]
		@menu_settings.items.push ["---"]
		@menu_settings.items.push [[h("span.emoji", "\uD83D\uDD07 "), "Manage muted users"], @handleManageMutesClick]
		@menu_settings.items.push ["Show data directory", @handleBackupClick]
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

	handleOrderbyClick: (orderby) =>
		Page.settings.sites_orderby = orderby
		Page.site_list.reorder()
		Page.saveSettings()

	handleTorClick: =>
		return true

	handleManageMutesClick: =>
		if Page.server_info.rev < 1880
			return Page.cmd "wrapperNotification", ["info", "You need ZeroNet 0.5.2 to use this feature."]

		Page.projector.replace($("#MuteList"), Page.mute_list.render)
		Page.mute_list.show()

	handleUpdateZeronetClick: =>
		Page.cmd "wrapperConfirm", ["Update to latest development version?", "Update ZeroNet #{Page.latest_version}"], =>
			Page.cmd "wrapperNotification", ["info", "Updating to latest version...<br>Please restart ZeroNet manually if it does not come back in the next few minutes.", 8000]
			Page.cmd "serverUpdate"
			@log "Updating..."
		return false


	handleShutdownZeronetClick: =>
		Page.cmd "wrapperConfirm", ["Are you sure?", "Shut down ZeroNet"], =>
			Page.cmd "serverShutdown"

	handleModeClick: (e) =>
		if Page.server_info.rev < 1700
			Page.cmd "wrapperNotification", ["info", "This feature requires ZeroNet version 0.5.0"]
		else
			Page.handleLinkClick(e)
		return false

	render: =>
		h("div#Head",
			h("a.settings", {href: "#Settings", onmousedown: @handleSettingsClick, onclick: Page.returnFalse}, ["\u22EE"])
			@menu_settings.render()
			h("a.logo", {href: "?Home"}, [
				h("img", {src: 'img/logo.svg', width: 40, height: 40, onerror: "this.src='img/logo.png'; this.onerror=null;"}),
				h("span", ["Hello ZeroNet_"])
			]),
			h("div.modes", [
				h("a.mode.sites", {href: "?", classes: {active: Page.mode == "Sites"}, onclick: Page.handleLinkClick}, _("Sites"))
				h("a.mode.files", {href: "?Files", classes: {active: Page.mode == "Files"}, onclick: Page.handleLinkClick}, _("Files"))
				if Page.site_info.settings.own then h("a.mode.stats", {href: "?Stats", classes: {active: Page.mode == "Stats"}, onclick: Page.handleLinkClick}, _("Stats"))
			])
		)

window.Head = Head