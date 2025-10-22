
import Head from 'next/head';
import Header from '../Header';
import Footer from '../Footer';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useCart } from '../../context/CartContext'; // Import useCart

// This function runs on the server for every request.
export async function getServerSideProps(context) {
  const { id } = context.params;

  try {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { notFound: true };
    }

    const product = { id: docSnap.id, ...docSnap.data() };

    return {
      props: { product },
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return {
      props: { error: 'Failed to load product data.' },
    };
  }
}

// This component renders the product page.
export default function ProductPage({ product, error }) {
  const { addToCart } = useCart(); // Get the addToCart function

  if (error) {
    return (
      <>
        <Header />
        <main><p>{error}</p></main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{product.name} - متجر دار اللغات</title>
        <meta name="description" content={product.description} />
      </Head>

      <Header />

      <main className="product-details-page">
        <div className="product-image-container">
          <img src={product.imageUrl} alt={product.name} />
        </div>
        <div className="product-info-container">
          <h1>{product.name}</h1>
          <p className="price">{product.price} جنيه</p>
          <p>{product.description}</p>
          {/* Call addToCart on button click */}
          <button 
            className="add-to-cart-btn" 
            onClick={() => addToCart(product)}
          >
            أضف إلى السلة
          </button>
        </div>
      </main>

      <Footer />
    </>
  );
}
