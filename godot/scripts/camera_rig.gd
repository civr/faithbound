extends Node3D
## Strategy camera: WASD / arrows or middle-drag to pan, wheel to zoom, right-drag or Q/E to turn.
## The view tilts toward the horizon as you zoom in, like a city builder.

signal moved

var world
var cam: Camera3D
var target := Vector3.ZERO
var dist := 320.0
var dist_t := 320.0
var yaw := 0.6
var yaw_t := 0.6
var min_dist := 14.0
var max_dist := 2600.0
var _drag_rotate := false
var _drag_pan := false


func setup(w) -> void:
	world = w
	cam = Camera3D.new()
	cam.near = 0.3
	cam.far = 9000.0
	cam.fov = 45.0
	add_child(cam)
	cam.current = true


func pitch() -> float:
	var t := clampf((dist - min_dist) / (max_dist - min_dist), 0.0, 1.0)
	return lerpf(0.36, 1.18, pow(t, 0.45))


func focus(p: Vector3, d: float = -1.0) -> void:
	target = p
	if d > 0.0:
		dist_t = d


func _unhandled_input(e: InputEvent) -> void:
	if e is InputEventMouseButton:
		var mb := e as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_WHEEL_UP and mb.pressed:
			dist_t = clampf(dist_t * 0.87, min_dist, max_dist)
		elif mb.button_index == MOUSE_BUTTON_WHEEL_DOWN and mb.pressed:
			dist_t = clampf(dist_t * 1.15, min_dist, max_dist)
		elif mb.button_index == MOUSE_BUTTON_RIGHT:
			_drag_rotate = mb.pressed
		elif mb.button_index == MOUSE_BUTTON_MIDDLE:
			_drag_pan = mb.pressed
	elif e is InputEventMouseMotion:
		var mm := e as InputEventMouseMotion
		if _drag_rotate:
			yaw_t -= mm.relative.x * 0.006
		if _drag_pan:
			var k := dist * 0.0016
			var fwd := Vector3(-sin(yaw), 0.0, -cos(yaw))
			var right := Vector3(cos(yaw), 0.0, -sin(yaw))
			target += (-right * mm.relative.x + fwd * mm.relative.y) * k


func _process(dt: float) -> void:
	var mv := Vector2.ZERO
	if Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP):
		mv.y += 1.0
	if Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN):
		mv.y -= 1.0
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
		mv.x -= 1.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
		mv.x += 1.0
	if Input.is_key_pressed(KEY_Q):
		yaw_t += dt * 1.4
	if Input.is_key_pressed(KEY_E):
		yaw_t -= dt * 1.4
	if mv != Vector2.ZERO:
		var fwd := Vector3(-sin(yaw), 0.0, -cos(yaw))
		var right := Vector3(cos(yaw), 0.0, -sin(yaw))
		var speed := dist * 1.1 * (3.0 if Input.is_key_pressed(KEY_SHIFT) else 1.0)
		target += (fwd * mv.y + right * mv.x).normalized() * speed * dt
	target.x = clampf(target.x, 0.0, world.SX)
	target.z = clampf(target.z, 0.0, world.SZ)
	var k := minf(1.0, dt * 8.0)
	dist = lerpf(dist, dist_t, k)
	yaw = lerpf(yaw, yaw_t, k)
	var gy := maxf(world.height_at(target.x, target.z), 0.0)
	target.y = lerpf(target.y, gy, minf(1.0, dt * 6.0))
	var p := pitch()
	var off := Vector3(sin(yaw) * cos(p), sin(p), cos(yaw) * cos(p)) * dist
	var pos := target + off
	var floor_y := maxf(world.height_at(pos.x, pos.z), 0.0) + 2.5
	if pos.y < floor_y:
		pos.y = floor_y
	cam.global_position = pos
	cam.look_at(target + Vector3(0.0, dist * 0.04, 0.0), Vector3.UP)
	moved.emit()
