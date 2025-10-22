
// Import services that main.js needs directly
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Import ALL cart functions needed
import { initializeCart, addToCart, getCart, clearCart, increaseQuantity, decreaseQuantity, removeFromCart } from './cart.js';

document.addEventListener("DOMContentLoaded", () => {

    const elements = {
        preloader: document.getElementById('preloader'),
        productsGrid: document.getElementById('product-list'),
        productsGridTitle: document.getElementById('products-grid-title'),
        searchInput: document.getElementById('search-input'),
        sortSelect: document.getElementById('sort-select'),
        siteHeader: document.querySelector('site-header'),
        // Modals
        allModals: document.querySelectorAll('.modal'),
        allCloseButtons: document.querySelectorAll('.close-button'),
        productDetailsModal: document.getElementById('product-details-modal'),
        productDetailsContent: document.getElementById('product-details-content'),
        cartItemsContainer: document.getElementById('cart-items'),
        // Checkout Form
        checkoutBtn: document.getElementById('whatsapp-checkout-btn'),
        customerName: document.getElementById('customer-name'),
        customerPhone: document.getElementById('customer-phone'),
        paymentMethod: document.getElementById('payment-method'),
    };

    let allProducts = [];
    let currentCategory = 'all';

    async function init() {
        initializeCart();
        setupEventListeners();
        await fetchAllProducts();
    }

    function hidePreloader() {
        if (elements.preloader) elements.preloader.style.display = 'none';
    }

    async function fetchAllProducts() {
        if (!elements.productsGrid) return;
        elements.productsGrid.innerHTML = '<div class="loader"></div>';
        try {
            const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(productsQuery);
            allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            filterAndRenderProducts();
        } catch (error) {
            console.error("Error fetching products:", error);
            elements.productsGrid.innerHTML = '<p style="color: var(--danger-red);">حدث خطأ أثناء تحميل المنتجات.</p>';
        } finally {
            hidePreloader();
        }
    }

    function filterAndRenderProducts() {
        const searchTerm = elements.searchInput ? elements.searchInput.value.toLowerCase().trim() : '';
        const sortValue = elements.sortSelect ? elements.sortSelect.value : 'latest';
        let filtered = [...allProducts];

        if (currentCategory !== 'all') {
            filtered = filtered.filter(p => p.category === currentCategory);
        }
        if (searchTerm) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm));
        }
        if (sortValue === 'price-asc') {
            filtered.sort((a, b) => getFinalPrice(a) - getFinalPrice(b));
        } else if (sortValue === 'price-desc') {
            filtered.sort((a, b) => getFinalPrice(b) - getFinalPrice(a));
        }

        renderProducts(filtered);
    }
    
    function renderProducts(productsToRender) {
        if (!elements.productsGrid) return;
        elements.productsGrid.innerHTML = '';
        if (productsToRender.length === 0) {
            elements.productsGrid.innerHTML = '<p>لا توجد منتجات تطابق بحثك.</p>';
            return;
        }
        productsToRender.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.dataset.id = product.id;
            productCard.innerHTML = `
                <div class="product-image-container"><img src="${product.imageUrl || 'https://via.placeholder.com/300'}" alt="${product.name}" class="product-image" loading="lazy"></div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price-container">${getPriceHTML(product)}</div>
                    <button class="add-to-cart-btn" data-id="${product.id}" ${product.stock <= 0 ? 'disabled' : ''}>${product.stock <= 0 ? 'نفدت الكمية' : '<i class="fas fa-shopping-cart"></i> أضف للسلة'}</button>
                </div>
            `;
            elements.productsGrid.appendChild(productCard);
        });
    }

    function showProductDetails(productId) {
        const product = allProducts.find(p => p.id === productId);
        if (!product) return;

        elements.productDetailsContent.innerHTML = `
            <span class="close-button">&times;</span>
            <div class="product-details-layout">
                <div class="product-details-image-container">
                    <img src="${product.imageUrl || 'https://via.placeholder.com/400'}" alt="${product.name}" class="product-details-image">
                </div>
                <div class="product-details-info">
                    <h2 class="product-details-title">${product.name}</h2>
                    <div class="product-price-container">${getPriceHTML(product)}</div>
                    <p class="product-details-description">${product.description || 'لا يتوفر وصف لهذا المنتج حاليًا.'}</p>
                    <button class="add-to-cart-btn details-add-to-cart" data-id="${product.id}" ${product.stock <= 0 ? 'disabled' : ''}>
                        ${product.stock <= 0 ? 'نفدت الكمية' : '<i class="fas fa-shopping-cart"></i> أضف إلى السلة'}
                    </button>
                </div>
            </div>
        `;
        elements.productDetailsModal.style.display = 'block';

        const newCloseButton = elements.productDetailsContent.querySelector('.close-button');
        newCloseButton.addEventListener('click', () => elements.productDetailsModal.style.display = 'none');
        
        const newAddToCartBtn = elements.productDetailsContent.querySelector('.details-add-to-cart');
        if(newAddToCartBtn) {
            newAddToCartBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleAddToCart(product.id, false); // false = don't open cart again
                // Optionally, give user feedback
                newAddToCartBtn.textContent = 'تمت الإضافة!';
                setTimeout(() => { 
                    elements.productDetailsModal.style.display = 'none';
                    newAddToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> أضف إلى السلة';
                }, 1000);
            });
        }
    }

    const getFinalPrice = (p) => (p.discountPrice > 0 && p.discountPrice < p.price) ? p.discountPrice : p.price;

    function getPriceHTML(product) {
        const price = parseFloat(product.price);
        const discountPrice = product.discountPrice ? parseFloat(product.discountPrice) : 0;
        if (discountPrice > 0 && discountPrice < price) {
            return `<div class="product-price"><span class="discount-price">${discountPrice.toFixed(2)} ج.م</span><span class="original-price">${price.toFixed(2)} ج.م</span></div>`;
        }
        return `<div class="product-price single-price">${price.toFixed(2)} ج.م</div>`;
    }

    function handleAddToCart(productId, openCartModal = true) {
        const product = allProducts.find(p => p.id === productId);
        if (!product || product.stock <= 0) return;
        const productDataForCart = { id: product.id, title: product.name, price: getFinalPrice(product), image: product.imageUrl, stock: product.stock };
        addToCart(productDataForCart);
        if (openCartModal) {
            document.getElementById('cart-modal').style.display = 'block';
        }
    }

    function handleWhatsAppCheckout() {
        const name = elements.customerName.value.trim();
        const phone = elements.customerPhone.value.trim();
        const payment = elements.paymentMethod.value;
        const cart = getCart();

        if (!name || !phone || !payment) {
            alert('يرجى إدخال جميع البيانات: الاسم، رقم الهاتف، وطريقة الدفع.');
            return;
        }
        if (cart.length === 0) {
            alert('سلة التسوق فارغة!');
            return;
        }

        const storePhoneNumber = '201090350339'; // Replace with the actual store WhatsApp number
        let message = `*طلب جديد من متجر دار اللغات* ✨\n\n`;
        message += `*العميل:* ${name}\n`;
        message += `*رقم الهاتف:* ${phone}\n`;
        message += `*طريقة الدفع:* ${payment}\n\n`;
        message += '-------------------------------------\n';
        message += '*المنتجات المطلوبة:*\n';

        let totalPrice = 0;
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            message += `🔹 ${item.title} (الكمية: ${item.quantity}) - ${itemTotal.toFixed(2)} ج.م\n`;
            totalPrice += itemTotal;
        });

        message += '-------------------------------------\n';
        message += `*الإجمالي: ${totalPrice.toFixed(2)} ج.م*\n\n`;
        message += `شكراً لثقتكم في دار اللغات! سنقوم بالتواصل معكم لتأكيد الطلب.`;

        const whatsappUrl = `https://wa.me/${storePhoneNumber}?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');
        
        // Clear cart and form after successful order submission
        clearCart();
        elements.customerName.value = '';
        elements.customerPhone.value = '';
        elements.paymentMethod.value = '';
        document.getElementById('cart-modal').style.display = 'none';
    }

    function setupEventListeners() {
        customElements.whenDefined('site-header').then(() => {
            const headerShadowRoot = elements.siteHeader.shadowRoot;
            if (headerShadowRoot) {
                headerShadowRoot.querySelectorAll('.nav-category-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        currentCategory = btn.dataset.category;
                        if (elements.productsGridTitle) {
                            elements.productsGridTitle.textContent = btn.textContent.trim();
                        }
                        filterAndRenderProducts();
                    });
                });
            }
        });

        if (elements.productsGrid) {
            elements.productsGrid.addEventListener('click', (e) => {
                const cartButton = e.target.closest('.add-to-cart-btn');
                if (cartButton) {
                    e.stopPropagation();
                    handleAddToCart(cartButton.dataset.id);
                    return;
                }
                const card = e.target.closest('.product-card');
                if (card) {
                    showProductDetails(card.dataset.id);
                }
            });
        }

        // Event delegation for cart item controls
        if(elements.cartItemsContainer) {
            elements.cartItemsContainer.addEventListener('click', (e) => {
                const target = e.target;
                const id = target.dataset.id;
                if (!id) return;

                if (target.classList.contains('increase-qty')) {
                    increaseQuantity(id);
                } else if (target.classList.contains('decrease-qty')) {
                    decreaseQuantity(id);
                } else if (target.classList.contains('remove-item-btn')) {
                    removeFromCart(id);
                }
            });
        }
        
        if (elements.searchInput) elements.searchInput.addEventListener('input', filterAndRenderProducts);
        if (elements.sortSelect) elements.sortSelect.addEventListener('change', filterAndRenderProducts);
        if (elements.checkoutBtn) elements.checkoutBtn.addEventListener('click', handleWhatsAppCheckout);

        elements.allModals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.style.display = 'none';
            });
        });
        elements.allCloseButtons.forEach(button => {
            button.addEventListener('click', () => button.closest('.modal').style.display = 'none');
        });
    }

    init();
});
