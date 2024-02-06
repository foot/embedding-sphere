import * as d3 from "d3";

export type LatLngIndex = { [key: string]: number };
export interface EmbeddingEntry {
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
export type EmbeddingsData = EmbeddingEntry[];

export function toIndexFromEmbeddings(
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
export function cosineDistance(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return similarity;
}
