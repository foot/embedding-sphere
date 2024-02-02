import { useEffect, useState } from "react";
import "./App.css";
import { Globe } from "./Globe";
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
  embedding: number[];
  theta: number;
  phi: number;
  lat: number;
  lng: number;
}
type EmbeddingsData = EmbeddingEntry[];

function toIndexFromEmbeddings(data: EmbeddingsData): LatLngIndex {
  const latLngIndex: LatLngIndex = {};

  // calculate the max value for n_tokens
  const maxNTokens = Math.max(...data.map((e) => e.n_tokens));

  for (const entry of data) {
    if (entry.theta === 0 && entry.phi === 0) {
      continue;
    }
    latLngIndex[`${entry.lat},${entry.lng}`] = entry.n_tokens / maxNTokens;
  }
  return latLngIndex;
}

function App() {
  const [data, setData] = useState<LatLngIndex | null>(null);
  const [displacement, setDisplacement] = useState<number>(1);
  const [animate, setAnimate] = useState<boolean>(false);

  useEffect(() => {
    const openai = new OpenAI({
      apiKey: import.meta.env["VITE_OPENAI_API_KEY"], // This is the default and can be omitted
      dangerouslyAllowBrowser: true,
    });

    async function main() {
      const chatCompletion = await openai.embeddings.create({
        input: "This is a test",
        model: "text-embedding-3-small",
      });

      console.log({ chatCompletion });
    }

    main();
  }, []);

  useEffect(() => {
    window
      .fetch("./fine_food_reviews_with_embeddings_1k_tsne.json")
      .then((res) => res.json())
      .then((d: EmbeddingsData) => {
        const index = toIndexFromEmbeddings(d);
        setData(index);
      });
  }, []);

  if (!data) {
    return "Loading...";
  }

  return (
    <div className="bg-gray-100 h-screen flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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

        <div className="absolute top-4 left-4 shadow sm:rounded-md sm:overflow-hidden">
          <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
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
