class Trigger extends Class
	constructor: ->
		@active = false

	handleTitleClick: =>
		@active = not @active
		if @active
			document.getElementById("left").classList.add("trigger-on")
		else
			document.getElementById("left").classList.remove("trigger-on")

		return false

	render: =>
		h("div.Trigger", {classes: { "active": @active }}, [
			h("a.icon", {"href": "#Trigger", onclick: @handleTitleClick, ontouchend: ""}, "\u25B6")
		])
window.Trigger = Trigger
