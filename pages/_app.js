
import { CartProvider } from '../context/CartContext';
import Cart from './Cart'; // Import the Cart component
import '../style.css';

function MyApp({ Component, pageProps }) {
  return (
    <CartProvider>
      <Component {...pageProps} />
      <Cart /> {/* Add the Cart component here */}
    </CartProvider>
  );
}

export default MyApp;
