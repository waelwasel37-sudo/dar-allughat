
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { isCartOpen, closeCart, cartItems, totalPrice, updateQuantity, removeFromCart } = useCart();

  if (!isCartOpen) {
    return null; // Don't render anything if the cart is closed
  }

  return (
    <div id="cart-modal" className="modal-overlay is-visible">
      <div className="cart-modal-content">
        <header className="cart-header">
          <h2>عربة التسوق</h2>
          <button id="close-cart-btn" className="close-btn" onClick={closeCart}>
            <i className="fas fa-times"></i>
          </button>
        </header>

        <div id="cart-items-container" className="cart-items">
          {cartItems.length === 0 ? (
            <p className="empty-cart-message">عربة التسوق فارغة.</p>
          ) : (
            cartItems.map(item => (
              <div className="cart-item" key={item.id}>
                <img src={item.imageUrl} alt={item.name} className="cart-item-image" />
                <div className="cart-item-details">
                  <h3>{item.name}</h3>
                  <p>{item.price} جنيه</p>
                  <div className="quantity-controls">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                </div>
                <button className="remove-item-btn" onClick={() => removeFromCart(item.id)}>
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))
          )}
        </div>

        <footer className="cart-footer">
          <div id="cart-total" className="cart-total">
            <strong>الإجمالي:</strong> {totalPrice.toFixed(2)} جنيه
          </div>
          <button id="checkout-btn" className="checkout-button" disabled={cartItems.length === 0}>
            إتمام الشراء
          </button>
        </footer>
      </div>
    </div>
  );
}
