
console.log("loginSignup.js has loaded");

import {
    loginUser,
    signupUser,
    authErrorMessage
} from "./authentication.js";

function initAuthUI() {
    const alertEl = document.getElementById("authAlert");
    const loginView = document.getElementById("loginView");
    const signupView = document.getElementById("signupView");

    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    const toSignup = document.getElementById("toSignup");
    const toLogin = document.getElementById("toLogin");

    if (!loginForm || !signupForm) return;

    let errorTimeout;

    // Display an error message.
    function showError(message) {
        alertEl.textContent = message;
        alertEl.classList.remove("d-none");

        clearTimeout(errorTimeout);

        errorTimeout = setTimeout(() => {
            alertEl.classList.add("d-none");
        }, 5000);
    }

    // Clear the error message.
    function hideError() {
        alertEl.classList.add("d-none");
        alertEl.textContent = "";

        clearTimeout(errorTimeout);
    }

    // Switch from login to signup.
    toSignup.addEventListener("click", (event) => {
        event.preventDefault();

        hideError();

        loginView.classList.add("d-none");
        signupView.classList.remove("d-none");
    });

    // Switch from signup to login.
    toLogin.addEventListener("click", (event) => {
        event.preventDefault();

        hideError();

        signupView.classList.add("d-none");
        loginView.classList.remove("d-none");
    });

    // Handle login form submission.
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        hideError();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        const button = loginForm.querySelector("button[type='submit']");
        button.disabled = true;

        try {
            await loginUser(email, password);

            window.location.href = "main.html";

        } catch (error) {
            showError(authErrorMessage(error));
            console.error("Login error:", error);

        } finally {
            button.disabled = false;
        }
    });

    // Handle signup form submission.
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        hideError();

        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;

        if (!name) {
            showError("Please enter your name.");
            return;
        }

        if (password.length < 6) {
            showError("Your password must contain at least 6 characters.");
            return;
        }

        const button = signupForm.querySelector("button[type='submit']");
        button.disabled = true;

        try {
            console.log("Signup button submitted");

            // Create the account and save the user's Firestore profile.
            await signupUser(name, email, password);

            console.log("Signup completed successfully.");

            // Redirect only after signupUser() finishes.
            
window.location.href = "main.html";
        } catch (error) {
            showError(authErrorMessage(error));
            console.error("Signup error:", error);

        } finally {
            button.disabled = false;
        }
    });
}

document.addEventListener("DOMContentLoaded", initAuthUI);
