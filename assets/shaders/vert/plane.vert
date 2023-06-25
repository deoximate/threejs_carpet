#define PI 3.1415926

uniform mat4 uLightSpaceMatrix;

out vec2 vUv;

out vec3 FragPos;
out vec3 Normal;
out vec4 FragPosLightSpace;



void main() {
  vUv = uv;

  Normal = transpose(inverse(mat3(modelMatrix))) * normal;
  FragPos = vec3(modelMatrix * vec4(position, 1.0));
  FragPosLightSpace = uLightSpaceMatrix * vec4(FragPos, 1.0);


  vec4 modelViewPosition = viewMatrix * modelMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * modelViewPosition;
}