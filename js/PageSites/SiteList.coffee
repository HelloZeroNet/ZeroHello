class SiteList extends Class
	constructor: ->
		@item_list = new ItemList(Site, "address")
		@sites = @item_list.items
		@sites_byaddress = @item_list.items_bykey
		@inactive_demo_sites = null
		@loaded = false
		@schedule_reorder = false
		@merged_db = {}
		@filtering = ""
		setInterval(@reorderTimer, 10000)

		Page.on_settings.then =>
			@update()
			Page.cmd "channelJoinAllsite", {"channel": "siteChanged"}

	reorderTimer: =>
		if not @schedule_reorder
			return

		# Don't reorder if user if over site list or any of the sites are updating
		if not document.querySelector('.left:hover') and not document.querySelector(".working") and not Page.mode == "Files"
			@reorder()
			@schedule_reorder = false

	sortRows: (rows) =>
		if Page.settings.sites_orderby == "modified"
			rows.sort (a, b) ->
				return b.row.settings.modified - a.row.settings.modified
		else if Page.settings.sites_orderby == "addtime"
			rows.sort (a, b) ->
				return (b.row.settings.added or 0) - (a.row.settings.added or 0)
		else if Page.settings.sites_orderby == "size"
			rows.sort (a, b) ->
				return b.row.settings.size - a.row.settings.size
		else
			rows.sort (a, b) ->
				return Math.max(b.row.peers, b.row.settings.peers) - Math.max(a.row.peers, a.row.settings.peers)
		return rows

	reorder: =>
		@sortRows(@item_list.items)
		Page.projector.scheduleRender()

	update: ->
		Page.cmd "siteList", {}, (site_rows) =>
			favorite_sites = Page.settings.favorite_sites

			@item_list.sync(site_rows)

			@sortRows(@item_list.items)

			if @inactive_demo_sites == null
				@updateInactiveDemoSites()
			Page.projector.scheduleRender()
			@loaded = true
		@

	updateInactiveDemoSites: ->
		demo_site_rows = [
			{address: "1Gfey7wVXXg1rxk751TBTxLJwhddDNfcdp", demo: true, content: {title: "ZeroBoard", domain: "Board.ZeroNetwork.bit"}, settings: {}}
			{address: "1TaLkFrMwvbNsooF4ioKAY9EuxTBTjipT", demo: true, content: {title: "ZeroTalk", domain: "Talk.ZeroNetwork.bit"}, settings: {}}
			{address: "1BLogC9LN4oPDcruNz3qo1ysa133E9AGg8", demo: true, content: {title: "ZeroBlog", domain: "Blog.ZeroNetwork.bit"}, settings: {}}
			{address: "1MaiL5gfBM1cyb4a8e3iiL8L5gXmoAJu27", demo: true, content: {title: "ZeroMail", domain: "Mail.ZeroNetwork.bit"}, settings: {}}
			{address: "1uPLoaDwKzP6MCGoVzw48r4pxawRBdmQc", demo: true, content: {title: "ZeroUp"}, settings: {}}
			{address: "1Gif7PqWTzVWDQ42Mo7np3zXmGAo3DXc7h", demo: true, content: {title: "GIF Time"}, settings: {}}
			{address: "1SiTEs2D3rCBxeMoLHXei2UYqFcxctdwB", demo: true, content: {title: "More @ ZeroSites", domain: "Sites.ZeroNetwork.bit"}, settings: {}}
		]
		if Page.server_info.rev >= 1400
			demo_site_rows.push {address: "1MeFqFfFFGQfa1J3gJyYYUvb5Lksczq7nH", demo: true, content: {title: "ZeroMe", domain: "Me.ZeroNetwork.bit"}, settings: {}}

		@inactive_demo_sites = []
		for site_row in demo_site_rows
			if @filtering and site.row.content.title.toLowerCase().indexOf(@filtering.toLowerCase()) == -1
				continue
			if not @sites_byaddress[site_row.address]
				@inactive_demo_sites.push(new Site(site_row))

	renderMergedSites: =>
		merged_db = {}
		for site in @sites_merged
			if not site.row.content.merged_type
				continue
			merged_db[site.row.content.merged_type] ?= []
			merged_db[site.row.content.merged_type].push site

		back = []
		for merged_type, merged_sites of merged_db
			back.push [
				h("h2.more", {key: "Merged: #{merged_type}"}, "Merged: #{merged_type}"),
				h("div.SiteList.merged.merged-#{merged_type}", merged_sites.map (item) ->
					item.render()
				)
			]
		return back

	handleFilterInput: (e) =>
		@filtering = e.target.value

	handleFilterKeyup: (e) =>
		if e.keyCode == 27 # Esc
			e.target.value = ""
			@handleFilterInput(e)
		return false

	render: =>
		if not @loaded
			return h("div#SiteList")

		@sites_needaction = []
		@sites_favorited = []
		@sites_owned = []
		@sites_connected = []
		@sites_merged = []

		for site in @sites
			if @filtering
				filter_base = site.row.content.title + site.row.content.merged_type
				if filter_base.toLowerCase().indexOf(@filtering.toLowerCase()) == -1
					continue

			if site.row.settings.size * 1.2 > site.row.size_limit * 1024 * 1024
				site.row.need_limit = site.row.size_limit * 2
				@sites_needaction.push site
			else if site.favorite
				@sites_favorited.push site
			else if site.row.content.merged_type
				@sites_merged.push site
			else if site.row.settings?.own
				@sites_owned.push site
			else
				@sites_connected.push site

		h("div#SiteList", [
			if @sites.length > 20
				h("input.site-filter", {placeholder: "Filter: Site name", spellcheck: false, oninput: @handleFilterInput, onkeyup: @handleFilterKeyup, value: @filtering})
			if @sites_needaction.length > 0 then h("h2.needaction", "Running out of size limit:"),
			h("div.SiteList.needaction", @sites_needaction.map (item) ->
				item.render()
			),
			if @sites_favorited.length > 0 then h("h2.favorited", "Favorited sites:"),
			h("div.SiteList.favorited", @sites_favorited.map (item) ->
				item.render()
			),
			if @sites_owned.length > 0 then h("h2.owned", "Owned sites:"),
			h("div.SiteList.owned", @sites_owned.map (item) ->
				item.render()
			),
			if @sites_connected.length > 0 then h("h2.connected", "Connected sites:"),
			h("div.SiteList.connected", @sites_connected.map (item) ->
				item.render()
			),
			@renderMergedSites()
			if @inactive_demo_sites != null and @inactive_demo_sites.length > 0
				[
					h("h2.more", {key: "More"}, "More sites:"),
					h("div.SiteList.more", @inactive_demo_sites.map (item) ->
						item.render()
					)
				]
		])


	onSiteInfo: (site_info) =>
		@item_list.items_bykey[site_info.address]?.setRow(site_info)
		@schedule_reorder = true
		Page.projector.scheduleRender()


window.SiteList = SiteList