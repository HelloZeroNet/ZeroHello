class MuteList extends Class
	constructor: ->
		@mutes = null
		@includes = null
		@visible = false
		@max_height = 0
		@updated = false
		@siteblocks_serving = []
		Page.site_list.on_loaded.then =>
			@updateFilterIncludes()
		@

	update: =>
		@need_update = false
		Page.cmd "MuteList", [], (res) =>
			@mutes = []
			for auth_address, mute of res
				mute.auth_address = auth_address
				mute.site = Page.site_list.sites_byaddress[mute.source]
				@mutes.push(mute)

			@mutes.sort (a, b) ->
				return b.date_added - a.date_added

			if not @max_height
				@max_height = 100

			@updated = true
			Page.projector.scheduleRender()

		@updateFilterIncludes()

	updateFilterIncludes: =>
		Page.cmd "filterIncludeList", {all_sites: true, filters: true}, (res) =>
			@siteblocks_serving = []
			@includes = []
			@siteblocks = {}
			for include in res
				include.site = Page.site_list.sites_byaddress[include.address]

				mutes = []
				if include.mutes?
					for auth_address, mute of include.mutes
						mute.auth_address = auth_address
						mutes.push(mute)
				include.mutes = mutes

				siteblocks = []
				if include.siteblocks?
					for address, siteblock of include.siteblocks
						siteblock.address = address
						siteblock.include = include
						siteblocks.push(siteblock)
						@siteblocks[address] = siteblock
				include.siteblocks = siteblocks

				@includes.push(include)

			@includes.sort (a, b) ->
				return b.date_added - a.date_added

			for site in Page.site_list.sites
				address = site.row.address
				if @siteblocks[address] and not Page.settings.siteblocks_ignore[address]
					@siteblocks[address].site = site
					@siteblocks_serving.push(@siteblocks[address])

				address_hash = "0x" + site.row.address_hash
				if @siteblocks[address_hash] and not Page.settings.siteblocks_ignore[address_hash]
					@siteblocks[address_hash].site = site
					@siteblocks_serving.push(@siteblocks[address_hash])

			@updated = true
			Page.projector.scheduleRender()

	handleHideClick: =>
		@visible = false
		setTimeout (=>
			@updateFilterIncludes()
		), 1000
		@max_height = 0

	handleMuteRemoveClick: (e) =>
		mute = e.target.mute
		if mute.removed
			# Re-add
			Page.cmd("muteAdd", [mute.auth_address, mute.cert_user_id, mute.reason])
		else
			# Remove
			Page.cmd("muteRemove", mute.auth_address)
		mute.removed = not mute.removed
		return false

	handleIncludeRemoveClick: (e) =>
		include = e.currentTarget.include
		if include.removed
			# Re-add
			Page.cmd("filterIncludeAdd", [include.inner_path, include.description, include.address])
		else
			# Remove
			Page.cmd("filterIncludeRemove", {inner_path: include.inner_path, address: include.address})
		include.removed = not include.removed
		return false

	afterUpdate: =>
		@updated = false
		if @node and @visible
			@max_height = @node.offsetHeight + 100
			Page.projector.scheduleRender()

	storeNode: (node) =>
		@node = node

	renderMutes: (mutes, mode="mutes") =>
		h("div.mutes", [
			h("div.mute.mute-head", [
				h("div.mute-col", "Muted user"),
				h("div.mute-col", {style: "width: 66%"}, "Why?")
			]),
			mutes.map (mute) =>
				h("div.mute", {key: mute.auth_address, classes: {removed: mute.removed}}, [
					h("div.mute-col", [
						h("div.cert_user_id", mute.cert_user_id),
						h("div.auth_address", mute.auth_address),
					]),
					h("div.mute-col", {style: "width: 66%"}, [
						h("div.source", if mute.site? then mute.site.row.content.title else mute.source),
						h("div.reason", {innerHTML: Text.renderMarked(mute.reason)}),
						h("div.date_added", " \u2500 " + Time.since(mute.date_added))
					])
					if mode == "mutes"
						h("a.action", {href: "#Unmute", onclick: @handleMuteRemoveClick, mute: mute}, "×")
				])
		])

	renderSiteblocks: (siteblocks) =>
		h("div.siteblocks", [
			h("div.mute.mute-head", [
				h("div.mute-col", "Blocked site"),
				h("div.mute-col", {style: "width: 66%"}, "Why?")
			]),
			siteblocks.map (siteblock) =>
				h("div.mute", {key: siteblock.address, classes: {removed: siteblock.removed}}, [
					h("div.mute-col", [
						h("div.cert_user_id", siteblock.name),
						h("div.auth_address", siteblock.address),
					]),
					h("div.mute-col", {style: "width: 66%"}, [
						h("div.reason", {innerHTML: Text.renderMarked(siteblock.reason)}),
						h("div.date_added", " \u2500 " + Time.since(siteblock.date_added))
					])
				])
		])


	renderIncludes: =>
		h("div.includes", [
			@includes.map (include) =>
				h("div.include", {key: include.address + include.inner_path, classes: {removed: include.removed}}, [
					h("h2", h("a.site", {href: include.site.getHref()}, include.site.row.content.title), " \u203A ", h("a.inner_path", {href: "#"}, include.inner_path))
					h("a.action", {href: "#Remove+include", onclick: @handleIncludeRemoveClick, include: include},
						[h("span.closer", "×"), "deactivate this blocklist"]
					)
					if include.mutes.length
						@renderMutes(include.mutes, "includes")
					if include.siteblocks.length
						@renderSiteblocks(include.siteblocks)

				])
		])

	render: =>
		if @need_update
			@update()
		if not @mutes
			return h("div#MuteList", {classes: {visible: false}}, "Muted")
		if @updated
			@updated = false
			setTimeout @afterUpdate

		h("div#MuteList", {classes: {visible: @visible}, style: "max-height: #{@max_height}px"}, [
			h("a.mute-hide", {href: "#Hide", onclick: @handleHideClick}, "\u2039 Back to feed"),

			if @mutes?.length == 0 and @includes?.length == 0
				h("div.mute-empty", "Your mute list is empty! :)")
			else
				h("div", {afterCreate: @storeNode}, [
					if @mutes.length > 0
						@renderMutes(@mutes)
					if @includes
						@renderIncludes()
				])
		])

	show: =>
		@visible = true
		Page.site_list.on_loaded.then =>
			@need_update = true
		Page.projector.scheduleRender()

window.MuteList = MuteList
