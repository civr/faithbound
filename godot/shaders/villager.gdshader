shader_type spatial;
// Townsfolk: legs and arms swing while walking; clothes from the instance colour,
// INSTANCE_CUSTOM = (walk phase, moving, skin tone, hair tone).
render_mode diffuse_burley, specular_schlick_ggx;

varying float v_part;
varying vec4 v_custom;

void vertex() {
	vec3 v = VERTEX;
	float phase = INSTANCE_CUSTOM.x;
	float moving = INSTANCE_CUSTOM.y;
	float swing = sin(phase) * 0.55 * moving;
	float part = 0.0;            // torso
	if (v.y < 0.85) {
		part = v.x < 0.0 ? 1.0 : 2.0;   // legs, pivot at the hip
		float s = part < 1.5 ? swing : -swing;
		float y = v.y - 0.86;
		v.yz = vec2(y * cos(s) - v.z * sin(s), y * sin(s) + v.z * cos(s));
		v.y += 0.86;
	} else if (abs(v.x) > 0.205 && v.y < 1.43) {
		part = v.x < 0.0 ? 3.0 : 4.0;   // arms, pivot at the shoulder
		float s = (part < 3.5 ? -swing : swing) * 0.8;
		float y = v.y - 1.4;
		v.yz = vec2(y * cos(s) - v.z * sin(s), y * sin(s) + v.z * cos(s));
		v.y += 1.4;
	} else if (v.y > 1.62) {
		part = 6.0;                     // hair or hood
	} else if (v.y > 1.43) {
		part = 5.0;                     // head
	}
	v.y += abs(sin(phase)) * 0.03 * moving;
	VERTEX = v;
	v_part = part;
	v_custom = INSTANCE_CUSTOM;
}

void fragment() {
	vec3 cloth = COLOR.rgb;
	vec3 skin = mix(vec3(0.93, 0.76, 0.62), vec3(0.45, 0.3, 0.2), v_custom.z);
	vec3 hair = mix(vec3(0.12, 0.08, 0.05), vec3(0.6, 0.48, 0.3), v_custom.w);
	vec3 col = cloth;
	if (v_part > 0.5 && v_part < 2.5) {
		col = cloth * 0.55;
	}
	if (v_part > 4.5 && v_part < 5.5) {
		col = skin;
	}
	if (v_part > 5.5) {
		col = hair;
	}
	ALBEDO = col;
	ROUGHNESS = 0.9;
}
