import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// FIXME: alternative ways of getting this stuff? @types/three etc?

declare global {
  namespace JSX {
    interface IntrinsicElements {
      orbitControls: ReactThreeFiber.Object3DNode<
        OrbitControls,
        typeof OrbitControls
      >;
    }
  }
}
