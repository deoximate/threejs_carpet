#define PI 3.14159265359
#define PI2 6.28318530718

uniform sampler2D tShadow;
uniform sampler2D tDraw;
uniform sampler2D tMask;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uLightPos;
uniform vec3 uViewPos;
uniform float uLightBias;
uniform float uLightIntensity;
uniform vec3 uLightColor;
uniform vec3 uAmbientColor;
uniform float uNormalAngle;

in vec2 vUv;


void main() {

    vec2 uv = vUv*vec2(1.0, 0.5)+vec2(0.0, 0.5);
    vec2 uvMask = vUv;
    vec3 mapColor = texture(tDraw, uv.xy).rgb;
    
    vec3 color = mapColor;

    //! FIX COLOR PLANE
    color.r = pow(mapColor.r, 3.0);
    color.g = pow(mapColor.g, 3.0);
    color.b = pow(mapColor.b, 3.0);
    vec3 map = texture(tMask, uvMask*vec2(2.0, 1.0)*4.0).rgb;
    color *= (vec3(1.0-map.r*1.0)*uLightColor*0.5)*2.0+0.25;
    color *= clamp(uNormalAngle, 0.0, 1.0)*0.3;
    color *= 0.5+0.25;


    gl_FragColor = vec4(color, 1.0);
}

