
import { db } from "./firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";

// Load the user's profile information
export async function loadUserProfile(user) {
    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    const nameElement = document.getElementById("name-goes-here");
    const budgetElement = document.getElementById("dailyBudget");
    const needsElement = document.getElementById("nutritionNeeds");

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
