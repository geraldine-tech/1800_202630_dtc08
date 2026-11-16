import { db } from "./firebaseConfig.js";
import { requireAuth, onAuthReady } from "./authentication.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";

// The fields we store in Firestore (email comes from Auth, not from here)
const fields = ["name", "dailyBudget", "dietaryRestrictions", "foodAllergies"];
// These two are arrays in Firestore, shown in the form as comma-separated text
const listFields = ["dietaryRestrictions", "foodAllergies"];
let currentUser = null;

// ---------- FETCH: gets data, touches no HTML ----------
async function loadUserProfile(user) {
    const userSnapshot = await getDoc(doc(db, "users", user.uid));
    return userSnapshot.exists() ? userSnapshot.data() : null;
}

// ---------- RENDER: takes data, touches no Firebase ----------
function renderProfile() {
    const container = document.querySelector("#profile");

    container.innerHTML = `
        <div class="text-center pt-2">
            <div id="avatar"
                 class="rounded-circle bg-secondary-subtle mx-auto d-flex align-items-center justify-content-center display-1"
                 style="width: 200px; height: 200px;"></div>
            <h1 id="profileName" class="mt-3"></h1>
        </div>

        <div id="profileAlert" class="alert alert-success d-none mx-3 mt-3"></div>

        <form id="profileForm" class="px-3">
            <p id="profileEmail" class="mt-4"></p>

            <div class="mb-3">
                <label for="nameInput" class="form-label">Name</label>
                <input type="text" class="form-control" id="nameInput" disabled>
            </div>

            <div class="mb-3">
                <label for="dailyBudgetInput" class="form-label">Daily budget ($)</label>
                <input type="number" min="0" class="form-control" id="dailyBudgetInput" disabled>
            </div>

            <div class="card bg-secondary-subtle p-3 mt-3">
                <h5>Health Restrictions:</h5>
                <div class="mb-2">
                    <label for="dietaryRestrictionsInput" class="form-label">Dietary (separate with commas)</label>
                    <input type="text" class="form-control" id="dietaryRestrictionsInput" disabled>
                </div>
                <div class="mb-0">
                    <label for="foodAllergiesInput" class="form-label">Allergies (separate with commas)</label>
                    <input type="text" class="form-control" id="foodAllergiesInput" disabled>
                </div>
            </div>

            <div class="mt-3 mb-4">
                <button type="button" id="editBtn" class="btn btn-secondary">Edit</button>
                <button type="submit" id="saveBtn" class="btn btn-primary" disabled>Save</button>
            </div>
        </form>
    `;
}

// Fill the header: first letter in the circle, name, email
function showHeader(name, email) {
    document.getElementById("avatar").textContent = name.charAt(0).toUpperCase(); //Get the first letter of the name in uppercase (e.g. "elmo" → "E")
    document.getElementById("profileName").textContent = name;
    document.getElementById("profileEmail").textContent = email;
}

// ---------- EDIT: What to do when Edit is clicked ----------
function enableEdit() {
    fields.forEach(field => document.getElementById(field + "Input").disabled = false);
    document.getElementById("saveBtn").disabled = false;
    document.getElementById("nameInput").focus();
}

// ---------- SAVE: What to do when the profile form is submitted ----------
async function saveProfile(event) {
    event.preventDefault();

    // Build an object from the inputs: { name: "...", dailyBudget: 20, dietaryRestrictions: [...], ... }
    const updates = {};
    fields.forEach(field => {
        const value = document.getElementById(field + "Input").value;

        if (listFields.includes(field)) {
            // "vegan, gluten-free" -> ["vegan", "gluten-free"]
            updates[field] = value.split(",").map(item => item.trim()).filter(Boolean);
        } else if (field === "dailyBudget") {
            updates[field] = value === "" ? "" : Number(value);
        } else {
            updates[field] = value;
        }
    });

    try {
        await updateDoc(doc(db, "users", currentUser.uid), updates);

        // Lock the form again, refresh the header, show a confirmation
        fields.forEach(field => document.getElementById(field + "Input").disabled = true);
        document.getElementById("saveBtn").disabled = true;
        showHeader(updates.name || "Unknown", currentUser.email);
        const alertBox = document.getElementById("profileAlert");
        alertBox.textContent = "Profile saved!";
        alertBox.classList.remove("d-none");
    } catch (error) {
        alert(`Error saving profile:\n${error.code || ""}\n${error.message || error}`);
    }
}

// ---------- ORCHESTRATE: wires it together ----------
onAuthReady(async (user) => {
    if (!user) {
        location.href = "index.html";
        return;
    }
    currentUser = user;

    const container = document.querySelector("#profile");
    container.textContent = "Loading...";

    try {
        const userData = await loadUserProfile(user);

        if (userData) {
            renderProfile();

            // Header: avatar initial, name, email
            showHeader(userData.name || user.displayName || user.email, user.email);

            // Pre-populate each input (empty string if the field doesn't exist yet)
            fields.forEach(field => {
                const value = userData[field];
                document.getElementById(field + "Input").value =
                    Array.isArray(value) ? value.join(", ") : (value ?? "");
            });

            // Connect the Edit button and the form
            document.getElementById("editBtn").addEventListener("click", enableEdit);
            document.getElementById("profileForm").addEventListener("submit", saveProfile);
        } else {
            container.textContent = "No profile found.";
        }
    } catch (error) {
        console.error("Profile error:", error);
        container.textContent = "We couldn't load your profile. Please try again.";
    }
});