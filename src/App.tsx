import { useEffect, useState } from "react";
import { chunk, fromPairs, keys } from "lodash";
import "./App.css";
import { Globe } from "./Globe";

type Year = number;
type DataInput = [Year, number[]];
type LatLngIndex = { [key: string]: number };
type PopulationIndex = { [year: string]: LatLngIndex };

function toIndex(data: DataInput[]): PopulationIndex {
  const populationIndex: PopulationIndex = fromPairs(
    data.map(([year, d]): [string, LatLngIndex] => {
      const latLngIndex: LatLngIndex = fromPairs(
        chunk(d, 3).map(([lat, lng, v]): [string, number] => [
          `${lat},${lng}`,
          v,
        ])
      );
      return [year.toString(), latLngIndex];
    })
  );

  return populationIndex;
}

// 'ProductId', 'UserId', 'Score', 'Summary', 'Text', 'combined', 'n_tokens', 'embedding', 'theta', 'phi', 'lat', 'lng'
interface EmbeddingEntry {
  ProductId: string;
  UserId: string;
  Score: number;
  Summary: string;
  Text: string;
  combined: string;
  n_tokens: number;
  embedding: number[];
  theta: number;
  phi: number;
  lat: number;
  lng: number;
}
type EmbeddingsData = EmbeddingEntry[];

function toIndexFromEmbeddings(
  data: EmbeddingsData,
  year: string
): PopulationIndex {
  const latLngIndex: LatLngIndex = {};

  // calculate the max value for n_tokens
  const maxNTokens = Math.max(...data.map((e) => e.n_tokens));

  for (const entry of data) {
    if (entry.theta === 0 && entry.phi === 0) {
      continue;
    }
    latLngIndex[`${entry.lat},${entry.lng}`] = entry.n_tokens / maxNTokens;
  }
  return { [year]: latLngIndex };
}

function App() {
  const [data, setData] = useState<PopulationIndex | null>(null);
  const [displacement, setDisplacement] = useState<number>(1);
  const [animate, setAnimate] = useState<boolean>(false);
  const [year, setYear] = useState<string>("2024");

  useEffect(() => {
    window
      .fetch("./fine_food_reviews_with_embeddings_1k_tsne.json")
      .then((res) => res.json())
      .then((d: EmbeddingsData) => {
        const index = toIndexFromEmbeddings(d, year);
        console.log({ index });
        setData(index);
      });
  }, [year]);

  const years = [year];

  if (!data) {
    return "Loading...";
  }

  console.log({ data });

  return (
    <div className="bg-gray-100 h-screen flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Globen</h1>
        </div>
      </header>
      <main className="relative h-full flex-1">
        <Globe
          animate={animate}
          setDisplacement={setDisplacement}
          displacement={displacement}
          populationIndex={data[year]}
        />

        <div className="absolute top-4 left-4 shadow sm:rounded-md sm:overflow-hidden">
          <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
            <fieldset>
              <div>
                <legend className="text-base font-medium text-gray-900">
                  Population data
                </legend>
                <p className="text-sm text-gray-500">Population by year</p>
              </div>
              <div className="mt-4 space-y-4">
                {years.map((y) => {
                  return (
                    <div key={y} className="flex items-center">
                      <input
                        onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                          return setYear(ev.target.value);
                        }}
                        id={y}
                        name={y}
                        value={y}
                        checked={y === year}
                        type="radio"
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                      />
                      <label
                        htmlFor={y}
                        className="ml-3 block text-sm font-medium text-gray-700"
                      >
                        {y}
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
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
