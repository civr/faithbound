extends Node3D
## Townsfolk walking between their homes and the green. One instanced mesh; legs and arms swing in
## the shader, the CPU only moves people along.

const MeshKit = preload("res://scripts/mesh_kit.gd")
const MAX := 900

var world
var sim
var towns
var mm: MultiMesh
var people: Array = []
var rng := RandomNumberGenerator.new()
const CLOTH := [Color(0.55, 0.42, 0.3), Color(0.42, 0.45, 0.3), Color(0.6, 0.55, 0.45), Color(0.35, 0.38, 0.5), Color(0.55, 0.3, 0.25), Color(0.75, 0.72, 0.62)]


func setup(w, s, t) -> void:
	world = w
	sim = s
	towns = t
	mm = MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_colors = true
	mm.use_custom_data = true
	mm.mesh = _figure()
	mm.instance_count = MAX
	mm.visible_instance_count = 0
	var mi := MultiMeshInstance3D.new()
	mi.multimesh = mm
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/villager.gdshader")
	mi.material_override = mat
	mi.custom_aabb = AABB(Vector3(-100, -100, -100), Vector3(world.SX + 200, 600, world.SZ + 200))
	add_child(mi)


## a simple figure; the shader finds legs, arms and head from the vertex position
func _figure() -> ArrayMesh:
	var kit = MeshKit.new()
	var w := Color(1, 1, 1)
	kit.box("b", Vector3(-0.11, 0.0, 0.0), Vector3(0.15, 0.86, 0.17), 0.0, w, 1.0, true, true)
	kit.box("b", Vector3(0.11, 0.0, 0.0), Vector3(0.15, 0.86, 0.17), 0.0, w, 1.0, true, true)
	kit.box("b", Vector3(0.0, 0.86, 0.0), Vector3(0.4, 0.58, 0.24), 0.0, w, 1.0, true, true)
	kit.box("b", Vector3(-0.27, 0.86, 0.0), Vector3(0.11, 0.56, 0.12), 0.0, w, 1.0, true, true)
	kit.box("b", Vector3(0.27, 0.86, 0.0), Vector3(0.11, 0.56, 0.12), 0.0, w, 1.0, true, true)
	kit.box("b", Vector3(0.0, 1.44, 0.0), Vector3(0.21, 0.25, 0.23), 0.0, w, 1.0, true, true)
	kit.box("b", Vector3(0.0, 1.66, -0.01), Vector3(0.24, 0.08, 0.26), 0.0, w, 1.0, true, true)
	var m := ArrayMesh.new()
	var st: SurfaceTool = kit.tools["b"]
	st.commit(m)
	return m


func _process(dt: float) -> void:
	_spawn()
	var cam := get_viewport().get_camera_3d()
	var n := 0
	for k in range(people.size() - 1, -1, -1):
		var p: Dictionary = people[k]
		var nat: Dictionary = sim.nations[p["nation"]]
		if not nat["alive"] or not towns.towns.has(p["town"]):
			people.remove_at(k)
			continue
		if p["wait"] > 0.0:
			p["wait"] -= dt
			p["moving"] = false
			if p["wait"] <= 0.0:
				_new_goal(p)
		else:
			var d: Vector2 = p["goal"] - p["pos"]
			var L := d.length()
			if L < 0.4:
				p["wait"] = 2.0 + rng.randf() * 8.0
			else:
				var step := minf(L, 1.35 * dt)
				var np: Vector2 = p["pos"] + d / L * step
				if world.height_at(np.x, np.y) < 0.6:
					p["wait"] = 1.0
				else:
					p["pos"] = np
					p["yaw"] = lerp_angle(p["yaw"], atan2(d.x, d.y), minf(1.0, dt * 8.0))
					p["moving"] = true
					p["phase"] += step * 3.2
	# draw only the people near the camera
	var cp := cam.global_position if cam != null else Vector3.ZERO
	for p in people:
		if n >= MAX:
			break
		var pos: Vector2 = p["pos"]
		if Vector2(pos.x - cp.x, pos.y - cp.z).length() > 700.0:
			continue
		var y: float = world.height_at(pos.x, pos.y)
		var b := Basis(Vector3.UP, p["yaw"]).scaled(Vector3.ONE * p["scale"])
		mm.set_instance_transform(n, Transform3D(b, Vector3(pos.x, y, pos.y)))
		mm.set_instance_color(n, p["cloth"])
		mm.set_instance_custom_data(n, Color(p["phase"], 1.0 if p["moving"] else 0.0, p["skin"], p["hair"]))
		n += 1
	mm.visible_instance_count = n


func _spawn() -> void:
	if people.size() >= 1400:
		return
	for key in towns.towns.keys():
		var t: Dictionary = towns.towns[key]
		var want := mini(int(t["count"] * 1.2), 45)
		var have: int = t.get("folk", 0)
		if have < want and rng.randf() < 0.2:
			var c: Dictionary = _city_by_seed(key)
			if c.is_empty():
				continue
			var plan: Dictionary = c.get("plan", {})
			var cp: Vector3 = t["pos"]
			var p := {"town": key, "nation": c["nation"], "pos": Vector2(cp.x, cp.z) + Vector2(rng.randf() - 0.5, rng.randf() - 0.5) * 10.0,
				"goal": Vector2(cp.x, cp.z), "wait": rng.randf() * 3.0, "moving": false, "yaw": rng.randf() * TAU, "phase": rng.randf() * 10.0,
				"scale": 0.95 + rng.randf() * 0.12 if rng.randf() > 0.15 else 0.7, "cloth": CLOTH[rng.randi_range(0, CLOTH.size() - 1)],
				"skin": rng.randf(), "hair": rng.randf()}
			people.append(p)
			t["folk"] = have + 1


func _city_by_seed(key: int) -> Dictionary:
	for n in sim.nations:
		for c in n["cities"]:
			if c["seed"] == key:
				return c
	return {}


func _new_goal(p: Dictionary) -> void:
	var c := _city_by_seed(p["town"])
	if c.is_empty():
		return
	var plan: Dictionary = c.get("plan", {})
	var t: Dictionary = towns.towns.get(p["town"], {})
	if t.is_empty():
		return
	var cp: Vector3 = t["pos"]
	var slots: Array = plan.get("slots", [])
	var cnt: int = mini(t["count"], slots.size())
	if cnt > 0 and rng.randf() < 0.65:
		var s: Dictionary = slots[rng.randi_range(0, cnt - 1)]
		var yaw: float = s["rot"]
		var front := Vector2(sin(yaw), cos(yaw)) * (s["d"] * 0.5 + 1.6)
		p["goal"] = Vector2(s["x"], s["z"]) + front
	else:
		var a := rng.randf() * TAU
		var r := rng.randf() * float(plan.get("pr", 8.0)) * 0.9
		p["goal"] = Vector2(cp.x + cos(a) * r, cp.z + sin(a) * r)
