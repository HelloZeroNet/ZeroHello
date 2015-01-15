window.cmp = (a, b) -> if a > b then 1 else if a < b then -1 else 0

### 
Array::sortBy = (key, options={}) ->
  @sort (a, b) ->
    [av, bv] = [a[key], b[key]]
    [av, bv] = [av.toLowerCase(), bv.toLowerCase()] if options.lower
    cmp av, bv
###