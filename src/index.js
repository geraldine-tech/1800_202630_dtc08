import { db } from "./firebaseConfig.js";
import { onAuthReady } from "./authentication.js";
import { doc, getDoc } from "firebase/firestore";

function setVisible(el, visible) {
    el?.classList.toggle("d-none", !visible);
}

async function checkUserProfile(user) {
    const loginPrompt = document.querySelector("#loginPrompt");

    // Logged out: show the prompt and stop. No Firestore call.
    if (!user) {
        setVisible(loginPrompt, true);
        return;
    }

    // Logged in: show the prompt only if there's no profile document
    const userSnapshot = await getDoc(doc(db, "users", user.uid));
    setVisible(loginPrompt, !userSnapshot.exists());
}

onAuthReady(async (user) => {
    try {
        await checkUserProfile(user);
    } catch (error) {
        console.error("Profile check failed:", error);
    }
});