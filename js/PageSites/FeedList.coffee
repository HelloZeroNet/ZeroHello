class FeedList extends Class
	constructor: ->
		@feeds = null
		@searching = null
		@searching_text = null
		@searched = null
		@res = null
		@loading = false
		@filter = null
		@feed_types = {}
		@need_update = false
		@updating = false
		@limit = 30
		@query_limit = 20
		@query_day_limit = 3
		@show_stats = false
		@feed_keys = {}
		Page.on_settings.then =>
			@need_update = true
			document.body.onscroll = =>
				RateLimit 300, =>
					@checkScroll()
		@

	checkScroll: =>
		scroll_top = window.pageYOffset or document.documentElement.scrollTop or document.body.scrollTop or 0
		if scroll_top + window.innerHeight > document.getElementById("FeedList").clientHeight - 400 and not @updating and @feeds?.length > 5 and Page.mode == "Sites" and @limit < 300
			@limit += 30
			@query_limit += 30
			@query_day_limit += 5
			@log "checkScroll update"
			@update()
			return true
		else
			return false

	displayRows: (rows, search) =>
		@feeds = []
		@feed_keys = {}
		if not rows
			return false

		rows.sort (a, b) ->
			return a.date_added + (if a.type == "mention" then 1 else 0) - b.date_added - (if b.type == "mention" then 1 else 0)  # Prefer mention

		row_group = {}
		last_row = {}
		@feed_types = {}
		rows.reverse()
		for row in rows
			if last_row.body == row.body and last_row.date_added == row.date_added
				continue  # Duplicate (eg. also signed up for comments and mentions)

			if row_group.type == row.type and row.url == row_group.url and row.site == row_group.site
				if not row_group.body_more?
					row_group.body_more = []
					row_group.body_more.push(row.body)
				else if row_group.body_more.length < 3
					row_group.body_more.push(row.body)
				else
					row_group.more ?= 0
					row_group.more += 1
				row_group.feed_id = row.date_added
			else
				row.feed_id ?= row.date_added
				row.key = row.site + row.type + row.title + row.feed_id
				if @feed_keys[row.key]
					@log "Duplicate feed key: #{row.key}"
				else
					@feeds.push(row)
				@feed_keys[row.key] = true
				row_group = row
			@feed_types[row.type] = true
			last_row = row
		Page.projector.scheduleRender()


	update: (cb) =>
		if @searching or @updating
			return false
		if not Page.server_info or Page.server_info.rev < 1850
			params = []
		else
			params = [@query_limit, @query_day_limit]
		@logStart "Updating feed"
		@updating = true
		Page.cmd "feedQuery", params, (res) =>
			if res.rows
				rows = res.rows
			else
				rows = res
			@res = res

			if rows.length < 10 and @day_limit != null
				# Query without day limit if too few result
				@limit = 20
				@day_limit = null
				@updating = false
				@update()
				return false

			@displayRows(rows)
			setTimeout @checkScroll, 100
			@logEnd "Updating feed"
			if cb then cb()
			@updating = false

	search: (search, cb) =>
		if Page.server_info.rev < 1230
			@displayRows([])
			if cb then cb()
			return
		@loading = true
		Page.cmd "feedSearch", search, (res) =>
			@loading = false
			@displayRows(res["rows"], search)
			delete res["rows"]
			@res = res
			@searched = search
			if cb then cb()

	# Focus on search input if key pressed an no input on focus
	storeNodeSearch: (node) =>
		document.body.onkeypress = (e) =>
			if e.charCode in [0, 32]  # Not a normal character or space
				return
			if document.activeElement?.tagName != "INPUT"
				node.focus()

	handleSearchInput: (e) =>
		if @searching and @searching.length > 3
			delay = 100
		else if @searching
			delay = 300
		else
			delay = 600
		@searching = e.target.value
		@searching_text = @searching.replace(/[^ ]+:.*$/, "").trim()

		if Page.server_info.rev < 1230
			@feeds = []
			@feed_keys = {}

		if e.target.value == ""  # No delay when returning to newsfeed
			delay = 1
		clearInterval @input_timer
		setTimeout =>
			@loading = true

		# Delay calls to reduce server load
		@input_timer = setTimeout ( =>
			RateLimitCb delay, (cb_done) =>
				@loading = false
				if @searching
					@search @searching, =>
						cb_done()
				else
					@update =>
						cb_done()
						if not @searching
							@searching = null
						@searched = null
		), delay
		return false

	handleSearchKeyup: (e) =>
		if e.keyCode == 27 # Esc
			e.target.value = ""
			@handleSearchInput(e)
		return false

	handleFilterClick: (e) =>
		@filter = e.target.getAttribute("href").replace("#", "")
		if @filter == "all"
			@filter = null
		return false

	handleSearchInfoClick: (e) =>
		@show_stats = not @show_stats
		return false

	formatTitle: (title) ->
		if @searching_text and @searching_text.length > 1
			return Text.highlight(title, @searching_text)
		else
			return title

	formatBody: (body, type) ->
		body = body.replace(/[\n\r]+/, "\n")  # Remove empty lines
		if type == "comment" or type == "mention"
			# Display Comment
			username_match = body.match(/^(([a-zA-Z0-9\.]+)@[a-zA-Z0-9\.]+|@(.*?)):/)
			if username_match
				if username_match[2]
					username_formatted = username_match[2] + " › "
				else
					username_formatted = username_match[3] + " › "
				body = body.replace(/> \[(.*?)\].*/g, "$1: ")  # Replace original message quote
				body = body.replace(/^[ ]*>.*/gm, "")  # Remove quotes
				body = body.replace(username_match[0], "")  # Remove commenter from body
			else
				username_formatted = ""
			body = body.replace(/\n/g, " ")
			body = body.trim()

			# Highligh matched search parts
			if @searching_text and @searching_text.length > 1
				body = Text.highlight(body, @searching_text)
				if body[0].length > 60 and body.length > 1
					body[0] = "..."+body[0][body[0].length-50..body[0].length-1]
				return [h("b", Text.highlight(username_formatted, @searching_text)), body]
			else
				body = body[0..200]
				return [h("b", [username_formatted]), body]
		else
			# Display post
			body = body.replace(/\n/g, " ")

			# Highligh matched search parts
			if @searching_text and @searching_text.length > 1
				body = Text.highlight(body, @searching_text)
				if body[0].length > 60
					body[0] = "..."+body[0][body[0].length-50..body[0].length-1]
			else
				body = body[0..200]
			return body

	formatType: (type, title) ->
		if type == "comment"
			return "Comment on"
		else if type == "mention"
			if title
				return "You got mentioned in"
			else
				return "You got mentioned"
		else
			return ""

	enterAnimation: (elem, props) =>
		if @searching == null
			return Animation.slideDown.apply(this, arguments)
		else
			return null

	exitAnimation: (elem, remove_func, props) =>
		if @searching == null
			return Animation.slideUp.apply(this, arguments)
		else
			remove_func()

	renderFeed: (feed) =>
		if @filter and feed.type != @filter
			return null

		try
			site = Page.site_list.item_list.items_bykey[feed.site]
			type_formatted = @formatType(feed.type, feed.title)
			return h("div.feed."+feed.type, {key: feed.key, enterAnimation: @enterAnimation, exitAnimation: @exitAnimation}, [
				h("div.details", [
					h("a.site", {href: site.getHref()}, [site.row.content.title]),
					h("div.added", [Time.since(feed.date_added)])
				]),
				h("div.circle", {style: "border-color: #{Text.toColor(feed.type+site.row.address, 60, 60)}"}),
				if type_formatted then h("span.type", type_formatted),
				h("a.title", {href: site.getHref()+feed.url}, @formatTitle(feed.title)),
				h("div.body", {key: feed.body, enterAnimation: @enterAnimation, exitAnimation: @exitAnimation}, @formatBody(feed.body, feed.type))
				if feed.body_more  # Display comments
					feed.body_more.map (body_more) =>
						h("div.body", {key: body_more, enterAnimation: @enterAnimation, exitAnimation: @exitAnimation}, @formatBody(body_more, feed.type))
				if feed.more > 0  # Collapse other types
					h("a.more", {href: site.getHref()+feed.url}, ["+#{feed.more} more"])
			])
		catch err
			@log err
			return h("div", key: Time.timestamp())

	renderWelcome: =>
		h("div.welcome", [
			h("img", {src: "img/logo.svg", height: 150, onerror: "this.src='img/logo.png'; this.onerror=null;"})
			h("h1", "Welcome to ZeroNet")
			h("h2", "Let's build a decentralized Internet together!")
			h("div.served", ["This site currently served by ", h("b.peers", (Page.site_info["peers"] or "n/a")), " peers, without any central server."])
			h("div.sites", [
				h("h3", "Some sites we created:"),
				h("a.site.site-zeroboard", {href: Text.getSiteUrl("Board.ZeroNetwork.bit")}, [
					h("div.title", ["ZeroBoard"])
					h("div.description", ["Simple messaging board"])
					h("div.visit", ["Activate \u2501"])
				]),
				h("a.site.site-zerotalk", {href: Text.getSiteUrl("Talk.ZeroNetwork.bit")}, [
					h("div.title", ["ZeroTalk"])
					h("div.description", ["Reddit-like, decentralized forum"])
					h("div.visit", ["Activate \u2501"])
				]),
				h("a.site.site-zeroblog", {href: Text.getSiteUrl("Blog.ZeroNetwork.bit")}, [
					h("div.title", ["ZeroBlog"])
					h("div.description", ["Microblogging platform"])
					h("div.visit", ["Activate \u2501"])
				]),
				h("a.site.site-zeromail", {href: Text.getSiteUrl("Mail.ZeroNetwork.bit")}, [
					h("div.title", ["ZeroMail"])
					h("div.description", ["End-to-end encrypted mailing"])
					h("div.visit", ["Activate \u2501"])
				]),
				h("a.site.site-zerome", {href: Text.getSiteUrl("Me.ZeroNetwork.bit")}, [
					h("div.title", ["ZeroMe"])
					h("div.description", ["P2P social network"])
					h("div.visit", ["Activate \u2501"])
				]),
				h("a.site.site-zerosites", {href: Text.getSiteUrl("Sites.ZeroNetwork.bit")}, [
					h("div.title", ["ZeroSites"])
					h("div.description", ["Discover more sites"])
					h("div.visit", ["Activate \u2501"])
				])

			])
		])

	renderSearchStat: (stat) =>
		if stat.taken == 0
			return null

		total_taken = @res.taken
		site = Page.site_list.item_list.items_bykey[stat.site]

		h("tr", {key: stat.site + "_" + stat.feed_name, classes: {"slow": stat.taken > total_taken * 0.1, "extra-slow": stat.taken > total_taken * 0.3}}, [
			h("td.site", h("a.site", {href: site.getHref()}, [site.row.content.title])),
			h("td.feed_name", stat.feed_name),
			h("td.taken", (if stat.taken? then stat.taken + "s" else "n/a "))
		])

	getClass: =>
		if @searching != null
			return "search"
		else
			return "newsfeed.limit-#{@limit}"

	render: =>
		if @need_update
			RateLimitCb(5000, @update)
			@need_update = false

		if @feeds and Page.site_list.loaded and document.body.className != "loaded" and not @updating
			if document.body.scrollTop > 500  # Scrolled down wait until next render
				setTimeout (-> document.body.className = "loaded"), 2000
			else
				document.body.className = "loaded"

		h("div#FeedList.FeedContainer", {classes: {faded: Page.mute_list.visible}},
			if @feeds == null or not Page.site_list.loaded
				h("div.loading")
			else if @feeds.length > 0 or @searching != null
				[
					h("div.feeds-filters", [
						h("a.feeds-filter", {href: "#all", classes: {active: @filter == null}, onclick: @handleFilterClick}, "All"),
						for feed_type of @feed_types
							h("a.feeds-filter", {key: feed_type, href: "#" + feed_type, classes: {active: @filter == feed_type}, onclick: @handleFilterClick}, feed_type)
					])
					h("div.feeds-line"),
					h("div.feeds-search", {classes: {"searching": @searching}},
						h("div.icon-magnifier"),
						if @loading
							h("div.loader", {enterAnimation: Animation.show, exitAnimation: Animation.hide}, h("div.arc"))
						h("input", {type: "text", placeholder: "Search in connected sites", value: @searching, onkeyup: @handleSearchKeyup, oninput: @handleSearchInput, afterCreate: @storeNodeSearch}),
						if @res?.stats and not @loading
							h("a.search-info.nolink",
								{href: "#ShowStats", enterAnimation: Animation.show, exitAnimation: Animation.hide, onclick: @handleSearchInfoClick},
								(if @searching then "#{@res.num} results " else "") + "from #{@res.sites} sites in #{@res.taken.toFixed(2)}s"
							)
						if @show_stats
							h("div.search-info-stats", {enterAnimation: Animation.slideDown, exitAnimation: Animation.slideUp}, [
								h("table", [
									h("tr", h("th", "Site"), h("th", "Feed"), h("th.taken", "Taken")),
									@res.stats.map @renderSearchStat
								])
							])
						if Page.server_info.rev < 1230 and @searching
							h("div.search-noresult", {enterAnimation: Animation.show}, ["You need to ", h("a", {href: "#Update", onclick: Page.head.handleUpdateZeronetClick}, "update"), " your ZeroNet client to use the search feature!"])
						else if @feeds.length == 0 and @searched
							h("div.search-noresult", {enterAnimation: Animation.show}, "No results for #{@searched}")
					),
					h("div.FeedList."+@getClass(), {classes: {loading: @loading}}, @feeds[0..@limit].map(@renderFeed))
				]
			else
				@renderWelcome()
		)

	onSiteInfo: (site_info) =>
		if site_info.event?[0] == "file_done" and site_info.event?[1].endsWith(".json") and not site_info.event?[1].endsWith("content.json")
			if not @searching
				@need_update = true

window.FeedList = FeedList