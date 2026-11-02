shader_type spatial;
// Grass carpet: instances sit on a grid that follows the camera; height, density, dryness and
// flowers come from world textures, so the CPU never touches individual blades.
render_mode cull_disabled, diffuse_burley, specular_schlick_ggx;

uniform sampler2D height_tex : filter_linear;
uniform sampler2D ground_tex : filter_linear;
uniform sampler2D mask_tex : filter_linear;
uniform vec2 world_size;
uniform vec2 hgrid;
uniform float vs = 5.0;
uniform vec3 center;
uniform float radius = 60.0;
uniform float spacing = 0.7;

varying float v_dry;
varying float v_flower;
varying float v_shade;
varying vec3 v_fcol;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void vertex() {
	vec3 o = (MODEL_MATRIX * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
	vec2 cell = floor(o.xz / spacing + 0.5);
	float h1 = hash(cell);
	float h2 = hash(cell + 17.31);
	float h3 = hash(cell + 41.73);
	vec2 jit = (vec2(h1, h2) - 0.5) * spacing * 0.95;
	vec2 p = o.xz + jit;
	float gh = texture(height_tex, (p / vs + 0.5) / hgrid).r;
	vec4 gr = texture(ground_tex, (p / vs + 0.5) / hgrid);
	float m = texture(mask_tex, p / world_size).r;
	float dens = gr.r * smoothstep(0.3, 0.45, m);
	float fade = 1.0 - smoothstep(radius * 0.72, radius, distance(p, center.xz));
	float keep = step(h3, dens) * fade;
	float sc = (0.65 + h1 * 0.7) * keep * (0.55 + gr.r * 0.6) * mix(1.0, 1.35, gr.g);
	bool is_flower = UV.x > 0.5;
	vec3 v = VERTEX;
	if (is_flower) {
		v *= step(hash(cell + 5.13), gr.b * 0.6);
	}
	float a = h2 * 6.28318;
	v.xz = mat2(vec2(cos(a), sin(a)), vec2(-sin(a), cos(a))) * v.xz;
	v *= sc;
	float wt = TIME * 1.7 + p.x * 0.23 + p.y * 0.17;
	float gust = 0.6 + 0.4 * sin(TIME * 0.35 + p.x * 0.012 + p.y * 0.008);
	float wind = (sin(wt) + 0.5 * sin(wt * 2.7 + 1.3)) * gust;
	v.x += wind * 0.18 * v.y * v.y;
	v.z += wind * 0.09 * v.y * v.y;
	VERTEX = v + vec3(jit.x, gh - o.y, jit.y);
	NORMAL = normalize(mix(NORMAL, vec3(0.0, 1.0, 0.0), 0.8));
	v_dry = gr.g;
	v_flower = is_flower ? 1.0 : 0.0;
	v_shade = 0.75 + h3 * 0.35;
	float fsel = hash(cell + 9.7);
	v_fcol = fsel < 0.3 ? vec3(0.95, 0.93, 0.85) : fsel < 0.55 ? vec3(0.95, 0.82, 0.2) : fsel < 0.75 ? vec3(0.8, 0.22, 0.18) : vec3(0.55, 0.42, 0.8);
}

void fragment() {
	vec3 base = mix(vec3(0.07, 0.12, 0.035), vec3(0.11, 0.17, 0.05), v_dry);
	vec3 tip = mix(vec3(0.32, 0.46, 0.14), vec3(0.55, 0.52, 0.24), smoothstep(0.45, 0.85, v_dry));
	vec3 col = mix(base, tip, UV.y) * v_shade;
	if (v_flower > 0.5) {
		col = v_fcol;
	}
	ALBEDO = col;
	ROUGHNESS = 0.85;
	SPECULAR = 0.3;
	BACKLIGHT = vec3(0.18, 0.24, 0.08) * UV.y;
}
