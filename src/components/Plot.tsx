import * as Plot from "@observablehq/plot";
import { LatLngIndex } from "../helpers/embeddings";
import { useEffect, useRef } from "react";

export function PlotData({ index }: { index: LatLngIndex }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const data = Object.values(index);
  data.sort();

  useEffect(() => {
    const plot = Plot.lineY(data).plot({
      width: 400,
      height: 200,
      y: { grid: true },
    });

    containerRef.current?.append(plot);
    return () => plot.remove();
  }, [data]);

  return <div ref={containerRef} />;
}
