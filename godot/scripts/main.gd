extends Node3D
## Faithbound: wires the world, simulation, towns, foliage, people, camera and interface together.
## Command-line options (after `--`): --seed=N  --years=N (simulate before showing)  --quality=0..3
## --shot=path.png (render a screenshot and quit)  --dist=metres  --yaw=radians

const World = preload("res://scripts/world.gd")
const Sim = preload("res://scripts/sim.gd")
const Terrain = preload("res://scripts/terrain_builder.gd")
const Towns = preload("res://scripts/town_builder.gd")
const Foliage = preload("res://scripts/foliage.gd")
const Villagers = preload("res://scripts/villagers.gd")
const Borders = preload("res://scripts/borders.gd")
const CameraRig = preload("res://scripts/camera_rig.gd")
const Hud = preload("res://scripts/hud.gd")

const SPEEDS := [0.0, 1.0, 4.0, 15.0]
const TEX_NAMES := ["grass", "forest", "sand", "dirt", "rock", "snow", "path", "thatch", "timber", "plaster", "bark", "leaves"]

var world
var sim
var terrain
var towns
var foliage
var folk
var borders
var rig
var hud
var env: Environment
var sun: DirectionalLight3D
var tex := {}
var speed := 1
var quality := 1
var acc := 0.0
var borders_dirty := true
var border_timer := 0.0
var road_timer := 0.0
var road_count := -1
var opts := {}
var _shot_frames := -1


func _ready() -> void:
	_parse_args()
	quality = int(opts.get("quality", "1"))
	var seed_value := int(opts.get("seed", str(randi() % 100000)))
	_load_textures()
	world = World.new()
	world.generate(seed_value)
	_setup_environment()
	terrain = Terrain.new()
	add_child(terrain)
	terrain.build(world, tex)
	sim = Sim.new()
	towns = Towns.new()
	add_child(towns)
	towns.setup(world, sim, tex)
	sim.city_removed.connect(towns.remove_town)
	sim.borders_changed.connect(func(): borders_dirty = true)
	sim.logged.connect(_on_log)
	sim.setup(world, seed_value, 6)
	var years := int(opts.get("years", "0"))
	for y in years:
		sim.tick()
	_settle_towns()
	foliage = Foliage.new()
	add_child(foliage)
	foliage.setup(world, towns, tex, quality)
	folk = Villagers.new()
	add_child(folk)
	folk.setup(world, sim, towns)
	borders = Borders.new()
	add_child(borders)
	borders.setup(world, sim)
	borders.rebuild()
	rig = CameraRig.new()
	add_child(rig)
	rig.setup(world)
	_focus_start()
	hud = Hud.new()
	add_child(hud)
	hud.setup(self)
	apply_quality(quality)
	if opts.has("shot"):
		_shot_frames = 40
		for i in 400:
			folk._spawn()


func _parse_args() -> void:
	for a in OS.get_cmdline_user_args():
		var s: String = a.trim_prefix("--")
		var kv := s.split("=", true, 1)
		opts[kv[0]] = kv[1] if kv.size() > 1 else "1"


## use scanned textures from assets/scanned when the fetch script has downloaded them
func _load_textures() -> void:
	for n in TEX_NAMES:
		for kind in ["albedo", "normal"]:
			var scanned := "res://assets/scanned/%s_%s.jpg" % [n, kind]
			var own := "res://assets/textures/%s_%s.png" % [n, kind]
			if ResourceLoader.exists(scanned):
				tex["%s_%s" % [n, kind]] = load(scanned)
			elif ResourceLoader.exists(own):
				tex["%s_%s" % [n, kind]] = load(own)


func _settle_towns() -> void:
	# build every town now (used at start and after skipping years)
	for i in 400:
		towns.update_towns()
		if towns._queue.is_empty():
			var all_built := true
			for n in sim.nations:
				for c in n["cities"]:
					if not towns.towns.has(c["seed"]):
						all_built = false
			if all_built:
				break
	towns.build_roads()
	road_count = _city_count()


func _city_count() -> int:
	var k := 0
	for n in sim.nations:
		if n["alive"]:
			k += n["cities"].size()
	return k


func _focus_start() -> void:
	var best = null
	for n in sim.nations:
		if not n["alive"]:
			continue
		if best == null or n["pop"] > best["pop"]:
			best = n
	if best != null and not best["cities"].is_empty():
		var cp: Vector3 = towns.city_pos(best["cities"][0])
		rig.target = cp
		rig.dist = float(opts.get("dist", "260"))
		rig.dist_t = rig.dist
	rig.yaw = float(opts.get("yaw", "0.7"))
	rig.yaw_t = rig.yaw


func _setup_environment() -> void:
	var we := WorldEnvironment.new()
	env = Environment.new()
	var sky := Sky.new()
	var sm := ProceduralSkyMaterial.new()
	sm.sky_top_color = Color(0.36, 0.53, 0.76)
	sm.sky_horizon_color = Color(0.74, 0.81, 0.86)
	sm.ground_horizon_color = Color(0.64, 0.69, 0.7)
	sm.ground_bottom_color = Color(0.22, 0.24, 0.22)
	sm.sun_angle_max = 25.0
	sky.sky_material = sm
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = 1.0
	env.reflected_light_source = Environment.REFLECTION_SOURCE_SKY
	env.tonemap_mode = Environment.TONE_MAPPER_AGX
	env.tonemap_exposure = 1.05
	env.glow_enabled = true
	env.glow_intensity = 0.35
	env.glow_bloom = 0.04
	env.fog_enabled = true
	env.fog_light_color = Color(0.73, 0.8, 0.87)
	env.fog_density = 0.00022
	env.fog_aerial_perspective = 0.55
	env.fog_sky_affect = 0.2
	env.adjustment_enabled = true
	env.adjustment_saturation = 1.06
	env.adjustment_contrast = 1.04
	we.environment = env
	add_child(we)
	sun = DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-38.0, 35.0, 0.0)
	sun.light_energy = 1.3
	sun.light_color = Color(1.0, 0.95, 0.86)
	sun.light_angular_distance = 0.6
	sun.shadow_enabled = true
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_4_SPLITS
	sun.directional_shadow_max_distance = 400.0
	sun.shadow_blur = 1.2
	add_child(sun)


## 0 low, 1 medium, 2 high, 3 ultra. Medium is meant for a GTX 1060 class card at 1080p.
func apply_quality(q: int) -> void:
	quality = clampi(q, 0, 3)
	env.ssao_enabled = quality >= 1
	env.ssao_radius = 1.6
	env.ssao_intensity = 1.6
	env.ssil_enabled = quality >= 2
	env.volumetric_fog_enabled = quality >= 2
	env.volumetric_fog_density = 0.0012
	env.volumetric_fog_albedo = Color(0.85, 0.88, 0.92)
	env.volumetric_fog_length = 600.0
	env.sdfgi_enabled = quality >= 3
	RenderingServer.directional_shadow_atlas_set_size(2048 if quality == 0 else 4096, true)
	sun.shadow_blur = 1.0 if quality == 0 else 1.4
	if foliage != null:
		foliage.set_quality(quality, tex)


func _on_log(t: String) -> void:
	if hud != null:
		hud.add_log(t)


func set_speed(i: int) -> void:
	speed = i


func skip_years(n: int) -> void:
	for y in n:
		sim.tick()
	_settle_towns()
	borders_dirty = true


func _process(dt: float) -> void:
	acc += dt * SPEEDS[speed]
	var steps := 0
	while acc >= 1.0 and steps < 4:
		sim.tick()
		acc -= 1.0
		steps += 1
	if steps == 4:
		acc = 0.0
	towns.update_towns()
	foliage.update(rig.target)
	border_timer -= dt
	if borders_dirty and border_timer <= 0.0:
		borders.rebuild()
		borders_dirty = false
		border_timer = 2.5
	road_timer -= dt
	if road_timer <= 0.0:
		road_timer = 8.0
		var cc := _city_count()
		if cc != road_count:
			road_count = cc
			towns.build_roads()
	borders.set_fade(rig.dist)
	sun.directional_shadow_max_distance = clampf(rig.dist * 2.4, 120.0, [300.0, 450.0, 650.0, 900.0][quality])
	for t in towns.towns.values():
		t["label"].visible = rig.dist > 110.0
	hud.refresh()
	if _shot_frames > 0:
		_shot_frames -= 1
		if _shot_frames == 0:
			var img := get_viewport().get_texture().get_image()
			img.save_png(opts["shot"])
			print("saved ", opts["shot"])
			get_tree().quit()


func _unhandled_input(e: InputEvent) -> void:
	if e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT:
		var cam: Camera3D = rig.cam
		var from := cam.project_ray_origin(e.position)
		var dir := cam.project_ray_normal(e.position)
		var hit: Vector3 = world.raycast(from, dir)
		if hit != Vector3.INF:
			var t: int = world.tile_of(hit.x, hit.z)
			var o: int = sim.owner[t] if t >= 0 else -1
			borders.selected = o
			borders_dirty = true
			hud.show_nation(o, t)
	elif e is InputEventKey and e.pressed:
		match e.keycode:
			KEY_SPACE:
				set_speed(0 if speed > 0 else 1)
			KEY_1:
				set_speed(1)
			KEY_2:
				set_speed(2)
			KEY_3:
				set_speed(3)
			KEY_F12:
				var img := get_viewport().get_texture().get_image()
				var path := "user://faithbound_%d.png" % Time.get_unix_time_from_system()
				img.save_png(path)
				hud.add_log("Screenshot saved to " + ProjectSettings.globalize_path(path))
