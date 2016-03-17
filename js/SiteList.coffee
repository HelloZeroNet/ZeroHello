class SiteList extends Class
	constructor: ->
		@item_list = new ItemList(Site, "address")
		@sites = @item_list.items
		@sites_byaddress = @item_list.items_bykey
		@inactive_demo_sites = null
		@loaded = false

		Page.on_local_storage.then =>
			@update()
			Page.cmd "channelJoinAllsite", {"channel": "siteChanged"}

	reorder: =>
		@update()

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
		@inactive_demo_sites = []
		for site_row in demo_site_rows
			if not @sites_byaddress[site_row.address]
				@inactive_demo_sites.push(new Site(site_row))

	render: =>
		if not @loaded
			return h("div")
		@sites_favorited = (site for site in @sites when site.favorite)
		@sites_connected = [
			{address: "1Gfey7wVXXg1rxk751TBTxLJwhddDNfcdp", demo: true, content: {title: "ZeroBoard", domain: "Board.ZeroNetwork.bit"}, settings: {}}
			{address: "1TaLkFrMwvbNsooF4ioKAY9EuxTBTjipT", demo: true, content: {title: "ZeroTalk", domain: "Talk.ZeroNetwork.bit"}, settings: {}}
			{address: "1BLogC9LN4oPDcruNz3qo1ysa133E9AGg8", demo: true, content: {title: "ZeroBlog", domain: "Blog.ZeroNetwork.bit"}, settings: {}}
			{address: "1MaiL5gfBM1cyb4a8e3iiL8L5gXmoAJu27", demo: true, content: {title: "ZeroMail", domain: "Mail.ZeroNetwork.bit"}, settings: {}}
			{address: "1Gif7PqWTzVWDQ42Mo7np3zXmGAo3DXc7h", demo: true, content: {title: "GIF Time"}, settings: {}}
			{address: "186THqMWuptrZxq1rxzpguAivK3Bs6z84o", demo: true, content: {title: "More sites @ 0list", domain: "0list.bit"}, settings: {}}
		]
		h("div", [
			if @sites_favorited.length > 0 then h("h2.favorited", "Favorited sites:"),
			h("div.SiteList.favorited", @sites_favorited.map (item) ->
				item.render()
			),
			h("h2.connected", "Connected sites:"),
			h("div.SiteList.connected", @sites_connected.map (item) ->
				item.render()
			),
			if @inactive_demo_sites != null and @inactive_demo_sites.length > 0
				[
					h("h2.more", "More sites:"),
					h("div.SiteList.more", @inactive_demo_sites.map (item) ->
						item.render()
					)
				]
		])


	onSiteInfo: (site_info) =>
		@item_list.items_bykey[site_info.address]?.setRow(site_info)
		Page.projector.scheduleRender()


window.SiteList = SiteList
