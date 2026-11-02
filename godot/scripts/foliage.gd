extends Node3D
## Forests and meadow grass. Trees are instanced per terrain chunk; grass is one large instanced
## carpet that follows the camera, placed and thinned entirely on the GPU from height and ground maps.

const MeshKit = preload("res://scripts/mesh_kit.gd")
const CHUNK_M := 320.0

var world
var towns
var broad_mesh: ArrayMesh
var conifer_mesh: ArrayMesh
var chunk_nodes := {}   # Vector2i -> [MultiMeshInstance3D, MultiMeshInstance3D]
var grass: MultiMeshInstance3D
var grass_mat: ShaderMaterial
var grass_spacing := 0.55
var grass_radius := 60.0
var height_tex: ImageTexture
var ground_tex: ImageTexture
var mask_tex: ImageTexture
var _dirty_chunks := {}


func setup(w, t, tex: Dictionary, quality: int) -> void:
	world = w
	towns = t
	var leaf := ShaderMaterial.new()
	leaf.shader = load("res://shaders/leaves.gdshader")
	leaf.set_shader_parameter("leaves", tex["leaves_albedo"])
	var bark := StandardMaterial3D.new()
	bark.albedo_texture = tex["bark_albedo"]
	bark.normal_enabled = true
	bark.normal_texture = tex["bark_normal"]
	bark.roughness = 0.95
	bark.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	broad_mesh = _broadleaf(leaf, bark, 7)
	conifer_mesh = _conifer(leaf, bark, 11)
	_bake_maps()
	for j in int(ceil(world.SZ / CHUNK_M)):
		for i in int(ceil(world.SX / CHUNK_M)):
			_build_chunk(Vector2i(i, j))
	_setup_grass(tex, quality)
	towns.mask_changed.connect(_on_mask_changed)


# ---------------------------------------------------------------- tree models
func _broadleaf(leaf: Material, bark: Material, s: int) -> ArrayMesh:
	var r := RandomNumberGenerator.new()
	r.seed = s
	var kit = MeshKit.new()
	# tapered trunk and a few limbs
	var segs := 7
	for i in segs:
		var a0 := TAU * i / segs
		var a1 := TAU * (i + 1) / segs
		var b0 := Vector3(cos(a0), 0, sin(a0))
		var b1 := Vector3(cos(a1), 0, sin(a1))
		var lo := 0.34
		var hi := 0.2
		var H := 6.0
		kit.tri_n("bark", b0 * lo, b1 * lo, b1 * hi + Vector3(0, H, 0), Vector2(a0, 3), Vector2(a1, 3), Vector2(a1, 0), b0, b1, b1, Color.WHITE)
		kit.tri_n("bark", b0 * lo, b1 * hi + Vector3(0, H, 0), b0 * hi + Vector3(0, H, 0), Vector2(a0, 3), Vector2(a1, 0), Vector2(a0, 0), b0, b1, b0, Color.WHITE)
	for k in 4:
		var a := TAU * k / 4.0 + r.randf()
		var tip := Vector3(cos(a) * 2.6, 7.6 + r.randf(), sin(a) * 2.6)
		var root := Vector3(0, 4.2 + k * 0.4, 0)
		var side := Vector3(-sin(a), 0, cos(a)) * 0.12
		kit.quad("bark", root - side, root + side, tip + side * 0.4, tip - side * 0.4, Vector2(0, 2), Vector2(0.3, 2), Vector2(0.3, 0), Vector2(0, 0), (tip - root).cross(side).normalized(), Color.WHITE)
	# canopy of leaf cards with normals pointing away from the crown, so it shades like a volume
	var cc := Vector3(0, 7.4, 0)
	for k in 46:
		var dir := Vector3(r.randfn(), r.randfn() * 0.75, r.randfn()).normalized()
		var p := cc + Vector3(dir.x * 3.3, dir.y * 2.5, dir.z * 3.3) * (0.55 + r.randf() * 0.5)
		var sz := 2.4 + r.randf() * 1.2
		var b := Basis(Vector3(r.randf() - 0.5, r.randf() - 0.5, r.randf() - 0.5).normalized(), r.randf() * TAU)
		var ux := b * Vector3(sz * 0.5, 0, 0)
		var uy := b * Vector3(0, sz * 0.5, 0)
		var n := (p - cc + Vector3(0, 1.2, 0)).normalized()
		var tone := Color(1, 1, 1).lerp(Color(0.78, 0.86, 0.74), r.randf())
		kit.quad("leaf", p - ux - uy, p + ux - uy, p + ux + uy, p - ux + uy, Vector2(0, 1), Vector2(1, 1), Vector2(1, 0), Vector2(0, 0), n, tone)
	return kit.commit({"bark": bark, "leaf": leaf})


func _conifer(leaf: Material, bark: Material, s: int) -> ArrayMesh:
	var r := RandomNumberGenerator.new()
	r.seed = s
	var kit = MeshKit.new()
	var H := 15.0
	kit.cylinder("bark", Vector3.ZERO, 0.28, H * 0.9, 6, Color.WHITE, 0.6)
	var tiers := 10
	for t in tiers:
		var f := float(t) / tiers
		var y := 2.2 + f * (H - 3.0)
		var R := lerpf(3.4, 0.6, f) * (0.9 + r.randf() * 0.2)
		var n := 8
		for k in n:
			var a := TAU * (k + r.randf() * 0.4) / n + t * 0.4
			var out := Vector3(cos(a), 0, sin(a))
			var side := Vector3(-sin(a), 0, cos(a)) * R * 0.42
			var root := Vector3(0, y + 0.4, 0)
			var tip := out * R + Vector3(0, y - R * 0.38, 0)
			var nrm := (out + Vector3(0, 1.1, 0)).normalized()
			var tone := Color(0.62, 0.78, 0.66).lerp(Color(0.5, 0.66, 0.58), r.randf())
			kit.quad("leaf", root - side * 0.3, root + side * 0.3, tip + side, tip - side, Vector2(0, 0), Vector2(1, 0), Vector2(1, 1), Vector2(0, 1), nrm, tone)
	return kit.commit({"bark": bark, "leaf": leaf})


# ---------------------------------------------------------------- ground maps
func _bake_maps() -> void:
	var NX: int = world.NX
	var NZ: int = world.NZ
	height_tex = ImageTexture.create_from_image(Image.create_from_data(NX, NZ, false, Image.FORMAT_RF, world.heights.to_byte_array()))
	var img := Image.create(NX, NZ, false, Image.FORMAT_RGBA8)
	var amount := {world.GRASS: 1.0, world.FOREST: 0.55, world.HILLS: 0.75, world.BEACH: 0.12, world.MOUNTAIN: 0.25}
	var fl := FastNoiseLite.new()
	fl.seed = world.seed_value + 61
	fl.frequency = 0.012
	for j in NZ:
		for i in NX:
			var x := i * world.VS
			var z := j * world.VS
			var h: float = world.heights[j * NX + i]
			var t: int = world.tile_of(minf(x, world.SX - 0.1), minf(z, world.SZ - 0.1))
			var g: float = amount.get(world.biome[t], 0.0) if t >= 0 else 0.0
			var hr: float = world.heights[j * NX + mini(i + 1, NX - 1)] - h
			var hd: float = world.heights[mini(j + 1, NZ - 1) * NX + i] - h
			var steep := Vector2(hr, hd).length() / world.VS
			g *= 1.0 - smoothstep(0.45, 0.8, steep)
			g *= smoothstep(0.8, 2.0, h) * (1.0 - smoothstep(150.0, 170.0, h))
			var dry := world.dry_noise.get_noise_2d(x, z) * 0.5 + 0.5
			var flower := clampf((fl.get_noise_2d(x, z) - 0.15) * 2.0, 0.0, 1.0) * g
			img.set_pixel(i, j, Color(g, dry, flower, 1.0))
	ground_tex = ImageTexture.create_from_image(img)
	mask_tex = ImageTexture.create_from_image(towns.mask)


func _on_mask_changed(rect: Rect2) -> void:
	mask_tex.update(towns.mask)
	for j in range(int(rect.position.y / CHUNK_M), int(rect.end.y / CHUNK_M) + 1):
		for i in range(int(rect.position.x / CHUNK_M), int(rect.end.x / CHUNK_M) + 1):
			_dirty_chunks[Vector2i(i, j)] = true


func update(cam_target: Vector3) -> void:
	# trees near new towns are felled a chunk at a time
	if not _dirty_chunks.is_empty():
		var k: Vector2i = _dirty_chunks.keys()[0]
		_dirty_chunks.erase(k)
		_build_chunk(k)
	if grass != null:
		var sp := grass_spacing
		grass.global_position = Vector3(snappedf(cam_target.x, sp), 0.0, snappedf(cam_target.z, sp))
		grass_mat.set_shader_parameter("center", cam_target)


# ---------------------------------------------------------------- trees per chunk
func _mask_at(x: float, z: float) -> float:
	var m: Image = towns.mask
	var i := clampi(int(x / towns.MASK_RES), 0, m.get_width() - 1)
	var j := clampi(int(z / towns.MASK_RES), 0, m.get_height() - 1)
	return m.get_pixel(i, j).r


func _build_chunk(key: Vector2i) -> void:
	if chunk_nodes.has(key):
		for n in chunk_nodes[key]:
			n.queue_free()
	var x0 := key.x * CHUNK_M
	var z0 := key.y * CHUNK_M
	if x0 >= world.SX or z0 >= world.SZ or key.x < 0 or key.y < 0:
		return
	var broad: Array[Transform3D] = []
	var conif: Array[Transform3D] = []
	var bcol: Array[Color] = []
	var ccol: Array[Color] = []
	var r := RandomNumberGenerator.new()
	var TILE: float = world.TILE
	var per := int(CHUNK_M / TILE)
	for tj in per:
		for ti in per:
			var tx := int(x0 / TILE) + ti
			var tz := int(z0 / TILE) + tj
			if tx >= world.GW or tz >= world.GH:
				continue
			var t: int = tz * world.GW + tx
			r.seed = t * 9176 + world.seed_value
			var b: int = world.biome[t]
			var n := 0
			var cf := 0.0  # share of conifers
			if b == world.FOREST:
				n = 34
				cf = 0.25 + world.moist[t] * 0.3
			elif b == world.GRASS:
				n = 4 if r.randf() < 0.3 else 0
				cf = 0.1
			elif b == world.HILLS:
				n = 10
				cf = 0.65
			elif b == world.MOUNTAIN:
				n = 6
				cf = 1.0
			for k in n:
				var x := (tx + r.randf()) * TILE
				var z := (tz + r.randf()) * TILE
				var h: float = world.height_at(x, z)
				if h < 1.5 or h > 150.0:
					continue
				if world.normal_at(x, z).y < 0.78:
					continue
				if _mask_at(x, z) < 0.9:
					continue
				var s := 0.75 + r.randf() * 0.55
				var basis := Basis(Vector3.UP, r.randf() * TAU).scaled(Vector3(s, s * (0.9 + r.randf() * 0.25), s))
				var tr := Transform3D(basis, Vector3(x, h - 0.3, z))
				var tint := Color(1, 1, 1).lerp(Color(0.82, 0.9, 0.7), r.randf()).lerp(Color(1.05, 0.95, 0.75), r.randf() * 0.25)
				if r.randf() < cf:
					conif.append(tr)
					ccol.append(tint)
				else:
					broad.append(tr)
					bcol.append(tint)
	var nodes := []
	for pair in [[broad_mesh, broad, bcol], [conifer_mesh, conif, ccol]]:
		var list: Array = pair[1]
		if list.is_empty():
			continue
		var mm := MultiMesh.new()
		mm.transform_format = MultiMesh.TRANSFORM_3D
		mm.use_colors = true
		mm.mesh = pair[0]
		mm.instance_count = list.size()
		for i in list.size():
			mm.set_instance_transform(i, list[i])
			mm.set_instance_color(i, pair[2][i])
		var mi := MultiMeshInstance3D.new()
		mi.multimesh = mm
		mi.visibility_range_end = 2600.0
		mi.visibility_range_end_margin = 200.0
		mi.visibility_range_fade_mode = GeometryInstance3D.VISIBILITY_RANGE_FADE_SELF
		add_child(mi)
		nodes.append(mi)
	chunk_nodes[key] = nodes


# ---------------------------------------------------------------- grass carpet
func _grass_mesh() -> ArrayMesh:
	# a clump of curved blades, plus two flower heads marked with UV.x = 1
	var r := RandomNumberGenerator.new()
	r.seed = 5
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var add := func(p: Vector3, tip: float, flower: float) -> void:
		st.set_normal(Vector3.UP)
		st.set_uv(Vector2(flower, tip))
		st.add_vertex(p)
	for k in 11:
		var a := r.randf() * TAU
		var d := sqrt(r.randf()) * 0.32
		var bx := cos(a) * d
		var bz := sin(a) * d
		var h := 0.28 + r.randf() * 0.42
		var w := 0.025 + r.randf() * 0.02
		var fa := r.randf() * TAU
		var fx := Vector3(cos(fa), 0, sin(fa)) * w
		var la := r.randf() * TAU
		var lean := Vector3(cos(la), 0, sin(la)) * (0.12 + r.randf() * 0.35) * h
		var b := Vector3(bx, 0, bz)
		var m := b + Vector3(0, h * 0.55, 0) + lean * 0.3
		var t := b + Vector3(0, h, 0) + lean
		add.call(b - fx, 0.0, 0.0)
		add.call(b + fx, 0.0, 0.0)
		add.call(m + fx * 0.6, 0.55, 0.0)
		add.call(b - fx, 0.0, 0.0)
		add.call(m + fx * 0.6, 0.55, 0.0)
		add.call(m - fx * 0.6, 0.55, 0.0)
		add.call(m - fx * 0.6, 0.55, 0.0)
		add.call(m + fx * 0.6, 0.55, 0.0)
		add.call(t, 1.0, 0.0)
	for k in 2:
		var a := r.randf() * TAU
		var c := Vector3(cos(a) * 0.15, 0.5 + r.randf() * 0.15, sin(a) * 0.15)
		var s := 0.05
		for q in [[Vector3(-s, 0, 0), Vector3(0, s, 0), Vector3(s, 0, 0)], [Vector3(-s, 0, 0), Vector3(s, 0, 0), Vector3(0, -s * 0.6, 0)],
				[Vector3(0, 0, -s), Vector3(0, s, 0), Vector3(0, 0, s)], [Vector3(0, 0, -s), Vector3(0, 0, s), Vector3(0, -s * 0.6, 0)]]:
			for v in q:
				add.call(c + v, 1.0, 1.0)
	return st.commit()


func _setup_grass(tex: Dictionary, quality: int) -> void:
	# quality 0 low, 1 medium, 2 high, 3 ultra
	grass_radius = [34.0, 48.0, 64.0, 82.0][quality]
	grass_spacing = [0.9, 0.78, 0.66, 0.58][quality]
	if grass != null:
		grass.queue_free()
		grass = null
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = _grass_mesh()
	var pts: Array[Vector3] = []
	var n := int(grass_radius / grass_spacing)
	for j in range(-n, n + 1):
		for i in range(-n, n + 1):
			var p := Vector3(i * grass_spacing, 0, j * grass_spacing)
			if p.length() <= grass_radius:
				pts.append(p)
	mm.instance_count = pts.size()
	for i in pts.size():
		mm.set_instance_transform(i, Transform3D(Basis(), pts[i]))
	grass_mat = ShaderMaterial.new()
	grass_mat.shader = load("res://shaders/grass.gdshader")
	grass_mat.set_shader_parameter("height_tex", height_tex)
	grass_mat.set_shader_parameter("ground_tex", ground_tex)
	grass_mat.set_shader_parameter("mask_tex", mask_tex)
	grass_mat.set_shader_parameter("world_size", Vector2(world.SX, world.SZ))
	grass_mat.set_shader_parameter("hgrid", Vector2(world.NX, world.NZ))
	grass_mat.set_shader_parameter("vs", world.VS)
	grass_mat.set_shader_parameter("radius", grass_radius)
	grass_mat.set_shader_parameter("spacing", grass_spacing)
	grass = MultiMeshInstance3D.new()
	grass.multimesh = mm
	grass.material_override = grass_mat
	grass.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	grass.custom_aabb = AABB(Vector3(-grass_radius, -60, -grass_radius), Vector3(grass_radius * 2, 400, grass_radius * 2))
	add_child(grass)


func set_quality(q: int, tex: Dictionary) -> void:
	_setup_grass(tex, q)
