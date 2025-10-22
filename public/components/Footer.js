
class Footer extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <footer>
                <div class="footer-container">
                    <div class="footer-section about">
                        <h3>عن دار اللغات</h3>
                        <p>نحن متخصصون في توفير أفضل المواد التعليمية والترفيهية للأطفال، لمساعدتهم على التعلم والنمو بمتعة وإبداع.</p>
                    </div>
                    <div class="footer-section links">
                        <h3>روابط سريعة</h3>
                        <ul>
                            <li><a href="#products-section">المنتجات</a></li>
                        </ul>
                    </div>
                    <div class="footer-section contact">
                        <h3>تواصل معنا</h3>
                        <p><i class="fab fa-whatsapp"></i> <a href="https://wa.me/201090350339" target="_blank">+20 109 035 0339</a></p>
                        <p><i class="fas fa-envelope"></i> <a href="mailto:info@darallughat.com">info@darallughat.com</a></p>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>&copy; 2024 دار اللغات. جميع الحقوق محفوظة.</p>
                </div>
            </footer>
        `;
    }

    connectedCallback() {
        const productsLink = this.querySelector('a[href="#products-section"]');
        if(productsLink) {
            productsLink.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = document.getElementById('products-section');
                if(targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    }
}

customElements.define('site-footer', Footer);
