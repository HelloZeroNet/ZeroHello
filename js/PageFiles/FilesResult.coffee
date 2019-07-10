class FilesResult extends Class
	constructor: ->
		@files = new SiteFiles(@)
		@files.mode = "result"
		@files.limit = 20
		@files.update = @updateFiles
		@row = {"address": "result"}
		@filter_inner_path = ""

	updateFiles: (cb) =>
		@log "Update FilesResult", @filter_inner_path
		if Page.server_info.rev < 4120
			Page.projector.scheduleRender()
			return cb?()
		orderby = @files.orderby + (if @files.orderby_desc then " DESC" else "")
		Page.cmd "optionalFileList", {address: "all", filter: "downloaded", filter_inner_path: "%#{@filter_inner_path}%", limit: @files.limit+1, orderby: orderby}, (res) =>
			for row in res
				row.site = Page.site_list.sites_byaddress[row.address]
			@files.items = res[0..@files.limit-1]
			@files.loaded = true
			@files.has_more = res.length > @files.limit
			Page.projector.scheduleRender()
			cb?()

	setFilter: (filter, cb) =>
		@filter_inner_path = filter
		@updateFiles(cb)

	getHref: (row) =>
		return row.inner_path

	render: =>
		if Page.server_info.rev < 4120
			return h("div.empty", [
					h("h4", "Feature not supported"),
					h("small", "You need to update to the latest version to use this feature")
				])
		if not @filter_inner_path
			return []
		if not @files.items.length
			return h("div.empty", [
					h("h4", "Filter result: #{@filter_inner_path}"),
					h("small", "No files found")
				])

		h("div.site", [
			h("div.title", [h("h3.name", "Filter result: #{@filter_inner_path}")])
			@files.render()
		])

window.FilesResult = FilesResult