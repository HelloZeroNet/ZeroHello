class ZeroHello extends ZeroFrame
	init: ->
		@log "inited!"
		@last_sitedata = {}


	# Wrapper websocket connection ready
	onOpenWebsocket: (e) =>
		@reloadPeers()
		@reloadSites()
		@cmd "channelJoinAllsite", {"channel": "siteChanged"}


	# Route incoming requests
	route: (cmd, message) ->
		if cmd == "setSiteInfo"
			@actionSetSiteInfo(message)
		else
			@log "Unknown command", message


	# - Incoming requests -

	actionSetSiteInfo: (message) ->
		site = message.params
		@applySitedata($(".site-#{site.address}"), site)



	# Format time since
	formatSince: (time) ->
		now = +(new Date)/1000
		secs = now - time
		if secs < 60
			return "Just now"
		else if secs < 60*60
			return "#{Math.round(secs/60)} minutes ago"
		else if secs < 60*60*24
			return "#{Math.round(secs/60/60)} hours ago"
		else
			return "#{Math.round(secs/60/60/24)} days ago"


	# Reload site peer number
	reloadPeers: ->
		@cmd "siteInfo", {}, (site_info) =>
			@address = site_info.addres
			peers = site_info["peers"]
			if peers == 0 then peers = "n/a"
			$("#peers").removeClass("loading").text(peers)


	# Apple site data to html element
	applySitedata: (elem, site) ->
		elem.addClass("site-#{site.address}")
		if site.peers
			$(".peers", elem).html(site.peers)
		else
			$(".peers", elem).html("n/a")
		if site.content.title.length > 20
			$(".title", elem).html(site.content.title).addClass("long")
		else
			$(".title", elem).html(site.content.title).removeClass("long")
		$(".description", elem).html(site.content.description)
		$(".modified", elem).html(@formatSince(site.content.modified))
		$(".site", elem).attr("href", "/"+site.address)

		$(elem).removeClass("site-seeding").removeClass("site-paused")
		if site.settings.serving and site.address # Seeding
			$(elem).addClass("site-seeding")
			$(".status", elem).text("Seeding")
		else # Paused
			$(elem).addClass("site-paused")
			$(".status", elem).text("Paused")


		# Show/hide loading
		if site.tasks?.length > 0 # Site tasks running
			$(".loading", elem).addClass("visible")
		else
			$(".loading", elem).removeClass("visible")

		# Show success
		if site.event?[0] == "file_done" or site.event?[0] == "file_started"
			if site.bad_files.length > 0
				success = "Updating: #{site.bad_files.length} left"
			else if site.event[0] == "file_done" and site.bad_files.length == 0
				success = "Site updated"
		if success
			$(".notify", elem).text(success).addClass("success").addClassLater("visible")

		# Show error
		if site.content_updated == false
			error = "Update failed"
		if error
			$(".notify", elem).text(error).removeClass("success").addClassLater("visible")

		# Hide error/success
		if not error and not success
			$(".notify", elem).removeClass("visible")

		# Disabled
		if site.disabled # No address for site
			$(elem).addClass("site-disabled")

		# Add menu events
		$(".hamburger", elem).off("click").on "click", (-> new SiteMenu(elem, site).show(); return false )

		@last_sitedata[site.address] = site

		if site.address == @address and site.peers > 0 then $("#peers").text(site.peers) # Update servedby text

		return elem


	# Reload sites div content
	reloadSites: ->
		@cmd "siteList", {}, (sites) =>
			$("#sites > :not(.template)").remove()

			# Append Active sites category marker
			elem_category = $(".site-category.template").clone()
			elem_category.removeClass("template")
			$("#sites").append elem_category

			sites.sort (a,b) ->
				return cmp b["peers"], a["peers"]

			# Append active sites
			for site in sites
				elem = $(".site-container.template").clone().removeClass("template")
				elem = @applySitedata(elem, site)

				$("#sites").append elem

			# Append Sample sites marker
			elem_category = $(".site-category.template").clone()
			elem_category.removeClass("template")
			$(".title", elem_category).html("Sample sites")
			$("#sites").append elem_category

			# Append sample sites
			sample_sites = [
				{"content": {"title": "ZeroBoard", "description": "Messaging board demo"}, "address": "1Gfey7wVXXg1rxk751TBTxLJwhddDNfcdp", "settings": {"serving": false}}
				{"content": {"title": "ZeroMarket", "description": "Simple market demo (coming soon)"}, "address": "ZeroMarket", "disabled": true, "settings": {"serving": false}}
				{"content": {"title": "ZeroBay", "description": "A safe harbour (coming soon)"}, "address": "ZeroBay", "disabled": true, "settings": {"serving": false}}
			]

			for site in sample_sites
				if $(".site-#{site.address}").length > 0 then continue # Already using this site, continue
				elem = $(".site-container.template").clone().removeClass("template").addClass("site-inactive")
				elem = @applySitedata(elem, site)
				$(".status, .right, .bottom", elem).css("display", "none") # Hide data we dont have
				$(".action", elem).html("Activate site &#9473;")

				$("#sites").append elem
			# Show sites
			$("#sites").removeClass("loading")


	# - Site commands -

	# Update site content.json
	siteUpdate: (address) ->
		@cmd "siteUpdate", {"address": address}



	# Pause site from seeding
	sitePause: (address) ->
		@cmd "sitePause", {"address": address}


	# Resume site seeding
	siteResume: (address) ->
		@cmd "siteResume", {"address": address}

window.zero_hello = new ZeroHello()
