import pandas as pd
from sklearn.manifold import TSNE
import numpy as np
from ast import literal_eval


def to_unit_sphere(reduced_embeddings):
    # Normalize and map onto a unit circle
    angles = np.arctan2(reduced_embeddings[:, 1], reduced_embeddings[:, 0])
    radii = np.sqrt(reduced_embeddings[:, 0]**2 + reduced_embeddings[:, 1]**2)
    radii_normalized = (radii - np.min(radii)) / \
        (np.max(radii) - np.min(radii))

    # Use angles for azimuthal angle and radii for polar angle
    theta = np.pi * radii_normalized  # Map radius to [0, π]
    phi = angles

    # # Convert spherical coordinates to Cartesian coordinates for plotting
    # x = np.sin(theta) * np.cos(phi)
    # y = np.sin(theta) * np.sin(phi)
    # z = np.cos(theta)

    return theta, phi


def to_lat_lng(theta, phi):
    # Convert theta from [0, π] to latitude in degrees [-90, 90]
    lat = 90 - np.degrees(theta)

    # Convert phi from [0, 2π] or [-π, π] to longitude in degrees [-180, 180]
    lng = np.degrees(phi)

    # Round to nearest whole number
    lat_rounded = np.round(lat)
    lng_rounded = np.round(lng)

    return lat_rounded, lng_rounded


def main():
    # Load the embeddings
    datafile_path = "data/fine_food_reviews_with_embeddings_1k.csv"
    df = pd.read_csv(datafile_path)

    # Convert to a list of lists of floats
    matrix = np.array(df.embedding.apply(literal_eval).to_list())

    # Create a t-SNE model and transform the data
    tsne = TSNE(n_components=2, perplexity=15, random_state=42,
                init='random', learning_rate=200)
    reduced_embeddings = tsne.fit_transform(matrix)

    # for each entry in the dataframe, calculate the to_unit_sphere
    theta, phi = to_unit_sphere(reduced_embeddings)

    # Create a new dataframe with the new columns
    df['theta'] = theta
    df['phi'] = phi

    lat, lng = to_lat_lng(theta, phi)
    df['lat'] = lat
    df['lng'] = lng

    # Save to a JSON file in a format of a list of dictionaries
    df.to_json(
        "public/fine_food_reviews_with_embeddings_1k_tsne.json", orient='records')


if __name__ == "__main__":
    main()
