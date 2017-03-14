class Dashboard extends Class
	constructor: ->
		@menu_newversion = new Menu()
		@menu_tor = new Menu()
		@menu_port = new Menu()
		@menu_multiuser = new Menu()
		@menu_donate = new Menu()
		@menu_browserwarning = new Menu()
		@menu_torbrowserwarning = new Menu()

		@port_checking = false
		@has_web_gl = null

	isTorAlways: ->
		return Page.server_info.fileserver_ip == "127.0.0.1"

	hasWebGl: ->
		if @has_web_gl == null
			canvas = document.createElement('canvas')
			ctx = canvas.getContext("webgl")
			@has_web_gl = if ctx then true else false
			@log "Webgl:", @has_web_gl
		return @has_web_gl

	getTorTitle: ->
		tor_title = Page.server_info.tor_status.replace(/\((.*)\)/, "").trim()
		if tor_title == "Disabled" then tor_title = _("Disabled")
		else if tor_title == "Error" then tor_title = _("Error")
		return tor_title

	handleTorClick: =>
		@menu_tor.items = []
		@menu_tor.items.push ["Status: #{Page.server_info?.tor_status}", "http://zeronet.readthedocs.org/en/latest/faq/#how-to-make-zeronet-work-with-tor-under-linux"]
		if @getTorTitle() != "OK"
			@menu_tor.items.push ["How to make Tor connection work?", "http://zeronet.readthedocs.org/en/latest/faq/#how-to-make-zeronet-work-with-tor-under-linux"]
		@menu_tor.items.push ["How to use ZeroNet in Tor Browser?", "http://zeronet.readthedocs.org/en/latest/faq/#how-to-use-zeronet-in-tor-browser"]
		@menu_tor.items.push ["---"]
		if @isTorAlways()
			@menu_tor.items.push ["Disable always Tor mode", @handleDisableAlwaysTorClick]
		else
			@menu_tor.items.push ["Enable Tor for every connection (slower)", @handleEnableAlwaysTorClick]

		@menu_tor.toggle()
		return false

	handleEnableAlwaysTorClick: =>
		Page.cmd "configSet", ["tor", "always"], (res) =>
			Page.cmd "wrapperNotification", ["done", "Tor always mode enabled, please restart your ZeroNet to make it work.<br>For your privacy switch to Tor browser and start a new profile by renaming the data directory."]

	handleDisableAlwaysTorClick: =>
		Page.cmd "configSet", ["tor", null], (res) =>
			Page.cmd "wrapperNotification", ["done", "Tor always mode disabled, please restart your ZeroNet."]

	handlePortClick: =>
		@menu_port.items = []
		if Page.server_info.ip_external
			@menu_port.items.push ["Nice! Your port #{Page.server_info.fileserver_port} is opened.", "http://zeronet.readthedocs.org/en/latest/faq/#do-i-need-to-have-a-port-opened"]
		else if @isTorAlways()
			@menu_port.items.push ["Good, your port is always closed when using ZeroNet in Tor always mode.", "http://zeronet.readthedocs.org/en/latest/faq/#do-i-need-to-have-a-port-opened"]
		else if @getTorTitle() == "OK"
			@menu_port.items.push ["Your port #{Page.server_info.fileserver_port} is closed, but your Tor gateway is running well.", "http://zeronet.readthedocs.org/en/latest/faq/#do-i-need-to-have-a-port-opened"]
		else
			@menu_port.items.push ["Your port #{Page.server_info.fileserver_port} is closed. You are still fine, but for faster experience try open it.", "http://zeronet.readthedocs.org/en/latest/faq/#do-i-need-to-have-a-port-opened"]

		@menu_port.items.push ["---"]
		@menu_port.items.push ["Re-check opened port", @handlePortRecheckClick]

		@menu_port.toggle()
		return false

	handlePortRecheckClick: =>
		@port_checking = true
		Page.cmd "serverPortcheck", [], (res) =>
			@port_checking = false
			Page.reloadServerInfo()

	handleMultiuserClick: =>
		@menu_multiuser.items = []
		@menu_multiuser.items.push ["Show your masterseed", ( -> Page.cmd "userShowMasterSeed" )]
		@menu_multiuser.items.push ["Logout", ( -> Page.cmd "userLogout" )]

		@menu_multiuser.toggle()
		return false

	handleDonateClick: =>
		@menu_donate.items = []
		@menu_donate.items.push ["Help to keep this project alive", "https://zeronet.readthedocs.org/en/latest/help_zeronet/donate/"]

		@menu_donate.toggle()
		return false

	handleLogoutClick: =>
		Page.cmd "uiLogout"

	handleNewversionClick: =>
		@menu_newversion.items = []
		@menu_newversion.items.push ["Update and restart ZeroNet", ( ->
			Page.cmd "wrapperNotification", ["info", "Updating to latest version...<br>Please restart ZeroNet manually if it does not come back in the next few minutes.", 8000]
			Page.cmd "serverUpdate"
		)]

		@menu_newversion.toggle()
		return false

	handleBrowserwarningClick: =>
		@menu_browserwarning.items = []
		@menu_browserwarning.items.push ["Internet Explorer is not fully supported browser by ZeroNet, please consider switching to Chrome or Firefox", "http://browsehappy.com/"]
		@menu_browserwarning.toggle()
		return false


	handleTorBrowserwarningClick: =>
		@menu_torbrowserwarning.items = []
		@menu_torbrowserwarning.items.push ["To protect your anonymity you should use ZeroNet in the Tor browser.", "http://zeronet.readthedocs.io/en/latest/faq/#how-to-use-zeronet-in-tor-browser"]
		@menu_torbrowserwarning.toggle()
		return false

	render: =>
		if Page.server_info
			tor_title = @getTorTitle()
			h("div#Dashboard",
				# IE not supported
				if navigator.userAgent.match /(\b(MS)?IE\s+|Trident\/7.0)/
					h("a.port.dashboard-item.browserwarning", {href: "http://browsehappy.com/", onmousedown: @handleBrowserwarningClick, onclick: Page.returnFalse}, [
						h("span", "Unsupported browser")
					])
				@menu_browserwarning.render(".menu-browserwarning")

				# No tor browser detected
				if @isTorAlways() and (not navigator.userAgent.match(/(Firefox)/) or @hasWebGl() or navigator.serviceWorker?)
					h("a.port.dashboard-item.torbrowserwarning", {href: "http://zeronet.readthedocs.io/en/latest/faq/#how-to-use-zeronet-in-tor-browser", onmousedown: @handleTorBrowserwarningClick, onclick: Page.returnFalse}, [
						h("span", "Your browser is not safe")
					])
				@menu_torbrowserwarning.render(".menu-browserwarning")

				# Update
				if parseFloat(Page.server_info.version.replace(".", "0")) < parseFloat(Page.latest_version.replace(".", "0"))
					h("a.newversion.dashboard-item", {href: "#Update", onmousedown: @handleNewversionClick, onclick: Page.returnFalse}, "New ZeroNet version: #{Page.latest_version}")
				@menu_newversion.render(".menu-newversion")

				# Donate
				h("a.port.dashboard-item.donate", {"href": "#Donate", onmousedown: @handleDonateClick, onclick: Page.returnFalse}, [h("div.icon-heart")]),
				@menu_donate.render(".menu-donate")

				# Multiuser
				if Page.server_info.multiuser
					h("a.port.dashboard-item.multiuser", {href: "#Multiuser", onmousedown: @handleMultiuserClick, onclick: Page.returnFalse}, [
						h("span", "User: "),
						h("span.status",
							{style: "color: #{Text.toColor(Page.server_info.master_address)}"},
							Page.server_info.master_address[0..4]+".."+Page.server_info.master_address[-4..]
						)
					])
				if Page.server_info.multiuser
					@menu_multiuser.render(".menu-multiuser")

				if "UiPassword" in Page.server_info.plugins
					h("a.port.dashboard-item.logout", {href: "#Logout", onmousedown: @handleLogoutClick, onclick: Page.returnFalse}, [
						h("span", "Logout"),
					])

				# Port open status
				h("a.port.dashboard-item.port", {href: "#Port", classes: {bounce: @port_checking}, onmousedown: @handlePortClick, onclick: Page.returnFalse}, [
					h("span", "Port: "),
					if @port_checking
						h("span.status", "Checking")
					else if Page.server_info.ip_external == null
						h("span.status", "Checking")
					else if Page.server_info.ip_external == true
						h("span.status.status-ok", "Opened")
					else if @isTorAlways
						h("span.status.status-ok", "Closed")
					else if tor_title == "OK"
						h("span.status.status-warning", "Closed")
					else
						h("span.status.status-bad", "Closed")
				]),
				@menu_port.render(".menu-port"),
				# Tor status
				h("a.tor.dashboard-item.tor", {href: "#Tor", onmousedown: @handleTorClick, onclick: Page.returnFalse}, [
					h("span", "Tor: "),
					if tor_title == "OK"
						if @isTorAlways()
							h("span.status.status-ok", "Always")
						else
							h("span.status.status-ok", "Available")
					else
						h("span.status.status-warning", tor_title)
				]),
				@menu_tor.render(".menu-tor")
			)
		else
			h("div#Dashboard")


window.Dashboard = Dashboard