import React, { useState, useEffect } from 'react';
import { Product, Supplier, Order, RestockNotification, CurrencyCode, OrderItem, CustomerLocation, CustomerUser, DressProduct } from './types';
import { SUPPORTED_LOCATIONS, DEFAULT_LOCATION } from './utils/supplierSync';
import { DEFAULT_CURRENCY, CURRENCIES, formatPrice } from './utils/currency';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { StripeCheckoutModal } from './components/StripeCheckoutModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { AdminPortal } from './components/AdminPortal';
import { LiveChatSupport } from './components/LiveChatSupport';
import { WishlistDrawer } from './components/WishlistDrawer';
import { HeroBannerAd } from './components/HeroBannerAd';
import { Footer } from './components/Footer';
import { CategoriesPage } from './components/CategoriesPage';
import { DressShoppingPage } from './components/DressShoppingPage';
import { DressPromoBanner } from './components/DressPromoBanner';
import {
  Sparkles,
  Truck,
  Mail,
  SlidersHorizontal,
  Package,
  Star,
  CheckCircle2,
  AlertTriangle,
  X,
  Lock,
  Zap,
  ShoppingBag,
  Clock,
  Heart,
  User,
  LayoutGrid,
  List,
  Home,
  ArrowUp,
  ShieldCheck,
  Flame,
  Award,
} from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restockNotifications, setRestockNotifications] = useState<RestockNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Visual Theme State - Default is Dark theme as requested
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('kovira_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark'; // Default Dark theme
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('kovira_theme', theme);
    } catch {}
  }, [theme]);

  // Floating Arrow Button to navigate to screen top
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 220);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Highlighted Order Notification State for Placed or Cancelled Orders
  const [orderNotification, setOrderNotification] = useState<{
    type: 'placed' | 'cancelled';
    orderNumber: string;
    total?: number;
    currency?: string;
  } | null>(null);

  // Customer Authentication state
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(() => {
    try {
      const saved = localStorage.getItem('kovira_customer_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('kovira_customer_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('kovira_customer_user');
    }
  }, [currentUser]);

  const [isCustomerAuthOpen, setIsCustomerAuthOpen] = useState(false);

  // International Currency state - Default is Indian Rupee (INR) as requested
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    try {
      const isCustomChosen = localStorage.getItem('kovira_currency_user_chosen');
      const saved = localStorage.getItem('kovira_currency');
      if (isCustomChosen && saved && Object.keys(CURRENCIES).includes(saved)) {
        return saved as CurrencyCode;
      }
    } catch {}
    return DEFAULT_CURRENCY;
  });

  const handleCurrencyChange = (newCurr: CurrencyCode) => {
    setCurrency(newCurr);
    try {
      localStorage.setItem('kovira_currency', newCurr);
      localStorage.setItem('kovira_currency_user_chosen', 'true');
    } catch {}
  };

  useEffect(() => {
    localStorage.setItem('kovira_currency', currency);
  }, [currency]);

  // Customer Location (syncs supplier warehouse, local stock, and delivery timeline)
  const [customerLocation, setCustomerLocation] = useState<CustomerLocation>(() => {
    try {
      const saved = localStorage.getItem('kovira_customer_location');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_LOCATION; // Default: India
  });

  useEffect(() => {
    localStorage.setItem('kovira_customer_location', JSON.stringify(customerLocation));
  }, [customerLocation]);

  // Search, Category, and Sorting Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeCollection, setActiveCollection] = useState<'all' | 'bestsellers' | 'brands'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  // Default layout changed to grid view as requested
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Interactive Modals & Drawers & Separate Pages
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState<'shop' | 'categories' | 'dresses' | 'admin'>(() => {
    try {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin') return 'admin';
      if (hash === '#dresses') return 'dresses';
      if (hash === '#categories') return 'categories';
    } catch {}
    return 'shop';
  });

  const navigateToPage = (page: 'shop' | 'categories' | 'dresses' | 'admin') => {
    setCurrentPage(page);
    try {
      if (page === 'admin') window.location.hash = 'admin';
      else if (page === 'dresses') window.location.hash = 'dresses';
      else if (page === 'categories') window.location.hash = 'categories';
      else if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Global Keyboard Shortcut for Store Owner: Ctrl + Shift + A (or Cmd + Shift + A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        navigateToPage(currentPage === 'admin' ? 'shop' : 'admin');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage]);

  // Sync hash changes (e.g. browser back button)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin') setCurrentPage('admin');
      else if (hash === '#dresses') setCurrentPage('dresses');
      else if (hash === '#categories') setCurrentPage('categories');
      else if (hash === '#shop' || hash === '') setCurrentPage('shop');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const [dresses, setDresses] = useState<DressProduct[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);

  // Cart State (stored in localStorage)
  const [cartItems, setCartItems] = useState<OrderItem[]>(() => {
    try {
      const saved = localStorage.getItem('kovira_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('kovira_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Wishlist / Liked State (stored in localStorage)
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kovira_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('kovira_wishlist', JSON.stringify(wishlistIds));
  }, [wishlistIds]);

  const handleToggleWishlist = (productId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setWishlistIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleRemoveFromWishlist = (productId: string) => {
    setWishlistIds((prev) => prev.filter((id) => id !== productId));
  };

  const handleClearWishlist = () => {
    setWishlistIds([]);
  };

  const handleAddAllWishlistToCart = (itemsToAdd: Product[]) => {
    setCartItems((prev) => {
      let updated = [...prev];
      for (const prod of itemsToAdd) {
        const existing = updated.find((i) => i.productId === prod.id);
        if (existing) {
          updated = updated.map((i) =>
            i.productId === prod.id
              ? { ...i, quantity: Math.min(prod.stock, i.quantity + 1) }
              : i
          );
        } else {
          updated.push({
            productId: prod.id,
            title: prod.title,
            sku: prod.sku,
            price: prod.priceUSD,
            currency: currency,
            quantity: 1,
            supplierId: prod.supplierId,
            supplierName: prod.supplierName,
            image: prod.images[0],
          });
        }
      }
      return updated;
    });
    setIsCartOpen(true);
  };

  // Initial Data Fetching from server (public products + adminProducts with drafts + dresses)
  const loadInitialData = async (countryName = customerLocation.country) => {
    setIsLoading(true);
    try {
      const [prodRes, adminProdRes, supRes, ordRes, notifRes, dressRes] = await Promise.all([
        fetch(`/api/products?country=${encodeURIComponent(countryName)}`).then((r) => r.json()).catch(() => null),
        fetch(`/api/products?country=${encodeURIComponent(countryName)}&includeDrafts=true`).then((r) => r.json()).catch(() => null),
        fetch('/api/suppliers').then((r) => r.json()).catch(() => null),
        fetch('/api/orders').then((r) => r.json()).catch(() => null),
        fetch('/api/restock-notifications').then((r) => r.json()).catch(() => null),
        fetch('/api/dresses').then((r) => r.json()).catch(() => ({ success: false })),
      ]);

      if (prodRes && Array.isArray(prodRes.products) && prodRes.products.length > 0) {
        setProducts(prodRes.products);
      }
      if (adminProdRes && Array.isArray(adminProdRes.products) && adminProdRes.products.length > 0) {
        setAdminProducts(adminProdRes.products);
      }
      if (supRes && supRes.success) setSuppliers(supRes.suppliers);
      if (ordRes && ordRes.success) setOrders(ordRes.orders);
      if (notifRes && notifRes.success) setRestockNotifications(notifRes.notifications);
      if (dressRes && dressRes.success && dressRes.dresses) setDresses(dressRes.dresses);
    } catch (err) {
      console.error('Failed to load store data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCartDress = (dress: DressProduct, selectedSize: string, quantity: number = 1) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === dress.id && i.selectedSize === selectedSize
      );
      if (existing) {
        return prev.map((i) =>
          i.productId === dress.id && i.selectedSize === selectedSize
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: dress.id,
          title: dress.title,
          sku: dress.sku,
          price: dress.priceUSD || Number((dress.priceINR / 86.5).toFixed(2)),
          currency: currency,
          quantity,
          supplierId: 'shivora_collections',
          supplierName: 'Shivora Collections',
          image: dress.images[0] || '/assets/dresses/partywear_gown_1_1791385855095.jpg',
          selectedSize,
          isDress: true,
          deliveryChargeINR: 80,
        },
      ];
    });
    setIsCartOpen(true);
  };

  useEffect(() => {
    loadInitialData(customerLocation.country);
  }, [customerLocation.country]);

  // Unique categories
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  // Liked / Wishlist Products
  const likedProducts = products.filter((p) => wishlistIds.includes(p.id));

  // Filtered & Sorted products
  const filteredProducts = products
    .filter((p) => {
      const skuStr = String(p.sku || p.id || '');
      const titleStr = String(p.title || '');
      const catStr = String(p.category || '');
      const descStr = String(p.description || '');

      let matchesCategory = true;
      if (selectedCategory === 'All' && activeCollection === 'all') {
        matchesCategory = true;
      } else if (selectedCategory === 'Liked') {
        matchesCategory = wishlistIds.includes(p.id);
      } else if (selectedCategory === 'Bestsellers' || activeCollection === 'bestsellers') {
        matchesCategory =
          Boolean(p.tags?.some((t) => String(t).toLowerCase().includes('bestseller'))) ||
          Boolean(p.featured) ||
          Number(p.rating || 0) >= 4.8;
      } else if (selectedCategory === 'Brands' || activeCollection === 'brands') {
        matchesCategory =
          Boolean(p.tags?.some((t) => ['gripchef', 'styleva', 'brand', 'prettykrafts'].includes(String(t).toLowerCase()))) ||
          titleStr.includes('GripChef') ||
          titleStr.includes('Styleva') ||
          skuStr.startsWith('DD-') ||
          skuStr.startsWith('15733') ||
          skuStr.startsWith('2350') ||
          skuStr.startsWith('4781') ||
          skuStr.startsWith('7397') ||
          skuStr.startsWith('1692') ||
          p.supplierPlatform === 'DeoDap';
      } else {
        matchesCategory = catStr.toLowerCase() === selectedCategory.toLowerCase();
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        titleStr.toLowerCase().includes(q) ||
        skuStr.toLowerCase().includes(q) ||
        catStr.toLowerCase().includes(q) ||
        descStr.toLowerCase().includes(q)
      );
      const matchesStock = inStockOnly ? (Number(p.stock) > 0) : true;
      return matchesCategory && matchesSearch && matchesStock;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.priceUSD - b.priceUSD;
      if (sortBy === 'price-desc') return b.priceUSD - a.priceUSD;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      // Default: featured first, then rating
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (b.rating || 0) - (a.rating || 0);
    });

  // Cart Actions
  const handleAddToCart = (product: Product, quantity = 1, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity) }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          title: product.title,
          sku: product.sku,
          price: product.priceUSD,
          currency: currency,
          quantity: Math.min(product.stock, quantity),
          supplierId: product.supplierId,
          supplierName: product.supplierName,
          image: product.images[0],
        },
      ];
    });

    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    const product = products.find((p) => p.id === productId);
    const maxStock = product ? product.stock : 999;

    setCartItems((prev) =>
      prev.map((it) => (it.productId === productId ? { ...it, quantity: Math.min(maxStock, newQty) } : it))
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((it) => it.productId !== productId));
  };

  const handleBuyNow = (product: Product, quantity: number) => {
    setCartItems([
      {
        productId: product.id,
        title: product.title,
        sku: product.sku,
        price: product.priceUSD,
        currency: currency,
        quantity,
        supplierId: product.supplierId,
        supplierName: product.supplierName,
        image: product.images[0],
      },
    ]);
    setIsCheckoutOpen(true);
  };

  const handleOrderCompleted = (newOrder: Order, newRestocks: RestockNotification[]) => {
    setOrders((prev) => [newOrder, ...prev]);
    if (newRestocks && newRestocks.length) {
      setRestockNotifications((prev) => [...newRestocks, ...prev]);
    }

    // Highlight notification on order placement
    setOrderNotification({
      type: 'placed',
      orderNumber: newOrder.orderNumber,
      total: newOrder.total,
      currency: newOrder.currency || currency,
    });

    // Clear cart
    setCartItems([]);
    // Refresh products to show updated stock
    loadInitialData();
  };

  const handleOrderCancelled = (orderId: string, orderNumber: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId || o.orderNumber === orderNumber
          ? { ...o, fulfillmentStatus: 'Cancelled', paymentStatus: 'Refunded' }
          : o
      )
    );
    // Highlight notification on order cancellation
    setOrderNotification({
      type: 'cancelled',
      orderNumber: orderNumber,
    });
  };

  const handleReviewAdded = (productId: string, updatedReviews: any[], newRating: number, count: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, reviews: updatedReviews, rating: newRating, reviewsCount: count }
          : p
      )
    );
    if (selectedProduct && selectedProduct.id === productId) {
      setSelectedProduct((prev) =>
        prev ? { ...prev, reviews: updatedReviews, rating: newRating, reviewsCount: count } : null
      );
    }
  };

  // 1. Separate Admin Page (Not a modal popup)
  if (currentPage === 'admin') {
    return (
      <div
        className={`min-h-screen ${
          theme === 'dark' ? 'bg-[#070B14] text-slate-100' : 'bg-[#FAFAFA] text-slate-900'
        } flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-cyan-500 selection:text-slate-950 w-full max-w-full touch-pan-y`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <AdminPortal
          isOpen={true}
          onClose={() => navigateToPage('shop')}
          products={adminProducts.length > 0 ? adminProducts : products}
          suppliers={suppliers}
          orders={orders}
          restockNotifications={restockNotifications}
          currency={currency}
          onRefreshData={loadInitialData}
        />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        theme === 'dark' ? 'bg-[#090d16] text-slate-100' : 'bg-[#FAFAFA] text-slate-900'
      } flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-cyan-500 selection:text-slate-950 pb-20 md:pb-0 overflow-x-hidden w-full max-w-full`}
    >
      {/* Customer-Oriented Store Navigation Header (2 Lines, No Email, User & Logout Always Visible) */}
      <Header
        currentCurrency={currency}
        onCurrencyChange={handleCurrencyChange}
        customerLocation={customerLocation}
        onChangeLocation={setCustomerLocation}
        currentUser={currentUser}
        onOpenCustomerAuth={() => setIsCustomerAuthOpen(true)}
        onLogout={() => setCurrentUser(null)}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        cartSubtotalUSD={cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)}
        wishlistCount={wishlistIds.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenAdmin={() => navigateToPage('admin')}
        onOpenOrderTracker={() => setIsOrderTrackerOpen(true)}
        currentPage={currentPage}
        onOpenCategories={() => navigateToPage('categories')}
        onOpenDresses={() => navigateToPage('dresses')}
        onSelectCollection={(coll) => {
          navigateToPage('shop');
          setActiveCollection(coll);
          if (coll === 'bestsellers') setSelectedCategory('Bestsellers');
          else if (coll === 'brands') setSelectedCategory('Brands');
          else setSelectedCategory('All');
        }}
        activeCollection={activeCollection}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          navigateToPage('shop');
          setSelectedCategory(cat);
          setActiveCollection('all');
        }}
        categories={categories}
        products={products}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      {currentPage === 'dresses' ? (
        <DressShoppingPage
          dresses={dresses}
          currency={currency}
          onAddToCart={handleAddToCartDress}
          onBackToShop={() => navigateToPage('shop')}
          onRefreshDresses={() => loadInitialData(customerLocation.country)}
          wishlistIds={wishlistIds}
          onToggleWishlist={handleToggleWishlist}
        />
      ) : currentPage === 'categories' ? (
        <CategoriesPage
          categories={categories}
          products={products}
          currency={currency}
          customerLocation={customerLocation}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setActiveCollection('all');
            navigateToPage('shop');
          }}
          onSelectCollection={(coll) => {
            setActiveCollection(coll);
            if (coll === 'bestsellers') setSelectedCategory('Bestsellers');
            else if (coll === 'brands') setSelectedCategory('Brands');
            else setSelectedCategory('All');
            navigateToPage('shop');
          }}
          onSelectProduct={(p) => setSelectedProduct(p)}
          onAddToCart={(p, qty) => handleAddToCart(p, qty || 1)}
          onBackToShop={() => navigateToPage('shop')}
        />
      ) : (
        <>
          {/* Modern High-End Store Hero Banner */}
          <section
            className={`relative overflow-hidden ${
              theme === 'dark'
                ? 'bg-gradient-to-b from-slate-950 via-[#0b0f19] to-[#090d16] border-slate-800'
                : 'bg-gradient-to-b from-white via-slate-50 to-[#FAFAFA] border-slate-200/80'
            } border-b py-8 sm:py-10 px-4`}
          >
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-10">
          {/* Left Column: Big Catchy Headline & Overview */}
          <div className="max-w-2xl space-y-3 sm:space-y-4 text-center lg:text-left py-2">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Curated Essentials. <br className="hidden sm:inline" />
              <span className="text-cyan-400 font-['Outfit',sans-serif]">
                Direct Factory Deals.
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed mx-auto lg:mx-0 font-medium">
              ⚡ Same-Day Dispatch • All India Express Tracked Shipping • 100% Genuine Certified Goods
            </p>
          </div>

          {/* Right Column: Hero Banner Ad for Most Selling & New Stock Products */}
          <HeroBannerAd
            products={products}
            currency={currency}
            onSelectProduct={(prod) => setSelectedProduct(prod)}
            onAddToCart={(prod, e) => handleAddToCart(prod, 1, e)}
          />
        </div>
      </section>

      {/* Dress Boutique Banner */}
      <div className="max-w-7xl mx-auto px-4 w-full pt-3">
        <DressPromoBanner
          dresses={dresses}
          onNavigateToDresses={() => navigateToPage('dresses')}
        />
      </div>

      {/* Main Product Catalog Section */}
      <main id="products-section" className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* Header Bar with Collection Title & Shifted Grid/List Switcher */}
        <div className="flex flex-row items-center justify-between gap-3 pb-2.5 border-b border-slate-800">
          <div className="space-y-0.5">
            <h2 className="text-lg sm:text-2xl font-black text-white font-['Outfit',sans-serif] tracking-tight">
              {selectedCategory === 'All' ? 'All Products' : selectedCategory}
            </h2>
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
              {filteredProducts.length} items available in Rupees (₹)
            </span>
          </div>

          {/* View Mode Switcher: Grid vs List (Shifted to top side) */}
          <div className="self-start sm:self-center flex items-center bg-slate-900 border border-slate-700/80 rounded-2xl p-1 shadow-xs shrink-0">
            <button
              id="view-mode-grid-btn"
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-cyan-400 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Grid</span>
            </button>
            <button
              id="view-mode-list-btn"
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-cyan-400 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="List View with Product Details"
              aria-label="List View with Product Details"
            >
              <List className="w-4 h-4" />
              <span>List</span>
            </button>
          </div>
        </div>

        {/* Category Navigation Pills / Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setActiveCollection('all');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
              selectedCategory === 'All' && activeCollection === 'all'
                ? 'bg-cyan-400 text-slate-950 border-cyan-400 font-black shadow-xs'
                : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800'
            }`}
          >
            All Products ({products.length})
          </button>

          {/* Quick Categories Separate Page Trigger */}
          <button
            id="browse-categories-pill-btn"
            type="button"
            onClick={() => {
              setCurrentPage('categories');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border bg-gradient-to-r from-cyan-950/80 to-slate-900 text-cyan-300 hover:text-white hover:border-cyan-400 border-cyan-500/40 shadow-xs flex items-center gap-1.5"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
            <span>Categories</span>
          </button>

          {/* Bestsellers Fast Pill */}
          <button
            type="button"
            onClick={() => {
              setActiveCollection('bestsellers');
              setSelectedCategory('Bestsellers');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border flex items-center gap-1.5 ${
              activeCollection === 'bestsellers' || selectedCategory === 'Bestsellers'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-amber-400 font-black shadow-xs'
                : 'bg-slate-900 text-amber-300/90 hover:text-amber-300 hover:bg-slate-800 border-amber-500/30'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${activeCollection === 'bestsellers' || selectedCategory === 'Bestsellers' ? 'fill-slate-950 text-slate-950' : 'fill-amber-400 text-amber-400'}`} />
            <span>Bestsellers (270)</span>
          </button>

          {categories.map((cat) => {
            const count = products.filter((p) => p.category === cat).length;
            const isSelected = selectedCategory === cat && activeCollection === 'all';
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setActiveCollection('all');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-cyan-400 text-slate-950 border-cyan-400 font-black shadow-xs'
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800'
                }`}
              >
                {cat} {count > 0 && <span className="opacity-75 text-[10px]">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Active Filter Bar when filtered */}
        {(selectedCategory !== 'All' || activeCollection !== 'all') && (
          <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>
                Browsing:{' '}
                <strong className="text-cyan-300">
                  {selectedCategory === 'Bestsellers' || activeCollection === 'bestsellers'
                    ? '🔥 Top Curated Bestsellers'
                    : selectedCategory === 'Brands' || activeCollection === 'brands'
                    ? '🏷️ Verified Brand Curations'
                    : selectedCategory}
                </strong>
                {' '}• <span className="font-mono text-slate-400">{filteredProducts.length} items</span>
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setActiveCollection('all');
              }}
              className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline cursor-pointer"
            >
              ✕ Clear Filter
            </button>
          </div>
        )}

        {/* Product Display (Grid or List View) */}
        {isLoading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 mx-auto border-3 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-500">Loading Kovira catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-4 bg-white border border-slate-200 rounded-3xl p-10 max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No products match your criteria</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We couldn't find any products matching "{searchQuery}". Try searching for another keyword or reset the filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setInStockOnly(false);
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6'
                : 'flex flex-col gap-3 sm:gap-4'
            }
          >
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currency={currency}
                customerLocation={customerLocation}
                isLiked={wishlistIds.includes(product.id)}
                viewMode={viewMode}
                onSelect={(p) => setSelectedProduct(p)}
                onAddToCart={(p, e) => handleAddToCart(p, 1, e)}
                onToggleWishlist={(p, e) => handleToggleWishlist(p.id, e)}
              />
            ))}
          </div>
        )}


      </main>
      </>
      )}

      {/* Customer Store Footer */}
      <Footer
        onOpenAdmin={() => navigateToPage('admin')}
        onOpenOrderTracker={() => setIsOrderTrackerOpen(true)}
        onOpenCategories={() => navigateToPage('categories')}
      />

      {/* Floating Arrow Button to Navigate to Screen Top - Positioned beside chat trigger with zero overlap */}
      {showScrollTop && (
        <button
          id="scroll-to-top-btn"
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 right-20 sm:bottom-6 sm:right-24 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900/95 hover:bg-slate-800 text-cyan-400 border border-slate-700 hover:border-cyan-400/60 shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group cursor-pointer backdrop-blur-md"
          title="Navigate to Top of Screen"
          aria-label="Scroll back to top"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform text-cyan-400" />
        </button>
      )}

      {/* Interactive Modals */}
      {/* 1. Product Details & Quick View */}
      <ProductModal
        product={selectedProduct}
        currency={currency}
        customerLocation={customerLocation}
        onChangeLocation={setCustomerLocation}
        isLiked={selectedProduct ? wishlistIds.includes(selectedProduct.id) : false}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(prod, qty) => handleAddToCart(prod, qty)}
        onBuyNow={(prod, qty) => handleBuyNow(prod, qty)}
        onToggleWishlist={(prod) => handleToggleWishlist(prod.id)}
        onReviewAdded={handleReviewAdded}
      />

      {/* 2. Slide-out Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        currency={currency}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* 2b. Slide-out Liked Products / Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        likedProducts={likedProducts}
        currency={currency}
        customerLocation={customerLocation}
        onRemoveFromWishlist={handleRemoveFromWishlist}
        onClearWishlist={handleClearWishlist}
        onAddToCart={(prod, qty) => handleAddToCart(prod, qty || 1)}
        onAddAllToCart={handleAddAllWishlistToCart}
        onSelectProduct={(prod) => setSelectedProduct(prod)}
      />

      {/* 3. Stripe Checkout Modal */}
      <StripeCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        currency={currency}
        customerLocation={customerLocation}
        currentUser={currentUser}
        onOrderSuccess={handleOrderCompleted}
      />

      {/* 4. Customer Login & Registration Modal */}
      <CustomerAuthModal
        isOpen={isCustomerAuthOpen}
        onClose={() => setIsCustomerAuthOpen(false)}
        currentUser={currentUser}
        currency={currency}
        onUserChange={(user: CustomerUser | null) => setCurrentUser(user)}
        onOpenOrderTracker={() => setIsOrderTrackerOpen(true)}
        onCancelOrder={handleOrderCancelled}
      />

      {/* 5. Customer Order Tracker Modal */}
      <OrderTrackerModal
        isOpen={isOrderTrackerOpen}
        onClose={() => setIsOrderTrackerOpen(false)}
        onCancelOrder={handleOrderCancelled}
      />

      {/* HIGHLIGHTED ORDER NOTIFICATION MESSAGE (Place & Cancel Orders) */}
      {orderNotification && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] w-[94%] max-w-lg animate-in slide-in-from-top-6 duration-300 pointer-events-auto"
        >
          <div
            className={`p-4 sm:p-5 rounded-2xl shadow-2xl border flex items-start justify-between gap-3.5 backdrop-blur-xl ${
              orderNotification.type === 'placed'
                ? 'bg-[#062419]/95 border-emerald-500 text-white shadow-emerald-950/60 ring-2 ring-emerald-500/40'
                : 'bg-[#2b080c]/95 border-rose-500 text-white shadow-rose-950/60 ring-2 ring-rose-500/40'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  orderNotification.type === 'placed'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                    : 'bg-rose-500 text-white font-black shadow-md'
                }`}
              >
                {orderNotification.type === 'placed' ? (
                  <CheckCircle2 className="w-6 h-6 text-slate-950" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm sm:text-base tracking-tight">
                    {orderNotification.type === 'placed'
                      ? '🎉 Order Placed Successfully!'
                      : '⚠️ Order Cancelled'}
                  </span>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                      orderNotification.type === 'placed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    #{orderNotification.orderNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {orderNotification.type === 'placed'
                    ? `Your order #${orderNotification.orderNumber} has been received and confirmed for immediate fulfillment.${
                        orderNotification.total
                          ? ` Total Billed: ${formatPrice(orderNotification.total, orderNotification.currency as any)}.`
                          : ''
                      } A digital GST tax receipt has been generated.`
                    : `Order #${orderNotification.orderNumber} has been cancelled successfully. Any debited amount will be refunded directly to your source UPI account.`}
                </p>
                <div className="pt-0.5 flex items-center gap-2 text-[11px] text-slate-300">
                  <span className="text-slate-400">Order Status:</span>
                  <strong className={orderNotification.type === 'placed' ? 'text-emerald-400' : 'text-rose-400'}>
                    {orderNotification.type === 'placed' ? 'Confirmed & Dispatched' : 'Cancelled & Refund In Progress'}
                  </strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => setOrderNotification(null)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* 6. Customer Live Chat Support Widget */}
      <LiveChatSupport />

      {/* 7. Mobile-Friendly Bottom Sticky Action Bar - Big Touch Targets */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-3 py-2 flex items-center justify-around shadow-2xl">
        {/* 1. Shop Button */}
        <button
          id="bottom-nav-shop-btn"
          type="button"
          onClick={() => {
            setSelectedCategory('All');
            setActiveCollection('all');
            navigateToPage('shop');
          }}
          className={`flex flex-col items-center gap-1 text-[11px] sm:text-xs font-bold cursor-pointer transition-colors py-1 ${
            currentPage === 'shop' && selectedCategory === 'All' && activeCollection === 'all'
              ? 'text-cyan-400 font-black'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Shop</span>
        </button>

        {/* 2. Dresses Boutique Button */}
        <button
          id="bottom-nav-dresses-btn"
          type="button"
          onClick={() => navigateToPage('dresses')}
          className={`flex flex-col items-center gap-1 text-[11px] sm:text-xs font-bold cursor-pointer transition-colors py-1 ${
            currentPage === 'dresses'
              ? 'text-pink-400 font-black'
              : 'text-slate-400 hover:text-pink-400'
          }`}
          title="Shivora Collections (Designer Dresses)"
        >
          <span className="text-base leading-none">👗</span>
          <span>Shivora</span>
        </button>

        {/* 3. Categories Button */}
        <button
          id="bottom-nav-categories-btn"
          type="button"
          onClick={() => navigateToPage('categories')}
          className={`flex flex-col items-center gap-1 text-[11px] sm:text-xs font-bold cursor-pointer transition-colors py-1 ${
            currentPage === 'categories'
              ? 'text-cyan-400 font-black'
              : 'text-slate-400 hover:text-cyan-400'
          }`}
          title="Browse All Categories (Thumbnail View)"
        >
          <LayoutGrid className="w-5 h-5" />
          <span>Categories</span>
        </button>

        {/* 3. Liked Button */}
        <button
          id="bottom-nav-liked-btn"
          type="button"
          onClick={() => setIsWishlistOpen(true)}
          className="relative flex flex-col items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-400 hover:text-rose-400 cursor-pointer transition-colors py-1"
        >
          <Heart className={`w-5 h-5 ${wishlistIds.length > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span>Liked</span>
          {wishlistIds.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[10px] font-black px-1.5 rounded-full min-w-[18px] text-center">
              {wishlistIds.length}
            </span>
          )}
        </button>

        {/* 4. Cart Button */}
        <button
          id="bottom-nav-cart-btn"
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="relative flex flex-col items-center gap-1 text-[11px] sm:text-xs font-black text-white hover:text-cyan-300 cursor-pointer transition-colors py-1"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 text-cyan-400" />
            {cartItems.length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-cyan-400 text-slate-950 text-[10px] font-black px-1.5 rounded-full min-w-[18px] text-center shadow-xs">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            )}
          </div>
          <span>Cart</span>
        </button>

        {/* 5. Track Button */}
        <button
          id="bottom-nav-track-btn"
          type="button"
          onClick={() => setIsOrderTrackerOpen(true)}
          className="flex flex-col items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-400 hover:text-cyan-400 cursor-pointer transition-colors py-1"
        >
          <Truck className="w-5 h-5 text-cyan-400" />
          <span>Track</span>
        </button>

        {/* 6. Account Button */}
        <button
          id="bottom-nav-account-btn"
          type="button"
          onClick={() => setIsCustomerAuthOpen(true)}
          className="flex flex-col items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-400 hover:text-slate-100 cursor-pointer transition-colors py-1"
        >
          <User className="w-5 h-5 text-slate-400" />
          <span>{currentUser ? currentUser.name.split(' ')[0] : 'Account'}</span>
        </button>
      </nav>
    </div>
  );
}
