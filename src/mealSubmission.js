
import { Modal } from "bootstrap";
import { db } from "./firebaseConfig.js";

import {
    doc,
    collection,
    writeBatch,
    arrayUnion,
    serverTimestamp
} from "firebase/firestore";

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
    const submissionRef = doc(collection(db, "mealSubmissions"));

    const batch = writeBatch(db);

    batch.set(submissionRef, {
        ...mealData,
        userID: user.uid,
        status: "pending",
        createdAt: serverTimestamp()
    });

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
export function setupAddMealForm(user) {
    const form = document.getElementById("addMealForm");
    const submitMealBtn = document.getElementById("submitMealBtn");
    const modalElement = document.getElementById("addMealModal");

    if (!form || !submitMealBtn || !modalElement) {
        console.error("Add Meal form, button or modal was not found.");
        return;
    }

    const mealModal = Modal.getOrCreateInstance(modalElement);

    submitMealBtn.addEventListener("click", async () => {
        if (!form.reportValidity()) {
            return;
        }

        submitMealBtn.disabled = true;

        try {
            const mealData = getMealFormData();

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
