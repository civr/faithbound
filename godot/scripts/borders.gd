extends MeshInstance3D
## Realm borders: smoothed outlines traced around each nation's land, a bright line with a soft
## wash of the nation's colour fading inward. Red where two nations are at war.

var world
var sim
var mat: ShaderMaterial
var selected := -1


func setup(w, s) -> void:
	world = w
	sim = s
	mat = ShaderMaterial.new()
	mat.shader = load("res://shaders/border.gdshader")
	material_override = mat
	cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF


func set_fade(camera_dist: float) -> void:
	mat.set_shader_parameter("opacity", clampf(remap(camera_dist, 120.0, 700.0, 0.15, 1.0), 0.15, 1.0))


func rebuild() -> void:
	var GW: int = world.GW
	var GH: int = world.GH
	var TILE: float = world.TILE
	var edges := {}
	var list: Array = []
	for t in GW * GH:
		var o: int = sim.owner[t]
		if o < 0:
			continue
		var x := t % GW
		var z := t / GW
		for d in 4:
			var X: int = x + [1, -1, 0, 0][d]
			var Z: int = z + [0, 0, 1, -1][d]
			var nb := -1
			if X >= 0 and Z >= 0 and X < GW and Z < GH:
				nb = sim.owner[Z * GW + X]
			if nb == o:
				continue
			var a: Vector2i
			var b: Vector2i
			if d == 1:
				a = Vector2i(x, z)
				b = Vector2i(x, z + 1)
			elif d == 2:
				a = Vector2i(x, z + 1)
				b = Vector2i(x + 1, z + 1)
			elif d == 0:
				a = Vector2i(x + 1, z + 1)
				b = Vector2i(x + 1, z)
			else:
				a = Vector2i(x + 1, z)
				b = Vector2i(x, z)
			var war: bool = nb >= 0 and sim.nations[o]["wars"].has(nb)
			var e := {"o": o, "a": a, "b": b, "war": war, "used": false}
			var key := "%d:%d,%d" % [o, a.x, a.y]
			if not edges.has(key):
				edges[key] = []
			edges[key].append(e)
			list.append(e)
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var any := false
	for e0 in list:
		if e0["used"]:
			continue
		var loop := []
		var e = e0
		while e != null and not e["used"]:
			e["used"] = true
			loop.append(Vector3(e["a"].x, e["a"].y, 1.0 if e["war"] else 0.0))
			var nxt = null
			var L = edges.get("%d:%d,%d" % [e["o"], e["b"].x, e["b"].y])
			if L != null:
				for q in L:
					if not q["used"]:
						nxt = q
						break
			e = nxt
		if loop.size() < 3:
			continue
		var p := loop
		for it in 3:
			var o2 := []
			for i in p.size():
				var A: Vector3 = p[i]
				var B: Vector3 = p[(i + 1) % p.size()]
				var w := maxf(A.z, B.z)
				o2.append(Vector3(A.x * 0.75 + B.x * 0.25, A.y * 0.75 + B.y * 0.25, w))
				o2.append(Vector3(A.x * 0.25 + B.x * 0.75, A.y * 0.25 + B.y * 0.75, w))
			p = o2
		var n: Dictionary = sim.nations[e0["o"]]
		var base: Color = n["color"]
		var sel: bool = e0["o"] == selected
		var lw := (14.0 if sel else 8.0)
		var band := (90.0 if sel else 60.0)
		var M := p.size()
		var nrm := []
		for i in M:
			var A: Vector3 = p[(i - 1 + M) % M]
			var B: Vector3 = p[(i + 1) % M]
			var dv := Vector2(B.x - A.x, B.y - A.y).normalized()
			nrm.append(Vector2(dv.y, -dv.x))
		var at := func(i: int, off: float) -> Vector3:
			var q: Vector3 = p[i % M]
			var nn: Vector2 = nrm[i % M]
			var x := q.x * TILE + nn.x * off
			var z := q.y * TILE + nn.y * off
			return Vector3(x, maxf(world.height_at(x, z), 0.0) + 1.2, z)
		for i in M:
			var war: bool = p[i].z > 0.5 or p[(i + 1) % M].z > 0.5
			var lc := Color(0.95, 0.2, 0.12) if war else base
			var a0: Vector3 = at.call(i, 2.0)
			var b0: Vector3 = at.call(i + 1, 2.0)
			var a1: Vector3 = at.call(i, 2.0 + lw)
			var b1: Vector3 = at.call(i + 1, 2.0 + lw)
			var a2: Vector3 = at.call(i, 2.0 + lw + band)
			var b2: Vector3 = at.call(i + 1, 2.0 + lw + band)
			for v in [[a0, 1.0], [b0, 1.0], [b1, 1.0], [a0, 1.0], [b1, 1.0], [a1, 1.0], [a1, 0.35], [b1, 0.35], [b2, 0.0], [a1, 0.35], [b2, 0.0], [a2, 0.0]]:
				var c := lc
				c.a = v[1]
				st.set_color(c)
				st.set_normal(Vector3.UP)
				st.add_vertex(v[0])
			any = true
	mesh = st.commit() if any else null
