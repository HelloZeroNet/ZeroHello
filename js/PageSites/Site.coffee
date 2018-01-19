class Site extends Class
	constructor: (row, @item_list) ->
		@deleted = false
		@show_errors = false
		@message_visible = false
		@message = null
		@message_class = ""
		@message_collapsed = false
		@message_timer = null
		@favorite = Page.settings.favorite_sites[row.address]
		@key = row.address
		@optional_helps = []
		@optional_helps_disabled = {}
		@setRow(row)
		@files = new SiteFiles(@)
		@menu = new Menu()
		@menu_helps = null

	setRow: (row) ->
		# Message
		if row.event?[0] == "updated" and row.content_updated != false
			@setMessage "Updated!", "done"
		else if row.event?[0] == "updating"
			@setMessage "Updating..."
		else if row.tasks > 0
			@setMessage "Updating: #{Math.max(row.tasks, row.bad_files)} left"
		else if row.bad_files > 0
			if row.peers <= 1
				@setMessage "No peers", "error"
			else
				@setMessage row.bad_files+" file update failed", "error"
		else if row.content_updated == false
			if row.peers <= 1
				@setMessage "No peers", "error"
			else
				@setMessage "Update failed", "error"
		else if row.tasks == 0 and @row?.tasks > 0
			@setMessage "Updated!", "done"

		if not row.body?
			row.body = ""

		@optional_helps = ([key, val] for key, val of row.settings.optional_help)

		@row = row

	setMessage: (message, @message_class="") ->
		# Set message
		if message
			@message = message
			@message_visible = true
			if @message_class == "error" and not @show_errors
				@message_collapsed = true
			else
				@message_collapsed = false

		else
			@message_visible = false

		# Hide done message after 3 seconds
		clearInterval(@message_timer)
		if @message_class == "done"
			@message_timer = setTimeout (=>
				@setMessage("")
			), 5000
		Page.projector.scheduleRender()

	isWorking: ->
		@row.tasks > 0 or @row.event?[0] == "updating"


	handleFavoriteClick: =>
		@favorite = true
		@menu = new Menu()
		Page.settings.favorite_sites[@row.address] = true
		Page.saveSettings()
		Page.site_list.reorder()
		return false

	handleUnfavoriteClick: =>
		@favorite = false
		@menu = new Menu()
		delete Page.settings.favorite_sites[@row.address]
		Page.saveSettings()
		Page.site_list.reorder()
		return false

	handleUpdateClick: =>
		Page.cmd "siteUpdate", {"address": @row.address}
		@show_errors = true
		return false

	handleCheckfilesClick: =>
		Page.cmd "siteUpdate", {"address": @row.address, "check_files": true, since: 0}
		@show_errors = true
		return false

	handleResumeClick: =>
		Page.cmd "siteResume", {"address": @row.address}
		return false

	handlePauseClick: =>
		Page.cmd "sitePause", {"address": @row.address}
		return false

	handleCloneClick: =>
		Page.cmd "siteClone", {"address": @row.address}
		return false

	handleCloneUpgradeClick: =>
		Page.cmd "wrapperConfirm", ["Are you sure?" + " Any modifications you made on<br><b>#{@row.content.title}</b> site's js/css files will be lost.", "Upgrade"], (confirmed) =>
			Page.cmd "siteClone", {"address": @row.content.cloned_from, "root_inner_path": @row.content.clone_root, "target_address": @row.address}
		return false

	handleDeleteClick: =>
		if @row.settings.own
			Page.cmd "wrapperNotification", ["error", "Sorry, you can't delete your own site.<br>Please remove the directory manually."]
		else
			if Page.server_info.rev > 2060
				Page.cmd "wrapperConfirm", ["Are you sure?" + " <b>#{@row.content.title}</b>", ["Delete", "Blacklist"]], (confirmed) =>
					if confirmed == 1
						Page.cmd "siteDelete", {"address": @row.address}
						@item_list.deleteItem(@)
						Page.projector.scheduleRender()
					else if confirmed == 2
						Page.cmd "wrapperPrompt", ["Blacklist <b>#{@row.content.title}</b>", "text", "Delete and Blacklist", "Reason"], (reason) =>
							Page.cmd "siteDelete", {"address": @row.address}
							Page.cmd "blacklistAdd", [@row.address, reason]
							@item_list.deleteItem(@)
							Page.projector.scheduleRender()
			else
				Page.cmd "wrapperConfirm", ["Are you sure?" + " <b>#{@row.content.title}</b>", "Delete"], (confirmed) =>
					if confirmed
						Page.cmd "siteDelete", {"address": @row.address}
						@item_list.deleteItem(@)
						Page.projector.scheduleRender()
		return false

	handleSettingsClick: (e) =>
		@menu.items = []
		if @favorite
			@menu.items.push ["Unfavorite", @handleUnfavoriteClick]
		else
			@menu.items.push ["Favorite", @handleFavoriteClick]
		@menu.items.push ["Update", @handleUpdateClick]
		@menu.items.push ["Check files", @handleCheckfilesClick]
		if @row.settings.serving
			@menu.items.push ["Pause", @handlePauseClick]
		else
			@menu.items.push ["Resume", @handleResumeClick]
		if @row.content.cloneable == true
			@menu.items.push ["Clone", @handleCloneClick]
		if @row.settings.own and @row.content.cloned_from and Page.server_info.rev >= 2080
			@menu.items.push ["---"]
			@menu.items.push ["Upgrade code", @handleCloneUpgradeClick]
		@menu.items.push ["---"]
		@menu.items.push ["Delete", @handleDeleteClick]

		if @menu.visible
			@menu.hide()
		else
			@menu.show()
		return false

	handleHelpClick: (directory, title) =>
		if @optional_helps_disabled[directory]
			Page.cmd "OptionalHelp", [directory, title, @row.address]
			delete @optional_helps_disabled[directory]
		else
			Page.cmd "OptionalHelpRemove", [directory, @row.address]
			@optional_helps_disabled[directory] = true
		return true

	handleHelpAllClick: =>
		if @row.settings.autodownloadoptional == true
			Page.cmd "OptionalHelpAll", [false, @row.address], =>
				@row.settings.autodownloadoptional = false
				Page.projector.scheduleRender()
		else
			Page.cmd "OptionalHelpAll", [true, @row.address], =>
				@row.settings.autodownloadoptional = true
				Page.projector.scheduleRender()

	handleHelpsClick: (e) =>
		if e.target.classList.contains("menu-item")
			return
		if not @menu_helps
			@menu_helps = new Menu()

		@menu_helps.items = []
		@menu_helps.items.push ["Help distribute all new files", @handleHelpAllClick, ( => return @row.settings.autodownloadoptional)]
		if @optional_helps.length > 0
			@menu_helps.items.push ["---"]
		for [directory, title] in @optional_helps
			@menu_helps.items.push [title, ( => @handleHelpClick(directory, title) ), ( => return not @optional_helps_disabled[directory] )]

		@menu_helps.toggle()

		return true

	getHref: (row) ->
		has_plugin = Page.server_info?.plugins? and ("Zeroname" in Page.server_info.plugins or "Dnschain" in Page.server_info.plugins or "Zeroname-local" in Page.server_info.plugins)
		if has_plugin and @row.content?.domain # Domain
			href = Text.getSiteUrl(@row.content.domain)
		else # Address
			href = Text.getSiteUrl(@row.address)

		if row?.inner_path
			return href + row.inner_path
		else
			return href

	handleLimitIncreaseClick: =>
		if Page.server_info.rev < 3170
			return Page.cmd "wrapperNotification", ["info", "You need ZeroNet Rev3170 to use this command"]

		Page.cmd "as", [@row.address, "siteSetLimit", @row.need_limit], (res) =>
			if res == "ok"
				Page.cmd "wrapperNotification", ["done", "Site <b>#{@row.content.title}</b> storage limit modified to <b>#{@row.need_limit}MB</b>", 5000]
			else
				Page.cmd "wrapperNotification", ["error", res.error]

			Page.projector.scheduleRender()

		return false

	render: =>
		now = Date.now()/1000
		h("div.site", {
			key: @key, "data-key": @key,
			classes: {
				"modified-lastday": now - @row.settings.modified < 60*60*24,
				"disabled": not @row.settings.serving and not @row.demo,
				"working": @isWorking()
			}
		},
			h("div.circle", {style: "color: #{Text.toColor(@row.address, 40, 50)}"}, ["\u2022"]),
			h("a.inner", {href: @getHref(), title: @row.content.title if @row.content.title?.length > 20}, [
				h("span.title", [@row.content.title]),
				h("div.details", [
					h("span.modified", [
						h("div.icon-clock")
						if Page.settings.sites_orderby == "size"
							h("span.value", [(@row.settings.size/1024/1024 + @row.settings.size_optional?/1024/1024).toFixed(1), "MB"])
						else
							h("span.value", [Time.since(@row.settings.modified)])
					]),
					h("span.peers", [
						h("div.icon-profile")
						h("span.value", [Math.max((if @row.settings.peers then @row.settings.peers else 0), @row.peers)])
					])
				])
				if @row.demo
					h("div.details.demo", "Activate \u00BB")
				if @row.need_limit
					h("a.details.needaction", {href: "#Set+limit", onclick: @handleLimitIncreaseClick}, "Set limit to #{@row.need_limit}MB")
				h("div.message",
					{classes: {visible: @message_visible, done: @message_class == 'done', error: @message_class == 'error', collapsed: @message_collapsed}},
					[@message]
				)
			]),
			h("a.settings", {href: "#Settings", tabIndex: -1, onmousedown: @handleSettingsClick, onclick: Page.returnFalse}, ["\u22EE"]),
			@menu.render()
		)

	renderCircle: (value, max) ->
		if value < 1
			dashoffset = 75+(1-value)*75
		else
			dashoffset = Math.max(0, 75-((value-1)/9)*75)
		stroke = "hsl(#{Math.min(555, value*50)}, 100%, 61%)"
		return h("div.circle", {title: "Upload/Download ratio", innerHTML: """
		<svg class="circle-svg" width="30" height="30" viewPort="0 0 30 30" version="1.1" xmlns="http://www.w3.org/2000/svg">
  			<circle r="12" cx="15" cy="15" fill="transparent" class='circle-bg'></circle>
  			<circle r="12" cx="15" cy="15" fill="transparent" class='circle-fg' style='stroke-dashoffset: #{dashoffset}; stroke: #{stroke}'></circle>
		</svg>
		"""})

	renderOptionalStats: =>
		row = @row
		ratio = (row.settings.bytes_sent/row.settings.bytes_recv).toFixed(1)
		if ratio >= 100
			ratio = "\u221E"
		else if ratio >= 10
			ratio = (row.settings.bytes_sent/row.settings.bytes_recv).toFixed(0)
		ratio_hue = Math.min(555, (row.settings.bytes_sent/row.settings.bytes_recv)*50)
		h("div.site", {key: @key}, [
			h("div.title", [
				h("h3.name", h("a", {href: @getHref()}, row.content.title)),
				h("div.size", {title: "Site size limit: #{Text.formatSize(row.size_limit*1024*1024)}"}, [
					"#{Text.formatSize(row.settings.size)}",
					h("div.bar", h("div.bar-active", {style: "width: #{100*(row.settings.size/(row.size_limit*1024*1024))}%"}))
				]),
				h("div.plus", "+"),
				h("div.size.size-optional", {title: "Optional files on site: #{Text.formatSize(row.settings.size_optional)}"}, [
					"#{Text.formatSize(row.settings.optional_downloaded)}",
					h("span.size-title", "Optional"),
					h("div.bar", h("div.bar-active", {style: "width: #{100*(row.settings.optional_downloaded/row.settings.size_optional)}%"}))
				]),
				h("a.helps", {href: "#", onmousedown: @handleHelpsClick, onclick: Page.returnFalse},
					h("div.icon-share"),
					if @row.settings.autodownloadoptional then "\u2661" else @optional_helps.length,
					h("div.icon-arrow-down")
					if @menu_helps then @menu_helps.render()
				),
				@renderCircle(parseFloat((row.settings.bytes_sent/row.settings.bytes_recv).toFixed(1)), 10),
				h("div.circle-value", {classes: {negative: ratio < 1}, style: "color: hsl(#{ratio_hue}, 70%, 60%)"}, ratio),
				h("div.transfers", [
					h("div.up", {"title": "Uploaded"}, "\u22F0 \u00A0#{Text.formatSize(row.settings.bytes_sent)}"),
					h("div.down", {"title": "Downloaded"}, "\u22F1 \u00A0#{Text.formatSize(row.settings.bytes_recv)}")
				])
			])
			@files.render()
		])


window.Site = Site
