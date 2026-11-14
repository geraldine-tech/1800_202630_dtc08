
import { Modal } from "bootstrap";

import { requireAuth } from "./authentication.js";
import { loadUserProfile } from "./dashboard.js";
import { loadMeals } from "./meals.js";
import { setupAddMealForm } from "./mealSubmission.js";

// Get the dashboard message element
const mealMessage = document.getElementById("mealMessage");

// Connect the Add Meal button to the modal
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

// Check authentication and load the dashboard
requireAuth(async (user) => {
    try {
        // Load the user's name, budget and nutrition preferences
        await loadUserProfile(user);

        // Load public meals and favourite buttons
        await loadMeals(user);

        // Connect the Add Meal form
        setupAddMealForm(user);

    } catch (error) {
        console.error("Dashboard error:", error);

        if (mealMessage) {
            mealMessage.textContent =
                "We couldn't load your dashboard. Please try again.";
        }
    }
});
