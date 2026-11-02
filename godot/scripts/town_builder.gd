extends Node3D
## Towns: every town grows its own street network from a central green, with cottages facing the
## lanes and fenced plots behind them. Also builds the roads between towns and keeps a mask of
## bare ground (houses, lanes, beds) so grass and trees stay off it.

signal mask_changed(rect: Rect2)

const MeshKit = preload("res://scripts/mesh_kit.gd")
const MASK_RES := 2.0  # metres per mask pixel

var world
var sim
var mats := {}
var towns := {}      # city seed -> {node, mesh, label, count, band}
var mask: Image      # 255 = grass may grow, 0 = bare
var road_node: MeshInstance3D
var _queue: Array = []


func setup(w, s, tex: Dictionary) -> void:
	world = w
	sim = s
	mask = Image.create(int(w.SX / MASK_RES), int(w.SZ / MASK_RES), false, Image.FORMAT_L8)
	mask.fill(Color(1, 1, 1))
	mats["timber"] = _mat(tex, "timber", 0.9)
	mats["plaster"] = _mat(tex, "plaster", 0.85)
	mats["thatch"] = _mat(tex, "thatch", 1.0)
	mats["stone"] = _mat(tex, "rock", 0.95)
	mats["wood"] = _mat(tex, "timber", 0.9)
	mats["soil"] = _mat(tex, "dirt", 1.0)
	mats["path"] = _mat(tex, "path", 0.95)
	mats["crop"] = _mat(tex, "grass", 0.9)
	mats["dark"] = _mat(tex, "timber", 0.7)


func _mat(tex: Dictionary, name: String, rough: float) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_texture = tex[name + "_albedo"]
	if tex.has(name + "_normal"):
		m.normal_enabled = true
		m.normal_texture = tex[name + "_normal"]
		m.normal_scale = 1.0
	m.roughness = rough
	m.vertex_color_use_as_albedo = true
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	return m


func band_for(era: int) -> int:
	if era == 0:
		return 0
	if era <= 4:
		return 1
	return 2


func want_count(c: Dictionary, era: int) -> int:
	var s: float = c["size"]
	if era == 0:
		return clampi(int(3 + s * 0.9), 3, 26)
	return clampi(int(3 + s * 1.7), 3, 140)


## call every frame: rebuilds at most one town whose size or age changed
func update_towns() -> void:
	if _queue.is_empty():
		for n in sim.nations:
			if not n["alive"]:
				continue
			for c in n["cities"]:
				var key: int = c["seed"]
				var want := want_count(c, n["era"])
				var band := band_for(n["era"])
				var t = towns.get(key)
				if t == null or band != t["band"] or want >= t["count"] + 2 or want < t["count"] - 6:
					_queue.append([c, n])
	if not _queue.is_empty():
		var job: Array = _queue.pop_front()
		build_town(job[0], job[1])


func remove_town(c: Dictionary) -> void:
	var key: int = c["seed"]
	if towns.has(key):
		towns[key]["node"].queue_free()
		towns.erase(key)


# ------------------------------------------------------------------ planning
func city_pos(c: Dictionary) -> Vector3:
	var x: float = (c["x"] + 0.5) * world.TILE
	var z: float = (c["z"] + 0.5) * world.TILE
	return Vector3(x, world.height_at(x, z), z)


func _bad(x: float, z: float) -> bool:
	if not world.in_bounds(x, z):
		return true
	var h: float = world.height_at(x, z)
	if h < 1.3:
		return true
	if world.normal_at(x, z).y < 0.88:
		return true
	var t: int = world.tile_of(x, z)
	return t < 0 or world.biome[t] >= world.MOUNTAIN


func plan(c: Dictionary, band: int, cap: bool) -> Dictionary:
	var key := "%d|%d" % [band, 1 if cap else 0]
	if c.has("plan") and c["plan"]["key"] == key:
		return c["plan"]
	var r := RandomNumberGenerator.new()
	r.seed = c["seed"]
	var cp := city_pos(c)
	var cx := cp.x
	var cz := cp.z
	var pr := 16.0 if cap else 10.0
	var grid := {}
	var CELL := 8.0
	var free := func(x: float, z: float, rad: float) -> bool:
		var gx := int(floor(x / CELL))
		var gz := int(floor(z / CELL))
		for a in range(-3, 4):
			for b in range(-3, 4):
				var L = grid.get(Vector2i(gx + a, gz + b))
				if L == null:
					continue
				for o in L:
					if Vector2(o.x - x, o.y - z).length() < rad + o.z:
						return false
		return true
	var mark := func(x: float, z: float, rad: float) -> void:
		var k := Vector2i(int(floor(x / CELL)), int(floor(z / CELL)))
		if not grid.has(k):
			grid[k] = []
		grid[k].append(Vector3(x, z, rad))
	var streets: Array = []
	var slots: Array = []
	var reserved := {}
	if band == 0:
		# a loose camp: huts gather in small clusters around the fire
		var huts := [Vector2(cx + 7.0, cz)]
		for k in 90:
			var bse: Vector2 = huts[r.randi_range(0, huts.size() - 1)]
			var a := r.randf() * TAU
			var d := 7.5 + r.randf() * 4.0
			var x := bse.x + cos(a) * d
			var z := bse.y + sin(a) * d
			if Vector2(x - cx, z - cz).length() < 6.0 or _bad(x, z) or not free.call(x, z, 3.4):
				continue
			mark.call(x, z, 3.4)
			huts.append(Vector2(x, z))
			slots.append({"x": x, "z": z, "rot": r.randf() * TAU, "w": 4.4, "d": 4.4, "pd": 0.0, "pw": 0.0, "core": 0.0, "st": -1, "at": 0.0, "dd": Vector2(x - cx, z - cz).length() + r.randf() * 10.0})
		slots.sort_custom(func(a, b): return a["dd"] < b["dd"])
		c["plan"] = {"key": key, "streets": streets, "slots": slots, "pr": 5.0, "church": null}
		return c["plan"]
	var straight := 0.35 if band >= 2 else 1.0
	var length := (250.0 if cap else 165.0) * (1.25 if band >= 2 else 1.0)
	var walk := func(x: float, z: float, h: float, L: float, main: bool) -> Array:
		var pts := [Vector3(x, 0.0, z)]
		var d := 0.0
		var step := 4.0
		for s in int(L / step):
			var best = null
			var bc := 1e9
			var y0: float = world.height_at(x, z)
			for dh in [-0.3, -0.15, 0.0, 0.15, 0.3]:
				var hh: float = h + dh * straight + (r.randf() - 0.5) * 0.12 * straight
				var X := x + cos(hh) * step
				var Z := z + sin(hh) * step
				if _bad(X, Z):
					continue
				var cost: float = absf(world.height_at(X, Z) - y0) * 0.9 + absf(dh) * (1.2 if main else 0.6) + r.randf() * 0.08
				if cost < bc:
					bc = cost
					best = Vector3(X, hh, Z)
			if best == null or bc > 2.4:
				break
			x = best.x
			z = best.z
			h = best.y
			d += step
			pts.append(Vector3(x, d, z))
		return pts
	# main streets leave the green in a few directions: one arm makes a street village, five a star town
	var nm: int = [1, 2, 2, 3, 3, 3, 4, 4, 5][r.randi_range(0, 8)]
	var a0 := r.randf() * TAU
	var arms := []
	if nm == 1:
		arms = [a0, a0 + PI + (r.randf() - 0.5) * 0.6]
	else:
		for k in nm:
			arms.append(a0 + k * TAU / nm + (r.randf() - 0.5) * 0.7)
	# a church on the green for capitals, once there is stone to build with
	var church = null
	if cap:
		var ca: float = a0 + PI / nm
		var chp := Vector3(cx + cos(ca) * (pr + 11.0), 0.0, cz + sin(ca) * (pr + 11.0))
		if not _bad(chp.x, chp.z):
			church = {"x": chp.x, "z": chp.z, "rot": atan2(-cos(ca), -sin(ca))}
			mark.call(chp.x, chp.z, 12.0)
	for a in arms:
		var pts: Array = walk.call(cx + cos(a) * pr, cz + sin(a) * pr, a, length * (0.6 + r.randf() * 0.6), true)
		if pts.size() > 3:
			streets.append({"pts": pts, "main": true, "base": pr})
	var mains := streets.size()
	for m in mains:
		var st: Dictionary = streets[m]
		var side := 1.0 if r.randf() < 0.5 else -1.0
		var i := 5
		while i < st["pts"].size() - 2:
			if r.randf() < 0.6:
				var p0: Vector3 = st["pts"][i]
				var p1: Vector3 = st["pts"][i + 1]
				var h := atan2(p1.z - p0.z, p1.x - p0.x) + side * (PI / 2.0 + (r.randf() - 0.5) * 0.6)
				side = -side
				var pts2: Array = walk.call(p0.x, p0.z, h, (30.0 + r.randf() * 80.0) * (1.3 if cap else 1.0), false)
				if pts2.size() > 3:
					streets.append({"pts": pts2, "main": false, "base": p0.y + st["base"]})
			i += 3 + r.randi_range(0, 3)
	# plots on the green first, then along every street, both sides
	var hw := 7.6 if band == 1 else 9.0
	var hd := 5.6 if band == 1 else 8.0
	var ring := maxi(5, int(pr * TAU / (hw + 2.5)))
	for k in ring:
		var a := TAU * k / ring + 0.2
		var rr := pr + hd * 0.5 + 2.5
		var x := cx + cos(a) * rr
		var z := cz + sin(a) * rr
		if _bad(x, z) or not free.call(x, z, hw * 0.5):
			continue
		mark.call(x, z, hw * 0.5)
		slots.append({"x": x, "z": z, "rot": atan2(-cos(a), -sin(a)), "w": hw, "d": hd, "pd": 6.0, "pw": hw * 1.1, "core": 1.0, "st": -1, "at": 0.0, "dd": pr * 0.5})
	for st in streets:
		for q in st["pts"]:
			mark.call(q.x, q.z, 3.0 if st["main"] else 2.2)
	for si in streets.size():
		var st: Dictionary = streets[si]
		var sw := 2.6 if st["main"] else 1.9
		var P: Array = st["pts"]
		for i in range(1, P.size()):
			var p0: Vector3 = P[i - 1]
			var p1: Vector3 = P[i]
			var h := atan2(p1.z - p0.z, p1.x - p0.x)
			for side in [1.0, -1.0]:
				var dd: float = st["base"] + p1.y
				var core := clampf(1.0 - dd / (190.0 if cap else 110.0), 0.0, 1.0)
				var rural := band == 1 and core < 0.6
				if r.randf() < (0.32 if rural else 0.12):
					continue
				var w := hw * (0.85 + r.randf() * 0.35)
				var d := hd * (0.85 + r.randf() * 0.3)
				var nx: float = -sin(h) * side
				var nz: float = cos(h) * side
				var off: float = sw + d * 0.5 + (3.0 + r.randf() * 5.0 if rural else 1.0 + r.randf() * 1.5)
				var x := p1.x + nx * off
				var z := p1.z + nz * off
				var rad := maxf(w, d) * 0.68 if rural else minf(w, d) * 0.55
				if _bad(x, z) or not free.call(x, z, rad):
					continue
				var pd := 0.0
				if band == 1:
					pd = 10.0 + r.randf() * 12.0 if rural else 5.0 + r.randf() * 4.0
				var pw := w * (1.1 + r.randf() * 0.5)
				var bx := x + nx * (d * 0.5 + pd * 0.5)
				var bz := z + nz * (d * 0.5 + pd * 0.5)
				if pd > 0.0 and (_bad(bx, bz) or not free.call(bx, bz, pd * 0.42)):
					pd = 0.0
				mark.call(x, z, rad)
				if pd > 0.0:
					mark.call(bx, bz, pd * 0.45)
					mark.call(x + nx * (d * 0.5 + pd * 0.9), z + nz * (d * 0.5 + pd * 0.9), pw * 0.4)
				slots.append({"x": x, "z": z, "rot": atan2(-nx, -nz), "w": w, "d": d, "pd": pd, "pw": pw, "core": core, "st": si, "at": p1.y, "dd": dd + r.randf() * 25.0})
	slots.sort_custom(func(a, b): return a["dd"] < b["dd"])
	c["plan"] = {"key": key, "streets": streets, "slots": slots, "pr": pr, "church": church}
	return c["plan"]


# ------------------------------------------------------------------ building
func build_town(c: Dictionary, n: Dictionary) -> void:
	var key: int = c["seed"]
	var era: int = n["era"]
	var band := band_for(era)
	var cap: bool = is_same(c, n["cities"][0])
	var p := plan(c, band, cap)
	var want := want_count(c, era)
	var kit = MeshKit.new()
	var r := RandomNumberGenerator.new()
	var cp := city_pos(c)
	var reach := {}
	var placed := 0
	var bounds := Rect2(cp.x, cp.z, 0, 0)
	for sl in p["slots"]:
		if placed >= want:
			break
		var t: int = world.tile_of(sl["x"], sl["z"])
		if t < 0 or sim.owner[t] != n["id"]:
			continue
		r.seed = int(sl["x"] * 131.0 + sl["z"] * 17.0)
		if _house(kit, sl, band, era, r):
			placed += 1
			bounds = bounds.expand(Vector2(sl["x"], sl["z"]))
			if sl["st"] >= 0:
				reach[sl["st"]] = maxf(reach.get(sl["st"], 0.0), sl["at"] + 10.0)
	# the green, its well, and the streets as far as houses reach
	if band >= 1:
		kit.ground_disc("path", cp, p["pr"], Color(0.95, 0.93, 0.9), world)
		_mask_circle(Vector2(cp.x, cp.z), p["pr"] + 8.0, 0.5)
		_mask_circle(Vector2(cp.x, cp.z), p["pr"])
		_well(kit, cp)
		if p["church"] != null and era >= 2:
			_church(kit, p["church"])
		for si in p["streets"].size():
			if not reach.has(si):
				continue
			var st: Dictionary = p["streets"][si]
			var lim: float = reach[si]
			var pts2 := PackedVector2Array()
			for q in st["pts"]:
				if q.y > lim:
					break
				pts2.append(Vector2(q.x, q.z))
			if pts2.size() < 2:
				continue
			pts2 = world.chaikin(pts2, 2)
			var pts3 := PackedVector3Array()
			for q in pts2:
				pts3.append(Vector3(q.x, world.height_at(q.x, q.y), q.y))
			var wdt := 5.0 if st["main"] else 3.6
			kit.ribbon("path", pts3, wdt, Color(1, 1, 1), world)
			_mask_line(pts3, wdt * 0.5 + 0.6)
	else:
		# campfire ring
		for k in 8:
			var a := TAU * k / 8.0
			var q := cp + Vector3(cos(a), 0, sin(a)) * 1.2
			kit.box("stone", Vector3(q.x, world.height_at(q.x, q.z) - 0.1, q.z), Vector3(0.45, 0.3, 0.4), a, Color(0.8, 0.8, 0.78))
		_mask_circle(Vector2(cp.x, cp.z), 3.0)
	# replace the old node
	var t0 = towns.get(key)
	if t0 != null:
		t0["node"].queue_free()
	var node := Node3D.new()
	var mi := MeshInstance3D.new()
	mi.mesh = kit.commit(mats)
	node.add_child(mi)
	var lbl := Label3D.new()
	lbl.text = c["name"]
	lbl.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	lbl.fixed_size = true
	lbl.pixel_size = 0.0012
	lbl.font_size = 30
	lbl.outline_size = 10
	lbl.no_depth_test = true
	lbl.modulate = Color(1, 1, 1)
	lbl.outline_modulate = Color(0, 0, 0, 0.75)
	lbl.position = cp + Vector3(0, 28, 0)
	node.add_child(lbl)
	add_child(node)
	towns[key] = {"node": node, "label": lbl, "count": want, "band": band, "pos": cp}
	mask_changed.emit(bounds.grow(60.0))


func _ground_range(x: float, z: float, w: float, d: float, yaw: float) -> Vector2:
	var ax := MeshKit.axes(yaw)
	var rr: Vector3 = ax[0]
	var f: Vector3 = ax[1]
	var lo := 1e9
	var hi := -1e9
	for pt in [Vector2(-0.5, -0.5), Vector2(0.5, -0.5), Vector2(0.5, 0.5), Vector2(-0.5, 0.5), Vector2(0, 0)]:
		var q := Vector3(x, 0, z) + rr * (pt.x * w) + f * (pt.y * d)
		var h: float = world.height_at(q.x, q.z)
		lo = minf(lo, h)
		hi = maxf(hi, h)
	return Vector2(lo, hi)


func _house(kit, sl: Dictionary, band: int, era: int, r: RandomNumberGenerator) -> bool:
	var x: float = sl["x"]
	var z: float = sl["z"]
	var yaw: float = sl["rot"]
	var w: float = sl["w"]
	var d: float = sl["d"]
	var g := _ground_range(x, z, w + 1.0, d + 1.0, yaw)
	if g.x < 0.8 or g.y - g.x > 4.0:
		return false
	var fl := g.y + 0.15
	var base := Vector3(x, fl, z)
	var ax := MeshKit.axes(yaw)
	var rr: Vector3 = ax[0]
	var f: Vector3 = ax[1]
	_mask_circle(Vector2(x, z), maxf(w, d) * 0.5 + 7.0, 0.5)
	_mask_rect(Vector2(x, z), w + 1.2, d + 1.2, yaw)
	if g.y - g.x > 0.25:
		kit.box("stone", Vector3(x, g.x - 0.4, z), Vector3(w + 0.3, fl - g.x + 0.4, d + 0.3), yaw, Color(0.85, 0.83, 0.8), 0.35)
	if band == 0:
		var hc := Color(0.72, 0.62, 0.5)
		kit.cylinder("plaster", Vector3(x, g.x - 0.2, z), 2.1, fl - g.x + 1.5, 12, hc)
		kit.cone("thatch", Vector3(x, fl + 1.2, z), 3.0, 3.4, 14, Color(0.78, 0.74, 0.68), 0.35)
		return true
	var h := 2.7 + r.randf() * 0.4
	var tone := r.randf()
	var thatch := Color(0.78, 0.74, 0.68).lerp(Color(0.62, 0.58, 0.52), r.randf())
	if band == 2:
		h = 5.6 + r.randf() * 1.2 * (1.0 + sl["core"])
	var wall := "timber" if (tone < 0.55 and band == 1) else "plaster"
	var wcol := Color(1, 1, 1) if wall == "plaster" else Color(1, 1, 1).lerp(Color(0.8, 0.78, 0.76), r.randf())
	if wall == "plaster":
		wcol = Color(1, 0.98, 0.94).lerp(Color(0.86, 0.8, 0.7), r.randf() * 0.7)
	kit.box(wall, base, Vector3(w, h, d), yaw, wcol, 0.4, false)
	var dark := Color(0.3, 0.26, 0.22)
	if wall == "plaster":
		# timber frame: corner posts, sill and top beams, a brace on the front
		for sx in [-1.0, 1.0]:
			for sz in [-1.0, 1.0]:
				var q := base + rr * (sx * (w * 0.5 - 0.1)) + f * (sz * (d * 0.5 - 0.1))
				kit.box("wood", q, Vector3(0.26, h, 0.26), yaw, dark, 0.5)
		for sz in [-1.0, 1.0]:
			kit.box("wood", base + f * (sz * (d * 0.5 + 0.02)), Vector3(w, 0.22, 0.08), yaw, dark, 0.5)
			kit.box("wood", base + f * (sz * (d * 0.5 + 0.02)) + Vector3(0, h - 0.24, 0), Vector3(w, 0.24, 0.08), yaw, dark, 0.5)
			if band == 2:
				kit.box("wood", base + f * (sz * (d * 0.5 + 0.02)) + Vector3(0, h * 0.5, 0), Vector3(w, 0.22, 0.08), yaw, dark, 0.5)
	# door and windows on the street side
	kit.box("dark", base + f * (d * 0.5 + 0.03) + rr * (w * 0.18), Vector3(1.0, 2.0, 0.08), yaw, Color(0.42, 0.34, 0.26), 0.6)
	for sx in ([-0.3, 0.38] if w > 6.0 else [-0.3]):
		var wp: Vector3 = base + f * (d * 0.5 + 0.03) + rr * (w * sx) + Vector3(0, 1.25, 0)
		kit.box("dark", wp, Vector3(0.75, 0.7, 0.06), yaw, Color(0.12, 0.12, 0.13), 1.0)
		kit.box("wood", wp - rr * 0.6, Vector3(0.38, 0.72, 0.07), yaw, Color(0.55, 0.45, 0.35), 0.6)
		kit.box("wood", wp + rr * 0.6, Vector3(0.38, 0.72, 0.07), yaw, Color(0.55, 0.45, 0.35), 0.6)
		if band == 2:
			kit.box("dark", wp + Vector3(0, h * 0.5, 0), Vector3(0.75, 0.8, 0.06), yaw, Color(0.12, 0.12, 0.13), 1.0)
	for sx in [-1.0, 1.0]:
		kit.box("dark", base + rr * (sx * (w * 0.5 + 0.03)) + Vector3(0, 1.25, 0), Vector3(0.06, 0.65, 0.7), yaw, Color(0.12, 0.12, 0.13), 1.0)
	# roof: steep hipped thatch for villages, darker steeper roofs for towns
	var ov := 0.75
	var rise := (d * 0.5 + ov) * (1.35 if band == 1 else 1.1)
	var rcol := thatch if band == 1 else Color(0.55, 0.3, 0.24).lerp(Color(0.4, 0.38, 0.4), r.randf())
	kit.hip_roof("thatch", base + Vector3(0, h, 0), w * 0.5 + ov, d * 0.5 + ov, rise, yaw, rcol, 0.35)
	if band == 1 and r.randf() < 0.22:
		# lean-to on one side
		var s := 1.0 if r.randf() < 0.5 else -1.0
		var lq := base + rr * (s * (w * 0.5 + 1.4)) - f * (d * 0.12)
		kit.box("timber", lq, Vector3(2.8, h * 0.72, d * 0.7), yaw, wcol if wall == "timber" else Color(0.85, 0.82, 0.78), 0.4, false)
		kit.hip_roof("thatch", lq + Vector3(0, h * 0.72, 0), 1.9, d * 0.35 + 0.5, 1.6, yaw, rcol, 0.35)
	if sl["pd"] > 0.0:
		_yard(kit, sl, r)
	return true


func _yard(kit, sl: Dictionary, r: RandomNumberGenerator) -> void:
	var yaw: float = sl["rot"]
	var ax := MeshKit.axes(yaw)
	var rr: Vector3 = ax[0]
	var f: Vector3 = ax[1]
	var c := Vector3(sl["x"], 0, sl["z"])
	var d: float = sl["d"]
	var pd: float = sl["pd"]
	var pw: float = sl["pw"]
	var z0 := -d * 0.5 - 0.6
	var z1 := z0 - pd
	var at := func(lx: float, lz: float) -> Vector3:
		var q := c + rr * lx + f * lz
		q.y = world.height_at(q.x, q.z)
		return q
	var fc := Color(0.62, 0.55, 0.46)
	var pc := c + f * ((z0 + z1) * 0.5)
	_mask_rect(Vector2(pc.x, pc.z), pw + 2.0, pd + 2.0, yaw, 0.5)
	# wattle fence: posts and two rails on three sides
	var runs := [[Vector2(-pw * 0.5, z0), Vector2(-pw * 0.5, z1)], [Vector2(-pw * 0.5, z1), Vector2(pw * 0.5, z1)], [Vector2(pw * 0.5, z1), Vector2(pw * 0.5, z0)]]
	for run in runs:
		var a: Vector2 = run[0]
		var b: Vector2 = run[1]
		var len := a.distance_to(b)
		var nposts := maxi(2, int(len / 2.3) + 1)
		var along := (b - a) / len
		var ryaw := yaw + (PI * 0.5 if absf(along.x) > 0.5 else 0.0)
		for k in nposts:
			var t := float(k) / (nposts - 1)
			var pp: Vector2 = a.lerp(b, t)
			kit.box("wood", at.call(pp.x, pp.y) - Vector3(0, 0.1, 0), Vector3(0.14, 1.15, 0.14), yaw, fc * 0.8, 0.6)
			if k < nposts - 1:
				var mp: Vector2 = a.lerp(b, (k + 0.5) / (nposts - 1))
				var seg := len / (nposts - 1)
				for ry in [0.45, 0.85]:
					kit.box("wood", at.call(mp.x, mp.y) + Vector3(0, ry, 0), Vector3(0.07, 0.09, seg), ryaw, fc, 0.6)
	# dug beds with rows of crops
	var nb := r.randi_range(1, 3)
	var bw := pw * 0.78 / nb
	for b in nb:
		var bx := -pw * 0.39 + bw * (b + 0.5)
		var bl := pd * (0.45 + r.randf() * 0.25)
		var bz := z1 + 1.0 + bl * 0.5
		var q: Vector3 = at.call(bx, bz)
		kit.box("soil", q - Vector3(0, 0.12, 0), Vector3(bw * 0.84, 0.26, bl), yaw, Color(0.82, 0.74, 0.66), 0.4)
		_mask_rect(Vector2(q.x, q.z), bw * 0.9, bl + 0.4, yaw)
		var rows := maxi(2, int(bw / 0.9))
		var crop := Color(0.55, 0.85, 0.4).lerp(Color(0.85, 0.85, 0.45), r.randf() * 0.6)
		for k in rows:
			var rx := bx - bw * 0.36 + bw * 0.72 * (k + 0.5) / rows
			var rq: Vector3 = at.call(rx, bz)
			kit.box("crop", rq + Vector3(0, 0.08, 0), Vector3(0.32, 0.32, bl * 0.9), yaw, crop, 1.0)
	# something in the corner: a haystack, a woodpile or a shed
	var ex := r.randf()
	var xx := (1.0 if r.randf() < 0.5 else -1.0) * pw * 0.28
	var zz := z0 - pd * 0.22
	var q2: Vector3 = at.call(xx, zz)
	if ex < 0.3:
		kit.cone("thatch", q2 - Vector3(0, 0.1, 0), 1.3, 2.6, 12, Color(0.95, 0.85, 0.6), 0.4)
		_mask_circle(Vector2(q2.x, q2.z), 1.4)
	elif ex < 0.5:
		kit.box("wood", q2 - Vector3(0, 0.1, 0), Vector3(2.2, 0.9, 0.9), yaw, Color(0.75, 0.62, 0.5), 0.5)
	elif ex < 0.72:
		kit.box("timber", q2 - Vector3(0, 0.2, 0), Vector3(3.0, 2.2, 2.4), yaw, Color(0.85, 0.82, 0.78), 0.4, false)
		kit.hip_roof("thatch", q2 + Vector3(0, 2.0, 0), 1.9, 1.6, 1.7, yaw, Color(0.7, 0.66, 0.6), 0.35)
		_mask_rect(Vector2(q2.x, q2.z), 3.4, 2.8, yaw)


func _well(kit, cp: Vector3) -> void:
	var q := Vector3(cp.x, world.height_at(cp.x, cp.z), cp.z)
	kit.cylinder("stone", q - Vector3(0, 0.2, 0), 1.0, 1.1, 14, Color(0.85, 0.83, 0.8), 0.4)
	kit.box("dark", q + Vector3(0, 0.75, 0), Vector3(1.6, 0.1, 1.6), 0.0, Color(0.1, 0.12, 0.14))
	for s in [-1.0, 1.0]:
		kit.box("wood", q + Vector3(s * 0.95, 0.0, 0), Vector3(0.16, 2.3, 0.16), 0.0, Color(0.5, 0.42, 0.34))
	kit.hip_roof("thatch", q + Vector3(0, 2.3, 0), 1.4, 1.1, 0.9, 0.0, Color(0.7, 0.66, 0.6), 0.4)


func _church(kit, ch: Dictionary) -> void:
	var x: float = ch["x"]
	var z: float = ch["z"]
	var yaw: float = ch["rot"]
	var g := _ground_range(x, z, 10.0, 18.0, yaw)
	var base := Vector3(x, g.y + 0.2, z)
	var ax := MeshKit.axes(yaw)
	var f: Vector3 = ax[1]
	var sc := Color(0.92, 0.9, 0.86)
	kit.box("stone", Vector3(x, g.x - 0.5, z), Vector3(10.4, base.y - g.x + 0.5, 18.4), yaw, sc, 0.3)
	kit.box("plaster", base, Vector3(9.0, 7.0, 17.0), yaw, Color(0.96, 0.95, 0.92), 0.3, false)
	kit.gable_roof("thatch", base + Vector3(0, 7.0, 0), 9.3, 5.3, 5.5, yaw + PI * 0.5, Color(0.5, 0.48, 0.48), "plaster", Color(0.96, 0.95, 0.92), 0.3)
	var tw := base - f * 9.6
	kit.box("stone", tw, Vector3(4.2, 16.0, 4.2), yaw, sc, 0.3)
	kit.hip_roof("thatch", tw + Vector3(0, 16.0, 0), 2.5, 2.5, 6.5, yaw, Color(0.42, 0.42, 0.44), 0.4)
	kit.box("dark", base + f * 8.53, Vector3(1.4, 2.6, 0.1), yaw, Color(0.35, 0.28, 0.22))
	_mask_rect(Vector2(x, z), 11.0, 24.0, yaw)


# ------------------------------------------------------------------ roads between towns
func build_roads() -> void:
	if road_node != null:
		road_node.queue_free()
		road_node = null
	var kit = MeshKit.new()
	var used := {}
	var any := false
	for n in sim.nations:
		if not n["alive"] or n["cities"].size() < 2:
			continue
		var conn := [n["cities"][0]]
		var rest: Array = n["cities"].slice(1)
		while not rest.is_empty():
			var bi := 0
			var bj := 0
			var bd := 1e9
			for i in rest.size():
				for j in conn.size():
					var dd := Vector2(rest[i]["x"] - conn[j]["x"], rest[i]["z"] - conn[j]["z"]).length()
					if dd < bd:
						bd = dd
						bi = i
						bj = j
			var a: Dictionary = rest[bi]
			rest.remove_at(bi)
			var b: Dictionary = conn[bj]
			conn.append(a)
			if bd > 22.0:
				continue
			var path := _road_path(a, b, n["id"], used)
			if path.is_empty():
				continue
			var pts := PackedVector2Array()
			var rr := RandomNumberGenerator.new()
			for t in path:
				rr.seed = t * 7 + 3
				var cc: Vector3 = world.tile_center(t)
				pts.append(Vector2(cc.x + (rr.randf() - 0.5) * 12.0, cc.z + (rr.randf() - 0.5) * 12.0))
			pts = world.chaikin(pts, 3)
			var p3 := PackedVector3Array()
			for q in pts:
				p3.append(Vector3(q.x, world.height_at(q.x, q.y), q.y))
			kit.ribbon("path", p3, 4.4, Color(0.97, 0.95, 0.92), world, 0.14)
			_mask_line(p3, 3.0)
			any = true
	if any:
		road_node = MeshInstance3D.new()
		road_node.mesh = kit.commit(mats)
		add_child(road_node)
		mask_changed.emit(Rect2(0, 0, world.SX, world.SZ))


func _road_path(a: Dictionary, b: Dictionary, nid: int, used: Dictionary) -> Array:
	var GW: int = world.GW
	var GH: int = world.GH
	var S: int = a["z"] * GW + a["x"]
	var T: int = b["z"] * GW + b["x"]
	var g := {}
	var from := {}
	g[S] = 0.0
	var open := [[Vector2(a["x"], a["z"]).distance_to(Vector2(b["x"], b["z"])), S]]
	var steps := 0
	var found := false
	while not open.is_empty() and steps < 6000:
		steps += 1
		# pick the cheapest open node (small graphs, a linear scan is fine)
		var bi := 0
		for i in open.size():
			if open[i][0] < open[bi][0]:
				bi = i
		var cur: Array = open[bi]
		open.remove_at(bi)
		var j: int = cur[1]
		if j == T:
			found = true
			break
		var x := j % GW
		var z := j / GW
		for dz in [-1, 0, 1]:
			for dx in [-1, 0, 1]:
				if dx == 0 and dz == 0:
					continue
				var X: int = x + dx
				var Z: int = z + dz
				if X < 0 or Z < 0 or X >= GW or Z >= GH:
					continue
				var k: int = Z * GW + X
				if world.is_water(k):
					continue
				var step: float = (1.414 if dx != 0 and dz != 0 else 1.0) * (1.0 + world.tile_slope[k] * 0.12 + (4.0 if world.biome[k] >= world.MOUNTAIN else 0.0) + (3.0 if nid >= 0 and sim.owner[k] != nid else 0.0))
				if world.river_tile[k] and not world.river_tile[j]:
					step += 2.5
				if used.has(k):
					step *= 0.45
				var ng: float = g[j] + step
				if ng < g.get(k, 1e9):
					g[k] = ng
					from[k] = j
					open.append([ng + Vector2(X, Z).distance_to(Vector2(b["x"], b["z"])), k])
	if not found:
		return []
	var path := []
	var cur2 := T
	while cur2 != S:
		path.append(cur2)
		cur2 = from[cur2]
	path.append(S)
	path.reverse()
	for t in path:
		used[t] = true
	return path


# ------------------------------------------------------------------ bare-ground mask
func _mask_px(i: int, j: int, v: float) -> void:
	if i < 0 or j < 0 or i >= mask.get_width() or j >= mask.get_height():
		return
	if mask.get_pixel(i, j).r > v:
		mask.set_pixel(i, j, Color(v, v, v))


func _mask_circle(c: Vector2, rad: float, v := 0.0) -> void:
	var cx := c.x / MASK_RES
	var cz := c.y / MASK_RES
	var rp := rad / MASK_RES
	for j in range(int(cz - rp) - 1, int(cz + rp) + 2):
		for i in range(int(cx - rp) - 1, int(cx + rp) + 2):
			if Vector2(i + 0.5 - cx, j + 0.5 - cz).length() <= rp:
				_mask_px(i, j, v)


func _mask_rect(c: Vector2, w: float, d: float, yaw: float, v := 0.0) -> void:
	var ax := MeshKit.axes(yaw)
	var rr: Vector3 = ax[0]
	var f: Vector3 = ax[1]
	var ext := (w + d) * 0.5
	for j in range(int((c.y - ext) / MASK_RES), int((c.y + ext) / MASK_RES) + 1):
		for i in range(int((c.x - ext) / MASK_RES), int((c.x + ext) / MASK_RES) + 1):
			var q := Vector3((i + 0.5) * MASK_RES - c.x, 0, (j + 0.5) * MASK_RES - c.y)
			if absf(q.dot(rr)) <= w * 0.5 and absf(q.dot(f)) <= d * 0.5:
				_mask_px(i, j, v)


func _mask_line(pts: PackedVector3Array, half: float) -> void:
	for k in pts.size():
		var p := pts[k]
		_mask_circle(Vector2(p.x, p.z), half + 4.0, 0.5)
		_mask_circle(Vector2(p.x, p.z), half)
