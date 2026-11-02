shader_type spatial;
// Leaf cards: alpha-cut foliage that sways with the wind and lets light glow through.
render_mode cull_disabled, diffuse_burley, specular_schlick_ggx;

uniform sampler2D leaves : source_color, filter_linear_mipmap, repeat_disable;
uniform float sway = 1.0;

void vertex() {
	vec3 o = (MODEL_MATRIX * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
	float t = TIME * 1.2 + o.x * 0.05 + o.z * 0.07;
	float w = sin(t) * 0.6 + sin(t * 2.3 + 1.7) * 0.3;
	float k = max(VERTEX.y - 3.0, 0.0) * 0.012 * sway;
	VERTEX.x += w * k;
	VERTEX.z += w * k * 0.6;
}

void fragment() {
	vec4 c = texture(leaves, UV);
	if (!FRONT_FACING) {
		NORMAL = -NORMAL;
	}
	ALBEDO = c.rgb * COLOR.rgb * 0.9;
	ALPHA = c.a;
	ALPHA_SCISSOR_THRESHOLD = 0.45;
	ROUGHNESS = 0.8;
	SPECULAR = 0.25;
	BACKLIGHT = vec3(0.32, 0.38, 0.14) * COLOR.rgb;
}
