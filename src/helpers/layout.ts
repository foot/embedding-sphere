export type LayoutPoint = [number, number];
export type LayoutData = LayoutPoint[];

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
}
export type EmbeddingsData = EmbeddingEntry[];

export function toIndexFromEmbeddings(
  data: EmbeddingsData,
  similarities: number[],
  layoutData: LayoutData
): LatLngIndex {
  const latLngIndex: LatLngIndex = {};

  const phiThetas = toUnitSphere(layoutData);
  const latLngs = phiThetas.map(toLatLng);

  for (const [i] of data.entries()) {
    latLngIndex[`${latLngs[i].lat},${latLngs[i].lng}`] = similarities[i] || 0;
  }

  return latLngIndex;
}

export function toUnitSphere(
  reducedEmbeddings: number[][]
): { theta: number; phi: number }[] {
  const radii = reducedEmbeddings.map((point) =>
    Math.sqrt(point[0] ** 2 + point[1] ** 2)
  );
  const minRadius = Math.min(...radii);
  const maxRadius = Math.max(...radii);
  const normalizedPoints = reducedEmbeddings.map((point) => {
    const radius = Math.sqrt(point[0] ** 2 + point[1] ** 2);
    const normalizedRadius = (radius - minRadius) / (maxRadius - minRadius);
    const theta = Math.PI * normalizedRadius;
    const phi = Math.atan2(point[1], point[0]);
    return { theta, phi };
  });

  return normalizedPoints;
}

export function toLatLng(sphereCoord: { theta: number; phi: number }): {
  lat: number;
  lng: number;
} {
  const { theta, phi } = sphereCoord;
  const lat = 90 - (theta * 180) / Math.PI;
  const lng = (phi * 180) / Math.PI;

  return { lat: Math.round(lat), lng: Math.round(lng) };
}
