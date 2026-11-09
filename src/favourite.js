
import { db } from "./firebaseConfig.js";
import { requireAuth } from "./authentication.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    deleteDoc
} from "firebase/firestore";

const savedMealsContainer = document.getElementById("savedMealsContainer");
const savedMealsMessage = document.getElementById("savedMealsMessage");

// Check authentication and display saved meals
requireAuth(async (user) => {
    try {
        await displaySavedMeals(user);
    } catch (error) {
        console.error("Error loading saved meals:", error);

        savedMealsMessage.textContent =
            "We couldn't load your saved meals. Please try again.";
    }
});

// Display saved meals from Firestore
async function displaySavedMeals(user) {
    savedMealsContainer.innerHTML = "";

    savedMealsMessage.textContent = "Loading your saved meals...";

    // Get this user's favourites
    const favoritesRef = collection(
        db,
        "users",
        user.uid,
        "favorites"
    );

    const favoritesSnapshot = await getDocs(favoritesRef);

    if (favoritesSnapshot.empty) {
        savedMealsMessage.textContent =
            "You haven't saved any meals yet.";
        return;
    }

    // Get the actual meal details from the meals collection
    const savedMeals = await Promise.all(
        favoritesSnapshot.docs.map(async (favoriteDoc) => {
            const mealRef = doc(db, "meals", favoriteDoc.id);
            const mealSnapshot = await getDoc(mealRef);

            if (!mealSnapshot.exists()) {
                return null;
            }

            return {
                id: mealSnapshot.id,
                ...mealSnapshot.data()
            };
        })
    );

    const availableMeals = savedMeals.filter((meal) => meal !== null);

    if (availableMeals.length === 0) {
        savedMealsMessage.textContent =
            "You haven't saved any available meals yet.";
        return;
    }

    savedMealsMessage.textContent = "";

    availableMeals.forEach((meal) => {
        const cost = Number(meal.estimatedCost || 0) / 100;

        const cardColumn = document.createElement("div");
        cardColumn.className = "col-md-6 col-lg-4";

        const card = document.createElement("div");
        card.className = "card h-100 shadow-sm";

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

        // Remove from Saved button
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "btn btn-outline-danger btn-sm";

        removeButton.innerHTML =
            '<i class="bi bi-heart-fill me-1"></i> Remove from Saved';

        removeButton.addEventListener("click", async () => {
            removeButton.disabled = true;

            try {
                // Remove this favourite from Firestore
                const favoriteRef = doc(
                    db,
                    "users",
                    user.uid,
                    "favorites",
                    meal.id
                );

                await deleteDoc(favoriteRef);

                // Refresh the Saved Meals page
                await displaySavedMeals(user);

            } catch (error) {
                console.error("Error removing favourite:", error);

                alert(
                    "We couldn't remove this meal. Please try again."
                );

                removeButton.disabled = false;
            }
        });

        cardBody.append(
            title,
            type,
            description,
            costText,
            time,
            removeButton
        );

        card.appendChild(cardBody);
        cardColumn.appendChild(card);
        savedMealsContainer.appendChild(cardColumn);
    });
}
