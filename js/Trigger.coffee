class Trigger extends Class
	constructor: ->
		@trigger_off = true
		@text = ">"

	handleTitleClick: =>
		if @trigger_off
		  @trigger_off = false
		  @text = "<"
		  document.getElementById("left").classList.add("trigger-on")
		else
		  document.getElementById("left").classList.remove("trigger-on")
		  @trigger_off = true
		  @text = ">"
		return false

	render: =>
		h("div.Trigger", {classes: { "trigger-off": @trigger_off }}, [
			h("a.icon", {"href": "#Trigger", onclick: @handleTitleClick, ontouchend: ""}, [@text])
		])
window.Trigger = Trigger
