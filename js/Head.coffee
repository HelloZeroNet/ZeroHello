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

	handleThemeClick: (e) =>
		if Page.server_info.rev < 3670
			return Page.cmd "wrapperNotification", ["info", "You need ZeroNet 0.6.4 to change the interface's theme"]

		theme = e.target.hash.replace("#", "")

		if theme == "system"
			if Page.server_info.rev < 4085
				return Page.cmd "wrapperNotification", ["info", "You need ZeroNet 0.7.0 to use system's theme"]

			DARK = "(prefers-color-scheme: dark)"
			mqDark = window.matchMedia(DARK)

		Page.cmd "userGetGlobalSettings", [], (user_settings) ->
			if theme == "system"
				theme = if mqDark.matches then "dark" else "light"
				user_settings.use_system_theme = true
			else
				user_settings.use_system_theme = false

			user_settings.theme = theme

			Page.server_info.user_settings = user_settings
			document.getElementById("style-live").innerHTML = "* { transition: all 0.5s ease-in-out }"
			Page.cmd "userSetGlobalSettings", [user_settings]
			setTimeout ( ->
				document.body.className = document.body.className.replace(/theme-[a-z]+/, "")
				document.body.className += " theme-#{theme}"
				setTimeout ( ->
					document.getElementById("style-live").innerHTML = ""
				), 1000
			), 300

		return false

	renderMenuTheme: =>
		themes = ["system", "light", "dark"]

		if Page.server_info.user_settings.use_system_theme
			theme_selected = "system"
		else
			theme_selected = Page.server_info.user_settings?.theme
			if not theme_selected then theme_selected = "system"

		h("div.menu-radio.menu-themes",
			h("div", "Theme: "),
			for theme in themes
				[
					h("a", {href: "#" + theme, onclick: @handleThemeClick, classes: {selected: theme_selected == theme, long: true}}, theme),
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
		@menu_settings.items.push [@renderMenuTheme(), null ]
		@menu_settings.items.push ["---"]
		@menu_settings.items.push [@renderMenuLanguage(), null ]
		@menu_settings.items.push ["---"]
		@menu_settings.items.push ["Create new, empty site", @handleCreateSiteClick]
		@menu_settings.items.push ["---"]
		@menu_settings.items.push [[h("div.icon-mute", ""), "Manage blocked users and sites"], @handleManageBlocksClick]
		if Page.server_info.rev >= 3520 then @menu_settings.items.push [[h("div.icon-gear.emoji", "\u2699\uFE0E"), "Configuration"], "/Config"]
		if Page.server_info.rev >= 4163 then @menu_settings.items.push [[h("div.icon-gear.emoji", "\u2B21"), "Plugins"], "/Plugins"]
		@menu_settings.items.push ["---"]
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

	handleManageBlocksClick: =>
		if Page.server_info.rev < 1880
			return Page.cmd "wrapperNotification", ["info", "You need ZeroNet 0.5.2 to use this feature."]

		Page.projector.replace($("#MuteList"), Page.mute_list.render)
		Page.mute_list.show()

	handleUpdateZeronetClick: =>
		if Page.server_info.updatesite
			Page.updateZeronet()
		else
			Page.cmd "wrapperConfirm", ["Update to latest development version?", "Update ZeroNet #{Page.latest_version}"], =>
				Page.updateZeronet()
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
				h("a.mode.stats", {href: "?Stats", classes: {active: Page.mode == "Stats"}, onclick: Page.handleLinkClick}, _("Stats"))
			])
		)

window.Head = Head
