extends Node3D
## Builds the landscape as chunked meshes. Vertex colour carries the ground layer weights
## (r grass, g forest floor, b sand, a farmland/dirt); rock and snow come from slope and height in the shader.

const CHUNK := 64  # quads per chunk side

var world
var material: ShaderMaterial
var chunks: Array[MeshInstance3D] = []
var water: MeshInstance3D
var river_mesh: MeshInstance3D
var field_tiles := {}  # tile -> true for farmland


func build(w, tex: Dictionary) -> void:
	world = w
	material = ShaderMaterial.new()
	material.shader = load("res://shaders/terrain.gdshader")
	for k in ["grass", "forest", "sand", "dirt", "rock", "snow"]:
		material.set_shader_parameter(k + "_alb", tex[k + "_albedo"])
		material.set_shader_parameter(k + "_nrm", tex.get(k + "_normal", tex["grass_normal"]))
	material.set_shader_parameter("macro_noise", _noise_tex(world.seed_value + 21, 0.004, 512))
	material.set_shader_parameter("fine_noise", _noise_tex(world.seed_value + 22, 0.06, 256))
	rebuild()
	_build_water(tex)
	_build_rivers()


func _noise_tex(s: int, f: float, size: int) -> NoiseTexture2D:
	var n := FastNoiseLite.new()
	n.seed = s
	n.frequency = f
	n.fractal_octaves = 4
	var t := NoiseTexture2D.new()
	t.width = size
	t.height = size
	t.seamless = true
	t.noise = n
	return t


func rebuild() -> void:
	for c in chunks:
		c.queue_free()
	chunks.clear()
	var cx := int(ceil((world.NX - 1) / float(CHUNK)))
	var cz := int(ceil((world.NZ - 1) / float(CHUNK)))
	for j in cz:
		for i in cx:
			var mi := MeshInstance3D.new()
			mi.mesh = _chunk_mesh(i * CHUNK, j * CHUNK)
			mi.material_override = material
			mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
			add_child(mi)
			chunks.append(mi)


func refresh_colors() -> void:
	rebuild()


func _weights_for(t: int) -> Color:
	var b: int = world.biome[t]
	if field_tiles.has(t):
		return Color(0.15, 0.0, 0.0, 0.85)
	if b == world.BEACH:
		return Color(0.15, 0.0, 0.85, 0.0)
	if b == world.SHALLOW or b == world.DEEP:
		return Color(0.0, 0.0, 1.0, 0.0)
	if b == world.FOREST:
		return Color(0.3, 0.7, 0.0, 0.0)
	if b == world.HILLS:
		return Color(0.75, 0.1, 0.0, 0.15)
	if b == world.MOUNTAIN or b == world.SNOW:
		return Color(0.45, 0.1, 0.0, 0.45)
	return Color(1.0, 0.0, 0.0, 0.0)


func _chunk_mesh(i0: int, j0: int) -> ArrayMesh:
	var NX: int = world.NX
	var NZ: int = world.NZ
	var i1 := mini(i0 + CHUNK, NX - 1)
	var j1 := mini(j0 + CHUNK, NZ - 1)
	var w := i1 - i0 + 1
	var verts := PackedVector3Array()
	var norms := PackedVector3Array()
	var cols := PackedColorArray()
	var uvs := PackedVector2Array()
	var tans := PackedFloat32Array()
	var idx := PackedInt32Array()
	var VS: float = world.VS
	var TILE: float = world.TILE
	for j in range(j0, j1 + 1):
		for i in range(i0, i1 + 1):
			var x := i * VS
			var z := j * VS
			var h: float = world.heights[j * NX + i]
			verts.append(Vector3(x, h, z))
			var hl: float = world.heights[j * NX + maxi(i - 1, 0)]
			var hr: float = world.heights[j * NX + mini(i + 1, NX - 1)]
			var hd: float = world.heights[maxi(j - 1, 0) * NX + i]
			var hu: float = world.heights[mini(j + 1, NZ - 1) * NX + i]
			var nn := Vector3(hl - hr, 2.0 * VS, hd - hu).normalized()
			norms.append(nn)
			var tg := (Vector3.RIGHT - nn * nn.x).normalized()
			tans.append_array([tg.x, tg.y, tg.z, -1.0])
			# blend the four nearest tiles' ground layers, with a wobble so edges are not square
			var wob := sin(x * 0.07 + z * 0.031) * 6.0 + sin(z * 0.09 - x * 0.04) * 5.0
			var u := clampf((x + wob) / TILE - 0.5, 0.0, world.GW - 1.001)
			var v := clampf((z - wob) / TILE - 0.5, 0.0, world.GH - 1.001)
			var tx := int(u)
			var tz := int(v)
			var fu := u - tx
			var fv := v - tz
			var c00 := _weights_for(tz * world.GW + tx)
			var c10 := _weights_for(tz * world.GW + tx + 1)
			var c01 := _weights_for((tz + 1) * world.GW + tx)
			var c11 := _weights_for((tz + 1) * world.GW + tx + 1)
			var c := c00.lerp(c10, fu).lerp(c01.lerp(c11, fu), fv)
			if h < 1.2:
				var s := 1.0 - smoothstep(0.2, 1.2, h)
				c = c.lerp(Color(0.0, 0.0, 1.0, 0.0), s)
			cols.append(c)
			uvs.append(Vector2(x, z))
	for j in range(j1 - j0):
		for i in range(i1 - i0):
			var a := j * w + i
			var b := a + 1
			var c := a + w
			var d := c + 1
			# Godot treats clockwise as front-facing: (a, b, d) and (a, d, c) face up here
			idx.append_array([a, b, d, a, d, c])
	var arr := []
	arr.resize(Mesh.ARRAY_MAX)
	arr[Mesh.ARRAY_VERTEX] = verts
	arr[Mesh.ARRAY_NORMAL] = norms
	arr[Mesh.ARRAY_COLOR] = cols
	arr[Mesh.ARRAY_TEX_UV] = uvs
	arr[Mesh.ARRAY_TANGENT] = tans
	arr[Mesh.ARRAY_INDEX] = idx
	var m := ArrayMesh.new()
	m.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arr)
	return m


func _build_water(tex: Dictionary) -> void:
	water = MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(world.SX + 6000.0, world.SZ + 6000.0)
	pm.subdivide_width = 64
	pm.subdivide_depth = 64
	water.mesh = pm
	water.position = Vector3(world.SX * 0.5, 0.0, world.SZ * 0.5)
	var m := ShaderMaterial.new()
	m.shader = load("res://shaders/water.gdshader")
	m.set_shader_parameter("wave_a", _noise_tex(world.seed_value + 31, 0.02, 256))
	m.set_shader_parameter("wave_b", _noise_tex(world.seed_value + 32, 0.05, 256))
	water.material_override = m
	water.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(water)


func _build_rivers() -> void:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var any := false
	for r in world.rivers:
		var pts: PackedVector3Array = r["pts"]
		var ws: PackedFloat32Array = r["w"]
		var dist := 0.0
		for k in pts.size() - 1:
			var a := pts[k]
			var b := pts[k + 1]
			if a.y < 0.05 and b.y < 0.05:
				continue
			var dir := Vector3(b.x - a.x, 0.0, b.z - a.z).normalized()
			var side := Vector3(-dir.z, 0.0, dir.x)
			var wa := ws[k] * 0.62
			var wb := ws[k + 1] * 0.62
			var seg := a.distance_to(b)
			var p0 := a + side * wa
			var p1 := a - side * wa
			var p2 := b + side * wb
			var p3 := b - side * wb
			var u0 := dist / 12.0
			var u1 := (dist + seg) / 12.0
			for v in [[p0, Vector2(0, u0)], [p3, Vector2(1, u1)], [p2, Vector2(0, u1)], [p0, Vector2(0, u0)], [p1, Vector2(1, u0)], [p3, Vector2(1, u1)]]:
				st.set_normal(Vector3.UP)
				st.set_uv(v[1])
				st.add_vertex(v[0])
			dist += seg
			any = true
	if not any:
		return
	river_mesh = MeshInstance3D.new()
	river_mesh.mesh = st.commit()
	var m := ShaderMaterial.new()
	m.shader = load("res://shaders/water.gdshader")
	m.set_shader_parameter("wave_a", _noise_tex(world.seed_value + 33, 0.03, 256))
	m.set_shader_parameter("wave_b", _noise_tex(world.seed_value + 34, 0.08, 256))
	m.set_shader_parameter("river", true)
	river_mesh.material_override = m
	river_mesh.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(river_mesh)
