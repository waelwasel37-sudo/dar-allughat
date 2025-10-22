
import Link from 'next/link';
import { useCart } from '../context/CartContext';

export default function Header() {
  // Get cart count and the function to open the cart
  const { cartCount, openCart } = useCart(); 

  return (
    <header className="main-header">
      <div className="logo-container">
        <Link href="/">
          <a>
            <img src="/logo.png" alt="Dar Allughat Logo" className="logo-img" />
            <span className="logo-text">دار اللغات</span>
          </a>
        </Link>
      </div>
      <nav className="main-nav">
        <ul>
          <li><Link href="/"><a>الرئيسية</a></Link></li>
          <li><Link href="#products-section"><a>المنتجات</a></Link></li>
          <li><a href="#">نبذة عنا</a></li>
          <li><a href="#">اتصل بنا</a></li>
        </ul>
      </nav>
      <div className="header-actions">
        <button className="action-btn search-btn"><i className="fas fa-search"></i></button>
        {/* Updated cart button to open the cart modal */}
        <button id="cart-button" className="action-btn cart-btn" onClick={openCart}>
          <i className="fas fa-shopping-cart"></i>
          {cartCount > 0 && <span id="cart-count" className="cart-count-badge">{cartCount}</span>}
        </button>
      </div>
    </header>
  );
}
