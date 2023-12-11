var aperture_master_vert = `
	uniform vec2 loc;
	uniform float seed;
	uniform float transition_frame;
	uniform float t;
	uniform bool is_points;

	varying float v_transition_frame;

	vec2 custom_normalize(vec2 _t){
	    vec2 _n = _t != vec2(0.) ? normalize(_t) : vec2(0.);
	    return _n;
	}

	vec3 custom_normalize(vec3 _t){
	    vec3 _n = _t != vec3(0.) ? normalize(_t) : vec3(0.);
	    return _n;
	}

	float hash( float n ){return fract(sin(n)*43758.5453);}
	float cal_noise( vec2 x ){
	    vec2 p = floor(x);
	    vec2 f = fract(x);
	    f = f*f*(3.0-2.0*f);
	    float n = p.x + p.y*57.0;
	    return mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y);
	}

	mat4 rotate(vec3 axis, float angle){
	    axis = custom_normalize(axis);
	    float s = sin(angle);
	    float c = cos(angle);
	    float oc = 1.0 - c;
	    
	    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
	                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
	                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
	                0.0,                                0.0,                                0.0,                                1.0);
	}

	void main(){
		vec3 pos = position;

		float aspect_x = screen_res.x / screen_res.y;
		float aspect_y = screen_res.y / screen_res.x;

		float noise = cal_noise((uv+seed*999.)*40. + t*10.) * .05;
		pos.xy += custom_normalize(pos.xy) * noise;

		// rand size
		pos.xy += custom_normalize(pos.xy) * .015;
		// rand rot orientation
		pos.xy = (vec4(pos, 1) * rotate(vec3(0,0,1), seed*360.)).xy;
		// rot 
		pos.xy = ( vec4(pos, 1) * rotate(vec3(0,0,1), t*3.*(seed*.8+.2)) ).xy;

		// transition
		pos.xy *= transition_frame;

		// move to loc
		pos.xy += vec2(loc.x, loc.y * aspect_y);

		pos.y *= aspect_x;

		if(is_points)
			gl_PointSize = 10.;

		gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);

		v_transition_frame = transition_frame;
	}
`;