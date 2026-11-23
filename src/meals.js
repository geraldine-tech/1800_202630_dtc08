
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

// Get the IDs of meals that the current user has saved as favourites.
async function getFavoriteMealIds(user) {
    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
        return new Set();
    }

    const userData = userSnapshot.data();

    // A Set makes it easy to check whether a meal is already a favourite.
    return new Set(userData.favorites || []);
}

// Create the favourite button for each meal card.
function createFavoriteButton(user, mealId, favoriteIds) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "btn btn-outline-danger btn-sm";
    button.style.position = "absolute";
    button.style.top = "10px";
    button.style.right = "10px";

    // Check whether this meal is already in the user's favourites.
    const isFavorite = favoriteIds.has(mealId);

    button.innerHTML = isFavorite ? "♥" : "♡";
    button.setAttribute(
        "aria-label",
        isFavorite ? "Remove from favourites" : "Add to favourites"
    );

    button.addEventListener("click", async (event) => {
        // Stop the click from opening the meal details page.
        event.stopPropagation();

        const userRef = doc(db, "users", user.uid);

        try {
            if (favoriteIds.has(mealId)) {
                // Remove the meal ID from the user's favourites array.
                await setDoc(
                    userRef,
                    { favorites: arrayRemove(mealId) },
                    { merge: true }
                );

                favoriteIds.delete(mealId);
                button.innerHTML = "♡";
                button.setAttribute("aria-label", "Add to favourites");
            } else {
                // Add the meal ID to the user's favourites array.
                await setDoc(
                    userRef,
                    { favorites: arrayUnion(mealId) },
                    { merge: true }
                );

                favoriteIds.add(mealId);
                button.innerHTML = "♥";
                button.setAttribute("aria-label", "Remove from favourites");
            }
        } catch (error) {
            console.error("Error updating favourites:", error);
        }
    });

    return button;
}

// Load approved meals from Firestore and display them on the dashboard.
export async function loadMeals(user) {
    const mealsContainer = document.getElementById("mealsContainer");

    if (!mealsContainer) {
        console.error("Meals container was not found.");
        return;
    }

    try {
        const mealsSnapshot = await getDocs(collection(db, "meals"));

        // Load the user's saved favourites so the correct heart appears.
        const favoriteIds = await getFavoriteMealIds(user);

        // Clear existing cards before displaying the latest meal data.
        mealsContainer.innerHTML = "";

        if (mealsSnapshot.empty) {
            mealsContainer.innerHTML =
                "<p>No meals are available at the moment.</p>";
            return;
        }

        mealsSnapshot.forEach((mealDoc) => {
            const meal = mealDoc.data();
            const mealId = mealDoc.id;

            // Convert the estimated cost from cents to dollars for display.
            const cost = Number(meal.estimatedCost || 0) / 100;

            const ingredients = Array.isArray(meal.ingredients)
                ? meal.ingredients.join(", ")
                : "";

            const tags = Array.isArray(meal.dietaryTags)
                ? meal.dietaryTags
                : [];

            const cardColumn = document.createElement("div");
            cardColumn.className = "col-md-6 col-lg-4 mb-4";

            const card = document.createElement("div");
            card.className =
                "card meal-card h-100 shadow-sm position-relative";

            // Make the entire meal card clickable.
            card.style.cursor = "pointer";
            card.setAttribute("role", "link");
            card.setAttribute("tabindex", "0");

            // Open the Learn page with the selected meal's document ID.
            const openMealDetails = () => {
                window.location.href =
                    `learn.html?mealId=${encodeURIComponent(mealId)}`;
            };

            card.addEventListener("click", openMealDetails);

            // Allow users to open the card using the Enter key.
            card.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                    openMealDetails();
                }
            });

            // Display the meal picture saved in Firestore.
            if (meal.imageUrl) {
                const image = document.createElement("img");

                image.src = meal.imageUrl;
                image.alt = meal.mealName || "Meal picture";
                image.className = "card-img-top";
                image.style.height = "190px";
                image.style.objectFit = "cover";

                card.appendChild(image);
            }

            const cardBody = document.createElement("div");
            cardBody.className = "card-body";
            // For like button to sit correctly
            cardBody.style.position = "relative";

            // Display the meal name.
            const title = document.createElement("h5");
            title.className = "card-title";
            title.textContent = meal.mealName || "Untitled Meal";

            // Display whether the meal is breakfast, lunch or dinner.
            const type = document.createElement("p");
            type.className = "text-muted small";
            type.textContent = meal.mealType || "";

            // Display the meal's calories and protein information.
            const description = document.createElement("p");
            description.className = "card-text";
            description.textContent =
                `${meal.calories ?? 0} calories | ` +
                `${meal.protein ?? 0}g protein`;

            // Display the meal's estimated cost.
            const price = document.createElement("p");
            price.className = "fw-bold";
            price.textContent = `$${cost.toFixed(2)}`;

            // Display how long the meal takes to prepare.
            const preparationTime = document.createElement("p");
            preparationTime.className = "small text-muted";
            preparationTime.textContent =
                `Preparation time: ${meal.preparationTime ?? 0} minutes`;

            // Display the meal ingredients.
            const ingredientText = document.createElement("p");
            ingredientText.className = "small";
            ingredientText.textContent = `Ingredients: ${ingredients}`;

            // Display dietary tags as Bootstrap badges.
            const tagContainer = document.createElement("div");
            tagContainer.className = "mb-3";

            tags.forEach((tag) => {
                const badge = document.createElement("span");
                badge.className = "badge bg-success me-1";
                badge.textContent = tag;

                tagContainer.appendChild(badge);
            });

            // Create the favourite button for this meal.
            const favoriteButton = createFavoriteButton(
                user,
                mealId,
                favoriteIds
            );

            // Add a link to show users they can view the full meal details.
            const detailsLink = document.createElement("p");
            detailsLink.className = "fw-semibold mt-3 mb-0";
            detailsLink.style.color = "#183D2B";
            detailsLink.textContent = "View Meal Details →";

            // Add all meal information to the card body.
            cardBody.appendChild(title);
            cardBody.appendChild(type);
            cardBody.appendChild(description);
            cardBody.appendChild(price);
            cardBody.appendChild(preparationTime);
            cardBody.appendChild(ingredientText);
            cardBody.appendChild(tagContainer);
            cardBody.appendChild(favoriteButton);
            cardBody.appendChild(detailsLink);

            // Add the completed card to the dashboard.
            card.appendChild(cardBody);
            cardColumn.appendChild(card);
            mealsContainer.appendChild(cardColumn);
        });

    } catch (error) {
        console.error("Error loading meals:", error);
        mealsContainer.innerHTML =
            "<p>Unable to load meals. Please try again later.</p>";
    }
}
