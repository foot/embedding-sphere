import { takeRight } from "lodash";
import { useEffect, useMemo, useState } from "react";
import { ExampleQuery, exampleQueries } from "../helpers/example-queries";
import { Globe } from "./Globe";

import {
  EmbeddingsData,
  cosineDistance,
  toIndexFromEmbeddings,
} from "../helpers/embeddings";
import { useQueryEmbedding } from "../hooks/useQueryEmbeddings";
import { EmbeddingsComboBox } from "./EmbeddingsComboBox";
import { PlotData } from "./Plot";

function App() {
  const [selected, setSelected] = useState<ExampleQuery>(exampleQueries[0]);
  const [embeddingsData, setEmbeddingsData] = useState<EmbeddingsData>([]);
  const [animate, setAnimate] = useState<boolean>(false);
  const activeEmbedding = useQueryEmbedding(selected.query);

  const [displacement, setDisplacement] = useState<number>(1);
  const [exponent, setExponent] = useState<number>(4);

  useEffect(() => {
    window
      .fetch("./fine_food_reviews_with_embeddings_1k_tsne.json")
      .then((res) => res.json())
      .then((d: EmbeddingsData) => {
        setEmbeddingsData(d);
      });
  }, []);

  const similaritiesData = useMemo(() => {
    if (!activeEmbedding) {
      return [];
    }

    const data = embeddingsData.map((entry, index) => {
      return {
        index,
        distance: cosineDistance(
          activeEmbedding.embedding,
          JSON.parse(entry.embedding)
        ),
      };
    });

    data.sort((a, b) => {
      return a.distance - b.distance;
    });

    return data;
  }, [embeddingsData, activeEmbedding]);

  const similarities = similaritiesData.map((d) => d.distance);
  const maxSimilarity = Math.max(...similarities);
  const minSimilarity = Math.min(...similarities);

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
          similaritiesIndex={data}
          minSimilarity={minSimilarity}
          maxSimilarity={maxSimilarity}
          exponent={exponent}
        />

        <div className="absolute top-4 left-4 bottom-4 shadow sm:rounded-md overflow-y-scroll">
          <div className="px-4 py-5 bg-white sm:p-6">
            <fieldset>
              <div>
                <legend className="text-base font-medium text-gray-900">
                  Look up embedding
                </legend>
                <p className="text-sm text-gray-500">
                  List items have been pre-calcuated and stored
                </p>
              </div>

              <EmbeddingsComboBox
                selected={selected}
                setSelected={setSelected}
              />

              <div className="mt-4">
                <legend className="text-base font-medium text-gray-900">
                  Displacement
                </legend>
                <p className="text-sm text-gray-500">How far the spikes go</p>
              </div>

              <div className="mt-2 space-y-2">
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

              <div className="mt-2">
                <div className="flex items-center">
                  <input
                    id="animate"
                    name="animate"
                    type="checkbox"
                    checked={animate}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                    onChange={(ev) => {
                      setAnimate(ev.target.checked);
                    }}
                  />
                  <label
                    htmlFor="animate"
                    className="ml-3 block text-sm font-medium text-gray-700"
                  >
                    Animate displacement
                  </label>
                </div>
              </div>
              <div className="mt-4">
                <legend className="text-base font-medium text-gray-900">
                  Scaling
                </legend>
                <p className="text-sm text-gray-500">
                  How prominent matches are
                </p>
              </div>

              <div className="mt-2">
                <div className="flex items-center">
                  <input
                    type="range"
                    min="2"
                    max="10"
                    value={exponent}
                    step="0.01"
                    onChange={(ev) => setExponent(parseFloat(ev.target.value))}
                  />
                </div>
              </div>
            </fieldset>

            <div className="mt-4">
              <legend className="text-base font-medium text-gray-900">
                Match distribution
              </legend>
              <p className="text-sm text-gray-500">
                What kind of matches we got for this query
              </p>
            </div>

            <PlotData index={data} />

            <div className="mt-4 w-64">
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
