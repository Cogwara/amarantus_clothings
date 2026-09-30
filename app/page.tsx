'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  Phone,
  PhoneCall,
  MessageCircle,
  MapPin,
  Clock,
  Sparkles,
  Flame,
  CheckCircle2,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Truck,
  Heart,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Filter,
  Send,
  User,
  Star,
  HelpCircle,
  Package,
  Zap,
  Tag,
  Gift,
  Check,
} from 'lucide-react';
import { formatNaira } from '@/lib/calculations';
import { Product } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function FrontShopPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [shop, setShop] = React.useState<any>({
    name: 'Elegance Thrift Haven',
    phone: '+234 803 123 4567',
    address: 'Shop 14, Block B, Katangua Main Complex, Super B/Stop, Lagos',
    currency: 'NGN',
  });
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [selectedCondition, setSelectedCondition] = React.useState('');
  const [clearanceOnly, setClearanceOnly] = React.useState(false);
  const [sortBy, setSortBy] = React.useState('newest');

  // Jumia Layout States: Dropdowns, Hero Slide, and Flash Sale Countdown
  const [accountDropdownOpen, setAccountDropdownOpen] = React.useState(false);
  const [helpDropdownOpen, setHelpDropdownOpen] = React.useState(false);
  const [heroSlide, setHeroSlide] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState({
    hours: 4,
    minutes: 22,
    seconds: 15,
  });

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 6, minutes: 30, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const closeDropdowns = () => {
      setAccountDropdownOpen(false);
      setHelpDropdownOpen(false);
    };
    window.addEventListener('click', closeDropdowns);
    return () => window.removeEventListener('click', closeDropdowns);
  }, []);

  // Product Detail Modal
  const [detailProduct, setDetailProduct] = React.useState<Product | null>(null);

  // Shopping Bag / Cart
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = React.useState(false);

  // Checkout Form
  const [checkoutName, setCheckoutName] = React.useState('');
  const [checkoutPhone, setCheckoutPhone] = React.useState('');
  const [checkoutAddress, setCheckoutAddress] = React.useState('');
  const [checkoutNotes, setCheckoutNotes] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState<'TRANSFER' | 'CASH'>('TRANSFER');
  const [submittingOrder, setSubmittingOrder] = React.useState(false);
  const [orderSuccess, setOrderSuccess] = React.useState<any | null>(null);
  const [orderError, setOrderError] = React.useState('');

  // Contact Form
  const [contactName, setContactName] = React.useState('');
  const [contactPhone, setContactPhone] = React.useState('');
  const [contactMessage, setContactMessage] = React.useState('');
  const [inquiryType, setInquiryType] = React.useState<'GENERAL' | 'THURSDAY_REQUEST'>('GENERAL');
  const [sendingContact, setSendingContact] = React.useState(false);
  const [contactStatus, setContactStatus] = React.useState('');

  const loadStorefront = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (selectedCondition) params.append('condition', selectedCondition);
      if (clearanceOnly) params.append('clearance', 'true');
      if (sortBy) params.append('sort', sortBy);

      const res = await fetch(`/api/public/products?${params.toString()}`);
      const data = await res.json();
      if (data.products) setProducts(data.products);
      if (data.categories) setCategories(data.categories);
      if (data.shop) setShop(data.shop);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedCondition, clearanceOnly, sortBy]);

  React.useEffect(() => {
    loadStorefront();
  }, [loadStorefront]);

  // Cart operations
  const addToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (product.quantity <= 0) return;

    setCart((prev) => {
      const existing = prev.find((it) => it.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) return prev;
        return prev.map((it) =>
          it.product.id === product.id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((it) => {
          if (it.product.id !== productId) return it;
          const newQty = it.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > it.product.quantity) return it;
          return { ...it, quantity: newQty };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((it) => it.product.id !== productId));
  };

  const totalCartAmount = cart.reduce(
    (acc, it) => acc + it.product.sellingPrice * it.quantity,
    0
  );
  const totalCartCount = cart.reduce((acc, it) => acc + it.quantity, 0);

  // Direct WhatsApp Order
  const getWhatsAppOrderLink = (prod: Product) => {
    const rawPhone = shop.phone.replace(/\D/g, '');
    const cleanPhone = rawPhone.startsWith('0') ? '234' + rawPhone.slice(1) : rawPhone;
    const text = `Hello ${shop.name}! 👋\n\nI want to order this item from your Front Shop:\n\n👗 *${prod.name}*\n📏 Size: ${prod.size}\n🏷️ Price: ${formatNaira(prod.sellingPrice)}\n⭐ Condition: ${prod.condition}\n\nIs it still available for delivery?`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const getWhatsAppCartLink = (order: any) => {
    const rawPhone = shop.phone.replace(/\D/g, '');
    const cleanPhone = rawPhone.startsWith('0') ? '234' + rawPhone.slice(1) : rawPhone;

    let text = `Hello ${shop.name}! 🛍️\n\nI just placed an order on your Front Shop:\n*Order Ref:* ${order.saleNumber}\n*Customer:* ${order.customerName} (${order.customerPhone})\n*Total:* ${formatNaira(order.totalAmount)}\n*Payment:* ${order.paymentMethod}\n\nItems:\n`;
    order.items.forEach((it: any) => {
      text += `• ${it.name} x${it.quantity} (${formatNaira(it.total)})\n`;
    });
    text += `\nPlease confirm my order and send payment details/receipt!`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  // Submit Online Order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutName.trim() || !checkoutPhone.trim() || !checkoutAddress.trim()) {
      setOrderError('Please provide your name, phone number and delivery location.');
      return;
    }
    if (cart.length === 0) {
      setOrderError('Your shopping bag is empty.');
      return;
    }

    setSubmittingOrder(true);
    setOrderError('');

    try {
      const payload = {
        customerName: checkoutName.trim(),
        customerPhone: checkoutPhone.trim(),
        deliveryAddress: checkoutAddress.trim(),
        deliveryNotes: checkoutNotes.trim() || null,
        paymentMethod,
        items: cart.map((it) => ({
          productId: it.product.id,
          quantity: it.quantity,
        })),
      };

      const res = await fetch('/api/public/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      setOrderSuccess(data);
      setCart([]);
      setCartOpen(false);
      loadStorefront();
    } catch (err: any) {
      setOrderError(err?.message || 'Error completing checkout');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Submit Contact Form
  const handleSendContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim() || !contactMessage.trim()) return;

    setSendingContact(true);
    setContactStatus('');

    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName.trim(),
          phone: contactPhone.trim(),
          message: contactMessage.trim(),
          inquiryType,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setContactStatus(data.message || 'Message sent! We will WhatsApp you shortly.');
        setContactName('');
        setContactPhone('');
        setContactMessage('');
      }
    } finally {
      setSendingContact(false);
    }
  };

  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('dress')) return '👗';
    if (lower.includes('shirt')) return '👔';
    if (lower.includes('trouser') || lower.includes('jean')) return '👖';
    if (lower.includes('shoe') || lower.includes('sneaker')) return '👟';
    if (lower.includes('bag')) return '👜';
    if (lower.includes('jacket') || lower.includes('coat')) return '🧥';
    if (lower.includes('skirt')) return '👗';
    if (lower.includes('child') || lower.includes('kid')) return '👶';
    if (lower.includes('top')) return '👚';
    return '👕';
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#17211B] flex flex-col font-sans">
      {/* Top Utility Header Bar (Jumia style) */}
      <div className="bg-[#F8FAF9] border-b border-[#DDE5DF] text-xs py-1.5 px-4 hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[#D96F0B] font-bold">
              <Star className="w-3.5 h-3.5 fill-[#F28C28] text-[#F28C28]" />
              <span>Sell on ClothShop</span>
            </span>
            <span className="text-[#DDE5DF]">|</span>
            <span className="text-[11px] text-[#66736B]">Katangua Market Direct Thrift Bales</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-[#66736B] font-semibold">
            <span className="text-[#16803C] font-bold">CLOTHSHOP PAY</span>
            <span className="text-gray-300">•</span>
            <span>KATANGUA EXPRESS</span>
            <span className="text-gray-300">•</span>
            <span>DOORSTEP WAYBILL</span>
            <span className="text-gray-300">•</span>
            <span className="text-[#17211B] font-bold">🇳🇬 NGN (₦)</span>
          </div>
        </div>
      </div>

      {/* Main Jumia-Style Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#DDE5DF] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
          {/* Jumia-Style Logo */}
          <Link href="/" className="flex items-center gap-1.5 shrink-0 group">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#17211B]">
              CLOTHSHOP
            </span>
            <div className="w-6 h-6 rounded-full bg-[#F28C28] flex items-center justify-center text-white text-xs font-black shadow-sm group-hover:scale-110 transition-transform">
              ★
            </div>
          </Link>

          {/* Centered Search Bar with attached Orange Button */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <div className="flex items-center w-full border-2 border-[#F28C28] rounded-[8px] overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-[#F28C28]/20 transition-all">
              <div className="pl-3.5 text-[#8A968F] shrink-0">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search products, brands and categories"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const el = document.getElementById('catalog');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm text-[#17211B] bg-transparent focus:outline-none placeholder:text-[#8A968F]"
              />
              <button
                onClick={() => {
                  const el = document.getElementById('catalog');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-2.5 bg-[#F28C28] hover:bg-[#D96F0B] text-white text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors shrink-0 flex items-center gap-1.5 shadow-inner"
              >
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Right Header Navigation: Account, Help, Cart */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            {/* Account Dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => {
                  setAccountDropdownOpen(!accountDropdownOpen);
                  setHelpDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-[8px] hover:bg-[#F8FAF9] text-xs sm:text-sm font-semibold text-[#17211B] transition-colors"
              >
                <User className="w-5 h-5 text-[#17211B]" />
                <span className="hidden lg:inline">Account</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#66736B]" />
              </button>

              {accountDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-[14px] shadow-2xl border border-[#DDE5DF] p-3 z-50 animate-fadeIn">
                  <Link
                    href="/login"
                    onClick={() => setAccountDropdownOpen(false)}
                    className="w-full flex items-center justify-center py-2.5 px-3 bg-[#16803C] hover:bg-[#0F5C2E] text-white text-xs font-bold rounded-[10px] transition-colors shadow-sm"
                  >
                    Staff & Owner Sign In
                  </Link>
                  <div className="my-2.5 border-t border-[#F0F4F1]" />
                  <Link
                    href="/dashboard"
                    onClick={() => setAccountDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#17211B] hover:bg-[#F8FAF9] rounded-[8px] transition-colors"
                  >
                    <User className="w-4 h-4 text-[#16803C]" />
                    <span>Management Dashboard</span>
                  </Link>
                  <button
                    onClick={() => {
                      setAccountDropdownOpen(false);
                      setCartOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#17211B] hover:bg-[#F8FAF9] rounded-[8px] transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#F28C28]" />
                    <span>My Shopping Bag ({totalCartCount})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Help Dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => {
                  setHelpDropdownOpen(!helpDropdownOpen);
                  setAccountDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-[8px] hover:bg-[#F8FAF9] text-xs sm:text-sm font-semibold text-[#17211B] transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-[#17211B]" />
                <span className="hidden lg:inline">Help</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#66736B]" />
              </button>

              {helpDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-[14px] shadow-2xl border border-[#DDE5DF] p-3 z-50 animate-fadeIn">
                  <a
                    href={`https://wa.me/${shop.phone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(
                      shop.name
                    )},%20I%20need%20assistance%20with%20an%20order.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setHelpDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-[#16803C] bg-[#EAF7EE] hover:bg-[#d4f2dc] rounded-[8px] transition-colors mb-1.5"
                  >
                    <MessageCircle className="w-4 h-4 text-[#16803C]" />
                    <span>Live Chat on WhatsApp</span>
                  </a>
                  <a
                    href={`tel:${shop.phone.replace(/\D/g, '')}`}
                    onClick={() => setHelpDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#17211B] hover:bg-[#F8FAF9] rounded-[8px] transition-colors"
                  >
                    <Phone className="w-4 h-4 text-[#F28C28]" />
                    <span>Call Customer Care</span>
                  </a>
                  <a
                    href="#contact"
                    onClick={() => setHelpDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#17211B] hover:bg-[#F8FAF9] rounded-[8px] transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-[#66736B]" />
                    <span>Katangua Physical Shop</span>
                  </a>
                </div>
              )}
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setCartOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-[8px] hover:bg-[#F8FAF9] text-xs sm:text-sm font-semibold text-[#17211B] transition-colors relative"
              aria-label="View Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-[#17211B]" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 w-4 h-4 rounded-full bg-[#F28C28] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow">
                    {totalCartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-bold">Cart</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3">
          <div className="flex items-center w-full border-2 border-[#F28C28] rounded-[8px] overflow-hidden bg-white shadow-sm">
            <div className="pl-3 text-[#8A968F] shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search products, brands and categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2.5 py-2 text-xs text-[#17211B] bg-transparent focus:outline-none"
            />
            <button
              onClick={() => {
                const el = document.getElementById('catalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2 bg-[#F28C28] text-white text-xs font-bold uppercase shrink-0"
            >
              Search
            </button>
          </div>
        </div>

        {/* Sub-Navigation Ribbon (Under Search Bar) */}
        <div className="bg-[#FAFBFB] border-t border-[#EAEFEA] overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-6 py-2 text-xs font-medium text-[#17211B] whitespace-nowrap">
            <button
              onClick={() => {
                setSelectedCategory('');
                setClearanceOnly(false);
              }}
              className={`flex items-center gap-1.5 hover:text-[#16803C] transition-colors ${
                selectedCategory === '' && !clearanceOnly ? 'text-[#16803C] font-bold' : 'text-[#66736B]'
              }`}
            >
              <span>🏛️</span>
              <span>All Thrift</span>
            </button>

            <button
              onClick={() => setClearanceOnly(true)}
              className={`flex items-center gap-1.5 transition-colors ${
                clearanceOnly ? 'text-[#DC2626] font-extrabold' : 'text-[#DC2626] font-bold hover:text-red-700'
              }`}
            >
              <span>🔥</span>
              <span>Clearance Deals</span>
            </button>

            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCategory(c.id);
                  setClearanceOnly(false);
                }}
                className={`flex items-center gap-1.5 hover:text-[#16803C] transition-colors ${
                  selectedCategory === c.id && !clearanceOnly ? 'text-[#16803C] font-bold' : 'text-[#66736B]'
                }`}
              >
                <span>{getCategoryIcon(c.name)}</span>
                <span>{c.name}</span>
              </button>
            ))}

            <a
              href="#contact"
              className="flex items-center gap-1.5 text-[#16803C] hover:underline font-semibold"
            >
              <span>🚚</span>
              <span>Thursday Market Drop</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Promotional Banner Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 w-full">
        <div className="relative rounded-[16px] overflow-hidden bg-gradient-to-r from-[#07381C] via-[#0D5C2E] to-[#0A4723] text-white shadow-xl min-h-[320px] sm:min-h-[380px] flex items-center border border-[#16803C]">
          {/* Subtle Background Pattern Accent */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10 w-full p-6 sm:p-10 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Left Content */}
            <div className="max-w-xl space-y-4 text-center md:text-left">
              {/* Tagline */}
              <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-black tracking-wider uppercase text-white/90">
                <span className="text-[#F28C28] text-base">★</span>
                <span>• NAIJA WE DEY FOR YOU •</span>
              </div>

              {/* Giant Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-white">
                Celebrate Nigeria <br />
                <span className="text-[#FFDC73]">Celebrate Savings</span>
              </h1>

              {/* Up to 40% Off Pill */}
              <div className="pt-1">
                <div className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-2 rounded-full bg-white text-[#17211B] shadow-lg">
                  <span className="text-sm sm:text-base font-black text-[#16803C]">
                    Up to <span className="text-lg sm:text-xl font-extrabold text-[#17211B]">40% off</span>
                  </span>
                  <span className="text-xs text-[#66736B] font-medium">• UK Grade A Thrift</span>
                </div>
              </div>

              {/* Shop Now CTA */}
              <div className="pt-2">
                <a
                  href="#catalog"
                  className="inline-flex items-center gap-2 text-base font-bold text-white hover:text-[#FFDC73] transition-colors group"
                >
                  <span className="underline underline-offset-4 decoration-2">Shop Now</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                </a>
              </div>
            </div>

            {/* Right Fashion Montage Graphic */}
            <div className="relative w-full md:w-1/2 flex justify-center items-center">
              <div className="relative w-72 sm:w-96 aspect-[4/3] rounded-[16px] overflow-hidden shadow-2xl border-4 border-white/20 group">
                <img
                  src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80"
                  alt="Celebrate Nigeria Thrift Fashion"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
                  <span className="text-[11px] font-bold text-[#F28C28] uppercase tracking-wider">
                    Direct From Katangua & Balogun
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-white">
                    Grade A Handpicked Okrika Drops Every Thursday
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Slide Indicator Dots (Just like Jumia banner bottom) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === heroSlide ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Signature 6 Quick Action Tiles Row (Jumia Style) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* 1. Call to Order */}
          <a
            href={`tel:${shop.phone.replace(/\D/g, '')}`}
            className="group relative rounded-[16px] p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#FF6B8B] to-[#FF8E53] text-white shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between text-xs font-bold leading-tight">
              <span>Call to Order</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <div className="my-3 flex justify-center">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-[#FF6B8B] shadow-inner group-hover:scale-110 transition-transform">
                <PhoneCall className="w-6 h-6 stroke-[2.5]" />
              </div>
            </div>
            <div className="bg-white/95 text-[#17211B] text-[9px] sm:text-[10px] font-black uppercase tracking-wider py-1 px-2 rounded-full text-center shadow-sm">
              ORDER WITH EASE
            </div>
          </a>

          {/* 2. Make Money / Wholesale Bales */}
          <a
            href="#contact"
            className="group relative rounded-[16px] p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden bg-white border border-[#DDE5DF] text-[#17211B] shadow-sm hover:shadow-md hover:border-[#F28C28] transition-all active:scale-[0.98]"
          >
            <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#FFF1E2] flex items-center justify-center text-[#F28C28]">
              <Star className="w-3 h-3 fill-[#F28C28]" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold block leading-tight text-[#17211B]">Make Money</span>
              <span className="text-[10px] text-[#66736B]">Be your own boss</span>
            </div>
            <div className="my-2.5 flex justify-center">
              <div className="w-12 h-12 rounded-full bg-[#EAF7EE] flex items-center justify-center text-[#16803C] shadow-inner group-hover:scale-110 transition-transform">
                <Tag className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-[#F8FAF9] text-[#16803C] border border-[#C5E9CE] text-[9px] sm:text-[10px] font-black uppercase tracking-wider py-1 px-2 rounded-full text-center">
              WHOLESALE BALES
            </div>
          </a>

          {/* 3. Free Delivery */}
          <div className="group relative rounded-[16px] p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#F28C28] to-[#FF6F00] text-white shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-xs font-bold leading-tight">
              <span>Free Delivery</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <div className="my-3 flex justify-center">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-[#F28C28] shadow-inner group-hover:scale-110 transition-transform">
                <Truck className="w-6 h-6 stroke-[2.5]" />
              </div>
            </div>
            <div className="bg-white/95 text-[#17211B] text-[9px] sm:text-[10px] font-black uppercase tracking-wider py-1 px-2 rounded-full text-center shadow-sm">
              FREE DELIVERY
            </div>
          </div>

          {/* 4. New Arrival */}
          <button
            onClick={() => {
              setSortBy('newest');
              const el = document.getElementById('catalog');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative rounded-[16px] p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#2DD4BF] to-[#0D9488] text-white shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left"
          >
            <div className="flex items-center justify-between text-xs font-bold leading-tight">
              <span>New Arrival</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <div className="my-3 flex justify-center">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-[#0D9488] shadow-inner group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6 stroke-[2.5]" />
              </div>
            </div>
            <div className="bg-white/95 text-[#0F5C2E] text-[9px] sm:text-[10px] font-black uppercase tracking-wider py-1 px-2 rounded-full text-center shadow-sm">
              JUST FOR YOU
            </div>
          </button>

          {/* 5. Buy 2 Pay for 1 / Combos */}
          <button
            onClick={() => {
              setClearanceOnly(true);
              const el = document.getElementById('catalog');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative rounded-[16px] p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#38BDF8] to-[#2563EB] text-white shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left"
          >
            <div className="flex items-center justify-between text-xs font-bold leading-tight">
              <span>Buy 2 Pay for 1</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <div className="my-3 flex justify-center">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-[#2563EB] shadow-inner group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6 stroke-[2.5]" />
              </div>
            </div>
            <div className="bg-white/95 text-[#1D4ED8] text-[9px] sm:text-[10px] font-black uppercase tracking-wider py-1 px-2 rounded-full text-center shadow-sm">
              UP TO -50%
            </div>
          </button>

          {/* 6. Banger Deals */}
          <button
            onClick={() => {
              setClearanceOnly(true);
              const el = document.getElementById('catalog');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative rounded-[16px] p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#EF4444] to-[#F97316] text-white shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left"
          >
            <div className="flex items-center justify-between text-xs font-bold leading-tight">
              <span>Banger Deals</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <div className="my-3 flex justify-center">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-[#EF4444] shadow-inner group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6 stroke-[2.5]" />
              </div>
            </div>
            <div className="bg-white/95 text-[#DC2626] text-[9px] sm:text-[10px] font-black uppercase tracking-wider py-1 px-2 rounded-full text-center shadow-sm">
              UP TO -60%
            </div>
          </button>
        </div>
      </section>

      {/* Flash Sales Banner with Live Ticking Countdown */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 w-full">
        <div className="bg-white rounded-[16px] border border-[#DDE5DF] overflow-hidden shadow-sm">
          {/* Header Bar (Red Jumia Flash Sales Style) */}
          <div className="bg-[#E52E04] text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 fill-white text-white" />
              <h2 className="text-base sm:text-lg font-black tracking-wide uppercase">
                Flash Sales
              </h2>
            </div>

            {/* Countdown Clock */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white/90 hidden sm:inline">
                Time Left:
              </span>
              <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-bold">
                <span className="bg-black/30 px-2 py-0.5 rounded">
                  {String(timeLeft.hours).padStart(2, '0')}h
                </span>
                <span>:</span>
                <span className="bg-black/30 px-2 py-0.5 rounded">
                  {String(timeLeft.minutes).padStart(2, '0')}m
                </span>
                <span>:</span>
                <span className="bg-black/30 px-2 py-0.5 rounded">
                  {String(timeLeft.seconds).padStart(2, '0')}s
                </span>
              </div>
            </div>

            <a
              href="#catalog"
              onClick={() => setClearanceOnly(true)}
              className="text-xs font-bold uppercase tracking-wider text-white hover:underline flex items-center gap-1"
            >
              <span>See All Deals</span>
              <span>→</span>
            </a>
          </div>

          {/* Horizontal Deals Carousel */}
          <div className="p-4 overflow-x-auto flex gap-4 no-scrollbar">
            {products.slice(0, 6).map((p) => {
              const discountPercent = p.status === 'CLEARANCE' ? 50 : 35;
              const originalPrice = Math.round(p.sellingPrice / (1 - discountPercent / 100));

              return (
                <div
                  key={p.id}
                  onClick={() => setDetailProduct(p)}
                  className="w-44 sm:w-48 shrink-0 bg-white rounded-[12px] border border-[#F0F4F1] hover:border-[#16803C] hover:shadow-cardHover transition-all p-2.5 cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-square w-full rounded-[10px] overflow-hidden bg-gray-100 mb-2">
                    <img
                      src={p.primaryImageUrl || 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=500&q=80'}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1.5 right-1.5 bg-[#DC2626] text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                      -{discountPercent}%
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-[#17211B] line-clamp-1">
                      {p.name}
                    </h4>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-sm font-black text-[#17211B]">
                        {formatNaira(p.sellingPrice)}
                      </span>
                      <span className="text-[10px] text-[#8A968F] line-through">
                        {formatNaira(originalPrice)}
                      </span>
                    </div>

                    {/* Stock Progress Bar */}
                    <div className="mt-2 space-y-1">
                      <div className="w-full bg-[#EAEFEA] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#DC2626] h-full rounded-full"
                          style={{ width: `${Math.min(100, Math.max(25, p.quantity * 15))}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#66736B] block">
                        {p.quantity} items left
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Catalog & Filter Navigation Bar */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 space-y-6">
        {/* Category Pills & Clearance Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-[#DDE5DF]">
          {/* Category Horizontal Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
            <button
              onClick={() => {
                setSelectedCategory('');
                setClearanceOnly(false);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all ${
                selectedCategory === '' && !clearanceOnly
                  ? 'bg-[#16803C] text-white shadow-sm'
                  : 'bg-white text-[#66736B] hover:text-[#17211B] border border-[#DDE5DF]'
              }`}
            >
              All Items ({products.length})
            </button>

            <button
              onClick={() => setClearanceOnly(!clearanceOnly)}
              className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all ${
                clearanceOnly
                  ? 'bg-[#F28C28] text-white shadow-sm'
                  : 'bg-white text-[#D96F0B] hover:bg-[#FFF1E2] border border-[#FCD9B8]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Clearance Deals</span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setClearanceOnly(false);
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all ${
                  selectedCategory === cat.id && !clearanceOnly
                    ? 'bg-[#16803C] text-white shadow-sm'
                    : 'bg-white text-[#66736B] hover:text-[#17211B] border border-[#DDE5DF]'
                }`}
              >
                {getCategoryIcon(cat.name)} {cat.name} ({cat.count})
              </button>
            ))}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#66736B] font-medium hidden sm:inline">
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-[10px] border border-[#DDE5DF] bg-white px-3 py-1.5 text-xs text-[#17211B] focus:border-[#16803C] focus:outline-none font-semibold"
            >
              <option value="newest">Latest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product Cards Showcase Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-72 bg-white rounded-[14px] p-3 animate-pulse border border-[#DDE5DF]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-[14px] border border-dashed border-[#DDE5DF] p-8 space-y-3">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-bold text-base text-[#17211B]">No clothing items found</h3>
            <p className="text-xs text-[#66736B] max-w-sm mx-auto">
              We couldn&apos;t find any items matching your selected filter. Please reset filters or check back on Thursday for the fresh market drop!
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setSelectedCategory('');
                setClearanceOnly(false);
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => {
              const inCart = cart.find((it) => it.product.id === p.id);
              const discountPercent = p.status === 'CLEARANCE' ? 50 : 30;
              const originalPrice = Math.round(p.sellingPrice / (1 - discountPercent / 100));

              return (
                <div
                  key={p.id}
                  onClick={() => setDetailProduct(p)}
                  className="group bg-white rounded-[14px] border border-[#DDE5DF] overflow-hidden flex flex-col justify-between hover:shadow-cardHover hover:border-[#16803C] transition-all cursor-pointer select-none"
                >
                  {/* Photo & Badges */}
                  <div className="relative aspect-square w-full bg-gray-100 overflow-hidden border-b border-[#F0F4F1]">
                    {p.primaryImageUrl ? (
                      <img
                        src={p.primaryImageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-gray-300">
                        CS
                      </div>
                    )}

                    {/* Condition Pill */}
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {p.condition}
                    </div>

                    {/* Red Discount Badge */}
                    <div className="absolute top-2 right-2 bg-[#DC2626] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                      -{discountPercent}%
                    </div>

                    {/* Quantity Pill */}
                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-[#17211B] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      {p.quantity === 1 ? '⚡ 1 piece only' : `${p.quantity} pcs left`}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-[#66736B]">
                        {p.categoryName} {p.brand ? `• ${p.brand}` : ''}
                      </p>
                      <h3 className="text-xs sm:text-sm font-bold text-[#17211B] line-clamp-2 mt-0.5">
                        {p.name}
                      </h3>
                      <p className="text-xs text-[#66736B] mt-1">
                        Size: <strong className="text-[#17211B]">{p.size}</strong>
                      </p>
                    </div>

                    {/* Price, Strikethrough & Action Row */}
                    <div className="pt-2 border-t border-[#F0F4F1] flex items-end justify-between gap-1">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm sm:text-base font-extrabold text-[#16803C]">
                            {formatNaira(p.sellingPrice)}
                          </span>
                          <span className="text-[10px] text-[#8A968F] line-through">
                            {formatNaira(originalPrice)}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#D96F0B] font-bold block mt-0.5">
                          Authentic Grade A
                        </span>
                      </div>

                      <button
                        onClick={(e) => addToCart(p, e)}
                        className={`p-2 rounded-full transition-all shrink-0 ${
                          inCart
                            ? 'bg-[#16803C] text-white'
                            : 'bg-[#EAF7EE] text-[#16803C] hover:bg-[#16803C] hover:text-white'
                        }`}
                        title="Add to Bag"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Product Details Modal */}
      <Modal
        isOpen={Boolean(detailProduct)}
        onClose={() => setDetailProduct(null)}
        maxWidth="2xl"
        hideHeader={true}
      >
        {detailProduct && (
          <div className="relative pt-1 sm:pt-2">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Column: Product Photo & Badges */}
              <div className="md:col-span-5 space-y-3">
                <div className="relative aspect-square w-full rounded-[14px] bg-[#F8FAF9] overflow-hidden border border-[#DDE5DF] shadow-sm">
                  {detailProduct.primaryImageUrl ? (
                    <img
                      src={detailProduct.primaryImageUrl}
                      alt={detailProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center font-bold text-gray-300">
                      <ShoppingBag className="w-12 h-12 stroke-1 text-gray-300" />
                      <span className="text-xs text-[#8A968F] mt-2 font-medium">ClothShop Thrift</span>
                    </div>
                  )}

                  {/* Condition Pill Overlaid */}
                  <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow">
                    <Sparkles className="w-3.5 h-3.5 text-[#F28C28]" />
                    <span>Grade: {detailProduct.condition}</span>
                  </div>

                  {/* Clearance Tag if clearance */}
                  {detailProduct.status === 'CLEARANCE' && (
                    <div className="absolute top-2.5 right-2.5 bg-[#DC2626] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow">
                      CLEARANCE SALE
                    </div>
                  )}
                </div>

                {/* Quality & Sanitation Badge */}
                <div className="p-3 bg-[#EAF7EE]/70 rounded-[12px] border border-[#C5E9CE] space-y-1.5 text-[11px] text-[#0F5C2E]">
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-[#16803C] shrink-0" />
                    <span>Steam-pressed, clean & ready to wear</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#66736B]">
                    <Truck className="w-4 h-4 text-[#16803C] shrink-0" />
                    <span>Available in Katangua shop & online</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Specs, Price, and Purchase Buttons */}
              <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                {/* Category & Title */}
                <div className="space-y-1 pr-10">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#EAF7EE] text-[#16803C] border border-[#C5E9CE]">
                      {detailProduct.categoryName}
                    </span>
                    <span className="text-[11px] text-[#66736B] font-medium">
                      SKU: <strong className="text-[#17211B]">{detailProduct.sku}</strong>
                    </span>
                    {detailProduct.brand && (
                      <span className="text-[11px] text-[#66736B] font-medium">
                        • Brand: <strong className="text-[#17211B]">{detailProduct.brand}</strong>
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-[#17211B] leading-tight pt-1">
                    {detailProduct.name}
                  </h2>
                </div>

                {/* Price & Stock Display Card */}
                <div className="p-3.5 bg-[#F8FAF9] rounded-[12px] border border-[#DDE5DF] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#66736B] block">
                      Price
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-[#16803C] leading-none mt-1">
                      {formatNaira(detailProduct.sellingPrice)}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#66736B] block">
                      Availability
                    </span>
                    <span className="inline-flex items-center gap-1.5 mt-1 text-xs font-bold text-[#16803C]">
                      <span className="w-2 h-2 rounded-full bg-[#16803C] animate-pulse" />
                      {detailProduct.quantity === 1 ? '1 piece only' : `${detailProduct.quantity} in store`}
                    </span>
                  </div>
                </div>

                {/* Specifications Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-[10px] bg-white border border-[#DDE5DF]">
                    <span className="text-[#66736B] block text-[11px]">Size / Fit</span>
                    <span className="font-bold text-[#17211B] text-sm mt-0.5 block">{detailProduct.size}</span>
                  </div>
                  <div className="p-2.5 rounded-[10px] bg-white border border-[#DDE5DF]">
                    <span className="text-[#66736B] block text-[11px]">Condition</span>
                    <span className="font-bold text-[#16803C] text-sm mt-0.5 block">{detailProduct.condition}</span>
                  </div>
                  {detailProduct.color && (
                    <div className="p-2.5 rounded-[10px] bg-white border border-[#DDE5DF]">
                      <span className="text-[#66736B] block text-[11px]">Color / Shade</span>
                      <span className="font-bold text-[#17211B] text-sm mt-0.5 block">{detailProduct.color}</span>
                    </div>
                  )}
                  {detailProduct.gender && (
                    <div className="p-2.5 rounded-[10px] bg-white border border-[#DDE5DF]">
                      <span className="text-[#66736B] block text-[11px]">Section</span>
                      <span className="font-bold text-[#17211B] text-sm mt-0.5 block">{detailProduct.gender}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {detailProduct.description && (
                  <div className="text-xs text-[#66736B] leading-relaxed bg-[#F8FAF9] p-3 rounded-[10px] border border-[#EBEFEA]">
                    <p className="line-clamp-3">{detailProduct.description}</p>
                  </div>
                )}

                {/* Call-to-Action Buttons */}
                <div className="space-y-2.5 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Add to Bag */}
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => {
                        addToCart(detailProduct);
                        setDetailProduct(null);
                      }}
                      className="w-full font-bold shadow-sm"
                    >
                      <ShoppingBag className="w-4 h-4 shrink-0" />
                      <span className="whitespace-nowrap">
                        {cart.find((it) => it.product.id === detailProduct.id)
                          ? 'In Bag (Add More)'
                          : 'Add to Bag'}
                      </span>
                    </Button>

                    {/* WhatsApp */}
                    <a
                      href={getWhatsAppOrderLink(detailProduct)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full block"
                    >
                      <Button
                        variant="secondary"
                        size="md"
                        className="w-full font-bold shadow-sm"
                      >
                        <MessageCircle className="w-4 h-4 shrink-0" />
                        <span className="whitespace-nowrap">Order on WhatsApp</span>
                      </Button>
                    </a>
                  </div>

                  <p className="text-[11px] text-center text-[#8A968F] font-medium">
                    ⚡ Fast Lagos Delivery & Nationwide Waybill
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Shopping Bag & Checkout Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slideRight">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#F0F4F1] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#16803C]" />
                <h3 className="font-bold text-base text-[#17211B]">
                  Your Shopping Bag ({totalCartCount})
                </h3>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-1 rounded-full text-[#66736B] hover:bg-[#F8FAF9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 flex-1 overflow-y-auto space-y-5">
              {orderError && (
                <div className="p-2.5 rounded-[8px] bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                  {orderError}
                </div>
              )}

              {cart.length === 0 ? (
                <div className="py-12 text-center text-[#66736B] space-y-3">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
                  <p className="text-sm font-semibold">Your shopping bag is empty</p>
                  <p className="text-xs text-gray-400">
                    Tap any thrift clothing piece in the catalog to add it here.
                  </p>
                </div>
              ) : (
                <>
                  {/* Items List */}
                  <div className="divide-y divide-[#F0F4F1] border border-[#DDE5DF] rounded-[12px] p-2 bg-[#F8FAF9]/50">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="py-2.5 px-2 flex items-center justify-between gap-3"
                      >
                        <div className="w-11 h-11 rounded-[8px] bg-gray-100 overflow-hidden shrink-0 border border-[#DDE5DF]">
                          {item.product.primaryImageUrl ? (
                            <img
                              src={item.product.primaryImageUrl}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-gray-300 text-xs">
                              CS
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#17211B] truncate">
                            {item.product.name}
                          </p>
                          <p className="text-[11px] text-[#66736B]">
                            Size: {item.product.size} • {formatNaira(item.product.sellingPrice)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-6 h-6 rounded bg-white border border-[#DDE5DF] flex items-center justify-center text-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-6 h-6 rounded bg-white border border-[#DDE5DF] flex items-center justify-center text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-1 rounded text-red-500 hover:bg-red-50 ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Checkout Form */}
                  <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-3 pt-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[#66736B]">
                      Delivery & Contact Information
                    </h4>

                    <Input
                      label="Your Full Name"
                      placeholder="e.g. Funke Akindele"
                      value={checkoutName}
                      onChange={(e) => setCheckoutName(e.target.value)}
                      required
                    />

                    <Input
                      label="WhatsApp Phone Number"
                      placeholder="e.g. 0803 123 4567"
                      value={checkoutPhone}
                      onChange={(e) => setCheckoutPhone(e.target.value)}
                      helperText="We will send your order receipt and tracking updates here"
                      required
                    />

                    <Input
                      label="Delivery Location / Address"
                      placeholder="e.g. Ikeja, Lagos (or Pickup at Katangua Shop)"
                      value={checkoutAddress}
                      onChange={(e) => setCheckoutAddress(e.target.value)}
                      required
                    />

                    <div>
                      <label className="block text-xs font-medium text-[#17211B] mb-1.5">
                        Payment Option
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('TRANSFER')}
                          className={`p-2.5 rounded-[10px] border text-left font-bold transition-all ${
                            paymentMethod === 'TRANSFER'
                              ? 'bg-[#EAF7EE] text-[#16803C] border-[#16803C] shadow-sm'
                              : 'bg-white text-[#66736B] border-[#DDE5DF]'
                          }`}
                        >
                          🏦 Bank Transfer
                          <span className="block text-[10px] font-normal text-[#66736B]">
                            Pay via GTBank
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('CASH')}
                          className={`p-2.5 rounded-[10px] border text-left font-bold transition-all ${
                            paymentMethod === 'CASH'
                              ? 'bg-[#EAF7EE] text-[#16803C] border-[#16803C] shadow-sm'
                              : 'bg-white text-[#66736B] border-[#DDE5DF]'
                          }`}
                        >
                          💵 Pay on Delivery
                          <span className="block text-[10px] font-normal text-[#66736B]">
                            Or Pickup at Shop
                          </span>
                        </button>
                      </div>
                    </div>
                  </form>
                </>
              )}
            </div>

            {/* Drawer Footer & Checkout Button */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-[#F0F4F1] bg-[#F8FAF9] space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-[#66736B]">Total Order Value:</span>
                  <span className="text-xl font-black text-[#16803C]">
                    {formatNaira(totalCartAmount)}
                  </span>
                </div>

                <Button
                  form="checkout-form"
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full font-bold text-base gap-2"
                  isLoading={submittingOrder}
                >
                  <span>Complete Order ({formatNaira(totalCartAmount)})</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Confirmation Modal */}
      <Modal
        isOpen={Boolean(orderSuccess)}
        onClose={() => setOrderSuccess(null)}
        title="🎉 Order Successfully Received!"
        description={`Order Reference: ${orderSuccess?.order?.saleNumber}`}
        maxWidth="md"
      >
        {orderSuccess && (
          <div className="space-y-5 text-xs text-[#17211B]">
            <div className="p-4 bg-[#EAF7EE] border border-[#C5E9CE] rounded-[12px] space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#16803C]">
                <CheckCircle2 className="w-5 h-5" />
                <span>Thank you, {orderSuccess.order.customerName}!</span>
              </div>
              <p className="text-[#0F5C2E]">
                Your thrift order has been reserved in our system. Inventory has been secured for you.
              </p>
            </div>

            {/* Bank Transfer Box */}
            <div className="p-4 bg-white border border-[#DDE5DF] rounded-[12px] space-y-2">
              <h4 className="font-bold text-sm text-[#17211B]">
                Shop Bank Transfer Information
              </h4>
              <div className="space-y-1 font-mono text-xs">
                <p>
                  <span className="text-[#66736B]">Bank:</span> {orderSuccess.bankDetails.bankName}
                </p>
                <p>
                  <span className="text-[#66736B]">Account Number:</span>{' '}
                  <strong className="text-sm text-[#16803C]">{orderSuccess.bankDetails.accountNumber}</strong>
                </p>
                <p>
                  <span className="text-[#66736B]">Account Name:</span> {orderSuccess.bankDetails.accountName}
                </p>
                <p>
                  <span className="text-[#66736B]">Amount to Transfer:</span>{' '}
                  <strong className="text-base text-[#16803C]">{formatNaira(orderSuccess.order.totalAmount)}</strong>
                </p>
              </div>
            </div>

            {/* Direct WhatsApp Confirmation Button */}
            <a
              href={getWhatsAppCartLink(orderSuccess.order)}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                variant="secondary"
                size="lg"
                className="w-full font-bold gap-2 text-sm shadow-sm"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Send Order to WhatsApp for Fast Dispatch</span>
              </Button>
            </a>

            <div className="text-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOrderSuccess(null)}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Contact & Physical Shop Location Section */}
      <section id="contact" className="bg-white border-t border-[#DDE5DF] py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Shop Location & Directions (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#16803C]">
              Visit Our Retail Store
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#17211B]">
              Located Right In Katangua Market
            </h2>
            <p className="text-xs sm:text-sm text-[#66736B] leading-relaxed">
              Prefer to see, touch, and try on our clothes in person? Visit our physical thrift boutique inside the bustling Katangua Super market complex.
            </p>

            <div className="p-4 bg-[#F8FAF9] rounded-[12px] border border-[#DDE5DF] space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#16803C] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#17211B] text-sm block">Shop Location:</strong>
                  <span className="text-[#66736B]">{shop.address}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#F28C28] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#17211B] text-sm block">Shop Opening Hours:</strong>
                  <p className="text-[#66736B]">Monday – Saturday: 8:00 AM – 6:30 PM</p>
                  <p className="text-[#16803C] font-bold mt-0.5">
                    ⚡ Thursday is Market Restock Day! Early morning bale arrivals.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#16803C] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#17211B] text-sm block">Direct Customer Line:</strong>
                  <span className="text-[#17211B] font-bold">{shop.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Inquiry & Style Request Form (6 cols) */}
          <div className="lg:col-span-6 bg-[#F8FAF9] p-6 rounded-[16px] border border-[#DDE5DF]">
            <h3 className="text-lg font-bold text-[#17211B]">
              Looking for a Specific Style or Size?
            </h3>
            <p className="text-xs text-[#66736B] mt-1 mb-4">
              Send us a message or request specific items for our upcoming Thursday market bale intake.
            </p>

            {contactStatus && (
              <div className="p-3 mb-4 rounded-[10px] bg-[#EAF7EE] border border-[#C5E9CE] text-xs font-bold text-[#16803C] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{contactStatus}</span>
              </div>
            )}

            <form onSubmit={handleSendContact} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Your Name"
                  placeholder="e.g. Chioma Adeleke"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                />

                <Input
                  label="WhatsApp Phone Number"
                  placeholder="e.g. 0803 123 4567"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#17211B] mb-1.5">
                  Inquiry Type
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setInquiryType('GENERAL')}
                    className={`py-2 px-3 rounded-[8px] border text-center font-bold ${
                      inquiryType === 'GENERAL'
                        ? 'bg-[#16803C] text-white border-[#16803C]'
                        : 'bg-white text-[#66736B] border-[#DDE5DF]'
                    }`}
                  >
                    General Inquiry
                  </button>
                  <button
                    type="button"
                    onClick={() => setInquiryType('THURSDAY_REQUEST')}
                    className={`py-2 px-3 rounded-[8px] border text-center font-bold ${
                      inquiryType === 'THURSDAY_REQUEST'
                        ? 'bg-[#16803C] text-white border-[#16803C]'
                        : 'bg-white text-[#66736B] border-[#DDE5DF]'
                    }`}
                  >
                    Request for Thursday Bales
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#17211B] mb-1.5">
                  Message / Clothing Request Details
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Please pick UK size 14 floral midi dresses and vintage Ralph Lauren shirts for me on Thursday."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full rounded-[10px] border border-[#DDE5DF] bg-white p-3 text-xs text-[#17211B] focus:border-[#16803C] focus:outline-none"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full font-bold gap-2"
                isLoading={sendingContact}
              >
                <Send className="w-4 h-4" />
                <span>Send Inquiry to Shop</span>
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#17211B] text-white py-8 px-4 sm:px-6 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-sm">{shop.name}</p>
            <p className="text-gray-400 text-[11px] mt-0.5">
              Grade A Thrift Boutique • Katangua Market, Super B/Stop, Lagos, Nigeria
            </p>
          </div>

          <div className="flex items-center gap-4 text-gray-300">
            <a
              href={`https://wa.me/${shop.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white font-semibold flex items-center gap-1"
            >
              <MessageCircle className="w-4 h-4 text-[#16803C]" />
              <span>WhatsApp</span>
            </a>
            <span>•</span>
            <a href="tel:+2348031234567" className="hover:text-white">
              Call {shop.phone}
            </a>
            <span>•</span>
            <Link href="/dashboard" className="text-[#F28C28] hover:underline font-bold">
              Owner / Staff Portal →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
