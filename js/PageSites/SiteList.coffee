class SiteList extends Class
	constructor: ->
		@item_list = new ItemList(Site, "address")
		@sites = @item_list.items
		@sites_byaddress = @item_list.items_bykey
		@inactive_demo_sites = null
		@loaded = false
		@on_loaded = new Promise()
		@schedule_reorder = false
		@merged_db = {}
		@filtering = ""
		setInterval(@reorderTimer, 10000)
		@limit = 5
		@should_animate = false

		Page.on_settings.then =>
			Page.on_server_info.then =>
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
				return b.row.settings.added - a.row.settings.added
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
		if Page.server_info.rev >= 3660
			args = {connecting_sites: true}
		else
			args = {}
		Page.cmd "siteList", args, (site_rows) =>
			favorite_sites = Page.settings.favorite_sites

			@item_list.sync(site_rows)

			@sortRows(@item_list.items)

			if @inactive_demo_sites == null
				@updateInactiveDemoSites()
			Page.projector.scheduleRender()
			@loaded = true
			@log "loaded"
			@on_loaded.resolve()
		@

	updateInactiveDemoSites: ->
		demo_site_rows = [
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
			back.push @renderSection(".merged.merged-#{merged_type}", "Merged: #{merged_type}", merged_sites),
		return back

	handleFilterInput: (e) =>
		@filtering = e.target.value

	handleFilterKeyup: (e) =>
		if e.keyCode == 27 # Esc
			e.target.value = ""
			@handleFilterInput(e)
		return false

	handleFilterClear: (e) =>
		e.target.value = ""
		@handleFilterInput(e)
		return false

	handleSiteListMoreClick: (e) =>
		@limit += 1000
		Page.projector.scheduleRender()
		return false

	handleSectionClick: (e) =>
		@should_animate = true
		class_name = e.currentTarget.getAttribute("class_name")
		if Page.settings.sites_section_hide[class_name]
			delete Page.settings.sites_section_hide[class_name]
		else
			Page.settings.sites_section_hide[class_name] = true
		Page.saveSettings()
		Page.projector.scheduleRender()
		return false

	renderSection: (class_name, title, items, limit=null) =>
		if items.length == 0
			return null

		classes = {"hidden": Page.settings.sites_section_hide[class_name]}

		if limit and items.length > limit
			items_limited = items[0..limit]
		else
			items_limited = items

		return [
			h("h2.SiteSection.section#{class_name}", {classes: classes},
				h("a.section-title", { href: "#Show", onclick: @handleSectionClick, class_name: class_name }, [
					title,
					h("span.hide-title", "[Show #{items.length} sites]")
				])
			),
			if not classes.hidden
				h("div.SiteList#{class_name}", {classes: classes, exitAnimation: Animation.slideUp, enterAnimation: Animation.slideDown, animate_disable: !@should_animate},
					[
						[ items_limited.map (item) -> item.render() ],
						if limit and items.length > limit
							h("a.site-list-more", {href: "#Show+more+connected+sites", onclick: @handleSiteListMoreClick}, "Show more")
					]
				)
		]

	render: =>
		if not @loaded
			return h("div#SiteList")

		@sites_needaction = []
		@sites_favorited = []
		@sites_owned = []
		@sites_recent = []
		@sites_connected = []
		@sites_connecting = []
		@sites_merged = []
		num_found = 0

		for site in @sites
			if @filtering
				filter_base = site.row.content.title + site.row.content.merged_type + site.row.address
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
			else if site.row.settings?.downloaded > Time.timestamp() - 60 * 60 * 24
				@sites_recent.push site
			else if site.row.content.title
				@sites_connected.push site
			else
				@sites_connecting.push site
			num_found += 1

		h("div#SiteList", [
			if @sites.length > 10
				h("input.site-filter", {placeholder: "Filter: Site name", spellcheck: false, oninput: @handleFilterInput, onkeyup: @handleFilterKeyup, value: @filtering})
			if @filtering
				[
					h("span.filter-num", {updateAnimation: Animation.show, enterAnimation: Animation.show, exitAnimation: Animation.hide}, "(found #{num_found} of #{@sites.length} sites)")
					h("a.filter-clear", {href: "#clear", onclick: @handleFilterClear}, "\u00D7")
				]
			@renderSection(".recent", "Recently downloaded:", @sites_recent),
			@renderSection(".needaction", "Running out of size limit:", @sites_needaction),
			@renderSection(".favorited", "Favorited sites:", @sites_favorited),
			@renderSection(".owned", "Owned sites:", @sites_owned),
			@renderSection(".connecting", "Connecting sites:", @sites_connecting),
			@renderSection(".connected", "Connected sites:", @sites_connected, @limit),

			@renderMergedSites()
			if @inactive_demo_sites != null and @inactive_demo_sites.length > 0
				@renderSection(".more", "More sites:", @inactive_demo_sites)
		])


	onSiteInfo: (site_info) =>
		@item_list.items_bykey[site_info.address]?.setRow(site_info)
		@schedule_reorder = true
		Page.projector.scheduleRender()


window.SiteList = SiteList
