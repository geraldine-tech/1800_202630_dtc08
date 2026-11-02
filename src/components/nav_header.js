class Header extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
    <nav class="navbar navbar-expand-sm bg-success-subtle" aria-label="Main navigation">
        <div class="container-fluid">

            <!-- Logo and Brand -->
            <a class="navbar-brand" href="index.html">
                <img src="images/healthy.jpg" height="36" alt="Healthy Eating logo">
                Healthy Eating
            </a>

            <!-- Navbar Links and Search -->
            <div class="collapse navbar-collapse" id="navbarSupportedContent">
                <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                    <li class="nav-item">
                        <a class="nav-link active" aria-current="page" href="index.html">Home</a>
                    </li>
                </ul>

                <!-- Search Bar -->
                <form class="d-flex" role="search">
                    <input class="form-control me-2" type="search" placeholder="Search meals..." aria-label="Search">
                    <button class="btn btn-outline-dark" type="submit">
                        Search
                    </button>
                </form>
            </div>
    </nav>
        `;
    }
}

customElements.define("nav-header", Header);