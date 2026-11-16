
import { db } from "./firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";

// Get the meal ID passed from the dashboard URL.
const urlParams = new URLSearchParams(window.location.search);
const mealId = urlParams.get("mealId");

// Find the container where the meal details will be displayed.
const mealDetails = document.getElementById("mealDetails");

// Display the selected meal's information.
async function loadMealDetails() {
    // Check whether a meal ID was provided in the URL.
    if (!mealId) {
        mealDetails.textContent = "No meal was selected.";
        return;
    }

    try {
        // Find the selected meal document in the Firestore meals collection.
        const mealRef = doc(db, "meals", mealId);
        const mealSnapshot = await getDoc(mealRef);

        // Check whether the selected meal exists.
        if (!mealSnapshot.exists()) {
            mealDetails.textContent = "This meal could not be found.";
            return;
        }

        const meal = mealSnapshot.data();

        // Clear the loading message before displaying the meal.
        mealDetails.innerHTML = "";

        // Display the meal picture if an image URL is available.
        if (meal.imageUrl) {
            const image = document.createElement("img");
            image.src = meal.imageUrl;
            image.alt = meal.mealName || "Meal picture";
            image.className = "img-fluid rounded-3 mb-4 w-100";
            image.style.maxHeight = "350px";
            image.style.objectFit = "cover";

            mealDetails.appendChild(image);
        }

        // Display the meal name.
        const title = document.createElement("h2");
        title.className = "fw-bold mb-2";
        title.style.color = "#183D2B";
        title.textContent = meal.mealName || "Untitled Meal";
        mealDetails.appendChild(title);

        // Display the meal type.
        const type = document.createElement("p");
        type.className = "text-muted";
        type.textContent = meal.mealType || "Meal";
        mealDetails.appendChild(type);

        // Display the meal description.
        const descriptionTitle = document.createElement("h5");
        descriptionTitle.className = "fw-bold mt-4";
        descriptionTitle.textContent = "About this meal";
        mealDetails.appendChild(descriptionTitle);

        const description = document.createElement("p");
        description.textContent =
            meal.description || "No description available.";
        mealDetails.appendChild(description);

        // Display the meal ingredients.
        const ingredientsTitle = document.createElement("h5");
        ingredientsTitle.className = "fw-bold mt-4";
        ingredientsTitle.textContent = "Ingredients";
        mealDetails.appendChild(ingredientsTitle);

        const ingredientsList = document.createElement("ul");

        if (Array.isArray(meal.ingredients) && meal.ingredients.length > 0) {
            meal.ingredients.forEach((ingredient) => {
                const item = document.createElement("li");
                item.textContent = ingredient;
                ingredientsList.appendChild(item);
            });
        } else {
            const item = document.createElement("li");
            item.textContent = "No ingredients listed.";
            ingredientsList.appendChild(item);
        }

        mealDetails.appendChild(ingredientsList);

        // Convert the estimated cost from cents to dollars.
        const cost = Number(meal.estimatedCost || 0) / 100;

        // Display the meal's cost and nutritional information.
        const nutritionTitle = document.createElement("h5");
        nutritionTitle.className = "fw-bold mt-4";
        nutritionTitle.textContent = "Nutrition and Cost";
        mealDetails.appendChild(nutritionTitle);

        const costText = document.createElement("p");
        costText.textContent = `Estimated Cost: $${cost.toFixed(2)}`;
        mealDetails.appendChild(costText);

        const caloriesText = document.createElement("p");
        caloriesText.textContent = `Calories: ${meal.calories ?? 0}`;
        mealDetails.appendChild(caloriesText);

        const proteinText = document.createElement("p");
        proteinText.textContent = `Protein: ${meal.protein ?? 0}g`;
        mealDetails.appendChild(proteinText);

        // Display preparation time.
        const timeText = document.createElement("p");
        timeText.textContent =
            `Preparation Time: ${meal.preparationTime ?? 0} minutes`;
        mealDetails.appendChild(timeText);

        // Display the number of servings.
        const servingsText = document.createElement("p");
        servingsText.textContent = `Servings: ${meal.servings ?? "Not specified"}`;
        mealDetails.appendChild(servingsText);

        // Display dietary tags as Bootstrap badges.
        const tagsTitle = document.createElement("h5");
        tagsTitle.className = "fw-bold mt-4";
        tagsTitle.textContent = "Dietary Information";
        mealDetails.appendChild(tagsTitle);

        const tagContainer = document.createElement("div");

        if (Array.isArray(meal.dietaryTags) && meal.dietaryTags.length > 0) {
            meal.dietaryTags.forEach((tag) => {
                const badge = document.createElement("span");
                badge.className = "badge bg-success me-2 mb-2";
                badge.textContent = tag;
                tagContainer.appendChild(badge);
            });
        } else {
            tagContainer.textContent = "No dietary tags available.";
        }

        mealDetails.appendChild(tagContainer);

    } catch (error) {
        console.error("Error loading meal details:", error);
        mealDetails.textContent =
            "Unable to load this meal. Please try again later.";
    }
}

// Load the selected meal when the page opens.
loadMealDetails();

// Return to the previous page when the Back button is clicked.
document.getElementById("backButton").addEventListener("click", () => {
    window.history.back();
});
