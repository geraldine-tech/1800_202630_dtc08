
import { auth, db } from "/src/firebaseConfig.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "firebase/firestore";

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    signOut
} from "firebase/auth";

// Register a new user.
export async function signupUser(name, email, password) {

    // Create the user's Firebase Authentication account.
    const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

    const user = userCredential.user;

    // Save the user's name in Firebase Authentication.
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

        favorites: [],

        createdAt: serverTimestamp()
    });

    return user;
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

// Log out the user.
export async function logoutUser() {

    await signOut(auth);

    window.location.href = "index.html";
}

// Check when the user's login status changes.
export function onAuthReady(callback) {

    return onAuthStateChanged(auth, callback);
}

// Check if a user is logged in before opening a page.
export function requireAuth(callback) {

    return onAuthStateChanged(auth, (user) => {

        if (!user) {
            window.location.href = "login.html";
            return;
        }

        callback(user);
    });
}

// Show a friendly message when Firebase returns an error.
export function authErrorMessage(error) {

    const code = error.code;

    if (code === "auth/invalid-credential") {
        return "Wrong email or password.";
    }

    if (code === "auth/invalid-email") {
        return "Please enter a valid email address.";
    }

    if (code === "auth/email-already-in-use") {
        return "This email is already registered.";
    }

    if (code === "auth/weak-password") {
        return "Your password must contain at least 6 characters.";
    }

    if (code === "auth/too-many-requests") {
        return "Too many attempts. Try again later.";
    }

    if (code === "auth/network-request-failed") {
        return "Network error. Please try again.";
    }

    return "Something went wrong. Please try again.";
}
