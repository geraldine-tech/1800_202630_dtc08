
import { db } from "./firebaseConfig.js";
import { onAuthReady } from "./authentication.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";

// Fields stored in Firestore
const fields = [
    "name",
    "dailyBudget",
    "foodAllergies",
    "dietaryRestrictions",
    "nutritionalNeeds"
];

// These fields are arrays
const listFields = [
    "foodAllergies",
    "dietaryRestrictions",
    "nutritionalNeeds"
];

let currentUser = null;
let originalProfile = {};

// Get the user's profile from Firestore
async function loadUserProfile(user) {
    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
        return userSnapshot.data();
    }

    return null;
}

// Display the profile page
function renderProfile() {
    const container = document.querySelector("#profile");

    container.innerHTML = `
        <div class="text-center pt-3 mb-4">
            <div id="avatar"
                class="rounded-circle mx-auto d-flex align-items-center justify-content-center fw-bold"
                style="width: 100px; height: 100px; background-color: #DDE8D5; color: #245B4A; font-size: 2.5rem;">
            </div>

            <h2 id="profileName" class="mt-3 fw-bold" style="color: #245B4A;"></h2>
            <p id="profileEmail" class="text-secondary"></p>
            <p class="text-secondary">Manage your personal information and food preferences.</p>
        </div>

        <div id="profileAlert" class="alert d-none mx-3" role="alert"></div>

        <form id="profileForm" class="px-3">

            <div class="mb-4">
                <h5 class="fw-bold mb-3" style="color: #245B4A;">Personal Information</h5>

                <div class="mb-3">
                    <label for="nameInput" class="form-label fw-semibold">Full Name</label>
                    <input type="text" class="form-control" id="nameInput" required disabled>
                </div>

                <div class="mb-3">
                    <label for="emailInput" class="form-label fw-semibold">Email Address</label>
                    <input type="email" class="form-control" id="emailInput" disabled>
                </div>
            </div>

            <div class="mb-4">
                <h5 class="fw-bold mb-3" style="color: #245B4A;">Daily Food Budget</h5>

                <label for="dailyBudgetInput" class="form-label fw-semibold">Daily Budget ($)</label>
                <input type="number" class="form-control" id="dailyBudgetInput"
                    min="0" step="0.01" required disabled>

                <small class="text-secondary">Set the amount you want to spend on food each day.</small>
            </div>

            <div class="rounded-3 p-3 mb-4" style="background-color: #DDE8D5;">
                <h5 class="fw-bold mb-3" style="color: #245B4A;">Food & Nutrition Preferences</h5>

                <div class="mb-3">
                    <label for="foodAllergiesInput" class="form-label fw-semibold">Food Allergies</label>
                    <input type="text" class="form-control" id="foodAllergiesInput"
                        placeholder="e.g. Peanuts, dairy, seafood" disabled>
                    <small class="text-secondary">Separate each item with a comma.</small>
                </div>

                <div class="mb-3">
                    <label for="dietaryRestrictionsInput" class="form-label fw-semibold">Dietary Restrictions</label>
                    <input type="text" class="form-control" id="dietaryRestrictionsInput"
                        placeholder="e.g. Vegetarian, vegan, gluten-free" disabled>
                    <small class="text-secondary">Separate each item with a comma.</small>
                </div>

                <div class="mb-0">
                    <label for="nutritionalNeedsInput" class="form-label fw-semibold">Nutrition Goals</label>
                    <input type="text" class="form-control" id="nutritionalNeedsInput"
                        placeholder="e.g. High Protein, High Fiber" disabled>
                    <small class="text-secondary">Separate each goal with a comma.</small>
                </div>
            </div>

            <div class="d-flex flex-wrap gap-2 mb-4">
                <button type="button" id="editBtn" class="btn"
                    style="background-color: #245B4A; color: white;">
                    Edit Profile
                </button>

                <button type="submit" id="saveBtn" class="btn"
                    style="background-color: #C9785D; color: white;" disabled>
                    Save Changes
                </button>

                <button type="button" id="cancelBtn" class="btn btn-outline-secondary" disabled>
                    Cancel
                </button>
            </div>
        </form>
    `;
}

// Display the user's name and email
function showHeader(name, email) {
    const displayName = name || "User";

    document.getElementById("avatar").textContent =
        displayName.charAt(0).toUpperCase();

    document.getElementById("profileName").textContent = displayName;
    document.getElementById("profileEmail").textContent = email || "";
}

// Fill the form with profile information
function populateProfile(profile) {
    fields.forEach(field => {
        const input = document.getElementById(field + "Input");
        const value = profile[field];

        input.value = Array.isArray(value) ? value.join(", ") : (value ?? "");
    });

    document.getElementById("emailInput").value = currentUser.email || "";
}

// Enable or disable the form
function setFormDisabled(disabled) {
    fields.forEach(field => {
        document.getElementById(field + "Input").disabled = disabled;
    });

    document.getElementById("saveBtn").disabled = disabled;
    document.getElementById("cancelBtn").disabled = disabled;
    document.getElementById("editBtn").disabled = !disabled;
}

// Show a message
function showAlert(message, type) {
    const alertBox = document.getElementById("profileAlert");

    alertBox.textContent = message;
    alertBox.className = `alert alert-${type} mx-3 mt-3`;
}

// Hide the message
function hideAlert() {
    const alertBox = document.getElementById("profileAlert");

    alertBox.textContent = "";
    alertBox.classList.add("d-none");
}

// Edit profile
function enableEdit() {
    setFormDisabled(false);
    document.getElementById("nameInput").focus();
    hideAlert();
}

// Cancel changes
function cancelEdit() {
    populateProfile(originalProfile);
    setFormDisabled(true);
    hideAlert();
}

// Save profile changes
async function saveProfile(event) {
    event.preventDefault();

    const name = document.getElementById("nameInput").value.trim();
    const budget = document.getElementById("dailyBudgetInput").value;

    if (!name) {
        showAlert("Please enter your name.", "danger");
        return;
    }

    if (budget === "" || !Number.isFinite(Number(budget)) || Number(budget) < 0) {
        showAlert("Please enter a valid daily budget.", "danger");
        return;
    }

    const updates = {};

    fields.forEach(field => {
        const value = document.getElementById(field + "Input").value;

        if (listFields.includes(field)) {
            updates[field] = value.split(",").map(item => item.trim()).filter(item => item !== "");
        } else if (field === "dailyBudget") {
            updates[field] = Number(value);
        } else {
            updates[field] = value.trim();
        }
    });

    const saveBtn = document.getElementById("saveBtn");

    try {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";

        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, updates);

        originalProfile = updates;

        setFormDisabled(true);
        showHeader(updates.name, currentUser.email);
        showAlert("Your profile has been saved successfully!", "success");

    } catch (error) {
        console.error("Error saving profile:", error);
        showAlert("We couldn't save your profile. Please try again.", "danger");
        saveBtn.disabled = false;

    } finally {
        saveBtn.textContent = "Save Changes";
    }
}

// Load the profile when the user is logged in
onAuthReady(async (user) => {
    if (!user) {
        location.href = "index.html";
        return;
    }

    currentUser = user;

    const container = document.querySelector("#profile");

    if (!container) {
        return;
    }

    container.textContent = "Loading profile...";

    try {
        const userData = await loadUserProfile(user);

        if (!userData) {
            container.textContent = "No profile found.";
            return;
        }

        originalProfile = userData;

        renderProfile();
        showHeader(userData.name || user.displayName || user.email, user.email);
        populateProfile(userData);

        document.getElementById("editBtn").addEventListener("click", enableEdit);
        document.getElementById("cancelBtn").addEventListener("click", cancelEdit);
        document.getElementById("profileForm").addEventListener("submit", saveProfile);

    } catch (error) {
        console.error("Profile error:", error);
        container.textContent = "We couldn't load your profile. Please try again.";
    }
});
