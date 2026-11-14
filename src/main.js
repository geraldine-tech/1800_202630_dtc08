
import { Modal } from "bootstrap";
import { db } from "./firebaseConfig.js";
import { requireAuth } from "./authentication.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    setDoc,
    writeBatch,
    arrayUnion,
    arrayRemove,
    serverTimestamp
} from "firebase/firestore";

const nameElement = document.getElementById("name-goes-here");
const budgetElement = document.getElementById("dailyBudget");
const needsElement = document.getElementById("nutritionNeeds");
const mealsContainer = document.getElementById("mealsContainer");
const mealMessage = document.getElementById("mealMessage");

// Add Meal button and modal
const addMealBtn = document.getElementById("addMealBtn");
const addMealModalElement = document.getElementById("addMealModal");

if (addMealBtn && addMealModalElement) {
    const addMealModal = Modal.getOrCreateInstance(addMealModalElement);

    addMealBtn.addEventListener("click", () => {
        addMealModal.show();
    });
} else {
    console.error("Add Meal button or modal was not found.");
}

// Check authentication and load dashboard
requireAuth(async (user) => {
    try {
        await loadUserProfile(user);
        await loadMeals(user);
        setupAddMealForm(user);
    } catch (error) {
        console.error("Dashboard error:", error);

        mealMessage.textContent =
            "We couldn't load your dashboard. Please try again.";
    }
});

// Load the user's profile
async function loadUserProfile(user) {
    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    const name = user.displayName || user.email || "friend";
    nameElement.textContent = name;

    if (userSnapshot.exists()) {
        const profile = userSnapshot.data();

        const budget = Number(profile.dailyBudget ?? 20);

        budgetElement.textContent = `$${budget.toFixed(2)}`;

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

// Get meal information from the form
function getMealFormData() {
    return {
        mealName: document.getElementById("mealName").value.trim(),
        mealType: document.getElementById("mealType").value,
        description: document.getElementById("mealDescription").value.trim(),

        ingredients: document.getElementById("mealIngredients").value
            .split(",")
            .map((ingredient) => ingredient.trim())
            .filter((ingredient) => ingredient !== ""),

        instructions: document.getElementById("mealInstructions").value.trim(),

        // Store cost in cents, like the existing public meals
        estimatedCost: Math.round(
            Number(document.getElementById("estimatedCost").value) * 100
        ),

        preparationTime: Number(
            document.getElementById("preparationTime").value
        ),

        calories: Number(
            document.getElementById("calories").value
        ),

        protein: Number(
            document.getElementById("protein").value
        ),

        servings: Number(
            document.getElementById("servings").value
        )
    };
}

// Save the meal in mealSubmissions and add its ID to the user's profile
async function saveUserMeal(user, mealData) {
    const userRef = doc(db, "users", user.uid);

    // Generate a new submission document ID
    const submissionRef = doc(collection(db, "mealSubmissions"));

    // Save both Firestore updates together
    const batch = writeBatch(db);

    // Save the complete meal details
    batch.set(submissionRef, {
        ...mealData,
        userID: user.uid,
        status: "pending",
        createdAt: serverTimestamp()
    });

    // Add the submission ID to the user's myMeals array
    batch.set(
        userRef,
        {
            myMeals: arrayUnion(submissionRef.id)
        },
        { merge: true }
    );

    await batch.commit();
}

// Connect the Add Meal form to Firestore
function setupAddMealForm(user) {
    const form = document.getElementById("addMealForm");

    const submitMealBtn =
        document.getElementById("submitMealBtn");

    const modalElement = document.getElementById("addMealModal");

    const mealModal = Modal.getOrCreateInstance(modalElement);

    if (!form || !submitMealBtn || !modalElement) {
        console.error("Add Meal form, button or modal was not found.");
        return;
    }

    // Submit meal and save it to the user's meals
    // and the meal submissions collection.
    submitMealBtn.addEventListener("click", async () => {
        if (!form.reportValidity()) {
            return;
        }

        submitMealBtn.disabled = true;

        try {
            const mealData = getMealFormData();

            // Save meal and update the user's myMeals array
            await saveUserMeal(user, mealData);

            alert(
                "Your meal has been submitted successfully! " +
                "You can view it in My Meals while it awaits approval."
            );

            form.reset();
            mealModal.hide();

        } catch (error) {
            console.error("Error submitting meal:", error);

            alert(
                "We couldn't submit your meal. Please try again."
            );

        } finally {
            submitMealBtn.disabled = false;
        }
    });
}

// Load the user's favourite meal IDs from their profile
async function getFavoriteMealIds(user) {
    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
        return new Set();
    }

    const profile = userSnapshot.data();

    return new Set(profile.favorites || []);
}

// Load public meals from Firestore
async function loadMeals(user) {
    const mealsRef = collection(db, "meals");
    const mealsSnapshot = await getDocs(mealsRef);

    // Get this user's favourites
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
        const favoriteButton = document.createElement("button");
        favoriteButton.type = "button";
        favoriteButton.className =
            "btn btn-link text-danger p-0 position-absolute top-0 end-0 m-3";

        // Check whether the meal is already saved
        const isAlreadySaved = favoriteIds.has(mealId);

        favoriteButton.innerHTML = isAlreadySaved
            ? '<i class="bi bi-heart-fill fs-4"></i>'
            : '<i class="bi bi-heart fs-4"></i>';

        favoriteButton.setAttribute(
            "aria-label",
            isAlreadySaved
                ? "Remove from favourites"
                : "Save to favourites"
        );

        // Save or remove the meal in Firestore
        favoriteButton.addEventListener("click", async () => {
            const userRef = doc(db, "users", user.uid);

            const isLiked = favoriteIds.has(mealId);

            favoriteButton.disabled = true;

            try {
                if (isLiked) {
                    // Remove the favourite
                    await setDoc(
                        userRef,
                        {
                            favorites: arrayRemove(mealId)
                        },
                        { merge: true }
                    );

                    favoriteIds.delete(mealId);

                    favoriteButton.innerHTML =
                        '<i class="bi bi-heart fs-4"></i>';

                    favoriteButton.setAttribute(
                        "aria-label",
                        "Save to favourites"
                    );

                } else {
                    // Save the favourite
                    await setDoc(
                        userRef,
                        {
                            favorites: arrayUnion(mealId)
                        },
                        { merge: true }
                    );

                    favoriteIds.add(mealId);

                    favoriteButton.innerHTML =
                        '<i class="bi bi-heart-fill fs-4"></i>';

                    favoriteButton.setAttribute(
                        "aria-label",
                        "Remove from favourites"
                    );
                }

            } catch (error) {
                console.error("Error updating favourite:", error);

                alert(
                    "We couldn't update your favourite. Please try again."
                );

            } finally {
                favoriteButton.disabled = false;
            }
        });

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
