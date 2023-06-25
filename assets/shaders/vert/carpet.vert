#define PI 3.1415926

uniform sampler2D tDraw;
uniform sampler2D tDepthDown;

uniform float uTime;
uniform vec4 uMousePos;
uniform vec2 uPlaneSize;
uniform float uNormalAngle;
uniform vec3 uViewPos;
uniform mat4 uLightSpaceMatrix;

struct CarpetV { 
	float randSize;
	float randSizeY;
  float sizeNoise;
};
uniform CarpetV carpetV;

out vec3 FragPos;
out vec3 Normal;
out vec4 FragPosLightSpace;


out float vInstanceID;
out vec3 vColorNormals;
out vec3 vPos;
out vec2 vUv;

float rand (in vec2 st) {
    return fract(sin(dot(st.xy,
    vec2(12.9898,78.233)))
    * 43758.5453123);
}

float cnoise (vec2 n) {
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

float normalizeRange (float value, float minValue, float maxValue) {
  return ((value - minValue) / (maxValue - minValue))*2.0-0.5;
}

vec3 shiftLineDirection (vec3 lineDirection, vec3 cameraDirection, float angle) {
    // Нормализуем векторы направления
    vec3 normalizedLineDir = normalize(lineDirection);
    vec3 normalizedCameraDir = normalize(cameraDirection);

    // Вычисляем ось поворота
    vec3 rotationAxis = cross(normalizedCameraDir, normalizedLineDir);
    rotationAxis = normalize(rotationAxis);

    // Вычисляем угол поворота в радианах
    float radians = radians(angle);

    // Выполняем поворот вокруг оси
    mat3 rotationMatrix = mat3(cos(radians) + rotationAxis.x * rotationAxis.x * (1.0 - cos(radians)),
                               rotationAxis.x * rotationAxis.y * (1.0 - cos(radians)) - rotationAxis.z * sin(radians),
                               rotationAxis.x * rotationAxis.z * (1.0 - cos(radians)) + rotationAxis.y * sin(radians),
                               rotationAxis.y * rotationAxis.x * (1.0 - cos(radians)) + rotationAxis.z * sin(radians),
                               cos(radians) + rotationAxis.y * rotationAxis.y * (1.0 - cos(radians)),
                               rotationAxis.y * rotationAxis.z * (1.0 - cos(radians)) - rotationAxis.x * sin(radians),
                               rotationAxis.z * rotationAxis.x * (1.0 - cos(radians)) - rotationAxis.y * sin(radians),
                               rotationAxis.z * rotationAxis.y * (1.0 - cos(radians)) + rotationAxis.x * sin(radians),
                               cos(radians) + rotationAxis.z * rotationAxis.z * (1.0 - cos(radians)));

    // Поворачиваем вектор направления линии
    vec3 rotatedLineDir = rotationMatrix * normalizedLineDir;

    return rotatedLineDir;
}

float linearizeDepth (float depth, float near, float far) {
    float z = depth * 2.0 - 1.0; 
    return (2.0 * near * far) / (far + near - z * (far - near));
}

float linearizeDepthOrtho (float depth, float near, float far) {
    float z = (depth + 1.0) / 2.0; 
    return depth * (far-near) + near;
}


void main() {
  vec2 planeSize = uPlaneSize*0.5;
  float idx = float(gl_InstanceID);
  float x = mod(idx, 300.0);
  float z = floor(idx / 300.0);
  //float y = mod(float(gl_VertexID), 2.0);

  //! POSITION
  vec3 pos = vec3(z, 0.0, x);
  pos.xz *= vec2(uPlaneSize.xy/300.0);
  pos.xz -= vec2(2.0, 2.0);
  pos.y = position.y * 0.1;


  //! UV & MAPS
  vec2 st = vec2(
    normalizeRange(pos.x, -4.0, 4.0),
    1.0-normalizeRange(pos.z, -4.0, 4.0)
  )*vec2(1.0, 0.5);

  vec4 mapTouch = texture(tDraw, st.xy+vec2(0.0, 0.0));


  //! OFFSET
  float randSize = carpetV.randSize;
  float randSizeY = carpetV.randSizeY;
  float sizeNoise = carpetV.sizeNoise;

  vec4 uvOffset = vec4(1.0-pos.xz, 3.0-pos.xz) * sizeNoise;

  vec2 offset = vec2(
    surface3(vec3(uvOffset.xy-1.0, 1.0)), 
    surface3(vec3(uvOffset.zw, 1.0))
  )*0.9-0.9;
  pos.xz += rand(pos.xz)*vec2(randSize*0.1)-(randSize*0.05);
  pos.xz += offset * pos.y * randSizeY;
  

  if (pos.y <= 0.0) {
    //! SIDE
    pos.x = max(pos.x, -planeSize.x);
    pos.z = max(pos.z, -planeSize.y);
    pos.x = min(pos.x, planeSize.x);
    pos.z = min(pos.z, planeSize.y);
  } else {
    //! DEPTH DOWN
    float scaleXZ = 0.2;
    float scaleY = 0.05;

    vec3 normal = mapTouch.rgb;


    scaleXZ *= mapTouch.r;
    pos.xz += vec2(1.0-(normal.x), 1.0-(normal.y))*scaleXZ-scaleXZ*0.5;
    pos.y -= mapTouch.b*0.08;



    vColorNormals.rgb = normal.rgb;
  
/*
    //! VIEW ANGLES
    vec3 V = normalize(-pos);
    vec3 L = normalize(-uViewPos);
    float FF = normalize(pow(distance(uViewPos.xz, pos.xz), 10.0))*0.05;
    pos.xz += shiftLineDirection(L, V, 90.0/180.0*PI).xz*FF;*/

    pos.x = max(pos.x, -planeSize.x*1.1);
    pos.z = max(pos.z, -planeSize.y*1.1);
    pos.x = min(pos.x, planeSize.x*1.1);
    pos.z = min(pos.z, planeSize.y*1.1);
  }

  vUv = st;
  vPos = pos;
  vInstanceID = idx;




  //! TOUCH
  vec2 u_circlePos = uMousePos.xy*vec2(2.0, 2.0);
  float u_circleRadius = 1.0;
  float u_attraction = 0.05;
  u_circlePos.y = 1.0-u_circlePos.y-1.0;

  float dist = distance(pos.xz, u_circlePos);
  if (dist < u_circleRadius && pos.y > 0.0) {
    vec2 dir = normalize(pos.xz - u_circlePos);
    pos.xz += dir * (u_circleRadius - dist) * u_attraction;
  }






  //! SHADOW
  Normal = transpose(inverse(mat3(modelMatrix)))*(vec3(0, 1, 0)+normal);
  FragPos = vec3(modelMatrix * vec4(pos, 1.0));
  FragPosLightSpace = uLightSpaceMatrix * vec4(FragPos, 1.0);

  
  //vColor = vec4(1.0, 0.0, 0.0, 1.0);
  vec4 modelViewPosition = viewMatrix * modelMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * modelViewPosition;
}


// if (pos.x < 0.0)