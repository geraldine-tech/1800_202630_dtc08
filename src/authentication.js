
import { auth, db } from "/src/firebaseConfig.js";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    signOut
} from "firebase/auth";

// Register a new user and create their AffordableEats profile.
export async function signupUser(name, email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        const user = userCredential.user;

        await updateProfile(user, {
            displayName: name
        });

        // Create the user's profile in Firestore.
        const userRef = doc(db, "users", user.uid);

        await setDoc(userRef, {
            userID: user.uid,
            name: name,
            email: email,
            dailyBudget: 20,
            foodAllergies: [],
            nutritionalNeeds: [],
            dietaryRestrictions: [],
            createdAt: serverTimestamp()
        });

        return user;

    } catch (error) {
        console.error("Signup error:", error);
        throw error;
    }
}

// Log in an existing user.
export async function loginUser(email, password) {
    const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
    );

    return userCredential.user;
}

// Log out the current user.
export async function logoutUser() {
    await signOut(auth);
    window.location.href = "index.html";
}

// Listen for Firebase authentication changes.
export function onAuthReady(callback) {
    return onAuthStateChanged(auth, callback);
}

// Protect pages that require a signed-in user.
export function requireAuth(callback) {
    return onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = "login.html";
            return;
        }

        callback(user);
    });
}

// Display friendly Firebase error messages.
export function authErrorMessage(error) {
    const code = (error?.code || "").toLowerCase();

    const messages = {
        "auth/invalid-credential": "Wrong email or password.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/user-not-found": "No account found with that email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/too-many-requests": "Too many attempts. Try again later.",
        "auth/email-already-in-use": "This email is already registered.",
        "auth/weak-password": "Your password must contain at least 6 characters.",
        "auth/missing-password": "Please enter your password.",
        "auth/network-request-failed": "Network error. Please try again.",
        "permission-denied": "You do not have permission to access this information."
    };

    return messages[code] || "Something went wrong. Please try again.";
}
