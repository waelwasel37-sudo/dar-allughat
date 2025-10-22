
// --- cart.js (Simplified for LocalStorage only) ---

let cart = [];
const CART_STORAGE_KEY = 'dar_allughat_cart';

// --- Core Utility Functions ---

const saveCart = () => {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
        console.error("Error saving cart to local storage:", e);
    }
};

const updateAndSave = () => {
    saveCart();
    updateUI();
};

// --- Public API --- 

export const getCart = () => {
    return [...cart]; // Return a copy
};

export const initializeCart = () => {
    try {
        const localData = localStorage.getItem(CART_STORAGE_KEY);
        cart = localData ? JSON.parse(localData) : [];
    } catch (e) {
        console.error("Error reading cart from local storage:", e);
        cart = [];
    }
    updateUI();
};

export const addToCart = (product, quantity = 1) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        // Ensure we don't exceed stock
        const newQuantity = existingItem.quantity + quantity;
        existingItem.quantity = Math.min(newQuantity, existingItem.stock);
    } else {
        cart.push({ ...product, quantity });
    }
    updateAndSave();
};

export const increaseQuantity = (productId) => {
    const item = cart.find(i => i.id === productId);
    if (item && item.quantity < item.stock) {
        item.quantity++;
        updateAndSave();
    }
};

export const decreaseQuantity = (productId) => {
    const item = cart.find(i => i.id === productId);
    if (item && item.quantity > 1) {
        item.quantity--;
        updateAndSave();
    } else if (item && item.quantity === 1) {
        // If quantity is 1, decreasing removes the item
        removeFromCart(productId);
    }
};

export const removeFromCart = (productId) => {
    cart = cart.filter(i => i.id !== productId);
    updateAndSave();
};

export const clearCart = () => {
    cart = [];
    updateAndSave();
};

// --- UI Update Function --- 

export const updateUI = () => {
    // Update Header Cart Count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const header = document.querySelector('site-header');
    if (header && header.shadowRoot) {
        header.shadowRoot.querySelectorAll('#cart-count, #mobile-cart-count').forEach(el => {
            el.textContent = totalItems;
            el.style.display = totalItems > 0 ? 'flex' : 'none';
        });
    }

    // Update Cart Modal
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('whatsapp-checkout-btn');

    if (cartItemsContainer && cartTotalElement) {
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-message">سلتك فارغة حالياً.</p>';
            if(checkoutBtn) checkoutBtn.disabled = true;
        } else {
            if(checkoutBtn) checkoutBtn.disabled = false;
            cart.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                itemElement.innerHTML = `
                    <img src="${item.image || 'https://via.placeholder.com/80'}" alt="${item.title}" class="cart-item-image">
                    <div class="cart-item-details">
                        <p class="cart-item-title">${item.title}</p>
                        <p class="cart-item-price">${item.price.toFixed(2)} ج.م</p>
                        <div class="quantity-controls">
                            <button class="quantity-btn decrease-qty" data-id="${item.id}">-</button>
                            <span class="item-quantity">${item.quantity}</span>
                            <button class="quantity-btn increase-qty" data-id="${item.id}">+</button>
                        </div>
                    </div>
                    <button class="remove-item-btn" data-id="${item.id}" aria-label="Remove item">&times;</button>
                `;
                cartItemsContainer.appendChild(itemElement);
            });
        }

        // Update Total Price
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalElement.innerHTML = `<span>الإجمالي:</span> <strong>${totalPrice.toFixed(2)} ج.م</strong>`;
    }
};
