class FileList extends Class
	constructor: ->
		@need_update = true
		@updating_files = 0
		@optional_stats = {limit: "0", free: "0", used: "0"}
		@updateOptionalStats()
		@hover_totalbar = false
		@menu_totalbar = new Menu()
		@editing_limit = false
		@limit = ""
		@selected_files_num = 0
		@selected_files_size = 0
		@selected_files_pinned = 0
		@bigfiles = new Bigfiles()
		@display_limit = 0
		@

	getSites: =>
		if @bigfiles.files.items.length > 0
			back = []
			# Create separate fake site objects for bigfiles
			bigfile_sites = {}
			for file in @bigfiles.files.items
				bigfile_sites[file.site.row.address] ?= {row: file.site.row, files: {items: [], selected: @bigfiles.files.selected, update: @bigfiles.files.update}}
				bigfile_sites[file.site.row.address].files.items.push(file)

			for address, site of bigfile_sites
				back.push(site)

			# Add other sites
			back = back.concat(Page.site_list.sites)
			return back
		else
			return Page.site_list.sites

	checkSelectedFiles: =>
		@selected_files_num = 0
		@selected_files_size = 0
		@selected_files_pinned = 0
		for site in @getSites()
			for site_file in site.files.items when site.files.selected[site_file.inner_path]
				@selected_files_num += 1
				@selected_files_size += site_file.size
				@selected_files_pinned += site_file.is_pinned

	handleSelectbarCancel: =>
		for site in @getSites()
			for site_file in site.files.items
				for key, val of site.files.selected
					delete site.files.selected[key]
		@checkSelectedFiles()
		Page.projector.scheduleRender()
		return false

	handleSelectbarPin: =>
		for site in @getSites()
			inner_paths = (site_file.inner_path for site_file in site.files.items when site.files.selected[site_file.inner_path])

			if inner_paths.length > 0
				((site) ->
					Page.cmd "optionalFilePin", [inner_paths, site.row.address], ->
						site.files.update()
				)(site)
		@handleSelectbarCancel()

	handleSelectbarUnpin: =>
		for site in @getSites()
			inner_paths = (site_file.inner_path for site_file in site.files.items when site.files.selected[site_file.inner_path])

			if inner_paths.length > 0
				((site) ->
					Page.cmd "optionalFileUnpin", [inner_paths, site.row.address], ->
						site.files.update()
				)(site)
		@handleSelectbarCancel()

	handleSelectbarDelete: =>
		for site in @getSites()
			inner_paths = (site_file.inner_path for site_file in site.files.items when site.files.selected[site_file.inner_path])

			if inner_paths.length > 0
				for inner_path in inner_paths
					Page.cmd "optionalFileDelete", [inner_path, site.row.address]
				site.files.update()
		Page.site_list.update()
		@handleSelectbarCancel()

	handleTotalbarOver: =>
		@hover_totalbar = true
		Page.projector.scheduleRender()

	handleTotalbarOut: =>
		@hover_totalbar = false
		Page.projector.scheduleRender()

	handleEditlimitClick: =>
		@editing_limit = true
		return false

	handleLimitCancelClick: =>
		@editing_limit = false
		return false

	handleLimitSetClick: =>
		if @limit.indexOf("M") > 0 or @limit.indexOf("m") > 0
			limit = (parseFloat(@limit) / 1024).toString()
		else if @limit.indexOf("%") > 0
			limit = parseFloat(@limit) + "%"
		else
			limit = parseFloat(@limit).toString()
		@optional_stats.limit = limit
		Page.cmd("optionalLimitSet", limit)

		@editing_limit = false
		return false

	handleTotalbarMenu: =>
		@menu_totalbar.items = []
		@menu_totalbar.items.push ["Edit optional files limit", @handleEditlimitClick]

		if @menu_totalbar.visible
			@menu_totalbar.hide()
		else
			@menu_totalbar.show()
		return false

	handleLimitInput: (e) =>
		@limit = e.target.value

	renderTotalbar: =>
		###
		size_optional = 0
		optional_downloaded = 0
		for site in Page.site_list.sites
			size_optional += site.row.settings.size_optional
			optional_downloaded += site.row.settings.optional_downloaded
		###
		if @editing_limit and parseFloat(@limit) > 0
			if @limit.indexOf("M") > 0 or @limit.indexOf("m") > 0
				limit = (parseFloat(@limit) / 1024) + "GB"
			else
				limit = @limit
		else
			limit = @optional_stats.limit

		if limit.endsWith("%")
			limit = @optional_stats.free * (parseFloat(limit)/100)
		else
			limit = parseFloat(limit) * 1024 * 1024 * 1024

		if @optional_stats.free > limit * 1.8 and not @hover_totalbar
			total_space_limited = limit * 1.8  # Too much free space, keep it visible
		else
			total_space_limited = @optional_stats.free


		percent_optional_downloaded = (@optional_stats.used/limit) * 100
		percent_optional_used = percent_optional_downloaded * (limit/total_space_limited)
		percent_limit = (limit/total_space_limited) * 100

		h("div#FileListDashboard", {classes: {editing: @editing_limit}}, [
			h("div.totalbar-edit", [
				h("span.title", "Optional files limit:"),
				h("input", {type: "text", value: @limit, oninput: @handleLimitInput}),
				h("a.set", {href: "#", onclick: @handleLimitSetClick}, "Set"),
				h("a.cancel", {href: "#", onclick: @handleLimitCancelClick}, "Cancel")
			]),
			h("a.totalbar-title", {href: "#", title: "Space current used by optional files", onclick: @handleTotalbarMenu},
				"Used: #{Text.formatSize(@optional_stats.used)} / #{Text.formatSize(limit)} (#{Math.round(percent_optional_downloaded)}%)",
				h("div.icon-arrow-down")
			),
			@menu_totalbar.render(),
			h("div.totalbar", { onmouseover: @handleTotalbarOver, onmouseout: @handleTotalbarOut },
				h("div.totalbar-used", {style: "width: #{percent_optional_used}%"}),
				h("div.totalbar-limitbar", {style: "width: #{percent_limit}%"}),
				h("div.totalbar-limit", {style: "margin-left: #{percent_limit}%"},
					h("span", {title: "Space allowed to used by optional files"}, Text.formatSize(limit))
				)
				h("div.totalbar-hddfree",
					h("span", {title: "Total free space on your storage"}, [
						Text.formatSize(@optional_stats.free),
						h("div.arrow", { style: if @optional_stats.free > total_space_limited then "width: 10px" else "width: 0px" }, " \u25B6")
					])
				)
			)
		])

	renderSelectbar: =>
		h("div.selectbar", {classes: {visible: @selected_files_num > 0}}, [
			"Selected:",
			h("span.info", [
				h("span.num", "#{@selected_files_num} files"),
				h("span.size", "(#{Text.formatSize(@selected_files_size)})"),
			])
			h("div.actions", [
				if @selected_files_pinned > @selected_files_num / 2
					h("a.action.pin.unpin", {href: "#", onclick: @handleSelectbarUnpin}, "UnPin")
				else
					h("a.action.pin", {href: "#", title: "Don't delete these files automatically", onclick: @handleSelectbarPin}, "Pin")
				h("a.action.delete", {href: "#", onclick: @handleSelectbarDelete}, "Delete")
			])
			h("a.cancel.link", {href: "#", onclick: @handleSelectbarCancel}, "Cancel")
		])

	updateOptionalStats: =>
		Page.cmd "optionalLimitStats", [], (res) =>
			@limit = res.limit
			if not @limit.endsWith("%")
				@limit += " GB"
			@optional_stats = res

	updateAllFiles: =>
		@updating_files = 0
		used = 0
		Page.site_list.sites.map (site) =>
			if not site.row.settings.size_optional
				return
			@updating_files += 1
			used += site.row.settings.optional_downloaded
			site.files.update =>
				@updating_files -= 1
		@updating_files += 1
		@bigfiles.files.update =>
			@updating_files -= 1

	render: =>
		if Page.site_list.sites and not @need_update and @updating_files == 0and document.body.className != "loaded"
			document.body.className = "loaded"
		if @need_update and Page.site_list.sites.length
			@updateAllFiles()
			@need_update = false

		sites = (site for site in Page.site_list.sites when site.row.settings.size_optional)
		sites_favorited = (site for site in sites when site.favorite)
		sites_connected = (site for site in sites when not site.favorite)
		if sites.length > 0 and sites[0].files.loaded == false
			# Sites loaded but not site files yet
			if sites_favorited.length
				sites_favorited = [sites_favorited[0]]
				sites_connected = []
			else
				sites_favorited = []
				sites_connected = [sites_connected[0]]

		if sites.length == 0
			document.body.className = "loaded"
			return h("div#FileList",
				@renderSelectbar()
				@renderTotalbar()
				h("div.empty", [
					h("h4", "Hello newcomer!"),
					h("small", "You have not downloaded any optional files yet")
				])
			)

		# Progressive display of sites to large ui blocks
		if @display_limit < sites.length
			setTimeout ( =>
				@display_limit += 1
				Page.projector.scheduleRender()
			), 1000

		h("div#FileList", [
			@renderSelectbar()
			@renderTotalbar()
			@bigfiles.render()
			sites_favorited[0..@display_limit].map (site) =>
				site.renderOptionalStats()
			sites_connected[0..@display_limit].map (site) =>
				site.renderOptionalStats()
		])

	onSiteInfo: (site_info) =>
		if site_info.event?[0] == "peers_added"
			return false
		if site_info.tasks == 0 and site_info.event?[0] == "file_done"
			rate_limit = 1000
		else
			rate_limit = 10000
		RateLimit rate_limit, =>
			@need_update = true

window.FileList = FileList