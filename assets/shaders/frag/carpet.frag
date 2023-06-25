
#define PI 3.14159265359
#define PI2 6.28318530718

uniform sampler2D tDraw;
uniform sampler2D tShadow;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uLightPos;
uniform vec3 uViewPos;
uniform float uLightBias;
uniform float uLightIntensity;
uniform vec3 uLightColor;
uniform vec3 uAmbientColor;
uniform float uNormalAngle;

struct CarpetF { 
  bool showNormal;
	bool p1;
	bool p2;
  bool p3;
	bool p4;
  bool p5;
	bool p6;
  bool p7;
	bool p8;
  bool p9;
};
uniform CarpetF carpetF;

struct Timeline { 
  bool isActive;
	float speed;
	float timeout;
};
uniform Timeline timeline;

in vec3 vColorNormals;
in vec3 vPos;
in float vInstanceID;
in vec2 vUv;

in vec3 FragPos;
in vec3 Normal;
in vec4 FragPosLightSpace;

vec3 color = vec3(0.0);


float unpackDepth(const in vec4 rgbaDepth) {
  const vec4 bitShift = vec4(1.0 / (256.0 * 256.0 * 256.0), 1.0 / (256.0 * 256.0), 1.0 / 256.0, 1.0);
  float depth = dot(rgbaDepth, bitShift);
  return depth;
}

float Shadow(vec4 fragPosLightSpace)
{
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    projCoords = projCoords * 0.5 + 0.5;

    float closestDepth = unpackDepth(texture(tShadow, vec2(projCoords.x, projCoords.y))); 
    float currentDepth = projCoords.z;
    float bias = -0.006;
    float shadow = currentDepth - bias > closestDepth  ? 1.0 : 0.0; 

    return shadow;
}

vec3 PhongBlinn(in vec3 V, in vec3 L, in vec3 N, in vec3 specular, in float shininess)
{
    vec3 H = normalize(L + V);
    float spec = pow(max(0.0, dot(N, H)), shininess);

    return spec * specular;
}

float toGrayscale(vec3 color) {
  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  return gray;
}



void main() {
  vec4 mapColor = texture(tDraw, vUv.xy+vec2(0.0, 0.5));
  vec4 mapTouch = texture(tDraw, vUv.xy+vec2(0.0, 0.0));

  float viewVertexDist = distance(uViewPos, vPos);

  //! COLOR
  bool p[10];

  if (timeline.isActive) {
    vec2 timeValue = vec2(0.0, 10.0+timeline.timeout);
    float t = mod((uTime*timeline.speed-vPos.x*0.5+1.0)*0.5, timeValue.y);

    if (timeline.speed <= 0.0) {
      timeValue.y = 1.0;
      t *= 10.0;
    }

    for (int idx = 1; idx < 10; idx++) {
      if (t > timeValue.x+float(idx))
      p[idx] = true;
    }

  } else {
    p[1] = carpetF.p1;
    p[2] = carpetF.p2;
    p[3] = carpetF.p3;
    p[4] = carpetF.p4;
    p[5] = carpetF.p5;
    p[6] = carpetF.p6;
    p[7] = carpetF.p7;
    p[8] = carpetF.p8;
    p[9] = carpetF.p9;
  }


  if (p[1]) //? T 1
  {
    //color.rgb = vColorNormals;
    //color.rgb = mapTouch.rgb;
    color.rgb = mapColor.rgb*0.9;

    if (carpetF.showNormal) {
      color.rgb = vColorNormals;
    }
  }

  if (p[2]) //? T 2
  {
    color.rgb -= 0.8-vPos.y*10.0;
  }

  if (p[3]) //? T 3
  if (mod(vInstanceID, 2.0) == 0.0) {
    color.rgb *= 0.7;
  }


  if (p[4]) //? T 4
  if (mod(vInstanceID, 8.0) == 0.0) {
    color.rgb -= 0.2;
  }

  if (p[5]) //? T 5
  if (mod(vInstanceID, 4.0) == 0.0) 
  {
    color.rgb += 0.1;
  }

  if (p[6]) //? T 6
  {
    color.rgb -= mod(cos(vPos.y*1000.0), 1.0)*0.2/(viewVertexDist*0.8);
  }

  if (p[7]) //? T 7
  {
    color.rgb -= 0.15;
    color.rgb *= 0.8;
    color += 0.15;
  }

  if (p[8]) //? T 8
  {
    color -= toGrayscale(color)*0.2;
  }

  if (p[9]) //? T 9
  { 
    color.rgb += mapTouch.b*0.2;
    color.rgb *= 1.0+mapTouch.g*0.3;
  }






  //! Shadow
  vec3 N = normalize(Normal);
  vec3 L = normalize(uLightPos - FragPos);
  vec3 V = normalize(uViewPos - FragPos);

  float shadowIntensity = 0.55;
  vec3 lightColor = uLightColor;
  vec3 ambient = uAmbientColor;



  //! Phong-Blinn
  vec3 phongColor = PhongBlinn(V, L, N, vec3(1.0), 1.0) * lightColor;
  float shadow = Shadow(FragPosLightSpace);       
  vec3 lighting = (ambient*2.0 + (1.0 - shadow*shadowIntensity) + lightColor*0.25)*(uLightIntensity*0.2); 

  gl_FragColor = vec4(color*lighting, 1.0);
}


// if (gl_FragCoord.x / uResolution.x < 0.5)