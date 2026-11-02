extends RefCounted
## Faithbound simulation, ported from the browser version: tribes grow into nations, spread over the land,
## found towns on good sites, advance through the ages and fight their neighbours.

signal city_added(city, nation)
signal city_changed(city)
signal city_removed(city)
signal borders_changed
signal era_reached(nation)
signal logged(text)

const ERAS := [
	{"name": "Stone Age", "tech": 0, "cap": 1.0, "mil": 1.0},
	{"name": "Bronze Age", "tech": 150, "cap": 1.3, "mil": 1.5},
	{"name": "Iron Age", "tech": 450, "cap": 1.6, "mil": 2.0},
	{"name": "Medieval", "tech": 1050, "cap": 2.0, "mil": 2.6},
	{"name": "Age of Sail", "tech": 2000, "cap": 2.6, "mil": 3.4},
	{"name": "Industrial", "tech": 3500, "cap": 3.6, "mil": 5.0},
	{"name": "Modern", "tech": 6000, "cap": 5.0, "mil": 7.0},
	{"name": "Future", "tech": 9500, "cap": 6.5, "mil": 10.0},
]
const COLORS := [Color("#c0392b"), Color("#2e6fb0"), Color("#d4a017"), Color("#3f8f4a"), Color("#8e44ad"), Color("#d35400"),
	Color("#16a085"), Color("#7f8c8d"), Color("#e84393"), Color("#2c3e50"), Color("#a0522d"), Color("#6c5ce7")]
const SYL := ["ka", "ri", "do", "mel", "an", "tor", "is", "va", "lo", "un", "sar", "eth", "bra", "gor", "li", "na", "ost", "ven", "ur", "dal", "mi", "sha", "ber", "ku"]
const DIRS := [Vector2i(1, 0), Vector2i(-1, 0), Vector2i(0, 1), Vector2i(0, -1)]

var world
var rng := RandomNumberGenerator.new()
var year := 0
var nations: Array = []
var owner := PackedInt32Array()


func setup(w, s: int, tribes: int) -> void:
	world = w
	rng.seed = s
	owner.resize(w.GW * w.GH)
	owner.fill(-1)
	var placed := 0
	var tries := 0
	while placed < tribes and tries < 8000:
		tries += 1
		var t := rng.randi_range(0, w.GW * w.GH - 1)
		if owner[t] >= 0 or w.site_score(t) < 0.75:
			continue
		var tx := t % w.GW
		var tz := t / w.GW
		var ok := true
		for n in nations:
			var c = n["cities"][0]
			if Vector2(c["x"] - tx, c["z"] - tz).length() < 13.0:
				ok = false
				break
		if ok:
			_new_nation(tx, tz)
			placed += 1
	_log("A new world rose from the deep. %d tribes wander its shores." % placed)


func gen_name(a: int, b: int) -> String:
	var n := ""
	for i in rng.randi_range(a, b):
		n += SYL[rng.randi_range(0, SYL.size() - 1)]
	return n.capitalize()


func _new_nation(tx: int, tz: int) -> Dictionary:
	var id := nations.size()
	var n := {"id": id, "name": gen_name(2, 3), "color": COLORS[id % COLORS.size()], "pop": 20.0, "tech": 0.0, "era": 0,
		"tiles": 0, "cities": [], "alive": true, "wars": {}, "aggr": 0.2 + rng.randf() * 0.7, "cap": 20.0, "front": []}
	nations.append(n)
	_add_city(n, tx, tz, n["name"])
	for dz in [-1, 0, 1]:
		for dx in [-1, 0, 1]:
			var x: int = tx + dx
			var z: int = tz + dz
			if x >= 0 and z >= 0 and x < world.GW and z < world.GH:
				var t: int = z * world.GW + x
				if owner[t] < 0 and (world.HAB[world.biome[t]] >= 0.1 or (dx == 0 and dz == 0)):
					claim(t, id)
	return n


func _add_city(n: Dictionary, tx: int, tz: int, nm: String) -> Dictionary:
	var c := {"x": tx, "z": tz, "name": nm, "seed": rng.randi(), "nation": n["id"], "size": 1.0, "built": -1}
	n["cities"].append(c)
	city_added.emit(c, n)
	return c


func claim(t: int, nid: int) -> void:
	var prev := owner[t]
	if prev == nid:
		return
	var x: int = t % world.GW
	var z: int = t / world.GW
	if prev >= 0:
		var P: Dictionary = nations[prev]
		P["tiles"] -= 1
		for i in P["cities"].size():
			var c: Dictionary = P["cities"][i]
			if c["x"] == x and c["z"] == z:
				P["cities"].remove_at(i)
				if nid >= 0:
					c["nation"] = nid
					nations[nid]["cities"].append(c)
					_log("%s captured %s from %s." % [nations[nid]["name"], c["name"], P["name"]])
					city_changed.emit(c)
				else:
					city_removed.emit(c)
				break
	owner[t] = nid
	if nid >= 0:
		nations[nid]["tiles"] += 1
	borders_changed.emit()


func near_city(tx: int, tz: int, d: int) -> bool:
	for n in nations:
		if not n["alive"]:
			continue
		for c in n["cities"]:
			if absi(c["x"] - tx) < d and absi(c["z"] - tz) < d:
				return true
	return false


func _best_site(n: Dictionary, tx: int, tz: int, r: int) -> int:
	var best := -1
	var bs := 0.0
	for dz in range(-r, r + 1):
		for dx in range(-r, r + 1):
			var x := tx + dx
			var z := tz + dz
			if x < 0 or z < 0 or x >= world.GW or z >= world.GH:
				continue
			var t: int = z * world.GW + x
			if owner[t] != n["id"]:
				continue
			var s: float = world.site_score(t)
			if s > bs:
				bs = s
				best = t
	return best


## rivers and ridges slow a nation down, so borders settle on them
func _terr(i: int, j: int) -> float:
	var f := 1.0
	if (world.river_tile[i] > 0) != (world.river_tile[j] > 0):
		f *= 0.3
	f *= clampf(1.25 - world.tile_slope[j] * 0.025, 0.2, 1.0)
	if world.biome[j] >= world.MOUNTAIN:
		f *= 0.3
	return f


func tick() -> void:
	year += 1
	var N: int = world.GW * world.GH
	var cap_a := {}
	for t in N:
		var o := owner[t]
		if o >= 0:
			cap_a[o] = cap_a.get(o, 0.0) + world.HAB[world.biome[t]]
	for n in nations:
		if not n["alive"]:
			continue
		var e: Dictionary = ERAS[n["era"]]
		n["cap"] = maxf(10.0, cap_a.get(n["id"], 0.0) * 16.0 * e["cap"])
		n["pop"] = clampf(n["pop"] + n["pop"] * 0.022 * (1.0 - n["pop"] / n["cap"]), 1.0, 1e9)
		n["tech"] += sqrt(n["pop"]) * 0.16 * (1.0 + n["cities"].size() * 0.04)
		if n["era"] < ERAS.size() - 1 and n["tech"] >= ERAS[n["era"] + 1]["tech"]:
			n["era"] += 1
			_log("%s entered the %s." % [n["name"], ERAS[n["era"]]["name"]])
			era_reached.emit(n)
		if n["tiles"] <= 0 or n["pop"] < 1.5:
			n["alive"] = false
			_log("%s has fallen." % n["name"])
			continue
		# towns grow with their share of the people
		var share: float = n["pop"] / maxf(1.0, n["cities"].size())
		for c in n["cities"]:
			var target := sqrt(share) * (1.4 if is_same(c, n["cities"][0]) else 1.0)
			c["size"] = lerpf(c["size"], target, 0.05)
		n["front"] = []
	# spread, found towns and fight, a random sample of borders each year
	for k in int(N * 0.1):
		var i := rng.randi_range(0, N - 1)
		var a := owner[i]
		if a < 0:
			continue
		var A: Dictionary = nations[a]
		var d: Vector2i = DIRS[rng.randi_range(0, 3)]
		var x: int = i % world.GW + d.x
		var z: int = i / world.GW + d.y
		if x < 0 or z < 0 or x >= world.GW or z >= world.GH:
			continue
		var j: int = z * world.GW + x
		var b := owner[j]
		if b == a:
			if rng.randf() < 0.0025 and A["tiles"] / maxf(1.0, A["cities"].size()) > 14.0:
				var s := _best_site(A, i % world.GW, i / world.GW, 2)
				if s >= 0 and not near_city(s % world.GW, s / world.GW, 5):
					_add_city(A, s % world.GW, s / world.GW, gen_name(2, 3))
			continue
		var hab: float = world.HAB[world.biome[j]]
		if b < 0:
			if hab < 0.1:
				continue
			var pr: float = A["pop"] / A["cap"]
			if rng.randf() < hab * 0.4 * (1.0 if pr > 0.6 else 0.2) * (1.0 + A["era"] * 0.08) * _terr(i, j):
				claim(j, a)
				if rng.randf() < 0.07:
					var s2 := _best_site(A, x, z, 1)
					if s2 >= 0 and not near_city(s2 % world.GW, s2 / world.GW, 5):
						_add_city(A, s2 % world.GW, s2 / world.GW, gen_name(2, 3))
			continue
		var B: Dictionary = nations[b]
		if A["wars"].has(b):
			A["front"].append(i)
			var sa: float = A["pop"] / maxf(1.0, A["tiles"]) * ERAS[A["era"]]["mil"]
			var sb: float = B["pop"] / maxf(1.0, B["tiles"]) * ERAS[B["era"]]["mil"]
			if rng.randf() < sa / (sa + sb) * 0.5 * _terr(i, j):
				var moved: float = B["pop"] / maxf(1.0, B["tiles"])
				B["pop"] = maxf(2.0, B["pop"] - moved * 0.7)
				A["pop"] += moved * 0.2
				claim(j, a)
		elif rng.randf() < 0.0012 * A["aggr"]:
			A["wars"][b] = true
			B["wars"][a] = true
			_log("%s declared war on %s." % [A["name"], B["name"]])
	# peace returns after a while
	for n in nations:
		for f in n["wars"].keys():
			if rng.randf() < 0.02:
				n["wars"].erase(f)
				nations[f]["wars"].erase(n["id"])
				_log("%s and %s made peace." % [n["name"], nations[f]["name"]])


func top_era() -> int:
	var e := 0
	for n in nations:
		if n["alive"]:
			e = maxi(e, n["era"])
	return e


func total_pop() -> float:
	var p := 0.0
	for n in nations:
		if n["alive"]:
			p += n["pop"]
	return p


func _log(t: String) -> void:
	logged.emit("Year %d: %s" % [year, t])
