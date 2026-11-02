shader_type spatial;
// Sea and rivers: depth-tinted, soft shoreline foam, rippling normals from two scrolling noise layers.
render_mode blend_mix, depth_draw_always, cull_disabled, diffuse_burley, specular_schlick_ggx;

uniform sampler2D depth_tex : hint_depth_texture, filter_linear;
uniform sampler2D wave_a : filter_linear_mipmap, repeat_enable;
uniform sampler2D wave_b : filter_linear_mipmap, repeat_enable;
uniform bool river = false;
uniform vec3 shallow_col : source_color = vec3(0.20, 0.42, 0.40);
uniform vec3 deep_col : source_color = vec3(0.03, 0.11, 0.16);

varying vec3 wpos;

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	vec2 uv1;
	vec2 uv2;
	if (river) {
		uv1 = vec2(UV.x * 0.4, UV.y * 0.6 - TIME * 0.35);
		uv2 = vec2(UV.x * 0.9 + 0.3, UV.y * 1.4 - TIME * 0.55);
	} else {
		uv1 = wpos.xz / 70.0 + vec2(TIME * 0.010, TIME * 0.006);
		uv2 = wpos.xz / 24.0 - vec2(TIME * 0.013, -TIME * 0.009);
	}
	float e = 0.0035;
	float h0 = texture(wave_a, uv1).r + texture(wave_b, uv2).r * 0.6;
	float hx = texture(wave_a, uv1 + vec2(e, 0.0)).r + texture(wave_b, uv2 + vec2(e, 0.0)).r * 0.6;
	float hz = texture(wave_a, uv1 + vec2(0.0, e)).r + texture(wave_b, uv2 + vec2(0.0, e)).r * 0.6;
	vec3 wn = normalize(vec3((h0 - hx) * 2.5, 1.0, (h0 - hz) * 2.5));
	NORMAL = normalize((VIEW_MATRIX * vec4(wn, 0.0)).xyz);

	float depth = texture(depth_tex, SCREEN_UV).r;
	vec4 view = INV_PROJECTION_MATRIX * vec4(SCREEN_UV * 2.0 - 1.0, depth, 1.0);
	view.xyz /= view.w;
	float thick = clamp(VERTEX.z - view.z, 0.0, 200.0);
	float deepness = 1.0 - exp(-thick * (river ? 0.35 : 0.12));
	vec3 col = mix(shallow_col, deep_col, clamp(thick / (river ? 4.0 : 18.0), 0.0, 1.0));
	float foam = (1.0 - smoothstep(0.0, river ? 0.5 : 1.4, thick)) * (0.55 + 0.45 * texture(wave_b, uv2 * 3.0).r);
	ALBEDO = mix(col, vec3(0.86, 0.9, 0.9), foam * 0.8);
	ALPHA = clamp(deepness * 0.88 + 0.1 + foam * 0.5, 0.0, 1.0);
	ROUGHNESS = 0.04 + foam * 0.5;
	SPECULAR = 0.6;
}
