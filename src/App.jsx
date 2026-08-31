import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { HeroProvider } from './context/HeroContext';

const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Orders = lazy(() => import('./pages/Orders'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Auth = lazy(() => import('./pages/Auth'));

const AdminLayout = lazy(() => import('./components/AdminLayout'));
const AdminOverview = lazy(() => import('./pages/AdminOverview'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminOrders = lazy(() => import('./pages/AdminOrders'));
const AdminTheme = lazy(() => import('./pages/AdminTheme'));
const AdminHero = lazy(() => import('./pages/AdminHero'));
const AdminTeam = lazy(() => import('./pages/AdminTeam'));
const AdminImport = lazy(() => import('./pages/AdminImport'));

function PageFallback() {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="skeleton h-8 w-40 rounded" />
        <div className="skeleton mt-4 h-10 w-2/3 rounded" />
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map(i => <div key={i} className="skeleton aspect-[3/4] rounded" />)}
        </div>
      </div>
    </section>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <section className="py-16 md:py-24">
        <div className="container rounded-md border border-dashed border-ink/15 bg-paper p-10 text-center text-muted">
          <h3 className="font-display text-ink">Loading your account...</h3>
        </div>
      </section>
    );
  }
  if (!user) return <Navigate to="/account" replace state={{ from: location.pathname }} />;
  return children;
}

function StorefrontLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <HeroProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 2600,
                style: {
                  background: '#212121',
                  color: '#fff',
                  borderRadius: '4px',
                  padding: '12px 16px',
                  fontWeight: 600,
                  boxShadow: '0 12px 28px -14px rgba(0,0,0,.6)',
                },
                success: { iconTheme: { primary: '#388e3c', secondary: '#fff' } },
              }}
            />
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route element={<StorefrontLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:category" element={<Products />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                  <Route path="/account" element={<Auth />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                </Route>

                <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                  <Route index element={<AdminOverview />} />
                  <Route path="products" element={<Admin />} />
                  <Route path="import" element={<AdminImport />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="hero" element={<AdminHero />} />
                  <Route path="theme" element={<AdminTheme />} />
                  <Route path="team" element={<AdminTeam />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
      </HeroProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
