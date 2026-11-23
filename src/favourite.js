
import { db } from "./firebaseConfig.js";
import { requireAuth } from "./authentication.js";
import {
    doc,
    getDoc,
    updateDoc,
    arrayRemove
} from "firebase/firestore";

const savedMealsContainer = document.getElementById("savedMealsContainer");
const savedMealsMessage = document.getElementById("savedMealsMessage");

// Check login and load saved meals
requireAuth(async (user) => {
    try {
        await displaySavedMeals(user);
    } catch (error) {
        console.error("Error loading saved meals:", error);
        savedMealsMessage.textContent = "We couldn't load your saved meals. Please try again.";
    }
});

// Create an element with text
function createText(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
}

// Display saved meals
async function displaySavedMeals(user) {
    if (!savedMealsContainer || !savedMealsMessage) {
        console.error("Saved meals page elements not found.");
        return;
    }

    savedMealsContainer.innerHTML = "";
    savedMealsMessage.textContent = "Loading your saved meals...";

    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
        savedMealsMessage.textContent = "You haven't saved any meals yet.";
        return;
    }

    const favorites = userSnapshot.data().favorites || [];

    if (favorites.length === 0) {
        savedMealsMessage.textContent = "You haven't saved any meals yet.";
        return;
    }

    let mealCount = 0;

    // Get and display each saved meal
    for (const mealId of favorites) {
        const mealRef = doc(db, "meals", mealId);
        const mealSnapshot = await getDoc(mealRef);

        if (!mealSnapshot.exists()) {
            continue;
        }

        const meal = mealSnapshot.data();
        const cost = Number(meal.estimatedCost || 0) / 100;

        const column = document.createElement("div");
        column.className = "col-12 col-md-6 col-lg-4";

        const card = document.createElement("div");
        card.className = "card h-100 shadow-sm";

        // Meal image
        if (meal.imageUrl) {
            const image = document.createElement("img");
            image.src = meal.imageUrl;
            image.alt = meal.mealName || "Saved meal";
            image.className = "card-img-top";
            image.style.height = "200px";
            image.style.objectFit = "cover";
            card.appendChild(image);
        } else {
            const placeholder = createText(
                "div",
                "bg-light text-secondary text-center p-5",
                "No image available"
            );
            card.appendChild(placeholder);
        }

        const cardBody = document.createElement("div");
        cardBody.className = "card-body d-flex flex-column";

        const title = createText(
            "h5",
            "card-title fw-bold",
            meal.mealName || "Untitled meal"
        );

        const type = createText(
            "p",
            "text-success mb-2",
            meal.mealType || "Meal"
        );

        const description = createText(
            "p",
            "card-text text-secondary",
            meal.description || "No description available."
        );

        const nutrition = createText(
            "p",
            "card-text small",
            `${meal.calories || 0} calories | ${meal.protein || 0}g protein`
        );

        const costText = createText(
            "h5",
            "fw-bold",
            `$${cost.toFixed(2)}`
        );
        costText.style.color = "#183D2B";

        const time = createText(
            "p",
            "text-secondary small",
            `Preparation time: ${meal.preparationTime || "N/A"} minutes`
        );

        // Remove meal from Saved
        const removeButton = createText(
            "button",
            "btn btn-outline-danger btn-sm mt-auto",
            "Remove from Saved"
        );

        removeButton.type = "button";

        removeButton.addEventListener("click", async () => {
            removeButton.disabled = true;

            try {
                await updateDoc(userRef, {
                    favorites: arrayRemove(mealId)
                });

                await displaySavedMeals(user);
            } catch (error) {
                console.error("Error removing saved meal:", error);
                alert("We couldn't remove this meal. Please try again.");
                removeButton.disabled = false;
            }
        });

        cardBody.append(
            title,
            type,
            description,
            nutrition,
            costText,
            time,
            removeButton
        );

        card.appendChild(cardBody);
        column.appendChild(card);
        savedMealsContainer.appendChild(column);

        mealCount++;
    }

    if (mealCount === 0) {
        savedMealsMessage.textContent = "You haven't saved any available meals yet.";
    } else {
        savedMealsMessage.textContent = "";
    }
}
