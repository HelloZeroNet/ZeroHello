class StatList extends Class
	constructor: ->
		@need_update = true
		@

	render: =>
		if @need_update and Page.site_list.sites.length
			@need_update = false

		h("div#StatList", [
		])


window.StatList = StatList