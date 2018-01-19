class MuteList extends Class
	constructor: ->
		@mutes = null
		@visible = false
		Page.on_settings.then =>
			@need_update = true
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

			Page.projector.scheduleRender()

	handleHideClick: =>
		@visible = false

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

	render: =>
		if @need_update
			@update()
		if not @mutes
			return h("div#MuteList", {classes: {visible: false}}, "Muted")

		if @visible
			max_height = 100 + @mutes.length * 70
		else
			max_height = 0

		h("div#MuteList", {classes: {visible: @visible}, style: "max-height: #{max_height}px"}, [
			h("a.mute-hide", {href: "#Hide", onclick: @handleHideClick}, "\u2039 Back to feed"),

			if @mutes.length == 0
				h("div.mute-empty", "Your mute list is empty! :)")
			else
				[
					h("div.mute.mute-head", [
						h("div.mute-col", "Muted user"),
						h("div.mute-col", {style: "width: 66%"}, "Why?")
					]),
					@mutes.map (mute) =>
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
							h("a.action", {href: "#Unmute", onclick: @handleMuteRemoveClick, mute: mute}, "×")
						])
				]
		])

	show: =>
		@visible = true
		@need_update = true
		Page.projector.scheduleRender()

window.MuteList = MuteList