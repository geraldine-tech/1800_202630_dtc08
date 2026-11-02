
import { db } from "./firebaseConfig.js";
import { requireAuth } from "./authentication.js";

import {
    doc,
    getDoc,
    collection,
    getDocs
} from "firebase/firestore";

const nameElement = document.getElementById("name-goes-here");
const budgetElement = document.getElementById("dailyBudget");
const needsElement = document.getElementById("nutritionNeeds");
const mealsContainer = document.getElementById("mealsContainer");
const mealMessage = document.getElementById("mealMessage");

requireAuth(async (user) => {
    try {
        await loadUserProfile(user);
        await loadMeals();
    } catch (error) {
        console.error("Dashboard error:", error);
        mealMessage.textContent =
            "We couldn't load your dashboard. Please try again.";
    }
});

async function loadUserProfile(user) {
    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    const name = user.displayName || user.email || "friend";
    nameElement.textContent = name;

    if (userSnapshot.exists()) {
        const profile = userSnapshot.data();

        const budget = Number(profile.dailyBudget ?? 20);

        budgetElement.textContent =
            `$${budget.toFixed(2)}`;

        const needs = profile.nutritionalNeeds || [];

        needsElement.textContent =
            needs.length > 0
                ? needs.join(", ")
                : "No preferences added yet.";
    } else {
        budgetElement.textContent = "$20.00";
        needsElement.textContent = "No preferences added yet.";
    }
}

async function loadMeals() {
    const mealsRef = collection(db, "meals");
    const mealsSnapshot = await getDocs(mealsRef);

    mealsContainer.innerHTML = "";

    if (mealsSnapshot.empty) {
        mealMessage.textContent =
            "No meals are available yet. Please check again later.";
        return;
    }

    mealMessage.textContent = "";

    mealsSnapshot.forEach((mealDoc) => {
        const meal = mealDoc.data();

        const cost = Number(meal.estimatedCost || 0) / 100;

        const ingredients = Array.isArray(meal.ingredients)
            ? meal.ingredients.join(", ")
            : "Ingredients not available";

        const tags = Array.isArray(meal.dietaryTags)
            ? meal.dietaryTags
            : [];

        const cardColumn = document.createElement("div");
        cardColumn.className = "col-md-6 col-lg-4";

        const card = document.createElement("div");
        card.className = "card meal-card h-100 shadow-sm";

        const cardBody = document.createElement("div");
        cardBody.className = "card-body";

        const title = document.createElement("h5");
        title.className = "card-title fw-bold";
        title.textContent = meal.mealName || "Untitled meal";

        const type = document.createElement("p");
        type.className = "text-success text-capitalize";
        type.textContent = meal.mealType || "Meal";

        const description = document.createElement("p");
        description.textContent =
            `${meal.calories ?? 0} calories | ` +
            `${meal.protein ?? 0}g protein`;

        const costText = document.createElement("h5");
        costText.className = "fw-bold";
        costText.textContent = `$${cost.toFixed(2)}`;

        const time = document.createElement("p");
        time.className = "text-secondary small";
        time.textContent =
            `Preparation time: ${meal.preparationTime ?? "N/A"} minutes`;

        const ingredientText = document.createElement("p");
        ingredientText.className = "small";
        ingredientText.textContent = `Ingredients: ${ingredients}`;

        const tagContainer = document.createElement("div");
        tagContainer.className = "d-flex flex-wrap gap-2 mt-3";

        tags.forEach((tag) => {
            const badge = document.createElement("span");
            badge.className = "badge text-bg-success";
            badge.textContent = tag;
            tagContainer.appendChild(badge);
        });

        cardBody.append(
            title,
            type,
            description,
            costText,
            time,
            ingredientText,
            tagContainer
        );

        card.appendChild(cardBody);
        cardColumn.appendChild(card);
        mealsContainer.appendChild(cardColumn);
    });
}
