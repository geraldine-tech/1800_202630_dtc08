class SiteFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <nav class="navbar fixed-bottom border-top"
                 style="background-color: #183D2B;">
                <div class="container">
                    <div class="d-flex justify-content-around w-100">
                        <a href="favorite.html"
                           class="nav-link text-center text-white">
                            <i class="bi bi-heart fs-4 d-block"></i>
                            <small>Favorite</small>
                        </a>
                        <a href="main.html"
                           class="nav-link text-center text-white">
                            <i class="bi bi-egg-fried fs-4 d-block"></i>
                            <small>Meals</small>
                        </a>
                        <a href="profile.html"
                           class="nav-link text-center text-white">
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