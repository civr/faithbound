shader_type spatial;
// Faithbound landscape: weighted ground layers from vertex colour, rock on slopes, snow on peaks,
// two-scale sampling against visible tiling and large meadow colour patches.
render_mode blend_mix, depth_draw_opaque, cull_back, diffuse_burley, specular_schlick_ggx;

uniform sampler2D grass_alb : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D grass_nrm : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D forest_alb : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D forest_nrm : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D sand_alb : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D sand_nrm : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D dirt_alb : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D dirt_nrm : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D rock_alb : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D rock_nrm : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D snow_alb : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D snow_nrm : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D macro_noise : filter_linear_mipmap, repeat_enable;
uniform sampler2D fine_noise : filter_linear_mipmap, repeat_enable;
uniform float tile_m = 7.0;

varying vec3 wpos;
varying vec3 wnrm;

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	wnrm = normalize((MODEL_MATRIX * vec4(NORMAL, 0.0)).xyz);
}

vec3 two_scale(sampler2D t, vec2 uv) {
	return mix(texture(t, uv).rgb, texture(t, uv * 0.23 + vec2(0.37, 0.71)).rgb, 0.4);
}

void fragment() {
	vec2 uv = wpos.xz / tile_m;
	float macro = texture(macro_noise, wpos.xz / 700.0).r;
	float macro2 = texture(macro_noise, wpos.xz / 180.0 + 0.5).r;
	float fine = texture(fine_noise, wpos.xz / 35.0).r;
	vec4 w = max(COLOR, vec4(0.0));
	float slope = 1.0 - clamp(wnrm.y, 0.0, 1.0);
	float rockw = smoothstep(0.24, 0.42, slope + (fine - 0.5) * 0.14);
	float snoww = smoothstep(150.0, 185.0, wpos.y + (macro - 0.5) * 40.0) * (1.0 - smoothstep(0.55, 0.75, slope));

	vec2 side_uv = abs(wnrm.x) > abs(wnrm.z) ? wpos.zy / 10.0 : wpos.xy / 10.0;
	vec2 ruv = mix(wpos.xz / 10.0, side_uv, smoothstep(0.25, 0.6, slope));

	vec3 g = two_scale(grass_alb, uv);
	g *= mix(vec3(0.80, 0.94, 0.74), vec3(1.14, 1.06, 0.80), smoothstep(0.3, 0.75, macro * 0.65 + macro2 * 0.35));
	vec3 f = two_scale(forest_alb, uv);
	vec3 s = two_scale(sand_alb, uv);
	vec3 d = two_scale(dirt_alb, uv * 0.8);
	float tot = w.r + w.g + w.b + w.a + 0.0001;
	vec3 col = (g * w.r + f * w.g + s * w.b + d * w.a) / tot;
	vec3 nrm = (texture(grass_nrm, uv).rgb * w.r + texture(forest_nrm, uv).rgb * w.g + texture(sand_nrm, uv).rgb * w.b + texture(dirt_nrm, uv * 0.8).rgb * w.a) / tot;

	vec3 r = texture(rock_alb, ruv).rgb * mix(0.85, 1.1, macro2);
	col = mix(col, r, rockw);
	nrm = mix(nrm, texture(rock_nrm, ruv).rgb, rockw);
	col = mix(col, texture(snow_alb, uv).rgb, snoww);
	nrm = mix(nrm, texture(snow_nrm, uv).rgb, snoww);

	// darker wet ground at the water's edge and under water
	col *= mix(0.55, 1.0, smoothstep(-0.4, 0.8, wpos.y));
	col *= 0.9 + fine * 0.2;

	ALBEDO = col;
	NORMAL_MAP = nrm;
	NORMAL_MAP_DEPTH = 1.0;
	ROUGHNESS = mix(0.96, 0.7, snoww);
}
