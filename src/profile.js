import { db } from "./firebaseConfig.js";
import { requireAuth, onAuthReady } from "./authentication.js";
import { doc, getDoc } from "firebase/firestore";

// ---------- FETCH: gets data, touches no HTML ----------
async function loadUserProfile(user) {
    const userSnapshot = await getDoc(doc(db, "users", user.uid));
    return userSnapshot.exists() ? userSnapshot.data() : null;
}

// ---------- RENDER: takes data, touches no Firebase ----------
function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

function listOrNone(arr) {
    return arr?.length ? escapeHtml(arr.join(", ")) : "None listed";
}

function renderProfile(userData) {
    const container = document.querySelector("#profile");

    container.innerHTML = `
        <div class="text-center pt-2">
            <div class="rounded-circle bg-secondary-subtle mx-auto"
                 style="width: 200px; height: 200px;"></div>
            <h1 class="mt-3">${escapeHtml(userData.name) || "Unknown"}</h1>
        </div>
        <div class ="px-3">
            <p class="mt-4">${escapeHtml(userData.email)}</p>
            <p>Daily budget: $${escapeHtml(userData.dailyBudget) || "-"}</p>
        </div>

        <div class="card bg-secondary-subtle p-3 mt-3">
            <h5>Health Restrictions:</h5>
            <p class="mb-1">Dietary: ${listOrNone(userData.dietaryRestrictions)}</p>
            <p class="mb-0">Allergies: ${listOrNone(userData.foodAllergies)}</p>
        </div>
    `;
}

// ---------- ORCHESTRATE: wires it together ----------
onAuthReady(async (user) => {
    const container = document.querySelector("#profile");
    container.textContent = "Loading...";

    try {
        const userData = await loadUserProfile(user);

        if (userData) {
            renderProfile(userData);
        } else {
            container.textContent = "No profile found.";
        }
    } catch (error) {
        console.error("Profile error:", error);
        container.textContent = "We couldn't load your profile. Please try again.";
    }
});