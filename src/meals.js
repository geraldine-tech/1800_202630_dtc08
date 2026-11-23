
import { db } from "./firebaseConfig.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    updateDoc,
    arrayUnion,
    arrayRemove
} from "firebase/firestore";

// Create an element with text
function createText(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
}

// Create a meal image
function createMealImage(meal, altText) {
    const imageSource = meal.image || meal.imageUrl;

    if (!imageSource) {
        return null;
    }

    const image = document.createElement("img");
    image.src = imageSource;
    image.alt = meal.mealName || altText;
    image.className = "card-img-top";
    image.style.height = "190px";
    image.style.objectFit = "cover";

    return image;
}

// Get the user's favourite meal IDs
async function getFavoriteMealIds(user) {
    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
        return userSnapshot.data().favorites || [];
    }

    return [];
}

// Create the favourite button
function createFavoriteButton(user, mealId, favorites) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "btn btn-outline-danger btn-lg";
    button.style.fontSize = "1.5rem";
    button.style.padding = "0.25rem 1rem";
    button.textContent = favorites.includes(mealId) ? "♥" : "♡";

    button.addEventListener("click", async (event) => {
        event.stopPropagation();

        const userRef = doc(db, "users", user.uid);

        try {
            if (favorites.includes(mealId)) {
                await updateDoc(userRef, {
                    favorites: arrayRemove(mealId)
                });

                favorites.splice(favorites.indexOf(mealId), 1);
                button.textContent = "♡";

            } else {
                await updateDoc(userRef, {
                    favorites: arrayUnion(mealId)
                });

                favorites.push(mealId);
                button.textContent = "♥";
            }

        } catch (error) {
            console.error("Error updating favourites:", error);
        }
    });

    return button;
}

// Load public meals
export async function loadMeals(user) {
    const container = document.getElementById("mealsContainer");
    const message = document.getElementById("mealMessage");
    const search = document.getElementById("mealSearch");
    const searchMessage = document.getElementById("searchMessage");

    if (!container) {
        console.error("Meals container not found.");
        return;
    }

    if (message) {
        message.textContent = "Loading meals...";
    }

    try {
        const mealsSnapshot = await getDocs(collection(db, "meals"));
        const favorites = await getFavoriteMealIds(user);

        container.innerHTML = "";

        if (searchMessage) {
            searchMessage.textContent = "";
        }

        if (mealsSnapshot.empty) {
            if (message) {
                message.textContent = "No meals are available at the moment.";
            }
            return;
        }

        const mealCards = [];

        mealsSnapshot.forEach((mealDoc) => {
            const meal = mealDoc.data();

            // Skip meals submitted by individual users
            if (meal.userID) {
                return;
            }

            const mealId = mealDoc.id;
            const cost = Number(meal.estimatedCost || 0) / 100;

            const column = document.createElement("div");
            column.className = "col-md-6 col-lg-4 mb-4";

            const card = document.createElement("div");
            card.className = "card meal-card h-100 shadow-sm";
            card.style.cursor = "pointer";

            card.addEventListener("click", () => {
                window.location.href = "learn.html?mealId=" + encodeURIComponent(mealId);
            });

            const image = createMealImage(meal, "Meal picture");

            if (image) {
                card.appendChild(image);
            }

            const cardBody = document.createElement("div");
            cardBody.className = "card-body";

            cardBody.appendChild(
                createText("h5", "card-title", meal.mealName || "Untitled Meal")
            );

            cardBody.appendChild(
                createText("p", "text-success", meal.mealType || "Meal")
            );

            cardBody.appendChild(
                createText(
                    "p",
                    "",
                    `${meal.calories || 0} calories | ${meal.protein || 0}g protein`
                )
            );

            cardBody.appendChild(
                createText("p", "fw-bold", `$${cost.toFixed(2)}`)
            );

            cardBody.appendChild(
                createText(
                    "p",
                    "",
                    `Preparation time: ${meal.preparationTime || 0} minutes`
                )
            );

            const ingredients = Array.isArray(meal.ingredients)
                ? meal.ingredients.join(", ")
                : meal.ingredients || "";

            cardBody.appendChild(
                createText("p", "", "Ingredients: " + ingredients)
            );

            // Display dietary tags
            const tags = document.createElement("div");

            if (Array.isArray(meal.dietaryTags)) {
                meal.dietaryTags.forEach((tag) => {
                    const badge = createText(
                        "span",
                        "badge bg-success me-1",
                        tag
                    );

                    tags.appendChild(badge);
                });
            }

            cardBody.appendChild(tags);

            // Add favourite button
            const favoriteContainer = document.createElement("div");

            favoriteContainer.className =
                "border-top pt-3 mt-3 d-flex justify-content-end";

            favoriteContainer.appendChild(
                createFavoriteButton(user, mealId, favorites)
            );

            cardBody.appendChild(favoriteContainer);
            card.appendChild(cardBody);
            column.appendChild(card);
            container.appendChild(column);

            // Save meal information for searching
            const searchText =
                (meal.mealName || "") + " " +
                (meal.mealType || "") + " " +
                ingredients;

            mealCards.push({
                element: column,
                text: searchText.toLowerCase()
            });
        });

        if (message) {
            message.textContent = container.children.length === 0
                ? "No meals are available at the moment."
                : "";
        }

        // Search meals
        if (search) {
            search.oninput = function () {
                const searchTerm = search.value.toLowerCase().trim();
                let visibleMeals = 0;

                mealCards.forEach((mealCard) => {
                    if (mealCard.text.includes(searchTerm)) {
                        mealCard.element.style.display = "";
                        visibleMeals++;
                    } else {
                        mealCard.element.style.display = "none";
                    }
                });

                if (searchMessage) {
                    searchMessage.textContent = visibleMeals === 0
                        ? "No meals found. Try another search."
                        : "";
                }
            };
        }

    } catch (error) {
        console.error("Error loading meals:", error);

        if (message) {
            message.textContent = "Unable to load meals. Please try again.";
        }
    }
}

// Load meals added by the logged-in user
export async function loadMyMeals(user) {
    const container = document.getElementById("myMealsContainer");
    const message = document.getElementById("myMealsMessage");

    if (!container) {
        console.error("My Meals container not found.");
        return;
    }

    if (message) {
        message.textContent = "Loading your meals...";
    }

    try {
        // Get the user's meal IDs
        const userRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userRef);

        const myMealIds = userSnapshot.exists()
            ? userSnapshot.data().myMeals || []
            : [];

        container.innerHTML = "";

        if (myMealIds.length === 0) {
            if (message) {
                message.textContent = "You haven't added any meals yet.";
            }
            return;
        }

        // Get each meal using its ID
        for (const mealId of myMealIds) {
            const mealRef = doc(db, "meals", mealId);
            const mealSnapshot = await getDoc(mealRef);

            if (!mealSnapshot.exists()) {
                continue;
            }

            const meal = mealSnapshot.data();

            // Only display meals belonging to this user
            if (meal.userID !== user.uid) {
                continue;
            }

            const cost = Number(meal.estimatedCost || 0) / 100;

            const column = document.createElement("div");
            column.className = "col-12 col-md-6 col-lg-4";

            const card = document.createElement("div");
            card.className = "card h-100 shadow-sm";

            const image = createMealImage(meal, "My meal");

            if (image) {
                image.style.height = "200px";
                card.appendChild(image);
            }

            const cardBody = document.createElement("div");
            cardBody.className = "card-body";

            cardBody.appendChild(
                createText("h5", "card-title", meal.mealName || "Untitled Meal")
            );

            cardBody.appendChild(
                createText("p", "", meal.description || "")
            );

            cardBody.appendChild(
                createText(
                    "p",
                    "",
                    `${meal.mealType || "Meal"} | $${cost.toFixed(2)} | ${meal.preparationTime || 0} minutes`
                )
            );

            card.appendChild(cardBody);
            column.appendChild(card);
            container.appendChild(column);
        }

        if (message) {
            message.textContent = container.children.length === 0
                ? "You haven't added any meals yet."
                : "";
        }

    } catch (error) {
        console.error("Error loading your meals:", error);

        if (message) {
            message.textContent = "We couldn't load your meals. Please try again.";
        }
    }
}
