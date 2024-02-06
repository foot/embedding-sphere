import * as THREE from "three";

export const blueRed = {
  uniforms: {
    colorA: { type: "vec3", value: new THREE.Color(0xff0000) },
    colorB: { type: "vec3", value: new THREE.Color(0x0000ff) },
    displacementA: { value: 1 },
  },
  vertexShader: `
    varying vec3 vUv; 
    uniform float displacementA; 
    attribute float population;

    void main() {
      vUv = position; 
      vec3 posA;
      posA = position * (displacementA * population + 1.0);
      vec4 modelViewPosition = modelViewMatrix * vec4(posA.x, posA.y, posA.z, 1.0);
      gl_Position = projectionMatrix * modelViewPosition; 
    }
  `,
  fragmentShader: `
    uniform vec3 colorA; 
    uniform vec3 colorB; 
    varying vec3 vUv;

    void main() {
        gl_FragColor = vec4(mix(colorA, colorB, vUv.z), 1.0);
    }
  `,
};
