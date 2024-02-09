import { useCallback, useEffect, useMemo, useState } from "react";
import { ExampleQuery, exampleQueries } from "../helpers/example-queries";
import { Globe } from "./Globe";

import {
  EmbeddingsData,
  LayoutData,
  toIndexFromEmbeddings,
} from "../helpers/layout";
import { useQueryEmbedding } from "../hooks/useQueryEmbeddings";
import { EmbeddingsComboBox } from "./EmbeddingsComboBox";
import { DotPlot, PlotData } from "./Plot";
import { toLatLng, toUnitSphere } from "../helpers/layout";
import { cosineDistance } from "../helpers/embeddings";

function App() {
  const [selectedQuery, setSelectedQuery] = useState<ExampleQuery>(
    exampleQueries[0]
  );
  const [selectedLayoutPoint, setSelectedLayoutPoint] = useState<
    number | undefined
  >(undefined);
  const [embeddingsData, setEmbeddingsData] = useState<EmbeddingsData>([]);
  const [layoutData, setLayoutData] = useState<LayoutData>([]);
  const [animate, setAnimate] = useState<boolean>(false);
  const activeEmbedding = useQueryEmbedding(selectedQuery.query);

  const [displacement, setDisplacement] = useState<number>(1);
  const [exponent, setExponent] = useState<number>(4);

  useEffect(() => {
    window
      .fetch("./fine_food_reviews_with_embeddings_1k.json")
      .then((res) => res.json())
      .then((d: EmbeddingsData) => {
        setEmbeddingsData(d);
      });

    window
      .fetch("./fine_food_reviews_with_embeddings_1k_tsne.json")
      .then((res) => res.json())
      .then((d: LayoutData) => {
        setLayoutData(d);
      });
  }, []);

  const similarities = useMemo(() => {
    if (!activeEmbedding) {
      return [];
    }
    return embeddingsData.map((entry) => {
      return cosineDistance(
        activeEmbedding.embedding,
        JSON.parse(entry.embedding)
      );
    });
  }, [activeEmbedding, embeddingsData]);

  const latLngSelected = useMemo(() => {
    if (!selectedLayoutPoint) {
      return null;
    }

    const phiThetas = toUnitSphere(layoutData);
    const latLngs = phiThetas.map(toLatLng);
    return {
      lat: latLngs[selectedLayoutPoint].lat,
      lng: latLngs[selectedLayoutPoint].lng,
    };
  }, [selectedLayoutPoint, layoutData]);

  const data = useMemo(() => {
    return toIndexFromEmbeddings(embeddingsData, similarities, layoutData);
  }, [embeddingsData, similarities, layoutData]);

  const bestNDocs = useMemo(() => {
    const similaritiesData = similarities.map((distance, index) => ({
      index,
      distance,
    }));
    // revert sort
    similaritiesData.sort((a, b) => b.distance - a.distance);
    // take first 10
    return similaritiesData.slice(0, 10).map((entry) => entry.index);
  }, [similarities]);

  const maxSimilarity = Math.max(...similarities);
  const minSimilarity = Math.min(...similarities);

  const onSelectLayoutPoint = useCallback((index?: number) => {
    setSelectedLayoutPoint(index);
  }, []);

  if (!data) {
    return "Loading...";
  }

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
          hoverPoint={latLngSelected}
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
                selected={selectedQuery}
                setSelected={setSelectedQuery}
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
            <DotPlot
              similarities={similarities}
              layoutData={layoutData}
              onSelect={onSelectLayoutPoint}
            />
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                {selectedLayoutPoint
                  ? `${Math.round(
                      layoutData[selectedLayoutPoint][0]
                    )}, ${Math.round(layoutData[selectedLayoutPoint][1])} -> ${
                      latLngSelected?.lat
                    }, ${latLngSelected?.lng}: ${
                      similarities[selectedLayoutPoint || 0]
                    }`
                  : "No point selected"}
              </p>
            </div>

            <div className="mt-4 w-64">
              {bestNDocs.map((i) => {
                return (
                  <div key={i} className="mt-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      {similarities[i]} {embeddingsData[i].Summary}
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
