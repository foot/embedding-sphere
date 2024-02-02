import { useEffect, useMemo, useRef, useState } from "react";
import { takeRight } from "lodash";
import "./App.css";
import { Globe } from "./Globe";
import { exampleQueries } from "./example-queries";
import * as Plot from "@observablehq/plot";
import * as d3 from "d3";

import OpenAI from "openai";

type LatLngIndex = { [key: string]: number };

interface EmbeddingEntry {
  ProductId: string;
  UserId: string;
  Score: number;
  Summary: string;
  Text: string;
  combined: string;
  n_tokens: number;
  embedding: string;
  theta: number;
  phi: number;
  lat: number;
  lng: number;
}
type EmbeddingsData = EmbeddingEntry[];

function toIndexFromEmbeddings(
  data: EmbeddingsData,
  similaritiesData: { distance: number; index: number }[]
): LatLngIndex {
  const latLngIndex: LatLngIndex = {};

  const similarities = similaritiesData.map((d) => d.distance);

  const maxSimilarity = Math.max(...similarities);
  const minSimilarity = Math.min(...similarities);

  console.log({ minSimilarity, maxSimilarity });

  const scale = d3
    .scalePow()
    .domain([minSimilarity, maxSimilarity])
    .range([0, 1])
    .exponent(5);

  for (const [i, entry] of data.entries()) {
    if (entry.theta === 0 && entry.phi === 0) {
      continue;
    }

    latLngIndex[`${entry.lat},${entry.lng}`] = scale(similarities[i]);
  }

  return latLngIndex;
}

function cosineDistance(vecA: number[], vecB: number[]): number {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return similarity;
}

function PlotData({ index }: { index: LatLngIndex }) {
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

function App() {
  const [embeddingsData, setEmbeddingsData] = useState<EmbeddingsData>([]);
  const [displacement, setDisplacement] = useState<number>(1);
  const [animate, setAnimate] = useState<boolean>(false);
  const [selectedExampleQuery, setSelectedExampleQuery] = useState<string>(
    exampleQueries[0].query
  );

  // useEffect(() => {
  //   const openai = new OpenAI({
  //     apiKey: import.meta.env["VITE_OPENAI_API_KEY"], // This is the default and can be omitted
  //     dangerouslyAllowBrowser: true,
  //   });

  //   async function main() {
  //     const chatCompletion = await openai.embeddings.create({
  //       input: "i wanted a hot dog",
  //       model: "text-embedding-3-small",
  //     });

  //     console.log({ chatCompletion });
  //   }

  //   main();
  // }, []);

  useEffect(() => {
    window
      .fetch("./fine_food_reviews_with_embeddings_1k_tsne.json")
      .then((res) => res.json())
      .then((d: EmbeddingsData) => {
        setEmbeddingsData(d);
      });
  }, []);

  const similaritiesData = useMemo(() => {
    const exampleQuery = exampleQueries.find(
      (e) => e.query === selectedExampleQuery
    );

    if (!exampleQuery) {
      return {} as { distance: number; index: number }[];
    }

    const data = embeddingsData.map((entry, index) => {
      return {
        index,
        distance: cosineDistance(
          exampleQuery.embedding,
          JSON.parse(entry.embedding)
        ),
      };
    });

    data.sort((a, b) => {
      return a.distance - b.distance;
    });

    return data;
  }, [embeddingsData, selectedExampleQuery]);

  const data = useMemo(() => {
    return toIndexFromEmbeddings(embeddingsData, similaritiesData);
  }, [embeddingsData, similaritiesData]);

  if (!data) {
    return "Loading...";
  }

  // take the last 10 docs from the similarities data array
  const bestNDocs = takeRight(similaritiesData, 10);
  bestNDocs.reverse();

  return (
    <div className="bg-gray-100 h-screen flex flex-col">
      <header className="bg-white shadow">
        <div className="mx-10 my-6">
          <h1 className="text-3xl font-bold text-gray-900">Embedding Sphere</h1>
        </div>
      </header>
      <main className="relative h-full flex-1">
        <Globe
          animate={animate}
          setDisplacement={setDisplacement}
          displacement={displacement}
          populationIndex={data}
        />

        <div className="absolute top-4 left-4 bottom-4 shadow sm:rounded-md overflow-y-scroll">
          <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
            <fieldset>
              <div>
                <legend className="text-base font-medium text-gray-900">
                  Example queries
                </legend>
                <p className="text-sm text-gray-500">Precaculated embeddings</p>
              </div>
              <div className="mt-4 space-y-4">
                {exampleQueries.map((eq) => {
                  return (
                    <div key={eq.query} className="flex items-center">
                      <input
                        onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                          return setSelectedExampleQuery(ev.target.value);
                        }}
                        id={eq.query}
                        name={eq.query}
                        value={eq.query}
                        checked={eq.query === selectedExampleQuery}
                        type="radio"
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                      />
                      <label
                        htmlFor={eq.query}
                        className="ml-3 block text-sm font-medium text-gray-700"
                      >
                        {'"'}
                        {eq.query}
                        {'"'}
                      </label>
                    </div>
                  );
                })}
              </div>
            </fieldset>
            <fieldset>
              <div>
                <legend className="text-base font-medium text-gray-900">
                  Displacement
                </legend>
                <p className="text-sm text-gray-500">How far the spikes go</p>
              </div>
              <div className="mt-4 space-y-4">
                <div className="flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    value={displacement}
                    step="0.001"
                    onChange={(ev) =>
                      setDisplacement(parseFloat(ev.target.value))
                    }
                  />
                </div>
              </div>
              <div className="mt-4 space-y-4">
                <div className="flex items-center">
                  <input
                    id="animate"
                    name="animate"
                    type="checkbox"
                    checked={animate}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                    onChange={(ev) => {
                      console.log(ev.target.checked);
                      setAnimate(ev.target.checked);
                    }}
                  />
                  <label
                    htmlFor="animate"
                    className="ml-3 block text-sm font-medium text-gray-700"
                  >
                    Animate
                  </label>
                </div>
              </div>
            </fieldset>
            <PlotData index={data} />
            <div className="mt-4 w-96">
              {bestNDocs.map((similarity) => {
                const i = similarity.index;
                return (
                  <div key={i} className="mt-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      {similarity.distance} {embeddingsData[i].Summary}
                    </h2>
                    <p className="text-gray-500">{embeddingsData[i].Text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
