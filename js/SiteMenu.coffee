class Menu
	constructor: (@button) ->
		@elem = $(".menu.template").clone().removeClass("template")
		@elem.appendTo("body")

	show: ->
		if window.visible_menu then @log "visible_menu", window.visible_menu.button, @button
		if window.visible_menu and window.visible_menu.button[0] == @button[0] # Same menu visible then hide it
			window.visible_menu.hide()
			@hide()
		else
			button_pos = @button.offset()
			@elem.css({"top": button_pos.top+@button.outerHeight(), "left": button_pos.left})
			@button.addClass("menu-active")
			@elem.addClass("visible")
			if window.visible_menu then window.visible_menu.hide()
			window.visible_menu = @


	hide: ->
		@elem.removeClass("visible")
		@button.removeClass("menu-active")
		window.visible_menu = null



	addItem: (title, cb) ->
		item = $(".menu-item.template", @elem).clone().removeClass("template")
		item.html(title)
		item.on "click", =>
			@hide()
			cb()
			return false
		item.appendTo(@elem)
		return item


	log: (args...) ->
		console.log "[Menu]", args...


class SiteMenu extends Menu
	constructor: (elem, site) ->
		super($(".hamburger", elem))
		@elem.addClass("menu-site")
		@addItem "Update", (-> window.zero_hello.siteUpdate site.address )
		if site.settings.serving
			@addItem "Pause", (-> window.zero_hello.sitePause site.address )
		else
			@addItem "Resume", (-> window.zero_hello.siteResume site.address )
		if site.content?.cloneable
			if zero_hello.server_info.rev < 200
				@addItem "Clone", (-> window.zero_hello.cmd "wrapperNotification", ["info", "Please update to version 0.3.1 to use the site clone feature!"] )
			else
				@addItem "Clone", (-> window.zero_hello.siteClone site.address )

		@addItem("Delete", (-> window.zero_hello.siteDelete site.address ) ).addClass("menu-item-separator")


window.visible_menu = null
window.SiteMenu = SiteMenu
window.Menu = Menu

# Hide menu on outside click
$("body").on "click", (e) ->
	if window.visible_menu and e.target != window.visible_menu.button[0] and $(e.target).parent()[0] != window.visible_menu.elem[0]
		window.visible_menu.hide()
