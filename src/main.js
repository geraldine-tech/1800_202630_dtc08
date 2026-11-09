import { Modal } from "bootstrap";
import { db } from "./firebaseConfig.js";
import { requireAuth } from "./authentication.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    setDoc,
    deleteDoc,
    addDoc
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

        calories: Number(document.getElementById("calories").value),

        protein: Number(
            document.getElementById("protein").value
        ),

        servings: Number(
            document.getElementById("servings").value
        )
    };
}

// Connect the Add Meal form to Firestore
function setupAddMealForm(user) {
    const form = document.getElementById("addMealForm");

    const savePrivateMealBtn =
        document.getElementById("savePrivateMealBtn");

    const submitMealReviewBtn =
        document.getElementById("submitMealReviewBtn");

    const modalElement = document.getElementById("addMealModal");

    const mealModal = Modal.getOrCreateInstance(modalElement);

    // Save meal privately
    savePrivateMealBtn.addEventListener("click", async () => {
        if (!form.reportValidity()) {
            return;
        }

        savePrivateMealBtn.disabled = true;

        try {
            const mealData = getMealFormData();

            const privateMealsRef = collection(
                db,
                "users",
                user.uid,
                "myMeals"
            );

            await addDoc(privateMealsRef, {
                ...mealData,
                createdBy: user.uid
            });

            alert("Your meal has been saved privately!");

            form.reset();
            mealModal.hide();

        } catch (error) {
            console.error("Error saving private meal:", error);

            alert("We couldn't save your meal. Please try again.");

        } finally {
            savePrivateMealBtn.disabled = false;
        }
    });

    // Submit meal for review
    submitMealReviewBtn.addEventListener("click", async () => {
        if (!form.reportValidity()) {
            return;
        }

        submitMealReviewBtn.disabled = true;

        try {
            const mealData = getMealFormData();

            const submissionsRef = collection(db, "mealSubmissions");

            await addDoc(submissionsRef, {
                ...mealData,
                createdBy: user.uid,
                status: "pending"
            });

            alert("Your meal has been submitted for review!");

            form.reset();
            mealModal.hide();

        } catch (error) {
            console.error("Error submitting meal:", error);

            alert("We couldn't submit your meal. Please try again.");

        } finally {
            submitMealReviewBtn.disabled = false;
        }
    });
}


// Load the user's favourite meal IDs from Firestore
async function getFavoriteMealIds(user) {
    const favoritesRef = collection(
        db,
        "users",
        user.uid,
        "favorites"
    );

    const favoritesSnapshot = await getDocs(favoritesRef);

    const favoriteIds = new Set();

    favoritesSnapshot.forEach((favoriteDoc) => {
        favoriteIds.add(favoriteDoc.id);
    });

    return favoriteIds;
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
            const favoriteRef = doc(
                db,
                "users",
                user.uid,
                "favorites",
                mealId
            );

            const isLiked = favoriteIds.has(mealId);

            favoriteButton.disabled = true;

            try {
                if (isLiked) {
                    // Remove the favourite
                    await deleteDoc(favoriteRef);

                    favoriteIds.delete(mealId);

                    favoriteButton.innerHTML =
                        '<i class="bi bi-heart fs-4"></i>';

                    favoriteButton.setAttribute(
                        "aria-label",
                        "Save to favourites"
                    );
                } else {
                    // Save the favourite
                    await setDoc(favoriteRef, {
                        mealId: mealId
                    });

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