
import { useState, useMemo } from 'react'; // Import hooks
import Head from 'next/head';
import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

// This function runs on the server before the page is rendered.
export async function getServerSideProps() {
  try {
    const productsCollection = collection(db, 'products');
    const productSnapshot = await getDocs(productsCollection);
    const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return {
      props: { products: productList },
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      props: { products: [], error: 'Failed to load products.' },
    };
  }
}

export default function Home({ products, error }) {
  // State for search and sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('latest');

  // Memoized filtered and sorted products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (sortOrder) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'latest':
      default:
        // Assuming 'id' or a timestamp can be used for latest. 
        // As a fallback, we are not changing the order fetched from the server.
        break;
    }

    return filtered;
  }, [products, searchQuery, sortOrder]);

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>متجر دار اللغات - كتب ومواد تعليمية</title>
        <meta name="description" content="متجر دار اللغات هو مشروع تجريبي يهدف إلى بيع الكتب والمواد التعليمية عبر الإنترنت بطريقة حديثة وجذابة." />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
      </Head>

      <Header />

      <main>
        <section className="hero">
          <div className="hero-content">
            <h1 className="hero-title">كنوز المعرفة بين يديك</h1>
            <p className="hero-subtitle">افضل الكتب الدراسيه وكتب تنمية مهارات أطفال و العاب تنمية مهارات أطفال</p>
            <a href="#products-section" className="hero-button">اكتشف الآن</a>
          </div>
        </section>

        <section id="products-section" className="products-section">
          <h2 id="products-grid-title" className="section-title">كل المنتجات</h2>
          
          <div className="controls-container">
            <div className="search-group">
              <label htmlFor="search-input"><i className="fas fa-search"></i></label>
              <input 
                type="text" 
                id="search-input" 
                placeholder="ابحث عن كتاب..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="sort-group">
              <label htmlFor="sort-select"><i className="fas fa-sort-amount-down"></i></label>
              <select 
                id="sort-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="latest">الأحدث أولاً</option>
                <option value="price-asc">السعر: من الأقل للأعلى</option>
                <option value="price-desc">السعر: من الأعلى للأقل</option>
              </select>
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          <div id="product-list" className="product-grid">
            {filteredProducts.map(product => (
              <Link href={`/products/${product.id}`} key={product.id}>
                <a className="product-card">
                  <div className="product-image">
                    <img src={product.imageUrl} alt={product.name} />
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="price">{product.price} جنيه</p>
                  </div>
                </a>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
