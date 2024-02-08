import OpenAI from "openai";
import { useEffect, useMemo, useState } from "react";
import { ExampleQuery, exampleQueries } from "../helpers/example-queries";

export function useQueryEmbedding(value: string) {
  const [embeddingQueries, setEmbeddingQueries] = useState<ExampleQuery[]>([]);

  const allEmbeddings = useMemo(
    () => [...embeddingQueries, ...exampleQueries],
    [embeddingQueries]
  );

  useEffect(() => {
    const q = allEmbeddings.find((e) => e.query === value);
    if (q) {
      return;
    }
    const openai = new OpenAI({
      apiKey: import.meta.env["VITE_OPENAI_API_KEY"],
      dangerouslyAllowBrowser: true,
    });

    const fetchEmbeddings = async () => {
      const chatCompletion = await openai.embeddings.create({
        input: value,
        model: "text-embedding-3-small",
      });
      setEmbeddingQueries((prev) => [
        ...prev,
        { query: value, embedding: chatCompletion.data[0].embedding },
      ]);
    };

    fetchEmbeddings();
  }, [value, allEmbeddings]);

  const activeEmbedding = allEmbeddings.find((e) => e.query === value);
  return activeEmbedding;
}
