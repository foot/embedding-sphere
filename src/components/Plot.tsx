import * as Plot from "@observablehq/plot";
import { LayoutData } from "../helpers/layout";
import { useEffect, useRef } from "react";

interface PlotDataProps {
  similarities: number[];
  onSelect: (index: number | undefined) => void;
}

export function PlotData({ similarities, onSelect }: PlotDataProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const minSimilarity = Math.min(...similarities);
    const maxSimilarity = Math.max(...similarities);

    // map this onto x,y,
    // couldn't figure out how to make Plot.crosshairX work w/ "shorthand" style data.
    const data = [...similarities].sort().map((y, x) => ({ x, y }));

    const plot = Plot.plot({
      height: 200,
      width: 400,
      grid: true,
      color: {
        type: "pow",
        scheme: "Blues",
        domain: [minSimilarity, maxSimilarity],
      },
      marks: [
        Plot.frame(),
        // "z" to suppress a warning about high cardinalities in our color scale.
        Plot.lineY(data, { x: "x", y: "y", stroke: "y", z: null }),
        Plot.crosshairX(data, { x: "x", y: "y" }),
      ],
    });

    if (onSelect) {
      plot.addEventListener("input", () => {
        // FIXME: this feels a bit dicey..
        const index = plot.value?.x;
        onSelect(index);
      });
    }

    containerRef.current.append(plot);
    return () => plot.remove();
  }, [similarities, onSelect]);

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
