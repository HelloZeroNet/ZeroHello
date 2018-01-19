class Bigfiles extends Class
	constructor: ->
		@files = new SiteFiles(@)
		@files.mode = "bigfiles"
		@files.limit = 100
		@files.update = @updateFiles
		@row = {"address": "bigfiles"}

	updateFiles: (cb) =>
		if Page.server_info.rev < 3090
			return cb?()
		orderby = @files.orderby + (if @files.orderby_desc then " DESC" else "")
		Page.cmd "optionalFileList", {address: "all", filter: "downloaded,bigfile", limit: @files.limit+1, orderby: orderby}, (res) =>
			for row in res
				row.site = Page.site_list.sites_byaddress[row.address]
			@files.items = res[0..@files.limit-1]
			@files.loaded = true
			@files.has_more = res.length > @files.limit
			Page.projector.scheduleRender()
			cb?()

	getHref: (row) =>
		return row.inner_path

	render: =>
		if not @files.items.length
			return []

		h("div.Site", [
			h("div.title", [h("h3.name", "Bigfiles")])
			@files.render()
		])

window.Bigfiles = Bigfiles
