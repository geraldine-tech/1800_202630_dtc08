
import { Modal } from "bootstrap";
import { requireAuth } from "./authentication.js";
import { loadUserProfile } from "./dashboard.js";
import { loadMeals, loadMyMeals } from "./meals.js";
import { setupAddMealForm } from "./mealSubmission.js";

const mealMessage = document.getElementById("mealMessage");
const addMealBtn = document.getElementById("addMealBtn");
const addMealModalElement = document.getElementById("addMealModal");

// Open Add Meal modal
if (addMealBtn && addMealModalElement) {
    const addMealModal = Modal.getOrCreateInstance(addMealModalElement);

    addMealBtn.addEventListener("click", () => {
        addMealModal.show();
    });
}

// Load dashboard after login
requireAuth(async (user) => {
    try {
        await loadUserProfile(user);
        await loadMeals(user);
        await loadMyMeals(user);

        // Load public meals and favourite buttons
        await loadMeals(user, "meals");
        await loadMeals(user, "mealSubmissions")

        setupAddMealForm(user);

        // Refresh My Meals when a meal is added
        window.addEventListener("myMealsUpdated", async () => {
            try {
                await loadMyMeals(user);
            } catch (error) {
                console.error("Error refreshing meals:", error);
            }
        });

    } catch (error) {
        console.error("Dashboard error:", error);

        if (mealMessage) {
            mealMessage.textContent = "We couldn't load your dashboard. Please try again.";
        }
    }
});
