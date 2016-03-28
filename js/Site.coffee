class Site extends Class
	constructor: (row, @item_list) ->
		@deleted = false
		@show_errors = false
		@message_visible = false
		@message = null
		@message_class = ""
		@message_collapsed = false
		@message_timer = null
		@favorite = Page.local_storage.favorite_sites[row.address]
		@key = row.address
		@setRow(row)
		@menu = new Menu()

	setRow: (row) ->
		# Message
		if row.event?[0] == "updated" and row.content_updated != false
			@setMessage "Updated!", "done"
		else if row.event?[0] == "updating"
			@setMessage "Updating..."
		else if row.tasks > 0
			@setMessage "Updating: #{row.tasks} left"
		else if row.bad_files > 0
			@setMessage row.bad_files+" file update failed", "error"
		else if row.content_updated == false
			if row.peers <= 1
				@setMessage "No peers", "error"
			else
				@setMessage "Update failed", "error"
		else if row.tasks == 0 and @row?.tasks > 0
			@setMessage "Updated!", "done"

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
		Page.local_storage.favorite_sites[@row.address] = true
		Page.saveLocalStorage()
		Page.site_list.reorder()
		return false

	handleUnfavoriteClick: =>
		@favorite = false
		@menu = new Menu()
		delete Page.local_storage.favorite_sites[@row.address]
		Page.saveLocalStorage()
		Page.site_list.reorder()
		return false

	handleUpdateClick: =>
		Page.cmd "siteUpdate", {"address": @row.address}
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

	handleDeleteClick: =>
		if @row.settings.own
			Page.cmd "wrapperNotification", ["error", "Sorry, you can't delete your own site.<br>Please remove the directory manually."]
		else
			Page.cmd "wrapperConfirm", ["Are you sure? <b>#{@row.content.title}</b>", "Delete"], (confirmed) =>
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
		if @row.settings.serving
			@menu.items.push ["Pause", @handlePauseClick]
		else
			@menu.items.push ["Resume", @handleResumeClick]
		if @row.content.cloneable == true
			@menu.items.push ["Clone", @handleCloneClick]
		@menu.items.push ["---"]
		@menu.items.push ["Delete", @handleDeleteClick]

		if @menu.visible
			@menu.hide()
		else
			@menu.show()
		return false


	getHref: ->
		has_plugin = Page.server_info?.plugins? and ("Zeroname" in Page.server_info.plugins or "Dnschain" in Page.server_info.plugins or "Zeroname-local" in Page.server_info.plugins)
		if has_plugin and @row.content?.domain # Domain
			href = Text.getSiteUrl(@row.content.domain)
		else # Address
			href = Text.getSiteUrl(@row.address)
		return href


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
			h("a.inner", {href: @getHref(), title: @row.content.title if @row.content.title.length > 20}, [
				h("span.title", [@row.content.title]),
				h("div.details", [
					h("span.modified", [
						h("div.icon-clock")
						h("span.value", [Time.since(@row.settings.modified)])
					]),
					h("span.peers", [
						h("div.icon-profile")
						h("span.value", [Math.max((if @row.settings.peers then @row.settings.peers else 0), @row.peers)])
					])
				])
				if @row.demo
					h("div.details.demo", "Activate \u00BB")
				h("div.message",
					{classes: {visible: @message_visible, done: @message_class == 'done', error: @message_class == 'error', collapsed: @message_collapsed}},
					[@message]
				)
			]),
			h("a.settings", {href: "#", onmousedown: @handleSettingsClick, onclick: Page.returnFalse}, ["\u22EE"]),
			@menu.render()
		)


window.Site = Site
