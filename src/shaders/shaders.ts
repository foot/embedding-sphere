import * as THREE from "three";

export const blueRed = {
  uniforms: {
    colorA: { type: "vec3", value: new THREE.Color(0xff0000) },
    colorB: { type: "vec3", value: new THREE.Color(0x0000ff) },
    displacementA: { value: 1 },
    exponent: { value: 3 },
    minSimilarity: { value: 0 },
    maxSimilarity: { value: 1 },
  },
  vertexShader: `
    varying vec3 vUv; 
    uniform float displacementA; 
    attribute float similarities;
    uniform float exponent; // Use the exponent for scaling
    uniform float minSimilarity; // Minimum similarity for normalization
    uniform float maxSimilarity; // Maximum similarity for normalization

    void main() {
      vUv = position; 

      float normalizedSimilarity = (similarities - minSimilarity) / (maxSimilarity - minSimilarity);

      // Apply power scaling with the exponent
      float scaledSimilarity = pow(normalizedSimilarity, exponent);

      // Apply scaled displacement to position
      vec3 posA = position * (displacementA * scaledSimilarity + 1.0);

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
