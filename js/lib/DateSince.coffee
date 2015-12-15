class DateSince
	constructor: (@elem, @time) ->
		@render()
		date_since_db.push(@)

	# Format time since
	formatSince: (time) ->
		now = +(new Date)/1000
		secs = now - time
		if secs < 60
			back = "Just now"
		else if secs < 60*60
			back = "#{Math.round(secs/60)} minutes ago"
		else if secs < 60*60*24
			back = "#{Math.round(secs/60/60)} hours ago"
		else if secs < 60*60*24*3
			back = "#{Math.round(secs/60/60/24)} days ago"
		else
			back = "on "+@formatDate(time)
		back = back.replace(/^1 ([a-z]+)s/, "1 $1") # 1 days ago fix
		return back

	# Format timestamp to date
	formatDate: (timestamp, format="short") ->
		parts = (new Date(timestamp*1000)).toString().split(" ")
		if format == "short"
			display = parts.slice(1, 4)
		else
			display = parts.slice(1, 5)
		return display.join(" ").replace(/( [0-9]{4})/, ",$1")

	render: ->
		@elem.textContent = @formatSince(@time)

window.date_since_db = []
setInterval ( ->
	for date_since in date_since_db
		date_since.render()
), 1000

window.DateSince = DateSince
