
import { db } from "./firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";

const urlParams = new URLSearchParams(window.location.search);
const mealId = urlParams.get("mealId");

const mealDetails = document.getElementById("mealDetails");
const backButton = document.getElementById("backButton");

// Create and display text elements
function addText(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    mealDetails.appendChild(element);
}

// Load selected meal
async function loadMealDetails() {
    if (!mealDetails) {
        console.error("Meal details container not found.");
        return;
    }

    if (!mealId) {
        mealDetails.textContent = "No meal was selected.";
        return;
    }

    mealDetails.textContent = "Loading meal...";

    try {
        const mealRef = doc(db, "meals", mealId);
        const mealSnapshot = await getDoc(mealRef);

        if (!mealSnapshot.exists()) {
            mealDetails.textContent = "This meal could not be found.";
            return;
        }

        const meal = mealSnapshot.data();
        mealDetails.innerHTML = "";

        // Meal image
        if (meal.imageUrl) {
            const image = document.createElement("img");
            image.src = meal.imageUrl;
            image.alt = meal.mealName || "Meal picture";
            image.className = "img-fluid rounded-3 mb-4 w-100";
            image.style.maxHeight = "350px";
            image.style.objectFit = "cover";
            mealDetails.appendChild(image);
        }

        // Meal information
        addText("h2", "fw-bold mb-2", meal.mealName || "Untitled Meal");
        addText("p", "text-muted", meal.mealType || "Meal");

        addText("h5", "fw-bold mt-4", "About this meal");
        addText("p", "", meal.description || "No description available.");

        // Ingredients
        addText("h5", "fw-bold mt-4", "Ingredients");

        const ingredientsList = document.createElement("ul");
        const ingredients = meal.ingredients || [];

        if (ingredients.length > 0) {
            ingredients.forEach((ingredient) => {
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

        // Nutrition and cost
        const cost = Number(meal.estimatedCost || 0) / 100;

        addText("h5", "fw-bold mt-4", "Nutrition and Cost");
        addText("p", "", `Estimated Cost: $${cost.toFixed(2)}`);
        addText("p", "", `Calories: ${meal.calories || 0}`);
        addText("p", "", `Protein: ${meal.protein || 0}g`);
        addText("p", "", `Preparation Time: ${meal.preparationTime || 0} minutes`);
        addText("p", "", `Servings: ${meal.servings || "Not specified"}`);

        // Dietary tags
        addText("h5", "fw-bold mt-4", "Dietary Information");

        const tagContainer = document.createElement("div");
        const tags = meal.dietaryTags || [];

        if (tags.length > 0) {
            tags.forEach((tag) => {
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
        mealDetails.textContent = "Unable to load this meal. Please try again later.";
    }
}

loadMealDetails();

// Back button
if (backButton) {
    backButton.addEventListener("click", () => {
        window.history.back();
    });
}
