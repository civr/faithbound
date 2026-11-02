shader_type spatial;
render_mode unshaded, blend_mix, cull_disabled, depth_draw_never, shadows_disabled;
uniform float opacity = 1.0;
void fragment() {
	ALBEDO = COLOR.rgb;
	ALPHA = COLOR.a * opacity * 0.85;
}
