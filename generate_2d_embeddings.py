import pandas as pd
from sklearn.manifold import TSNE
import numpy as np
from ast import literal_eval


def main():
    # Load the embeddings
    datafile_path = "data/fine_food_reviews_with_embeddings_1k.csv"
    df = pd.read_csv(datafile_path)
    # Save to a JSON file in a format of a list of dictionaries
    df.to_json(
        "public/fine_food_reviews_with_embeddings_1k.json", orient='records')

    # Convert to a list of lists of floats
    matrix = np.array(df.embedding.apply(literal_eval).to_list())
    # Create a t-SNE model and transform the data
    tsne = TSNE(n_components=2, perplexity=15, random_state=42,
                init='random', learning_rate=200)
    reduced_embeddings = tsne.fit_transform(matrix)
    # write the reduced embeddings out to a json file
    with open("public/fine_food_reviews_with_embeddings_1k_tsne.json", "w") as f:
        f.write(str(reduced_embeddings.tolist()))


if __name__ == "__main__":
    main()
