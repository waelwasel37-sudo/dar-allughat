
class Header extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
            <style>
                /* Using :host to style the component itself */
                :host {
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                    display: block;
                }

                /* --- New Bright & Modern Header Styles --- */
                .main-header {
                    background-color: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border-bottom: 1px solid var(--light-gray, #ecf0f1);
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    padding: 0 5%;
                }

                .header-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    height: 70px;
                }

                .logo a {
                    color: var(--primary-blue, #3498db);
                    font-size: 1.8rem;
                    font-weight: 900;
                    text-decoration: none;
                }

                .desktop-nav { display: none; }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 1.2rem;
                }

                .action-icon {
                    color: var(--text-dark, #2c3e50);
                    text-decoration: none;
                    font-size: 1.3rem;
                    position: relative;
                    transition: color 0.3s;
                }
                .action-icon:hover { color: var(--primary-blue, #3498db); }

                #cart-count, #mobile-cart-count {
                    position: absolute;
                    top: -8px;
                    right: -12px;
                    background-color: var(--primary-green, #2ecc71);
                    color: white;
                    border-radius: 50%;
                    padding: 2px 6px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    border: 2px solid white;
                }
                
                #menu-toggle {
                    background: none;
                    border: none;
                    color: var(--text-dark, #2c3e50);
                    font-size: 1.6rem;
                    cursor: pointer;
                }

                /* --- Desktop Styles --- */
                @media (min-width: 992px) {
                    #menu-toggle { display: none; }
                    .desktop-nav { display: flex; gap: 1.5rem; }
                    .desktop-nav .nav-category-btn {
                        background: none; border: none;
                        font-family: var(--body-font, 'Cairo');
                        font-size: 1rem;
                        font-weight: 600;
                        color: #7f8c8d;
                        cursor: pointer;
                        padding: 5px 0;
                        position: relative;
                        transition: color 0.3s;
                    }
                    .desktop-nav .nav-category-btn::after {
                        content: '';
                        position: absolute;
                        bottom: 0; left: 0;
                        width: 0;
                        height: 2px;
                        background-color: var(--primary-blue, #3498db);
                        transition: width 0.3s ease-out;
                    }
                    .desktop-nav .nav-category-btn:hover, .desktop-nav .nav-category-btn.active {
                        color: var(--text-dark, #2c3e50);
                    }
                    .desktop-nav .nav-category-btn.active::after {
                        width: 100%;
                    }
                }

                /* --- Mobile Nav Panel --- */
                .mobile-nav {
                    display: block; /* Always in DOM, but positioned off-screen */
                    position: fixed;
                    top: 0; right: -300px;
                    width: 280px; height: 100%;
                    background: white;
                    box-shadow: -5px 0 20px rgba(0,0,0,0.1);
                    z-index: 3000;
                    padding-top: 20px;
                    transition: right 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                .mobile-nav.active { right: 0; }

                .mobile-nav-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid var(--light-gray, #ecf0f1);
                }
                .mobile-nav-header .logo {
                     font-size: 1.5rem; font-weight: 900; color: var(--primary-blue, #3498db);
                }

                #close-menu { background: none; border: none; font-size: 2rem; cursor: pointer; color: #95a5a6; transition: color 0.3s; }
                #close-menu:hover { color: var(--danger-red, #e74c3c); }

                .mobile-nav ul { list-style: none; padding: 1rem 0; margin: 0; }
                .mobile-nav ul li a, .mobile-nav ul li button {
                    display: flex; align-items: center; gap: 15px;
                    padding: 1rem 1.5rem;
                    color: #7f8c8d;
                    text-decoration: none;
                    font-size: 1.1rem;
                    font-weight: 600;
                    background: none; border: none; width: 100%; text-align: right;
                    font-family: var(--body-font, 'Cairo');
                    transition: color 0.3s, background-color 0.3s;
                }
                 .mobile-nav ul li a i, .mobile-nav ul li button i { width: 20px; }

                .mobile-nav ul li a:hover, .mobile-nav ul li button:hover,
                .mobile-nav ul li a.active, .mobile-nav ul li button.active {
                    color: var(--primary-blue, #3498db);
                    background-color: var(--bg-soft-accent, #F0F7F4);
                }

            </style>

            <header class="main-header">
                <div class="header-container">
                    <button id="menu-toggle" aria-label="Open menu"><i class="fas fa-bars"></i></button>
                    <div class="logo"><a href="/">دار اللغات</a></div>

                    <nav class="desktop-nav" id="main-nav-desktop">
                        <button class="nav-category-btn active" data-category="all">كل المنتجات</button>
                        <button class="nav-category-btn" data-category="external-books">كتب خارجية</button>
                        <button class="nav-category-btn" data-category="high-level-books">كتب مستوى</button>
                        <button class="nav-category-btn" data-category="skill-development-books">تنمية مهارات</button>
                        <button class="nav-category-btn" data-category="skill-development-games">ألعاب</button>
                        <button class="nav-category-btn" data-category="children-stories">قصص اطفال</button>
                        <button class="nav-category-btn" data-category="foundation-books">كتب تأسيس</button>
                        <button class="nav-category-btn" data-category="returned-books">كتب مرتجع</button>
                    </nav>

                    <div class="header-actions">
                        <a href="#" id="cart-icon-wrapper" class="action-icon" aria-label="عربة التسوق">
                            <i class="fas fa-shopping-cart"></i>
                            <span id="cart-count">0</span>
                        </a>
                        <a href="admin.html" class="action-icon" aria-label="لوحة التحكم" id="admin-link-desktop"><i class="fas fa-user-cog"></i></a>
                    </div>
                </div>
            </header>

            <nav id="mobile-nav-panel" class="mobile-nav">
                 <div class="mobile-nav-header">
                    <span class="logo">القائمة</span>
                    <button id="close-menu" aria-label="Close menu">&times;</button>
                 </div>
                 <ul>
                        <li><a href="admin.html"><i class="fas fa-user-cog"></i> لوحة التحكم</a></li>
                        <li><button class="nav-category-btn active" data-category="all"><i class="fas fa-home"></i> كل المنتجات</button></li>
                        <li><button class="nav-category-btn" data-category="external-books"><i class="fas fa-book"></i> كتب خارجية</button></li>
                        <li><button class="nav-category-btn" data-category="high-level-books"><i class="fas fa-layer-group"></i> كتب مستوى</button></li>
                        <li><button class="nav-category-btn" data-category="skill-development-books"><i class="fas fa-puzzle-piece"></i> تنمية مهارات</button></li>
                        <li><button class="nav-category-btn" data-category="skill-development-games"><i class="fas fa-gamepad"></i> ألعاب</button></li>
                        <li><button class="nav-category-btn" data-category="children-stories"><i class="fas fa-book-open"></i> قصص اطفال</button></li>
                        <li><button class="nav-category-btn" data-category="foundation-books"><i class="fas fa-pen-nib"></i> كتب تأسيس</button></li>
                        <li><button class="nav-category-btn" data-category="returned-books"><i class="fas fa-undo-alt"></i> كتب مرتجع</button></li>
                  </ul>
                  <div style="padding: 1rem 1.5rem;">
                      <p style="font-weight: 600; margin-bottom: 1rem;">تواصل معنا</p>
                       <div style="display: flex; gap: 1.5rem; font-size: 1.5rem;">
                          <a href="https://www.facebook.com/maktabat.dar.allughat/" target="_blank" aria-label="Facebook" class="action-icon"><i class="fab fa-facebook-f"></i></a>
                          <a href="https://t.me/+10C-njs5Xoo0ZDRk" target="_blank" aria-label="Telegram" class="action-icon"><i class="fab fa-telegram"></i></a>
                          <a href="https://chat.whatsapp.com/LoAtW84xgZr51vQAbSEw0E" target="_blank" aria-label="WhatsApp" class="action-icon"><i class="fab fa-whatsapp"></i></a>
                      </div>
                  </div>
            </nav>
        `;
    }

    connectedCallback() {
        const cartIconWrapper = this.shadowRoot.getElementById('cart-icon-wrapper');
        const cartModal = document.getElementById('cart-modal');
        const openCart = (e) => {
            e.preventDefault();
            if (cartModal) cartModal.style.display = 'block';
        };
        if(cartIconWrapper) cartIconWrapper.addEventListener('click', openCart);

        // Mobile menu controls
        const menuToggle = this.shadowRoot.getElementById('menu-toggle');
        const closeMenu = this.shadowRoot.getElementById('close-menu');
        const mobileNavPanel = this.shadowRoot.getElementById('mobile-nav-panel');
        if(menuToggle) menuToggle.addEventListener('click', () => mobileNavPanel.classList.add('active'));
        if(closeMenu) closeMenu.addEventListener('click', () => mobileNavPanel.classList.remove('active'));

        // Category switching
        const allCategoryButtons = this.shadowRoot.querySelectorAll('.nav-category-btn');
        allCategoryButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Close mobile nav on selection
                mobileNavPanel.classList.remove('active');
                // Update active state for all buttons
                allCategoryButtons.forEach(b => b.classList.remove('active'));
                this.shadowRoot.querySelectorAll(`.nav-category-btn[data-category="${btn.dataset.category}"]`).forEach(b => b.classList.add('active'));
            });
        });
    }
}

customElements.define('site-header', Header);
