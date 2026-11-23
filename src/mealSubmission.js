
import { Modal } from "bootstrap";
import { db } from "./firebaseConfig.js";

import {
    doc,
    collection,
    addDoc,
    updateDoc,
    arrayUnion,
    serverTimestamp
} from "firebase/firestore";

// Get meal information from the form
function getMealFormData() {
    return {
        mealName: document.getElementById("mealName").value.trim(),
        mealType: document.getElementById("mealType").value,
        description: document.getElementById("mealDescription").value.trim(),
        ingredients: document.getElementById("mealIngredients").value.split(",").map(item => item.trim()),
        instructions: document.getElementById("mealInstructions").value.trim(),
        estimatedCost: Math.round(Number(document.getElementById("estimatedCost").value) * 100),
        preparationTime: Number(document.getElementById("preparationTime").value),
        calories: Number(document.getElementById("calories").value),
        protein: Number(document.getElementById("protein").value),
        servings: Number(document.getElementById("servings").value)
    };
}

// Resize the picture and convert it to a Base64 string
function resizeImage(file, maxSize = 600) {
    return new Promise(function (resolve, reject) {
        const img = new Image();

        img.onload = function () {
            const scale = Math.min(1, maxSize / Math.max(img.width, img.height));

            const canvas = document.createElement("canvas");
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

            resolve(canvas.toDataURL("image/jpeg", 0.7));
        };

        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

// Save the meal and add its ID to the user's myMeals array
async function saveUserMeal(user, mealData) {

    const mealRef = await addDoc(collection(db, "meals"), {
        mealName: mealData.mealName,
        mealType: mealData.mealType,
        description: mealData.description,
        ingredients: mealData.ingredients,
        instructions: mealData.instructions,
        estimatedCost: mealData.estimatedCost,
        preparationTime: mealData.preparationTime,
        calories: mealData.calories,
        protein: mealData.protein,
        servings: mealData.servings,
        image: mealData.image,
        userID: user.uid,
        createdAt: serverTimestamp()
    });

    const userRef = doc(db, "users", user.uid);

    await updateDoc(userRef, {
        myMeals: arrayUnion(mealRef.id)
    });
}

// Set up the Add Meal form
export function setupAddMealForm(user) {
    const form = document.getElementById("addMealForm");
    const submitButton = document.getElementById("submitMealBtn");
    const modalElement = document.getElementById("addMealModal");
    const imageInput = document.getElementById("mealImage");

    if (!form || !submitButton || !modalElement || !imageInput) {
        console.error("Add Meal form elements were not found.");
        return;
    }

    const mealModal = Modal.getOrCreateInstance(modalElement);

    submitButton.addEventListener("click", async function () {
        if (!form.reportValidity()) {
            return;
        }

        const imageFile = imageInput.files[0];

        if (!imageFile || !imageFile.type.startsWith("image/")) {
            alert("Please select a valid meal picture.");
            return;
        }

        if (imageFile.size > 5 * 1024 * 1024) {
            alert("Your image must be smaller than 5 MB.");
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Saving Meal...";

        try {
            const mealData = getMealFormData();

            mealData.image = await resizeImage(imageFile);

            await saveUserMeal(user, mealData);

            alert("Your meal has been added successfully!");

            form.reset();
            mealModal.hide();

            window.dispatchEvent(new CustomEvent("myMealsUpdated"));

        } catch (error) {
            console.error("Error saving meal:", error);
            alert("Unable to save your meal. Please try again.");

        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Submit Meal";
        }
    });
}
