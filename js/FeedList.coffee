class FeedList extends Class
	constructor: ->
		@feeds = null
		Page.on_site_info.then =>
			@update()
		@


	update: =>
		Page.cmd "feedQuery", [], (rows) =>
			@feeds = []
			if not rows
				return false

			rows.sort (a, b) ->
				return a.date_added + (if a.type == "mention" then 1 else 0) - b.date_added + (if b.type == "mention" then 1 else 0)

			last_row = {}
			rows.reverse()
			for row in rows
				if last_row.title == row.title and last_row.body == row.body and last_row.date_added == row.date_added
					continue  # Duplicate (eg. also signed up for comments and mentions)
				if last_row.title == row.title and last_row.type == row.type
					last_row.more ?= 0
					last_row.body_more ?= []
					if last_row.body_more.length < 3
						last_row.body_more.push(row.body)
					else
						last_row.more += 1
					last_row.feed_id = row.date_added
				else
					row.feed_id ?= row.date_added
					@feeds.push(row)
					last_row = row

			Page.projector.scheduleRender()


	formatBody: (body, type) ->
		body = body.replace(/[\n\r]+/, "\n")  # Remove empty lines
		if type == "comment" or type == "mention"
			username = body.match(/(.*?)@/)[1] + " › "  # Extract commenter's username
			body = body.replace(/> \[(.*?)\].*/g, "$1: ")  # Replace original message quote
			body = body.replace(/^[ ]*>.*/gm, "")  # Remove quotes
			body = body.replace(/.*?@.*?:/, "")  # Remove commenter from body
			body = body.replace(/\n/g, " ")
			body = body.trim()
			return [h("b", [username]), body[0..200]]
		else
			return body[0..200]

	formatType: (type) ->
		if type == "comment"
			return "Comment in "
		else if type == "mention"
			return "You got mentioned in "
		else
			return ""


	renderFeed: (feed) =>
		try
			site = Page.site_list.item_list.items_bykey[feed.site]
			return h("div.feed."+feed.type, {key: feed.site+feed.type+feed.title+feed.feed_id, enterAnimation: Animation.slideDown, exitAnimation: Animation.slideUp}, [
				h("div.details", {}, [
					h("a.site", {href: site.getHref()}, [site.row.content.title]),
					h("div.added", [Time.since(feed.date_added)])
				]),
				h("div.circle", {style: "border-color: #{Text.toColor(feed.type+site.row.address, 60, 60)}"}),
				h("span.type", [@formatType(feed.type)]),
				h("a.title", {href: site.getHref()+"/"+feed.url}, [feed.title]),
				h("div.body", {key: feed.body, enterAnimation: Animation.slideDown, exitAnimation: Animation.slideUp}, [@formatBody(feed.body, feed.type)])
				if feed.body_more  # Display comments
					feed.body_more.map (body_more) =>
						h("div.body", {key: body_more, enterAnimation: Animation.slideDown, exitAnimation: Animation.slideUp}, [@formatBody(body_more, feed.type)])
				if feed.more > 0  # Collapse other types
					h("a.more", {href: site.getHref()+"/"+feed.url}, ["+#{feed.more} more"])
			])
		catch err
			@log err
			return h("div")

	renderWelcome: =>
		h("div.welcome", [
			h("img", {src: "img/logo_big.png", height: 150})
			h("h1", ["Welcome to ", h("span.zeronet", "ZeroNet")])
			h("h2", ["Let's build a decentralized Internet together!"])
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
				])
			])
		])

	render: =>
		h("div",
			if @feeds == null or not Page.site_list.loaded
				h("div.loading")
			else if @feeds.length > 0
				[
					h("div.feeds-line"),
					h("div.FeedList", @feeds[0..30].map(@renderFeed))
				]
			else
				@renderWelcome()
		)


	onSiteInfo: (site_info) =>
		if site_info.event?[0] == "file_done" and site_info.event?[1].endsWith(".json") and not site_info.event?[1].endsWith("content.json")
			RateLimit(5000, @update)

window.FeedList = FeedList