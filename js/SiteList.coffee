class SiteList extends Class
	constructor: ->
		@item_list = new ItemList(Site, "address")
		@sites = @item_list.items
		@sites_byaddress = @item_list.items_bykey
		@inactive_demo_sites = null
		@loaded = false
		@schedule_reorder = false
		@merged_db = {}
		setInterval(@reorderTimer, 10000)

		Page.on_local_storage.then =>
			@update()
			Page.cmd "channelJoinAllsite", {"channel": "siteChanged"}

	reorderTimer: =>
		if not @schedule_reorder
			return

		# Don't reorder if user if over site list or any of the sites are updating
		if not document.querySelector('.left:hover') and not document.querySelector(".working")
			@reorder()
			@schedule_reorder = false

	reorder: =>
		if Page.local_storage.sites_orderby == "modified"
			@item_list.items.sort (a, b) ->
				return b.row.settings.modified - a.row.settings.modified
		else
			@item_list.items.sort (a, b) ->
				return Math.max(b.row.peers, b.row.settings.peers) - Math.max(a.row.peers, a.row.settings.peers)
		Page.projector.scheduleRender()

	update: ->
		Page.cmd "siteList", {}, (site_rows) =>
			favorite_sites = Page.local_storage.favorite_sites
			if Page.local_storage.sites_orderby == "modified"
				site_rows.sort (a, b) ->
					return b.settings.modified - a.settings.modified
			else
				site_rows.sort (a, b) ->
					return Math.max(b.peers, b.settings.peers) - Math.max(a.peers, a.settings.peers)

			@item_list.sync(site_rows)
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
			{address: "1Gif7PqWTzVWDQ42Mo7np3zXmGAo3DXc7h", demo: true, content: {title: "GIF Time"}, settings: {}}
			{address: "186THqMWuptrZxq1rxzpguAivK3Bs6z84o", demo: true, content: {title: "More sites @ 0list", domain: "0list.bit"}, settings: {}}
		]
		if Page.server_info.rev >= 1400
			demo_site_rows.push {address: "1MeFqFfFFGQfa1J3gJyYYUvb5Lksczq7nH", demo: true, content: {title: "ZeroMe", domain: "Me.ZeroNetwork.bit"}, settings: {}}

		@inactive_demo_sites = []
		for site_row in demo_site_rows
			if not @sites_byaddress[site_row.address]
				@inactive_demo_sites.push(new Site(site_row))

	renderMergedSites: =>
		merged_db = {}
		for site in @sites
			if not site.row.content.merged_type
				continue
			merged_db[site.row.content.merged_type] ?= []
			merged_db[site.row.content.merged_type].push site

		back = []
		for merged_type, merged_sites of merged_db
			back.push [
				h("h2.more", {key: "Merged: #{merged_type}"}, "Merged: #{merged_type}"),
				h("div.SiteList", merged_sites.map (item) ->
					item.render()
				)
			]
		return back

	render: =>
		if not @loaded
			return h("div")
		@sites_favorited = (site for site in @sites when site.favorite and not site.row.content.merged_type)
		@sites_connected = (site for site in @sites when not site.favorite and not site.row.content.merged_type)
		h("div", [
			if @sites_favorited.length > 0 then h("h2.favorited", "Favorited sites:"),
			h("div.SiteList.favorited", @sites_favorited.map (item) ->
				item.render()
			),
			h("h2.connected", "Connected sites:"),
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