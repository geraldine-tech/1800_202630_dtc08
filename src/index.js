
import { db } from "./firebaseConfig.js";
import { requireAuth } from "./authentication.js";
import { doc, getDoc } from "firebase/firestore";

async function checkUserProfile(user) {
    const loginPrompt = document.querySelector("#loginPrompt")
    const userSnapshot = await getDoc(doc(db, "users", user.uid));
    userSnapshot.exists() ? setVisible(loginPrompt, false) : setVisible(loginPrompt, true);
}

function setVisible(el, visible) {
    el.classList?.toggle('d-none', !visible)
}

requireAuth(async (user) => {
    checkUserProfile(user)
})