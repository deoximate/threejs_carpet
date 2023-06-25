#define PI 3.1415926

uniform float uTime;
uniform float uFrameCount;
uniform vec2 uSize;
uniform vec2 uMousePos;
uniform bvec3 uMouseButtons;

uniform sampler2D tDraw;
uniform sampler2D tDepthDown;

struct MainParam { 
	vec3 drawColor;
  vec3 clearColor;
  float radius;
};
uniform MainParam mainParam;

in vec2 vUv;

float rand (in vec2 st) {
    return fract(sin(dot(st.xy,
    vec2(12.9898,78.233)))
    * 43758.5453123);
}

float cnoise(vec2 n) {
	const vec2 d = vec2(0.0, 1.0);
  vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
	return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}

float surface3 ( vec3 coord ) {
        float frequency = 4.0;
        float n = 0.0;  
        n += 1.0    * abs( cnoise( vec2(coord * frequency) ) );
        n += 0.5    * abs( cnoise( vec2(coord * frequency * 2.0) ) );
        n += 0.25   * abs( cnoise( vec2(coord * frequency * 4.0) ) );
        return n;
}

vec3 generateNormal(sampler2D tex, vec2 texCoord, vec2 texelSize) {
    vec3 dx = vec3(texelSize.x, 0.0, texture(tex, texCoord + vec2(texelSize.x, 0.0)).r - texture(tex, texCoord - vec2(texelSize.x, 0.0)).r);
    vec3 dy = vec3(0.0, texelSize.y, texture(tex, texCoord + vec2(0.0, texelSize.y)).r - texture(tex, texCoord - vec2(0.0, texelSize.y)).r);
    return normalize(cross(dy, -dx));
}

vec3 generateNormal2(sampler2D tex, vec2 texCoord, vec2 texelSize) {
    vec3 n;
    n.x = texture(tex, texCoord + vec2(texelSize.x, 0.0)).r - texture(tex, texCoord - vec2(texelSize.x, 0.0)).r;
    n.y = 1.0;
    n.z = texture(tex, texCoord + vec2(0.0, texelSize.y)).r - texture(tex, texCoord - vec2(0.0, texelSize.y)).r;
    return normalize(n);
}

int vec3ToInt(vec3 color) {
  vec3 scaledColor = color * 255.0;
  vec3 roundedColor = round(scaledColor);
  int intValue = int(roundedColor.r) * 256 * 256 + int(roundedColor.g) * 256 + int(roundedColor.b);
  return intValue;
}


vec4 color = vec4(0.0);
vec3 startColor = vec3(0.5);

vec3 blue = vec3(0.1, 0.25, 1.0);
vec3 yellow = vec3(1.0, 0.65, 0.0);


vec3 ukraineFlag(vec2 st, vec3 color, vec3 clearColor, vec3 drawColor) {

  if (uTime > 0.0 && uTime < 17.0) 
    {
    float drawP = mod((uTime)*0.3-1.0, 0.0)+sin(uTime+st.x)*0.1;
    if (drawP > st.x) {
      if (vec3ToInt(color.rgb) != vec3ToInt(drawColor))
        {
        if (st.x <= 0.5) {
          color.rgb = blue;
        } else {
          color.rgb = yellow;
        }
      }
    }

    float clearP = mod((uTime)*0.3-4.0, 0.0)+sin(uTime+st.x)*0.1;
    if (clearP > st.x) {
      if (vec3ToInt(color.rgb) != vec3ToInt(drawColor))
      color.rgb = clearColor;
    }
  }

  return color;
}


void main() {


  color.rgb = texture(tDraw, vUv).rgb;

  vec2 mousePos = uMousePos.xy * 0.5 + 0.5;
  mousePos.y *= 0.5;
  mousePos.y *= 2.0;
  mousePos.y -= 0.5;

  vec2 st = vUv;
  st.y *= 2.0;
  st.y -= 0.5;


  float drawR = mainParam.radius;
  float touchR = drawR*0.9;
  float clearR = mainParam.radius;


  if (st.y <= 0.5) { 
  //# TOUCH MAP

    if (uFrameCount <= 1.0) {
      color.rgb = vec3(0.0);
    }

    float dist = distance(st, mousePos) * 2.0;

    vec2 depthUV = st*vec2(1.0, -1.0)+vec2(0.0, 0.5);
    vec2 depthTexelSize = (1.0/vec2(textureSize(tDepthDown, 0)));
    float depth = (1.0-texture(tDepthDown, depthUV).r);

    if (depth > 0.0) 
    {
      vec3 normalMap = (generateNormal(tDepthDown, depthUV, depthTexelSize)*0.5+0.5);
      color.xy = vec2(normalMap.r, normalMap.g);
      color.z += normalMap.b*0.01;
      color.z += (normalMap.r+normalMap.g)*0.003;
    } else {

      float dist = distance(st, mousePos) * 2.0;
      if (dist < touchR) {
        if (color.b < 0.4) {
          color.b += 0.1;
        }
      } else {
        if (mod(uFrameCount, 3.0) <= 0.0) {
          color.rgb -= 0.003;
        }
      }
    }

  } else { 
    //# START COLOR
    if (uFrameCount <= 1.0) {
      color.rgb = mainParam.clearColor;
    }

    //# FLAG
    color.rgb = ukraineFlag(
      st, color.rgb, mainParam.clearColor, mainParam.drawColor
    );

    //# DRAW MAP
    if (uMouseButtons[0]) {
      float dist = distance(st, mousePos + vec2(0.0, 1.0)) * 2.0;
      float t = uTime*0.5;

      if (dist < drawR) {
        /*color.rgb = vec3(
          sin(t)*0.5+0.5, 
          sin(-t)*0.5+0.5, 
          cos(t)*0.5+0.5
        )*0.75+0.25;*/
        color.rgb = mainParam.drawColor;
      }
    }

    if (uMouseButtons[2]) {
      float dist = distance(st, mousePos + vec2(0.0, 1.0)) * 2.0;
      float t = uTime*0.5;

      if (dist < clearR) {
        color.rgb = mainParam.clearColor;
      }
    }

  }

  gl_FragColor = vec4(color.rgb, 1.0);
}