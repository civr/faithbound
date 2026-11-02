extends RefCounted
## Small procedural modelling kit: boxes, hipped roofs, cones, cylinders and ground ribbons,
## collected per material and committed into one ArrayMesh. Every triangle is turned to face
## its intended normal, so winding mistakes cannot flip faces.

var tools := {}


func _st(key: String) -> SurfaceTool:
	if not tools.has(key):
		var st := SurfaceTool.new()
		st.begin(Mesh.PRIMITIVE_TRIANGLES)
		tools[key] = st
	return tools[key]


func tri(key: String, a: Vector3, b: Vector3, c: Vector3, ua: Vector2, ub: Vector2, uc: Vector2, n: Vector3, col: Color) -> void:
	tri_n(key, a, b, c, ua, ub, uc, n, n, n, col)


## per-vertex normals; the face is oriented by the average normal (Godot: clockwise = front)
func tri_n(key: String, a: Vector3, b: Vector3, c: Vector3, ua: Vector2, ub: Vector2, uc: Vector2, na: Vector3, nb: Vector3, nc: Vector3, col: Color) -> void:
	var st := _st(key)
	var face := (c - a).cross(b - a)
	if face.dot(na + nb + nc) < 0.0:
		var t := b
		b = c
		c = t
		var tu := ub
		ub = uc
		uc = tu
		var tn := nb
		nb = nc
		nc = tn
	st.set_color(col)
	st.set_normal(na)
	st.set_uv(ua)
	st.add_vertex(a)
	st.set_color(col)
	st.set_normal(nb)
	st.set_uv(ub)
	st.add_vertex(b)
	st.set_color(col)
	st.set_normal(nc)
	st.set_uv(uc)
	st.add_vertex(c)


func quad(key: String, p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3, u0: Vector2, u1: Vector2, u2: Vector2, u3: Vector2, n: Vector3, col: Color) -> void:
	tri(key, p0, p1, p2, u0, u1, u2, n, col)
	tri(key, p0, p2, p3, u0, u2, u3, n, col)


static func axes(yaw: float) -> Array:
	# local +x (right) and local +z (front) for a heading
	return [Vector3(cos(yaw), 0.0, -sin(yaw)), Vector3(sin(yaw), 0.0, cos(yaw))]


## a box standing on `base` (centre of its bottom face), turned by yaw
func box(key: String, base: Vector3, size: Vector3, yaw: float, col: Color, uvs: float = 0.5, top := true, bottom := false) -> void:
	var ax := axes(yaw)
	var r: Vector3 = ax[0]
	var f: Vector3 = ax[1]
	var hx := size.x * 0.5
	var hz := size.z * 0.5
	var h := size.y
	var up := Vector3.UP
	var P := func(x: float, y: float, z: float) -> Vector3: return base + r * x + up * y + f * z
	# front (+z) and back (-z)
	for s in [1.0, -1.0]:
		var n: Vector3 = f * s
		quad(key, P.call(-hx * s, 0.0, hz * s), P.call(hx * s, 0.0, hz * s), P.call(hx * s, h, hz * s), P.call(-hx * s, h, hz * s),
			Vector2(0, h * uvs), Vector2(size.x * uvs, h * uvs), Vector2(size.x * uvs, 0), Vector2(0, 0), n, col)
	# sides
	for s in [1.0, -1.0]:
		var n: Vector3 = r * s
		quad(key, P.call(hx * s, 0.0, hz * s), P.call(hx * s, 0.0, -hz * s), P.call(hx * s, h, -hz * s), P.call(hx * s, h, hz * s),
			Vector2(0, h * uvs), Vector2(size.z * uvs, h * uvs), Vector2(size.z * uvs, 0), Vector2(0, 0), n, col)
	if top:
		quad(key, P.call(-hx, h, -hz), P.call(hx, h, -hz), P.call(hx, h, hz), P.call(-hx, h, hz),
			Vector2(0, 0), Vector2(size.x * uvs, 0), Vector2(size.x * uvs, size.z * uvs), Vector2(0, size.z * uvs), up, col)
	if bottom:
		quad(key, P.call(-hx, 0.0, -hz), P.call(hx, 0.0, -hz), P.call(hx, 0.0, hz), P.call(-hx, 0.0, hz),
			Vector2(0, 0), Vector2(size.x * uvs, 0), Vector2(size.x * uvs, size.z * uvs), Vector2(0, size.z * uvs), -up, col)


## hipped roof: eave rectangle centred on `c` (at eave height), half extents hx (along the ridge) and hz,
## rising `rise` to a ridge inset from both ends; includes a thick eave edge and an underside
func hip_roof(key: String, c: Vector3, hx: float, hz: float, rise: float, yaw: float, col: Color, uvs: float = 0.4, under_col := Color(0.35, 0.3, 0.25)) -> void:
	var ax := axes(yaw)
	var r: Vector3 = ax[0]
	var f: Vector3 = ax[1]
	var up := Vector3.UP
	var ins := minf(hz * 0.92, hx * 0.95)
	var e1 := c - r * hx - f * hz
	var e2 := c + r * hx - f * hz
	var e3 := c + r * hx + f * hz
	var e4 := c - r * hx + f * hz
	var r1 := c - r * (hx - ins) + up * rise
	var r2 := c + r * (hx - ins) + up * rise
	var slope := Vector2(hz, rise).length()
	# long slopes
	var nf := (f * rise + up * hz).normalized()
	var nb := (-f * rise + up * hz).normalized()
	var L := hx * 2.0
	quad(key, e4, e3, r2, r1, Vector2(0, slope * uvs), Vector2(L * uvs, slope * uvs), Vector2((L - ins) * uvs, 0), Vector2(ins * uvs, 0), nf, col)
	quad(key, e2, e1, r1, r2, Vector2(0, slope * uvs), Vector2(L * uvs, slope * uvs), Vector2((L - ins) * uvs, 0), Vector2(ins * uvs, 0), nb, col)
	# hip ends
	var sl2 := Vector2(ins, rise).length()
	var nl := (-r * rise + up * ins).normalized()
	var nr := (r * rise + up * ins).normalized()
	tri(key, e1, e4, r1, Vector2(0, sl2 * uvs), Vector2(hz * 2.0 * uvs, sl2 * uvs), Vector2(hz * uvs, 0), nl, col)
	tri(key, e3, e2, r2, Vector2(0, sl2 * uvs), Vector2(hz * 2.0 * uvs, sl2 * uvs), Vector2(hz * uvs, 0), nr, col)
	# thick thatch edge hanging below the eave
	var t := 0.32
	var d := Vector3(0.0, -t, 0.0)
	var edges := [[e4, e3, f], [e3, e2, r], [e2, e1, -f], [e1, e4, -r]]
	for ed in edges:
		var a: Vector3 = ed[0]
		var b: Vector3 = ed[1]
		var n: Vector3 = ed[2]
		var len := a.distance_to(b)
		quad(key, a + d, b + d, b, a, Vector2(0, t * uvs), Vector2(len * uvs, t * uvs), Vector2(len * uvs, 0), Vector2(0, 0), n, col * 0.85)
	# underside, so the roof never looks hollow from a low camera
	quad(key, e1 + d, e2 + d, e3 + d, e4 + d, Vector2(0, 0), Vector2(L * uvs, 0), Vector2(L * uvs, hz * 2 * uvs), Vector2(0, hz * 2 * uvs), -up, under_col)


## gable roof (for churches and halls)
func gable_roof(key: String, c: Vector3, hx: float, hz: float, rise: float, yaw: float, col: Color, gable_key: String, gable_col: Color, uvs: float = 0.4) -> void:
	var ax := axes(yaw)
	var r: Vector3 = ax[0]
	var f: Vector3 = ax[1]
	var up := Vector3.UP
	var e1 := c - r * hx - f * hz
	var e2 := c + r * hx - f * hz
	var e3 := c + r * hx + f * hz
	var e4 := c - r * hx + f * hz
	var r1 := c - r * hx + up * rise
	var r2 := c + r * hx + up * rise
	var slope := Vector2(hz, rise).length()
	var L := hx * 2.0
	quad(key, e4, e3, r2, r1, Vector2(0, slope * uvs), Vector2(L * uvs, slope * uvs), Vector2(L * uvs, 0), Vector2(0, 0), (f * rise + up * hz).normalized(), col)
	quad(key, e2, e1, r1, r2, Vector2(0, slope * uvs), Vector2(L * uvs, slope * uvs), Vector2(L * uvs, 0), Vector2(0, 0), (-f * rise + up * hz).normalized(), col)
	tri(gable_key, e1, e4, r1, Vector2(0, rise * uvs), Vector2(hz * 2 * uvs, rise * uvs), Vector2(hz * uvs, 0), -r, gable_col)
	tri(gable_key, e3, e2, r2, Vector2(0, rise * uvs), Vector2(hz * 2 * uvs, rise * uvs), Vector2(hz * uvs, 0), r, gable_col)


func cone(key: String, base: Vector3, rad: float, h: float, seg: int, col: Color, uvs: float = 0.5) -> void:
	var top := base + Vector3(0, h, 0)
	var sl := Vector2(rad, h).length()
	for i in seg:
		var a0 := TAU * i / seg
		var a1 := TAU * (i + 1) / seg
		var p0 := base + Vector3(cos(a0), 0, sin(a0)) * rad
		var p1 := base + Vector3(cos(a1), 0, sin(a1)) * rad
		var n0 := Vector3(cos(a0) * h, rad, sin(a0) * h).normalized()
		var n1 := Vector3(cos(a1) * h, rad, sin(a1) * h).normalized()
		var nt := (n0 + n1).normalized()
		tri_n(key, p0, p1, top, Vector2(a0 * rad * uvs, sl * uvs), Vector2(a1 * rad * uvs, sl * uvs), Vector2((a0 + a1) * 0.5 * rad * uvs, 0), n0, n1, nt, col)


func cylinder(key: String, base: Vector3, rad: float, h: float, seg: int, col: Color, uvs: float = 0.5) -> void:
	for i in seg:
		var a0 := TAU * i / seg
		var a1 := TAU * (i + 1) / seg
		var d0 := Vector3(cos(a0), 0, sin(a0))
		var d1 := Vector3(cos(a1), 0, sin(a1))
		var p0 := base + d0 * rad
		var p1 := base + d1 * rad
		var u0 := a0 * rad * uvs
		var u1 := a1 * rad * uvs
		tri_n(key, p0, p1, p1 + Vector3(0, h, 0), Vector2(u0, h * uvs), Vector2(u1, h * uvs), Vector2(u1, 0), d0, d1, d1, col)
		tri_n(key, p0, p1 + Vector3(0, h, 0), p0 + Vector3(0, h, 0), Vector2(u0, h * uvs), Vector2(u1, 0), Vector2(u0, 0), d0, d1, d0, col)


## a strip lying on the ground (roads, streets); pts already carry their heights
func ribbon(key: String, pts: PackedVector3Array, width: float, col: Color, world, lift := 0.12) -> void:
	if pts.size() < 2:
		return
	var dist := 0.0
	for k in pts.size() - 1:
		var a := pts[k]
		var b := pts[k + 1]
		var seg := Vector2(b.x - a.x, b.z - a.z)
		var len := seg.length()
		if len < 0.01:
			continue
		var s := Vector3(-seg.y, 0, seg.x) / len * width * 0.5
		# subdivide long pieces so the strip hugs the ground
		var parts := maxi(1, int(ceil(len / 3.0)))
		for q in parts:
			var t0 := float(q) / parts
			var t1 := float(q + 1) / parts
			var m0 := a.lerp(b, t0)
			var m1 := a.lerp(b, t1)
			var v := [m0 - s, m0 + s, m1 + s, m1 - s]
			var ns := []
			for i in 4:
				var p: Vector3 = v[i]
				p.y = world.height_at(p.x, p.z) + lift
				v[i] = p
				ns.append(world.normal_at(p.x, p.z))
			var d0 := (dist + len * t0) / width
			var d1 := (dist + len * t1) / width
			tri_n(key, v[0], v[1], v[2], Vector2(0, d0), Vector2(1, d0), Vector2(1, d1), ns[0], ns[1], ns[2], col)
			tri_n(key, v[0], v[2], v[3], Vector2(0, d0), Vector2(1, d1), Vector2(0, d1), ns[0], ns[2], ns[3], col)
		dist += len


## a flat disc on the ground (plazas)
func ground_disc(key: String, c: Vector3, rad: float, col: Color, world, seg := 28, uvs := 0.12) -> void:
	var cc := Vector3(c.x, world.height_at(c.x, c.z) + 0.1, c.z)
	for i in seg:
		var a0 := TAU * i / seg
		var a1 := TAU * (i + 1) / seg
		var p0 := c + Vector3(cos(a0), 0, sin(a0)) * rad
		var p1 := c + Vector3(cos(a1), 0, sin(a1)) * rad
		p0.y = world.height_at(p0.x, p0.z) + 0.1
		p1.y = world.height_at(p1.x, p1.z) + 0.1
		tri(key, cc, p0, p1, Vector2(cc.x, cc.z) * uvs, Vector2(p0.x, p0.z) * uvs, Vector2(p1.x, p1.z) * uvs, Vector3.UP, col)


func commit(mats: Dictionary) -> ArrayMesh:
	var mesh := ArrayMesh.new()
	for key in tools.keys():
		var st: SurfaceTool = tools[key]
		st.generate_tangents()
		st.commit(mesh)
		mesh.surface_set_material(mesh.get_surface_count() - 1, mats[key])
	return mesh
