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
import { LineSegments, ShaderMaterial, Vector3 } from "three";
import { Line } from "@react-three/drei";

extend({ OrbitControls, EffectComposer, RenderPass, ShaderPass });

interface DataVizProps {
  animate: boolean;
  setDisplacement: React.Dispatch<React.SetStateAction<number>>;
  displacement: number;
  similaritiesIndex: { [key: string]: number };
  exponent: number;
  minSimilarity: number;
  maxSimilarity: number;
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
  similaritiesIndex,
  exponent,
  minSimilarity,
  maxSimilarity,
}) => {
  const lineSegmentsRef: MutableRefObject<LineSegments | null> = useRef(null);

  const [dd, setDD] = useState<number>(0.01);
  const animateRef: MutableRefObject<boolean> = useRef(animate);

  useEffect(() => {
    animateRef.current = animate;
  }, [animate]);

  useFrame(() => {
    if (lineSegmentsRef.current) {
      // lineSegmentsRef.current.rotation.y += 0.001;
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

  const similaritiesArrtibutes = useMemo(() => {
    return new Float32Array(
      lats.flatMap((lat) => {
        const latPositions = lngs.map(
          (lng) => (similaritiesIndex[`${lat},${lng}`] || 0.1) * 1
        );
        const latSegments = range(latPositions.length - 1).flatMap((i) => [
          latPositions[i],
          latPositions[i + 1],
        ]);
        return flatten(latSegments);
      })
    );
  }, [similaritiesIndex]);

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
      current.material.uniforms.displacementA.value = displacement;
      current.material.uniforms.exponent.value = exponent;
      current.material.uniforms.minSimilarity.value = minSimilarity;
      current.material.uniforms.maxSimilarity.value = maxSimilarity;
    }
  }, [displacement, exponent, minSimilarity, maxSimilarity]);

  const { uniforms, fragmentShader, vertexShader } = blueRed;

  return (
    <>
      <lineSegments ref={lineSegmentsRef}>
        <bufferGeometry attach="geometry">
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute
            attach="attributes-similarities"
            args={[similaritiesArrtibutes, 1]}
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
  similaritiesIndex: { [key: string]: number };
  animate: boolean;
  setDisplacement: React.Dispatch<React.SetStateAction<number>>;
  exponent: number;
  minSimilarity: number;
  maxSimilarity: number;
  hoverPoint: { lat: number; lng: number } | null;
}

export const Globe: FC<GlobeProps> = ({
  displacement,
  similaritiesIndex,
  animate,
  setDisplacement,
  exponent,
  minSimilarity,
  maxSimilarity,
  hoverPoint,
}) => {
  const [hovered, setHover] = useState<boolean>(false);

  const viz = useMemo(
    () => (
      <DataViz
        displacement={displacement}
        similaritiesIndex={similaritiesIndex}
        animate={animate}
        setDisplacement={setDisplacement}
        exponent={exponent}
        minSimilarity={minSimilarity}
        maxSimilarity={maxSimilarity}
      />
    ),
    [
      displacement,
      similaritiesIndex,
      animate,
      setDisplacement,
      exponent,
      minSimilarity,
      maxSimilarity,
    ]
  );

  return (
    <Canvas>
      <color attach="background" args={["lightblue"]} />
      <ambientLight intensity={5} />
      {hoverPoint && (
        <RayFromCenter lat={hoverPoint.lat} lng={hoverPoint.lng} length={4} />
      )}

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

function RayFromCenter({
  lat,
  lng,
  length = 4,
}: {
  lat: number;
  lng: number;
  length?: number;
}) {
  const [x, y, z] = toPoint(lat, lng, length);

  // Points for the line
  const points = [new Vector3(0, 0, 0), new Vector3(x, y, z)];
  const color = "red";

  return <Line points={points} color={color} lineWidth={1} />;
}
