import { useEffect, useState } from "react";
import { chunk, fromPairs, keys } from "lodash";
import "./App.css";
import { Globe } from "./Globe";

function toIndex(data) {
  // { [year]: { [latlng]: v } }}
  const populationIndex = fromPairs(
    data.map(([year, d]) => {
      const latLngIndex = fromPairs(
        chunk(d, 3).map(([lat, lng, v]) => [[lat, lng], v])
      );
      return [year, latLngIndex];
    })
  );

  return populationIndex;
}

function App() {
  const [data, setData] = useState(null);
  const [displacement, setDisplacement] = useState(1);
  const [animate, setAnimate] = useState(false);
  const [year, setYear] = useState(null);

  useEffect(() => {
    window
      .fetch("./data/population909500.json")
      .then((res) => res.json())
      .then((d) => {
        const index = toIndex(d);
        setData(index);
        setYear(keys(index)[0]);
      });
  }, []);

  const years = keys(data).sort();

  if (!data) {
    return "Loading...";
  }

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
              <div
                onChange={(ev) => setYear(ev.target.value)}
                className="mt-4 space-y-4"
              >
                {years.map((y) => {
                  return (
                    <div key={y} className="flex items-center">
                      <input
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
