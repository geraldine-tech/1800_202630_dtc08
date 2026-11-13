
import { logoutUser, onAuthReady } from "/src/authentication.js";

class SiteNavbar extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <nav class="navbar navbar-expand-lg bg-success-subtle">
                <div class="container">
                    <a class="navbar-brand fw-bold text-success" href="index.html">
                        <img src="/images/healthy-eating-logo-transparent.png"
                        height="55"
                             alt="AffordableEats logo"
                             class="me-2">
                        AffordableEats
                    </a>

                    <button class="navbar-toggler"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#mainNavbar">
                        <span class="navbar-toggler-icon"></span>
                    </button>

                    <div class="collapse navbar-collapse" id="mainNavbar">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item">
                                <a class="nav-link" href="index.html">Home</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="main.html">Meals</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="favorite.html">Favorites</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="learn.html">Learn</a>
                            </li>
                        </ul>

                        <div id="authControls">
                            <span class="text-secondary">Loading...</span>
                        </div>
                    </div>
                </div>
            </nav>
        `;

        const authControls = this.querySelector("#authControls");

        this.unsubscribe = onAuthReady((user) => {
            if (user) {
                authControls.innerHTML = `
                    <div class="d-flex align-items-center gap-2">
                        <span class="small">
                            Hello, ${this.escapeText(user.displayName || user.email)}
                        </span>
                        <button class="btn btn-outline-success btn-sm"
                                id="signOutBtn">
                            Log out
                        </button>
                    </div>
                `;

                this.querySelector("#signOutBtn")
                    .addEventListener("click", logoutUser);

            } else {
                authControls.innerHTML = `
                    <a href="login.html" class="btn btn-success btn-sm">
                        Log in / Sign up
                    </a>
                `;
            }
        });
    }

    escapeText(value) {
        const div = document.createElement("div");
        div.textContent = value;
        return div.innerHTML;
    }

    disconnectedCallback() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}

customElements.define("site-navbar", SiteNavbar);
