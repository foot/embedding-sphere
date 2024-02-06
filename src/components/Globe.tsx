import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  FC,
  MutableRefObject,
} from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { blueRed } from "../shaders/shaders";
import { range, flatten } from "lodash";
import { LineSegments, ShaderMaterial } from "three";

extend({ OrbitControls, EffectComposer, RenderPass, ShaderPass });

interface DataVizProps {
  animate: boolean;
  setDisplacement: React.Dispatch<React.SetStateAction<number>>;
  displacement: number;
  populationIndex: { [key: string]: number };
}

interface ControlsProps {
  children: React.ReactNode;
}

const toPoint = (
  lat: number,
  lng: number,
  u: number
): [number, number, number] => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (180 - lng) * (Math.PI / 180);
  const x = u * Math.sin(phi) * Math.cos(theta);
  const y = u * Math.cos(phi);
  const z = u * Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
};

const step: number = -1;
const lats: number[] = range(80, -80 + step, step);
const lngs: number[] = range(180, -180 + step, step);

const DataViz: FC<DataVizProps> = ({
  animate,
  setDisplacement,
  displacement,
  populationIndex,
}) => {
  const lineSegmentsRef: MutableRefObject<LineSegments | null> = useRef(null);

  const [dd, setDD] = useState<number>(0.01);
  const animateRef: MutableRefObject<boolean> = useRef(animate);

  useEffect(() => {
    animateRef.current = animate;
  }, [animate]);

  useFrame(() => {
    if (lineSegmentsRef.current) {
      lineSegmentsRef.current.rotation.y += 0.001;
      if (animateRef.current) {
        if (displacement >= 2) {
          setDD(-0.01);
        } else if (displacement <= 0) {
          setDD(0.01);
        }
        setDisplacement(displacement + dd);
      }
    }
  });

  const populationAttributes = useMemo(() => {
    return new Float32Array(
      lats.flatMap((lat) => {
        const latPositions = lngs.map(
          (lng) => (populationIndex[`${lat},${lng}`] || 0) * 1
        );
        const latSegments = range(latPositions.length - 1).flatMap((i) => [
          latPositions[i],
          latPositions[i + 1],
        ]);
        return flatten(latSegments);
      })
    );
  }, [populationIndex]);

  const positions = useMemo(() => {
    return new Float32Array(
      lats.flatMap((lat) => {
        const latPositions = lngs.map((lng) => toPoint(lat, lng, 2));
        const latSegments = range(latPositions.length - 1).flatMap((i) => [
          latPositions[i],
          latPositions[i + 1],
        ]);
        return flatten(latSegments);
      })
    );
  }, []);

  useEffect(() => {
    const { current } = lineSegmentsRef;
    if (current && current.material instanceof ShaderMaterial) {
      current.geometry.attributes.population.needsUpdate = true;
      current.material.uniforms.displacementA.value = displacement;
    }
  }, [displacement]);

  const { uniforms, fragmentShader, vertexShader } = blueRed;

  return (
    <>
      <lineSegments ref={lineSegmentsRef}>
        <bufferGeometry attach="geometry">
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute
            attach="attributes-population"
            args={[populationAttributes, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          attach="material"
          uniforms={uniforms}
          fragmentShader={fragmentShader}
          vertexShader={vertexShader}
        />
      </lineSegments>
    </>
  );
};

const Controls: FC<ControlsProps> = ({ children }) => {
  const { gl, camera, invalidate } = useThree();
  const controlsRef = useRef<OrbitControls>(null);

  useEffect(() => {
    const controls = controlsRef.current;
    const onChange = () => invalidate();
    controls?.addEventListener("change", onChange);
    return () => {
      controls?.removeEventListener("change", onChange);
    };
  }, [invalidate]);

  return (
    <>
      <orbitControls
        ref={controlsRef}
        args={[camera, gl.domElement]}
        enableDamping
      />
      {children}
    </>
  );
};

interface GlobeProps {
  displacement: number;
  populationIndex: { [key: string]: number };
  animate: boolean;
  setDisplacement: React.Dispatch<React.SetStateAction<number>>;
}

export const Globe: FC<GlobeProps> = ({
  displacement,
  populationIndex,
  animate,
  setDisplacement,
}) => {
  const [hovered, setHover] = useState<boolean>(false);

  const viz = useMemo(
    () => (
      <DataViz
        displacement={displacement}
        populationIndex={populationIndex}
        animate={animate}
        setDisplacement={setDisplacement}
      />
    ),
    [displacement, populationIndex, animate, setDisplacement]
  );

  return (
    <Canvas>
      <color attach="background" args={["lightblue"]} />
      <ambientLight intensity={5} />
      <Controls>
        {viz}
        <mesh
          position={[0, 0, 0]}
          scale={[2, 2, 2]}
          onPointerOver={() => setHover(true)}
          onPointerOut={() => setHover(false)}
        >
          <sphereGeometry attach="geometry" args={[1, 12, 12]} />
          <meshStandardMaterial color={hovered ? "hotpink" : "orange"} />
        </mesh>
      </Controls>
    </Canvas>
  );
};
