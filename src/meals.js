
import { db } from "./firebaseConfig.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    setDoc,
    arrayUnion,
    arrayRemove
} from "firebase/firestore";

// Load the user's favourite meal IDs
async function getFavoriteMealIds(user) {
    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
        return new Set();
    }

    const profile = userSnapshot.data();

    return new Set(profile.favorites || []);
}

// Create the favourite button
function createFavoriteButton(user, mealId, favoriteIds) {
    const button = document.createElement("button");

    button.type = "button";
    button.className =
        "btn btn-link text-danger p-0 position-absolute top-0 end-0 m-3";

    function updateButton() {
        const isSaved = favoriteIds.has(mealId);

        button.innerHTML = isSaved
            ? '<i class="bi bi-heart-fill fs-4"></i>'
            : '<i class="bi bi-heart fs-4"></i>';

        button.setAttribute(
            "aria-label",
            isSaved ? "Remove from favourites" : "Save to favourites"
        );
    }

    updateButton();

    // Save or remove the meal from favourites
    button.addEventListener("click", async () => {
        const userRef = doc(db, "users", user.uid);
        const isSaved = favoriteIds.has(mealId);

        button.disabled = true;

        try {
            await setDoc(
                userRef,
                {
                    favorites: isSaved
                        ? arrayRemove(mealId)
                        : arrayUnion(mealId)
                },
                { merge: true }
            );

            if (isSaved) {
                favoriteIds.delete(mealId);
            } else {
                favoriteIds.add(mealId);
            }

            updateButton();

        } catch (error) {
            console.error("Error updating favourite:", error);

            alert(
                "We couldn't update your favourite. Please try again."
            );

        } finally {
            button.disabled = false;
        }
    });

    return button;
}

// Load public meals from Firestore
export async function loadMeals(user) {
    const mealsRef = collection(db, "meals");
    const mealsSnapshot = await getDocs(mealsRef);

    const mealsContainer =
        document.getElementById("mealsContainer");

    const mealMessage =
        document.getElementById("mealMessage");

    const favoriteIds = await getFavoriteMealIds(user);

    mealsContainer.innerHTML = "";

    if (mealsSnapshot.empty) {
        mealMessage.textContent =
            "No meals are available yet. Please check again later.";
        return;
    }

    mealMessage.textContent = "";

    mealsSnapshot.forEach((mealDoc) => {
        const meal = mealDoc.data();
        const mealId = mealDoc.id;

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
        card.className =
            "card meal-card h-100 shadow-sm position-relative";

        const cardBody = document.createElement("div");
        cardBody.className = "card-body";

        const title = document.createElement("h5");
        title.className = "card-title fw-bold pe-5";
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

        // Favourite button
        const favoriteButton = createFavoriteButton(
            user,
            mealId,
            favoriteIds
        );

        cardBody.append(
            title,
            type,
            description,
            costText,
            time,
            ingredientText,
            tagContainer,
            favoriteButton
        );

        card.appendChild(cardBody);
        cardColumn.appendChild(card);
        mealsContainer.appendChild(cardColumn);
    });
}
