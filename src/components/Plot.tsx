import * as Plot from "@observablehq/plot";
import { LatLngIndex } from "../helpers/embeddings";
import { useEffect, useRef } from "react";

export function PlotData({ index }: { index: LatLngIndex }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const data = Object.values(index);
  data.sort();

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const plot = Plot.plot({
      height: 200,
      width: 300,
      grid: true,
      marks: [Plot.lineY(data)],
    });

    containerRef.current.append(plot);
    return () => plot.remove();
  }, [data]);

  return <div ref={containerRef} />;
}
