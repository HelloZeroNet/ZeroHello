class ChartLegend extends Class
	constructor: ->
		@items_left = []
		@items_right = []

	renderItem: (item) =>
		@i += 1
		item.dot ?= "\u25CF"
		value = item.getValue()
		hidden = not value
		if item.post
			value += " #{item.post}"

		if item.type == "ratio"
			h("div.legend-item", {classes: {hidden: hidden}}, [
				h("div.title", item.title),
				h("div.value", [
					h("span", {updateAnimation: Animation.show, delay: @i * 0.1}, Math.round(value * 10) / 10),
					h("div.dots-container", [
						h("span.dots.dots-fg", {style: "width: #{Math.min(value, 5) * 11.5}px; color: #{item.color}"}, item.dot.repeat(5)),
						h("span.dots.dots-bg", item.dot.repeat(5))
					])
				])
			])
		else
			h("div.legend-item", {classes: {hidden: hidden}}, [
				h("div.title", [h("span.dot", {style: "color: #{item.color}"}, "#{item.dot} "), item.title]),
				h("div.value", {updateAnimation: Animation.show, delay: @i * 0.1}, value)
			])


	render: ->
		@i = 0
		h("div.ChartLegend",
			h("div.legend-items.align-left", @items_left.map(@renderItem))
			h("div.legend-items.align-right", @items_right.map(@renderItem))
		)

window.ChartLegend = ChartLegend