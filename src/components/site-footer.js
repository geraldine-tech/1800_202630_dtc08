
class SiteFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <nav class="navbar fixed-bottom bg-success-subtle border-top">
                <div class="container">
                    <div class="d-flex justify-content-around w-100">

                        <a href="index.html" class="nav-link text-center">
                            <i class="bi bi-house-door fs-4 d-block"></i>
                            <small>Home</small>
                        </a>

                        <a href="favorites.html" class="nav-link text-center">
                            <i class="bi bi-bookmark fs-4 d-block"></i>
                            <small>Saved</small>
                        </a>

                        <a href="learn.html" class="nav-link text-center">
                            <i class="bi bi-book-half fs-4 d-block"></i>
                            <small>Learn</small>
                        </a>

                        <a href="profile.html" class="nav-link text-center">
                            <i class="bi bi-person-circle fs-4 d-block"></i>
                            <small>Profile</small>
                        </a>

                    </div>
                </div>
            </nav>

            <footer class="text-center py-3 mb-5">
                <small class="text-secondary">
                    &copy; 2026 AffordableEats. All rights reserved.
                </small>
            </footer>
        `;
    }
}

customElements.define("site-footer", SiteFooter);
