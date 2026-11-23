
import { db } from "./firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";

// Load the user's profile information.
export async function loadUserProfile(user) {

    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    // Display the user's name.
    const nameElement = document.getElementById("name-goes-here");

    if (nameElement) {
        nameElement.textContent = user.displayName || user.email || "friend";
    }

    // Display the user's daily budget.
    const budgetElement = document.getElementById("dailyBudget");

    if (budgetElement) {

        let budget = 20;

        if (userSnapshot.exists()) {
            const profile = userSnapshot.data();
            budget = Number(profile.dailyBudget);
        }

        budgetElement.textContent = `$${budget.toFixed(2)}`;
    }
}