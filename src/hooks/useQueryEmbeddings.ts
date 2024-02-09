import OpenAI from "openai";
import { useEffect, useMemo, useState } from "react";
import { ExampleQuery, exampleQueries } from "../helpers/example-queries";

export function useQueryEmbedding(
  value: string,
  onError: (err: string) => void
) {
  const [embeddingQueries, setEmbeddingQueries] = useState<ExampleQuery[]>([]);

  const allEmbeddings = useMemo(
    () => [...embeddingQueries, ...exampleQueries],
    [embeddingQueries]
  );

  useEffect(() => {
    const q = allEmbeddings.find((e) => e.query === value);
    // already got the embeddings
    if (q) {
      return;
    }

    const fetchEmbeddings = async () => {
      try {
        const openai = new OpenAI({
          apiKey: import.meta.env["VITE_OPENAI_API_KEY"],
          dangerouslyAllowBrowser: true,
        });

        const chatCompletion = await openai.embeddings.create({
          input: value,
          model: "text-embedding-3-small",
        });

        setEmbeddingQueries((prev) => [
          ...prev,
          { query: value, embedding: chatCompletion.data[0].embedding },
        ]);
      } catch (e) {
        if (onError) {
          onError((e as Error).message);
        }
      }
    };

    fetchEmbeddings();
  }, [value, allEmbeddings, onError]);

  const activeEmbedding = allEmbeddings.find((e) => e.query === value);
  return activeEmbedding;
}
