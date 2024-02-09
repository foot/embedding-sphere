import * as Plot from "@observablehq/plot";
import { LatLngIndex, LayoutData } from "../helpers/layout";
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
      width: 400,
      grid: true,
      marks: [Plot.lineY(data)],
    });

    containerRef.current.append(plot);
    return () => plot.remove();
  }, [data]);

  return <div ref={containerRef} />;
}

interface DotPlotProps {
  layoutData: LayoutData;
  onSelect?: (index?: number) => void;
  similarities: number[];
}

export function DotPlot({ layoutData, onSelect, similarities }: DotPlotProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const minSimilarity = Math.min(...similarities);
    const maxSimilarity = Math.max(...similarities);

    const plot = Plot.plot({
      grid: true,
      color: {
        type: "pow",
        scheme: "Blues",
        domain: [minSimilarity, maxSimilarity],
      },
      inset: 10,
      width: 400,
      height: 400,
      aspectRatio: 1,
      marks: [
        Plot.frame(),
        Plot.dot(layoutData, {
          x: "0",
          y: "1",
          stroke: (_, i: number) => {
            return similarities[i];
          },
        }),
        Plot.crosshair(layoutData, { x: "0", y: "1" }),
      ],
    });

    if (onSelect) {
      plot.addEventListener("input", () => {
        // FIXME: this feels a bit dicey..
        const index = layoutData.indexOf(plot.value);
        onSelect(index === -1 ? undefined : index);
      });
    }

    containerRef.current.append(plot);
    return () => plot.remove();
  }, [layoutData, onSelect, similarities]);

  return <div ref={containerRef} />;
}
