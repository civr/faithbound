extends RefCounted
## Faithbound world: heightfield, rivers, biomes and the tile grid the simulation runs on.
## World space: x from 0 to SX, z from 0 to SZ, sea level at y = 0, units are metres.

const TILE := 40.0          # one simulation tile is 40 x 40 m
const GW := 64              # tiles across
const GH := 48              # tiles deep
const VS := 5.0             # terrain vertex spacing in metres

enum { DEEP, SHALLOW, BEACH, GRASS, FOREST, HILLS, MOUNTAIN, SNOW }
const BIOME_NAMES := ["Deep sea", "Shallow sea", "Beach", "Grassland", "Forest", "Hills", "Mountains", "Snow"]
const HAB := [0.0, 0.0, 0.45, 1.0, 0.7, 0.4, 0.08, 0.0]

var NX := 0
var NZ := 0
var SX := 0.0
var SZ := 0.0
var heights := PackedFloat32Array()     # NX * NZ vertex heights
var tile_h := PackedFloat32Array()      # mean height per tile
var tile_slope := PackedFloat32Array()  # height range inside a tile (m)
var biome := PackedByteArray()
var moist := PackedFloat32Array()
var river_tile := PackedByteArray()     # 1 where a river runs through the tile
var rivers: Array = []                  # [{pts: PackedVector3Array (x, water level, z), w: PackedFloat32Array}]
var seed_value := 0
var dry_noise := FastNoiseLite.new()


func generate(s: int) -> void:
	seed_value = s
	SX = GW * TILE
	SZ = GH * TILE
	NX = int(SX / VS) + 1
	NZ = int(SZ / VS) + 1
	heights.resize(NX * NZ)
	var cont := _noise(s, 0.00075, 5, FastNoiseLite.FRACTAL_FBM)
	var ridge := _noise(s + 1, 0.0017, 5, FastNoiseLite.FRACTAL_RIDGED)
	var mmask := _noise(s + 2, 0.00055, 3, FastNoiseLite.FRACTAL_FBM)
	var detail := _noise(s + 3, 0.018, 3, FastNoiseLite.FRACTAL_FBM)
	var hills := _noise(s + 4, 0.004, 3, FastNoiseLite.FRACTAL_FBM)
	for j in NZ:
		for i in NX:
			var x := i * VS
			var z := j * VS
			var dx := (x / SX - 0.5) * 2.0
			var dz := (z / SZ - 0.5) * 2.0
			var d := sqrt(dx * dx * 0.85 + dz * dz)
			var e := cont.get_noise_2d(x, z) * 0.85 + 0.34 - pow(d, 2.6) * 0.9
			var h := 0.0
			if e > 0.0:
				var m := clampf(mmask.get_noise_2d(x, z) * 1.7 + 0.05, 0.0, 1.0)
				var r := ridge.get_noise_2d(x, z) * 0.5 + 0.5
				var shore := smoothstep(0.0, 0.22, e)
				# lowlands stay gentle; mountains rise where the mask says so
				h = 1.5 + pow(e, 1.35) * 55.0 + hills.get_noise_2d(x, z) * 9.0 * shore
				h += m * m * r * r * 190.0 * shore
				h += detail.get_noise_2d(x, z) * (0.6 + m * 3.0) * shore
			else:
				h = e * 60.0 - 1.0
			heights[j * NX + i] = h
	_carve_rivers()
	_classify()
	dry_noise = _noise(s + 9, 0.006, 3, FastNoiseLite.FRACTAL_FBM)


func _noise(s: int, f: float, oct: int, fractal: int) -> FastNoiseLite:
	var n := FastNoiseLite.new()
	n.seed = s
	n.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
	n.frequency = f
	n.fractal_type = fractal
	n.fractal_octaves = oct
	return n


## bilinear height at a world position
func height_at(x: float, z: float) -> float:
	var u := clampf(x / VS, 0.0, NX - 1.001)
	var v := clampf(z / VS, 0.0, NZ - 1.001)
	var i := int(u)
	var j := int(v)
	var fu := u - i
	var fv := v - j
	var k := j * NX + i
	var a := lerpf(heights[k], heights[k + 1], fu)
	var b := lerpf(heights[k + NX], heights[k + NX + 1], fu)
	return lerpf(a, b, fv)


func normal_at(x: float, z: float) -> Vector3:
	var e := VS
	var hx := height_at(x + e, z) - height_at(x - e, z)
	var hz := height_at(x, z + e) - height_at(x, z - e)
	return Vector3(-hx, 2.0 * e, -hz).normalized()


func tile_of(x: float, z: float) -> int:
	var tx := int(floor(x / TILE))
	var tz := int(floor(z / TILE))
	if tx < 0 or tz < 0 or tx >= GW or tz >= GH:
		return -1
	return tz * GW + tx


func tile_center(t: int) -> Vector3:
	var x := (t % GW + 0.5) * TILE
	var z := (t / GW + 0.5) * TILE
	return Vector3(x, height_at(x, z), z)


func is_water(t: int) -> bool:
	return biome[t] <= SHALLOW


func in_bounds(x: float, z: float) -> bool:
	return x >= 0.0 and z >= 0.0 and x <= SX and z <= SZ


## march a ray over the heightfield; returns Vector3.INF when it misses
func raycast(from: Vector3, dir: Vector3) -> Vector3:
	var t := 0.0
	var step := 6.0
	var prev := from
	while t < 9000.0:
		var p := from + dir * t
		var gy := maxf(height_at(p.x, p.z), 0.0)
		if p.y <= gy and in_bounds(p.x, p.z):
			# refine between prev and p
			var a := prev
			var b := p
			for k in 12:
				var m := (a + b) * 0.5
				if m.y <= maxf(height_at(m.x, m.z), 0.0):
					b = m
				else:
					a = m
			return b
		prev = p
		t += step
		step = minf(step * 1.04, 40.0)
	return Vector3.INF


# ---------------------------------------------------------------- rivers
func _carve_rivers() -> void:
	rivers.clear()
	var rng := RandomNumberGenerator.new()
	rng.seed = seed_value + 77
	var stride := 4  # walk on a 20 m lattice
	var tries := 0
	var made := 0
	while made < 7 and tries < 400:
		tries += 1
		var i := rng.randi_range(8, NX - 9)
		var j := rng.randi_range(8, NZ - 9)
		var h0 := heights[j * NX + i]
		if h0 < 45.0 or h0 > 150.0:
			continue
		var path: Array = []
		var seen := {}
		var ci := i
		var cj := j
		var ok := false
		for s in 900:
			path.append(Vector2i(ci, cj))
			seen[Vector2i(ci, cj)] = true
			if heights[cj * NX + ci] < -0.5:
				ok = true
				break
			var best := Vector2i(-1, -1)
			var bh := 1e9
			for dj in [-1, 0, 1]:
				for di in [-1, 0, 1]:
					if di == 0 and dj == 0:
						continue
					var ni: int = ci + di * stride
					var nj: int = cj + dj * stride
					if ni < 1 or nj < 1 or ni >= NX - 1 or nj >= NZ - 1:
						continue
					var key := Vector2i(ni, nj)
					if seen.has(key):
						continue
					var hh := heights[nj * NX + ni] + rng.randf() * 0.4
					if hh < bh:
						bh = hh
						best = key
			if best.x < 0:
				break
			ci = best.x
			cj = best.y
		if not ok or path.size() < 25:
			continue
		_carve_path(path)
		made += 1


func _carve_path(path: Array) -> void:
	var pts := PackedVector2Array()
	for p in path:
		pts.append(Vector2(p.x * VS, p.y * VS))
	pts = chaikin(pts, 3)
	var n := pts.size()
	var water := PackedVector3Array()
	var widths := PackedFloat32Array()
	var bed := 1e9
	for k in n:
		var p := pts[k]
		var g := height_at(p.x, p.y)
		var w := lerpf(5.0, 16.0, float(k) / n)
		var depth := 1.6 + w * 0.12
		bed = minf(bed, g - depth)
		water.append(Vector3(p.x, bed + depth * 0.72, p.y))
		widths.append(w)
	# carve a smooth channel
	for k in n:
		var p := pts[k]
		var w := widths[k]
		var b := water[k].y - (1.6 + w * 0.12) * 0.72
		var r := w * 1.8
		var i0 := int((p.x - r) / VS)
		var i1 := int((p.x + r) / VS) + 1
		var j0 := int((p.y - r) / VS)
		var j1 := int((p.y + r) / VS) + 1
		for j in range(maxi(j0, 0), mini(j1, NZ - 1) + 1):
			for i in range(maxi(i0, 0), mini(i1, NX - 1) + 1):
				var d := Vector2(i * VS, j * VS).distance_to(p)
				if d > r:
					continue
				var idx := j * NX + i
				var t := smoothstep(w * 0.45, r, d)
				var target := lerpf(b, heights[idx], t)
				if target < heights[idx]:
					heights[idx] = target
	rivers.append({"pts": water, "w": widths})


static func chaikin(p: PackedVector2Array, it: int) -> PackedVector2Array:
	for k in it:
		var o := PackedVector2Array()
		o.append(p[0])
		for i in p.size() - 1:
			var a := p[i]
			var b := p[i + 1]
			o.append(a * 0.75 + b * 0.25)
			o.append(a * 0.25 + b * 0.75)
		o.append(p[p.size() - 1])
		p = o
	return p


# ---------------------------------------------------------------- biomes
func _classify() -> void:
	var n := GW * GH
	tile_h.resize(n)
	tile_slope.resize(n)
	biome.resize(n)
	moist.resize(n)
	river_tile.resize(n)
	river_tile.fill(0)
	for r in rivers:
		for p in r["pts"]:
			var t := tile_of(p.x, p.z)
			if t >= 0:
				river_tile[t] = 1
	var mn := _noise(seed_value + 5, 0.0022, 4, FastNoiseLite.FRACTAL_FBM)
	var per := int(TILE / VS)
	for tz in GH:
		for tx in GW:
			var t := tz * GW + tx
			var lo := 1e9
			var hi := -1e9
			var sum := 0.0
			var cnt := 0
			for j in range(tz * per, tz * per + per + 1):
				for i in range(tx * per, tx * per + per + 1):
					var h := heights[j * NX + i]
					lo = minf(lo, h)
					hi = maxf(hi, h)
					sum += h
					cnt += 1
			var mean := sum / cnt
			tile_h[t] = mean
			tile_slope[t] = hi - lo
			var cx := (tx + 0.5) * TILE
			var cz := (tz + 0.5) * TILE
			var m := mn.get_noise_2d(cx, cz) * 0.5 + 0.5 + (0.2 if river_tile[t] else 0.0)
			moist[t] = m
			var b := GRASS
			if mean < -6.0:
				b = DEEP
			elif mean < 0.0:
				b = SHALLOW
			elif mean > 175.0:
				b = SNOW
			elif mean > 105.0 or hi - lo > 48.0:
				b = MOUNTAIN
			elif mean < 3.5 and lo < 0.5:
				b = BEACH
			elif mean > 62.0 or hi - lo > 26.0:
				b = HILLS
			elif m > 0.56:
				b = FOREST
			biome[t] = b


## a 0..1 suitability for a town; -1 when unbuildable
func site_score(t: int) -> float:
	var b := biome[t]
	if b != GRASS and b != FOREST and b != BEACH and b != HILLS:
		return -1.0
	if tile_slope[t] > 14.0 or tile_h[t] < 1.5:
		return -1.0
	var s: float = HAB[b] - tile_slope[t] * 0.03
	if river_tile[t]:
		s += 0.35
	var tx := t % GW
	var tz := t / GW
	for d in [Vector2i(1, 0), Vector2i(-1, 0), Vector2i(0, 1), Vector2i(0, -1)]:
		var x: int = tx + d.x
		var z: int = tz + d.y
		if x >= 0 and z >= 0 and x < GW and z < GH and is_water(z * GW + x):
			s += 0.2
			break
	return s
