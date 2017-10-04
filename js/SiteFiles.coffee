class SiteFiles extends Class
	constructor: (@site) ->
		@limit = 10
		@selected = {}
		@items = []
		@loaded = false
		@orderby = "time_downloaded"
		@mode = "site"
		@mode = "single_site"
		@orderby_desc = true
		@has_more = false

	handleSelectClick: (e) =>
		return false

	handleSelectEnd: (e) =>
		document.body.removeEventListener('mouseup', @handleSelectEnd)
		@select_action = null

	handleSelectMousedown: (e) =>
		inner_path = e.target.attributes.inner_path.value
		if @selected[inner_path]
			delete @selected[inner_path]
			@select_action = "deselect"
		else
			@selected[inner_path] = true
			@select_action = "select"
		Page.file_list.checkSelectedFiles()
		document.body.addEventListener('mouseup', @handleSelectEnd)
		e.stopPropagation()
		Page.projector.scheduleRender()
		return false

	handleRowMouseenter: (e) =>
		if e.buttons and @select_action
			inner_path = e.target.attributes.inner_path.value
			if @select_action == "select"
				@selected[inner_path] = true
			else
				delete @selected[inner_path]
			Page.file_list.checkSelectedFiles()
			Page.projector.scheduleRender()
		return false

	handleOrderbyClick: (e) =>
		orderby = e.currentTarget.attributes.orderby.value
		if @orderby == orderby
			@orderby_desc = not @orderby_desc
		@orderby = orderby
		@update()
		Page.projector.scheduleRender()
		return false

	handleMoreClick: =>
		@limit += 15
		@update()
		return false

	renderOrder: (title, orderby) =>
		h("a.title.orderby", {
			href: "##{orderby}",
			orderby: orderby,
			onclick: @handleOrderbyClick,
			classes: {selected: @orderby == orderby, desc: @orderby_desc}
		}, [
			title,
			h("div.icon.icon-arrow-down")
		])

	renderOrderRight: (title, orderby) =>
		h("a.title.orderby", {
			href: "##{orderby}",
			orderby: orderby,
			onclick: @handleOrderbyClick,
			classes: {selected: @orderby == orderby, desc: @orderby_desc}
		}, [
			h("div.icon.icon-arrow-down"),
			title
		])

	render: =>
		if not @items?.length
			return []
		[
			h("div.files.files-#{@mode}", exitAnimation: Animation.slideUpInout, [
				h("div.tr.thead", [
					h("div.td.pre", "."),
					if @mode == "bigfiles"
						h("div.td.site", @renderOrder("Site", "address"))
					h("div.td.inner_path", @renderOrder("Optional file", "is_pinned DESC, inner_path")),
					if @mode == "bigfiles"
						h("div.td.status", "Status")
					h("div.td.size", @renderOrderRight("Size", "size")),
					h("div.td.peer", @renderOrder("Peers", "peer")),
					h("div.td.uploaded", @renderOrder("Uploaded", "uploaded")),
					h("div.td.added", @renderOrder("Finished", "time_downloaded"))
					#h("th.access", "Access")
				]),
				h("div.tbody", @items.map (file) =>
					site = file.site or @site
					if file.peer >= 10
						profile_color = "#47d094"
					else if file.peer > 0
						profile_color = "#f5b800"
					else
						profile_color = "#d1d1d1"
					if @mode == "bigfiles"
						file.pieces ?= 0
						file.pieces_downloaded ?= 0
						if file.pieces == 0 or file.pieces_downloaded == 0
							percent = 0
						else
							percent = parseInt((file.pieces_downloaded / file.pieces) * 100)

					h("div.tr", {key: file.inner_path, inner_path: file.inner_path, exitAnimation: Animation.slideUpInout, enterAnimation: Animation.slideDown, classes: {selected: @selected[file.inner_path]}, onmouseenter: @handleRowMouseenter}, [
						h("div.td.pre",
							h("a.checkbox", {
								href: "#Select",
								onmousedown: @handleSelectMousedown,
								onclick: @handleSelectClick,
								inner_path: file.inner_path
							})
						),
						if @mode == "bigfiles"
							h("div.td.site", h("a.link", {href: site.getHref()}, site.row.content.title))
						h("div.td.inner_path",
							h("a.title.link", {href: site.getHref(file), target: "_top"}, file.inner_path.replace(/.*\//, ""))
							if file.is_pinned
								h("span.pinned", {exitAnimation: Animation.slideUpInout, enterAnimation: Animation.slideDown}, "Pinned")
						),
						if @mode == "bigfiles"
							h("div.td.status",
								h("span.percent", {title: "#{file.pieces_downloaded} of #{file.pieces} pieces downloaded", style: "box-shadow: inset #{percent * 0.8}px 0px 0px #9ef5cf;"}, "#{percent}%")
							)
						h("div.td.size", Text.formatSize(file.size)),
						h("div.td.peer", [
							h("div.icon.icon-profile", {style: "color: #{profile_color}"}),
							h("span.num", file.peer)
						]),
						h("div.td.uploaded",
							h("div.uploaded-text", Text.formatSize(file.uploaded)),
							h("div.dots-container", [
								h("span.dots.dots-bg", {title: "Ratio: #{(file.uploaded/file.size).toFixed(1)}"}, "\u2022\u2022\u2022\u2022\u2022"),
								h("span.dots.dots-fg", {title: "Ratio: #{(file.uploaded/file.size).toFixed(1)}", style: "width: #{Math.min(5, file.uploaded/file.size) * 9}px"}, "\u2022\u2022\u2022\u2022\u2022")
							])
						),
						h("div.td.added", if file.time_downloaded then Time.since(file.time_downloaded) else "n/a"),
						#h("td.access", if file.time_accessed then Time.since(file.time_accessed) else "n/a")
					])
				)
			]),
			if @has_more
				h("div.more-container", h("a.more", {href: "#More", onclick: @handleMoreClick}, "More files..."))
		]

	update: (cb) =>
		orderby = @orderby + (if @orderby_desc then " DESC" else "")
		Page.cmd "optionalFileList", {address: @site.row.address, limit: @limit+1, orderby: orderby}, (res) =>
			@items = res[0..@limit-1]
			@loaded = true
			@has_more = res.length > @limit
			Page.projector.scheduleRender()
			cb?()

window.SiteFiles = SiteFiles
