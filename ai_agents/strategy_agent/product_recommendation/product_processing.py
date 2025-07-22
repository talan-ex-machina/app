import json

class ProductDataProcessor:
    def __init__(self):
        pass

    def preprocess_product_data(self, json_data):
        """
        Prétraiter les données des produits et extraire les reviews avec pros et cons.
        """
        product_reviews = []

        # Parcours des produits et de leurs revues
        for product in json_data["reviews"]:
            product_name = product["product"]
            reviews = product["g2_data"]["reviews"] if "reviews" in product["g2_data"] else []
            
            for review in reviews:
                review_info = {
                    "product_name": product_name,
                    "reviewer": review.get("Reviewer", "Anonyme"),
                    "rating": review.get("Rating", "Non disponible"),
                    "review_title": review.get("Review Title", "Non disponible"),
                    "pros": review.get("Pros", []),
                    "cons": review.get("Cons", []),
                    "problems_solved": review.get("Problems Solved", "Non disponible")
                }
                product_reviews.append(review_info)

        return product_reviews


