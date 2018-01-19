class StatList extends Class
	constructor: ->
		@items = []

	renderItem: (item) =>
		h("div.stat-list-item", {key: item.title, classes: {other: item.type == "other"}},
			h("div.title", item.title),
			h("div.value", item.value + " peers")
		)

	render: =>
		h("div.StatList", [
			h("h4", "Top country")
			h("div.stat-list-items", @items.map(@renderItem)),
		])

window.StatList = StatList