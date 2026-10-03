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
  ChevronLeft,
  ChevronDown,
  Camera,
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
  Menu,
  Home,
  Share2,
  Copy,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import { formatNaira, formatCompactNaira } from '@/lib/calculations';
import { Product } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { Logo } from '@/components/ui/logo';
import { InstallAppButton } from '@/components/pwa/pwa-install';
import {
  trackStorefrontEvent,
  sendPresenceHeartbeat,
  trackDebouncedSearch,
} from '@/lib/analytics-tracker';

interface CartItem {
  product: Product;
  quantity: number;
}

const HERO_GRADIENTS: Record<string, { bg: string; border: string; accent: string }> = {
  emerald: {
    bg: 'bg-gradient-to-r from-[#07381C] via-[#0D5C2E] to-[#0A4723]',
    border: 'border-[#16803C]',
    accent: '#FFDC73',
  },
  sunset: {
    bg: 'bg-gradient-to-r from-[#7C2D12] via-[#B45309] to-[#9A3412]',
    border: 'border-[#EA580C]',
    accent: '#FEF08A',
  },
  midnight: {
    bg: 'bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#172554]',
    border: 'border-[#2563EB]',
    accent: '#93C5FD',
  },
  ruby: {
    bg: 'bg-gradient-to-r from-[#881337] via-[#9F1239] to-[#4C0519]',
    border: 'border-[#E11D48]',
    accent: '#FECDD3',
  },
  royal: {
    bg: 'bg-gradient-to-r from-[#3B0764] via-[#581C87] to-[#2E1065]',
    border: 'border-[#9333EA]',
    accent: '#E9D5FF',
  },
};

const DEFAULT_HERO_SLIDES = [
  {
    id: 'default-1',
    title: 'Celebrate Nigeria, Celebrate Savings',
    subtitle: 'Up to 40% off • UK Grade A Thrift',
    tagline: '★ • NAIJA WE DEY FOR YOU •',
    buttonText: 'Shop Now',
    buttonLink: '#catalog',
    imageUrl:
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80',
    imageLayout: 'full',
    bgGradient: 'emerald',
  },
];

export default function FrontShopClient() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [shop, setShop] = React.useState<any>({
    name: 'Amarantus Clothings',
    phone: '+234 9065043549',
    address: 'Plot 78 Gbazango Kubwa FCT',
    currency: 'NGN',
  });
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [selectedCondition, setSelectedCondition] = React.useState('');
  const [clearanceOnly, setClearanceOnly] = React.useState(false);
  const [sortBy, setSortBy] = React.useState('newest');

  // Layout States: Mobile Menu, Dropdowns, Hero Slide, and Flash Sale Countdown
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = React.useState(false);
  const [helpDropdownOpen, setHelpDropdownOpen] = React.useState(false);
  const [heroSlide, setHeroSlide] = React.useState(0);
  const [heroSlides, setHeroSlides] = React.useState<any[]>([]);
  const [flashSaleItems, setFlashSaleItems] = React.useState<any[]>([]);
  const [flashSaleSettings, setFlashSaleSettings] = React.useState<any>({
    title: 'Flash Sales',
    isEnabled: true,
    countdownHours: 24,
  });

  // Hero carousel auto-advance timer
  React.useEffect(() => {
    const total = heroSlides.length > 0 ? heroSlides.length : DEFAULT_HERO_SLIDES.length;
    if (total <= 1) return;
    const interval = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % total);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

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
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [hoverZoom, setHoverZoom] = React.useState<{ isHovered: boolean; x: number; y: number }>({
    isHovered: false,
    x: 50,
    y: 50,
  });

  const handlePhotoMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setHoverZoom({ isHovered: true, x, y });
  };

  const handlePhotoMouseLeave = () => {
    setHoverZoom((prev) => ({ ...prev, isHovered: false }));
  };

  // Share Modal & Toast States
  const [shareModalData, setShareModalData] = React.useState<{
    title: string;
    text: string;
    url: string;
    product?: Product;
  } | null>(null);
  const [copiedToast, setCopiedToast] = React.useState(false);

  React.useEffect(() => {
    setSelectedImageIndex(0);
  }, [detailProduct]);

  const detailImageList = React.useMemo(() => {
    if (!detailProduct) return [];
    if (detailProduct.images && detailProduct.images.length > 0) {
      return detailProduct.images
        .map((img: any) => (typeof img === 'string' ? img : img.url))
        .filter(Boolean);
    }
    if (detailProduct.primaryImageUrl) {
      return [detailProduct.primaryImageUrl];
    }
    return [];
  }, [detailProduct]);

  const currentDetailImage =
    detailImageList[selectedImageIndex] || detailProduct?.primaryImageUrl || '';

  const handlePrevDetailImage = () => {
    if (detailImageList.length === 0) return;
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : detailImageList.length - 1));
  };

  const handleNextDetailImage = () => {
    if (detailImageList.length === 0) return;
    setSelectedImageIndex((prev) => (prev < detailImageList.length - 1 ? prev + 1 : 0));
  };

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
  const [copiedAccount, setCopiedAccount] = React.useState<string | null>(null);

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

      const [res, slidesRes, flashRes] = await Promise.all([
        fetch(`/api/public/products?${params.toString()}`),
        fetch('/api/public/hero-slides').catch(() => null),
        fetch('/api/public/flash-sales').catch(() => null),
      ]);
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
        if (search && search.trim().length >= 2) {
          trackDebouncedSearch(search, data.products.length);
        }
      }
      if (data.categories) setCategories(data.categories);
      if (data.shop) setShop(data.shop);

      if (slidesRes && slidesRes.ok) {
        const slidesData = await slidesRes.json();
        if (slidesData?.slides && slidesData.slides.length > 0) {
          setHeroSlides(slidesData.slides);
        }
      }

      if (flashRes && flashRes.ok) {
        const flashData = await flashRes.json();
        if (flashData?.settings) setFlashSaleSettings(flashData.settings);
        if (flashData?.items) setFlashSaleItems(flashData.items);
      }
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedCondition, clearanceOnly, sortBy]);

  React.useEffect(() => {
    loadStorefront();
  }, [loadStorefront]);

  // Storefront presence tracking: initial page view and periodic heartbeat every 20s
  React.useEffect(() => {
    trackStorefrontEvent({
      eventType: 'PAGE_VIEW',
      pageUrl: typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/',
      pageTitle: typeof document !== 'undefined' ? document.title : 'Amarantus Storefront',
    });
    sendPresenceHeartbeat();

    const heartbeatTimer = setInterval(() => {
      sendPresenceHeartbeat();
    }, 20000);

    return () => clearInterval(heartbeatTimer);
  }, []);

  // Track product modal view and update live presence
  React.useEffect(() => {
    if (detailProduct) {
      trackStorefrontEvent({
        eventType: 'ITEM_VIEW',
        productId: detailProduct.id,
        productName: detailProduct.name,
        productSku: detailProduct.sku,
        pageUrl: `/?item=${encodeURIComponent(detailProduct.sku || detailProduct.id)}`,
        pageTitle: `Viewing ${detailProduct.name}`,
        metadata: {
          sellingPrice: detailProduct.sellingPrice,
          condition: detailProduct.condition,
          size: detailProduct.size,
          category: detailProduct.categoryName,
        },
      });
      sendPresenceHeartbeat(
        `/?item=${encodeURIComponent(detailProduct.sku || detailProduct.id)}`,
        `Viewing: ${detailProduct.name}`
      );
    }
  }, [detailProduct?.id]);

  // Deep-link support: if ?item=SKU or ?item=ID is present in URL, auto-open Product Detail modal
  React.useEffect(() => {
    if (products.length === 0) return;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const itemParam = params.get('item');
      if (itemParam) {
        const found = products.find(
          (p) =>
            p.sku?.toLowerCase() === itemParam.toLowerCase() ||
            p.id.toLowerCase() === itemParam.toLowerCase()
        );
        if (found) {
          setDetailProduct(found);
        }
      }
    }
  }, [products]);

  // Central product open handler that tracks item click
  const handleOpenProduct = (p: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDetailProduct(p);
    trackStorefrontEvent({
      eventType: 'ITEM_CLICK',
      productId: p.id,
      productName: p.name,
      productSku: p.sku,
      pageUrl: `/?item=${encodeURIComponent(p.sku || p.id)}`,
      pageTitle: `Viewing ${p.name}`,
      metadata: {
        sellingPrice: p.sellingPrice,
        condition: p.condition,
        size: p.size,
        category: p.categoryName,
      },
    });
    sendPresenceHeartbeat(
      `/?item=${encodeURIComponent(p.sku || p.id)}`,
      `Viewing: ${p.name}`
    );
  };

  // WhatsApp redirection tracking handlers
  const handleWhatsAppProductClick = (prod: Product, e?: React.MouseEvent) => {
    trackStorefrontEvent({
      eventType: 'WHATSAPP_REDIRECT',
      productId: prod.id,
      productName: prod.name,
      productSku: prod.sku,
      metadata: {
        channel: 'whatsapp_product_order',
        price: prod.sellingPrice,
        condition: prod.condition,
      },
    });
  };

  const handleGeneralWhatsAppClick = (channel: string) => {
    trackStorefrontEvent({
      eventType: 'WHATSAPP_REDIRECT',
      metadata: {
        channel: channel || 'whatsapp_general',
      },
    });
  };

  // Cart operations
  const addToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (product.quantity <= 0) return;

    trackStorefrontEvent({
      eventType: 'ADD_TO_CART',
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      metadata: {
        sellingPrice: product.sellingPrice,
        size: product.size,
        condition: product.condition,
      },
    });

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
    const designText = prod.design ? `\n🎨 Design: ${prod.design}` : '';
    const text = `Hello ${shop.name}! 👋\n\nI want to order this item from your Front Shop:\n\n👗 *${prod.name}*\n📏 Size: ${prod.size}${designText}\n🏷️ Price: ${formatNaira(prod.sellingPrice)}\n⭐ Condition: ${prod.condition}\n\nIs it still available for delivery?`;
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

  // Copy to clipboard helper
  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  // Generic share handler with Web Share API fallback
  const handleShare = async (data: {
    title: string;
    text: string;
    url: string;
    product?: Product;
  }) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: data.text,
          url: data.url,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }
    // Fallback to custom share modal
    setShareModalData(data);
  };

  // Share specific product
  const handleShareProduct = (prod: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://amarantus-clothings.vercel.app';
    const identifier = prod.sku || prod.id;
    const url = `${origin}/?item=${encodeURIComponent(identifier)}`;
    const title = `${prod.name} | Amarantus Clothings`;
    const text = `Look at this UK thrift ${prod.name} (${prod.condition}, Size: ${prod.size}) for ${formatNaira(
      prod.sellingPrice
    )} at Amarantus Clothings! Only ${prod.quantity} available:`;
    handleShare({ title, text, url, product: prod });
  };

  // Share store
  const handleShareStore = () => {
    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://amarantus-clothings.vercel.app';
    const title = 'Amarantus Clothings - Handpicked UK Grade A Thrift Boutique';
    const text =
      'Shop premium UK thrift wear, blazers, vintage jeans & more at Amarantus Clothings. Authentic quality and fast delivery across Nigeria!';
    handleShare({ title, text, url: origin });
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
    <div className="min-h-screen bg-[#F8FAF9] text-[#17211B] flex flex-col font-sans pb-20 lg:pb-0">
      {/* Top Utility Header Bar (Jumia style) */}
      <div className="bg-[#F8FAF9] border-b border-[#DDE5DF] text-xs py-1.5 px-4 hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[#D96F0B] font-bold">
              <Star className="w-3.5 h-3.5 fill-[#F28C28] text-[#F28C28]" />
              <span>Sell on Amarantus Clothings</span>
            </span>
            <span className="text-[#DDE5DF]">|</span>
            <span className="text-[11px] text-[#66736B]">Amarantus Clothings Direct Thrift Bales</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-[#66736B] font-semibold">
            <span className="text-[#16803C] font-bold">AMARANTUS CLOTHINGS PAY</span>
            <span className="text-gray-300">•</span>
            <span>AMARANTUS EXPRESS</span>
            <span className="text-gray-300">•</span>
            <span>DOORSTEP WAYBILL</span>
            <span className="text-gray-300">•</span>
            <span className="text-[#17211B] font-bold">🇳🇬 NGN (₦)</span>
          </div>
        </div>
      </div>

      {/* Main Responsive Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#DDE5DF] shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-6">
          {/* Mobile Menu Hamburger Button & Logo */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-[8px] text-[#17211B] hover:bg-[#F8FAF9] active:bg-[#EAF7EE] transition-colors shrink-0"
              aria-label="Open mobile menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="hidden xs:block">
              <Logo size="md" />
            </div>
            <div className="xs:hidden">
              <Logo size="sm" />
            </div>
          </div>

          {/* Centered Search Bar with attached Orange Button (Desktop) */}
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
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="p-1 text-[#8A968F] hover:text-[#17211B]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
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

          {/* Right Header Navigation: WhatsApp quick link, Account, Help, Cart */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {/* Direct WhatsApp Call/Chat */}
            <a
              href={`https://wa.me/${shop.phone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(
                shop.name
              )},%20I%20want%20to%20inquire%20about%20your%20clothes.`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleGeneralWhatsAppClick('header_chat')}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-[8px] bg-[#EAF7EE] text-[#16803C] hover:bg-[#d5f2dd] text-xs font-bold transition-colors"
              title="Chat with shop on WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-[#16803C]" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            {/* Share Storefront */}
            <button
              type="button"
              onClick={handleShareStore}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-[8px] bg-[#F4F7F5] hover:bg-[#EAEFEA] text-[#17211B] text-xs font-semibold transition-colors"
              title="Share Amarantus Clothings"
              aria-label="Share Storefront"
            >
              <Share2 className="w-4 h-4 text-[#16803C]" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Install PWA App */}
            <InstallAppButton className="hidden sm:inline-flex" />

            {/* Account Dropdown (Desktop & Tablet) */}
            <div className="relative hidden sm:block" onClick={(e) => e.stopPropagation()}>
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

            {/* Help Dropdown (Desktop & Tablet) */}
            <div className="relative hidden md:block" onClick={(e) => e.stopPropagation()}>
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
                    onClick={() => {
                      setHelpDropdownOpen(false);
                      handleGeneralWhatsAppClick('help_dropdown_chat');
                    }}
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
                    <span>Amarantus Clothings Physical Shop</span>
                  </a>
                </div>
              )}
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setCartOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-[10px] bg-[#16803C]/10 hover:bg-[#16803C]/20 text-[#16803C] text-xs sm:text-sm font-bold transition-all relative active:scale-95"
              aria-label="View Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-[#16803C]" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 w-4 h-4 rounded-full bg-[#F28C28] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow">
                    {totalCartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-bold">Cart</span>
              {totalCartAmount > 0 && (
                <span className="hidden md:inline text-xs font-semibold text-[#17211B]">
                  ({formatCompactNaira(totalCartAmount)})
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-3 pb-2.5">
          <div className="flex items-center w-full border-2 border-[#F28C28] rounded-[10px] overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-[#F28C28]/20 transition-all">
            <div className="pl-3 text-[#8A968F] shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search products, brands, categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const el = document.getElementById('catalog');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="w-full px-2.5 py-2 text-xs text-[#17211B] bg-transparent focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="p-1 text-[#8A968F] hover:text-[#17211B]"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => {
                const el = document.getElementById('catalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-2 bg-[#F28C28] hover:bg-[#D96F0B] text-white text-xs font-bold uppercase shrink-0 transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </header>

      {/* Hero & Side Category Section (Jumia Style) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
          {/* Left Side Category Menu (Desktop) */}
          <aside className="hidden lg:flex lg:col-span-3 bg-white rounded-[16px] border border-[#DDE5DF] shadow-sm p-3.5 flex-col justify-between overflow-hidden">
            <div>
              <div className="px-2 pb-2.5 mb-1.5 border-b border-[#F0F4F1] flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#17211B] flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#16803C]" />
                  <span>Categories</span>
                </span>
                <span className="text-[10px] text-[#16803C] bg-[#EAF7EE] font-bold px-2 py-0.5 rounded-full">
                  Thrift Grade A
                </span>
              </div>

              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setClearanceOnly(false);
                    const el = document.getElementById('catalog');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-xs font-semibold transition-all ${
                    selectedCategory === '' && !clearanceOnly
                      ? 'bg-[#16803C] text-white shadow-sm'
                      : 'text-[#17211B] hover:bg-[#F8FAF9] hover:text-[#16803C]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span>🏛️</span>
                    <span>All Collections</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                {categories.map((c) => {
                  const isSelected = selectedCategory === c.id && !clearanceOnly;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCategory(c.id);
                        setClearanceOnly(false);
                        const el = document.getElementById('catalog');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-[#16803C] text-white font-bold shadow-sm'
                          : 'text-[#55635B] hover:bg-[#F8FAF9] hover:text-[#17211B]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">{getCategoryIcon(c.name)}</span>
                        <span>{c.name}</span>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'text-[#8A968F] bg-[#F8FAF9]'
                        }`}
                      >
                        {c.count}
                      </span>
                    </button>
                  );
                })}

                <button
                  onClick={() => {
                    setClearanceOnly(true);
                    const el = document.getElementById('catalog');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-xs font-bold transition-all ${
                    clearanceOnly
                      ? 'bg-[#DC2626] text-white shadow-sm'
                      : 'text-[#DC2626] hover:bg-red-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span>🔥</span>
                    <span>Clearance Deals</span>
                  </div>
                  <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-[#FFF1E2] text-[#D96F0B]">
                    -50%
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Footer Links inside Sidebar */}
            <div className="pt-3 border-t border-[#F0F4F1] space-y-1.5 text-[11px]">
              <a
                href="#contact"
                className="flex items-center justify-between px-3 py-1.5 rounded-[8px] text-[#16803C] hover:bg-[#EAF7EE] font-bold transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Thursday Drops</span>
                </div>
                <span className="text-[10px] bg-[#EAF7EE] text-[#16803C] px-1 rounded">Fresh</span>
              </a>

              <a
                href={`https://wa.me/${shop.phone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(
                  shop.name
                )},%20I%20want%20to%20buy%20wholesale%20bales.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-1.5 rounded-[8px] text-[#D96F0B] hover:bg-[#FFF1E2] font-bold transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 fill-[#F28C28]" />
                  <span>Wholesale Bales</span>
                </div>
                <span className="text-[10px]">Amarantus</span>
              </a>
            </div>
          </aside>

          {/* Hero Promotional Banner Carousel (lg:col-span-9) */}
          {(() => {
            const activeHeroSlides = heroSlides.length > 0 ? heroSlides : DEFAULT_HERO_SLIDES;
            const currentSlide = activeHeroSlides[heroSlide % activeHeroSlides.length] || activeHeroSlides[0];
            const currentTheme = HERO_GRADIENTS[currentSlide.bgGradient] || HERO_GRADIENTS.emerald;

            return (
              <div
                className={`lg:col-span-9 relative rounded-[16px] overflow-hidden ${currentTheme.bg} ${currentTheme.border} text-white shadow-xl min-h-[280px] sm:min-h-[380px] flex items-center border group/hero transition-all duration-700`}
              >
                {/* 100% Full Hero Banner Background Image */}
                {currentSlide.imageUrl && currentSlide.imageLayout !== 'split' && (
                  <div className="absolute inset-0 z-0">
                    <img
                      src={currentSlide.imageUrl}
                      alt={currentSlide.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Rich dark gradient overlay so text, badges, and buttons have 100% contrast */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/35" />
                  </div>
                )}

                {/* Subtle Background Pattern Accent */}
                <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Left and Right Slide Arrows */}
                {activeHeroSlides.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setHeroSlide((prev) =>
                          prev > 0 ? prev - 1 : activeHeroSlides.length - 1
                        )
                      }
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover/hero:opacity-100 transition-opacity shadow-md"
                      aria-label="Previous Slide"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setHeroSlide((prev) => (prev + 1) % activeHeroSlides.length)
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover/hero:opacity-100 transition-opacity shadow-md"
                      aria-label="Next Slide"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                <div
                  key={currentSlide.id || heroSlide}
                  className="relative z-10 w-full p-4 sm:p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 animate-fadeIn"
                >
                  {/* Left Content */}
                  <div className="max-w-xl sm:max-w-2xl space-y-2.5 sm:space-y-4 text-center md:text-left">
                    {/* Tagline */}
                    {currentSlide.tagline && (
                      <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-black tracking-wider uppercase text-white/90">
                        <span className="text-[#F28C28] text-sm sm:text-base">★</span>
                        <span>{currentSlide.tagline}</span>
                      </div>
                    )}

                    {/* Giant Headline */}
                    <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-white whitespace-pre-line drop-shadow-sm">
                      {currentSlide.title}
                    </h1>

                    {/* Subtitle / Offer Pill */}
                    {currentSlide.subtitle && (
                      <div className="pt-1">
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white text-[#17211B] shadow-lg">
                          <span className="text-sm font-black text-[#16803C]">
                            {currentSlide.subtitle}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* CTA Link */}
                    <div className="pt-2">
                      <a
                        href={currentSlide.buttonLink || '#catalog'}
                        onClick={(e) => {
                          if (currentSlide.buttonLink === '#catalog') {
                            e.preventDefault();
                            const el = document.getElementById('catalog');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        target={
                          currentSlide.buttonLink?.startsWith('http')
                            ? '_blank'
                            : '_self'
                        }
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-base font-bold text-white hover:text-[#FFDC73] transition-colors group/cta"
                      >
                        <span className="underline underline-offset-4 decoration-2">
                          {currentSlide.buttonText || 'Shop Now'}
                        </span>
                        <ArrowRight className="w-5 h-5 group-hover/cta:translate-x-1.5 transition-transform" />
                      </a>
                    </div>
                  </div>

                  {/* Right Fashion Montage Graphic (Shown only in split layout) */}
                  {currentSlide.imageUrl && currentSlide.imageLayout === 'split' && (
                    <div className="relative w-full md:w-1/2 flex justify-center items-center">
                      <div className="relative w-full max-w-sm sm:max-w-md aspect-[4/3] rounded-[16px] overflow-hidden shadow-2xl border-4 border-white/20 group">
                        <img
                          src={currentSlide.imageUrl}
                          alt={currentSlide.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
                          <span className="text-[10px] font-bold text-[#F28C28] uppercase tracking-wider">
                            Direct From Amarantus Clothings & Balogun
                          </span>
                          <p className="text-xs font-bold text-white leading-snug">
                            Grade A Handpicked Okrika Drops Every Thursday
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Slide Indicator Dots */}
                {activeHeroSlides.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                    {activeHeroSlides.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setHeroSlide(idx)}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === heroSlide % activeHeroSlides.length
                            ? 'w-5 bg-white'
                            : 'w-1.5 bg-white/40 hover:bg-white/70'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
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
      {flashSaleSettings?.isEnabled !== false && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 w-full">
          <div className="bg-white rounded-[16px] border border-[#DDE5DF] overflow-hidden shadow-sm">
            {/* Header Bar (Red Jumia Flash Sales Style) */}
            <div className="bg-[#E52E04] text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 fill-white text-white" />
                <h2 className="text-base sm:text-lg font-black tracking-wide uppercase">
                  {flashSaleSettings?.title || 'Flash Sales'}
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
              {((flashSaleItems && flashSaleItems.length > 0)
                ? flashSaleItems
                : products.slice(0, 6)
              ).map((item: any) => {
                const p = item.product || item;
                const discountPercent = item.discountPercent || (p.status === 'CLEARANCE' ? 50 : 35);
                const originalPrice = item.originalPrice || Math.round(p.sellingPrice / (1 - discountPercent / 100));
                const flashPrice = item.flashPrice || p.sellingPrice;

                return (
                  <div
                    key={item.id || p.id}
                    onClick={() => handleOpenProduct(p)}
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
                      {p.images && p.images.length > 1 && (
                        <div className="absolute bottom-1.5 right-1.5 bg-black/65 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm pointer-events-none">
                          <Camera className="w-3 h-3 text-[#F28C28]" />
                          <span>{p.images.length}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-[#17211B] line-clamp-1">
                        {p.name}
                      </h4>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-sm font-black text-[#17211B]">
                          {formatNaira(flashPrice)}
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
      )}

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
              
              // Dynamic discount control from shop settings & product overrides
              const showBadges = shop.showDiscountBadges !== false;
              const defaultCatalogDiscount = typeof shop.defaultDiscountPercent === 'number' ? shop.defaultDiscountPercent : 30;
              const defaultClearanceDiscount = typeof shop.clearanceDiscountPercent === 'number' ? shop.clearanceDiscountPercent : 50;

              let discountPercent = 0;
              if (typeof p.discountPercent === 'number') {
                discountPercent = p.discountPercent;
              } else if (p.status === 'CLEARANCE') {
                discountPercent = defaultClearanceDiscount;
              } else if (showBadges) {
                discountPercent = defaultCatalogDiscount;
              }

              const hasDiscount = discountPercent > 0;
              const originalPrice = hasDiscount
                ? Math.round(p.sellingPrice / (1 - discountPercent / 100))
                : p.sellingPrice;

              return (
                <div
                  key={p.id}
                  onClick={() => handleOpenProduct(p)}
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
                    {hasDiscount && (
                      <div className="absolute top-2 right-2 bg-[#DC2626] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                        -{discountPercent}%
                      </div>
                    )}

                    {/* Quick Zoom Button on Hover */}
                    {p.primaryImageUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenProduct(p);
                          setSelectedImageIndex(0);
                          setIsLightboxOpen(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-12 p-1.5 rounded-full bg-black/75 hover:bg-black/95 active:scale-95 text-white backdrop-blur-sm shadow-md z-10 cursor-pointer"
                        title="Click to zoom photo"
                        aria-label="Zoom photo"
                      >
                        <ZoomIn className="w-3.5 h-3.5 text-[#FFDC73]" />
                      </button>
                    )}

                    {/* Quantity Pill */}
                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-[#17211B] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      {p.quantity === 1 ? '⚡ 1 piece only' : `${p.quantity} pcs left`}
                    </div>

                    {p.images && p.images.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/65 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm pointer-events-none">
                        <Camera className="w-3 h-3 text-[#F28C28]" />
                        <span>{p.images.length}</span>
                      </div>
                    )}
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
                          {hasDiscount && (
                            <span className="text-[10px] text-[#8A968F] line-through">
                              {formatNaira(originalPrice)}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#D96F0B] font-bold block mt-0.5">
                          Authentic Grade A
                        </span>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleShareProduct(p, e)}
                          className="p-2 rounded-full transition-all text-[#66736B] hover:text-[#16803C] hover:bg-[#F0F4F1]"
                          title="Share Piece"
                          aria-label="Share this piece"
                        >
                          <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          type="button"
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
                <div
                  onClick={() => setIsLightboxOpen(true)}
                  onMouseMove={handlePhotoMouseMove}
                  onMouseLeave={handlePhotoMouseLeave}
                  className="relative aspect-square w-full rounded-[14px] bg-[#F8FAF9] overflow-hidden border border-[#DDE5DF] shadow-sm select-none cursor-zoom-in group/photo"
                >
                  {currentDetailImage ? (
                    <img
                      src={currentDetailImage}
                      alt={detailProduct.name}
                      style={{
                        transformOrigin: `${hoverZoom.x}% ${hoverZoom.y}%`,
                        transform: hoverZoom.isHovered ? 'scale(2.2)' : 'scale(1)',
                        transition: hoverZoom.isHovered ? 'none' : 'transform 0.25s ease-out',
                      }}
                      className="w-full h-full object-cover pointer-events-none select-none"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center font-bold text-gray-300">
                      <ShoppingBag className="w-12 h-12 stroke-1 text-gray-300" />
                      <span className="text-xs text-[#8A968F] mt-2 font-medium">Amarantus Clothings Thrift</span>
                    </div>
                  )}

                  {/* Condition Pill Overlaid */}
                  <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow z-10 pointer-events-none">
                    <Sparkles className="w-3.5 h-3.5 text-[#F28C28]" />
                    <span>Grade: {detailProduct.condition}</span>
                  </div>

                  {/* Clearance Tag if clearance */}
                  {detailProduct.status === 'CLEARANCE' && (
                    <div className="absolute top-2.5 right-2.5 bg-[#DC2626] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow z-10 pointer-events-none">
                      CLEARANCE SALE
                    </div>
                  )}

                  {/* Zoom Action Hint Button Badge */}
                  {currentDetailImage && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsLightboxOpen(true);
                      }}
                      className="absolute bottom-2.5 left-2.5 bg-black/75 hover:bg-black/90 active:scale-95 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md backdrop-blur-md transition-all cursor-pointer z-10"
                      title="Click to view full screen & zoom"
                      aria-label="Click to zoom image"
                    >
                      <ZoomIn className="w-3.5 h-3.5 text-[#FFDC73]" />
                      <span className="hidden sm:inline">Click to Zoom</span>
                      <span className="sm:hidden">Zoom</span>
                    </button>
                  )}

                  {/* Prev / Next navigation arrows over photo if multiple images */}
                  {detailImageList.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrevDetailImage();
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all shadow-md active:scale-95 cursor-pointer z-10"
                        title="Previous photo"
                        aria-label="Previous photo"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNextDetailImage();
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all shadow-md active:scale-95 cursor-pointer z-10"
                        title="Next photo"
                        aria-label="Next photo"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2.5 right-2.5 bg-black/65 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow pointer-events-none z-10">
                        {selectedImageIndex + 1} / {detailImageList.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Interactive Thumbnail Gallery Strip */}
                {detailImageList.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {detailImageList.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative w-14 h-14 rounded-[8px] overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                          selectedImageIndex === idx
                            ? 'border-[#16803C] ring-2 ring-[#16803C]/25 shadow-sm scale-105'
                            : 'border-[#DDE5DF] opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`${detailProduct.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Quality & Sanitation Badge */}
                <div className="p-3 bg-[#EAF7EE]/70 rounded-[12px] border border-[#C5E9CE] space-y-1.5 text-[11px] text-[#0F5C2E]">
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-[#16803C] shrink-0" />
                    <span>Steam-pressed, clean & ready to wear</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#66736B]">
                    <Truck className="w-4 h-4 text-[#16803C] shrink-0" />
                    <span>Available in Amarantus Clothings shop & online</span>
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
                {(() => {
                  const showBadges = shop.showDiscountBadges !== false;
                  const defaultCatalogDiscount = typeof shop.defaultDiscountPercent === 'number' ? shop.defaultDiscountPercent : 30;
                  const defaultClearanceDiscount = typeof shop.clearanceDiscountPercent === 'number' ? shop.clearanceDiscountPercent : 50;

                  let detailDiscount = 0;
                  if (typeof detailProduct.discountPercent === 'number') {
                    detailDiscount = detailProduct.discountPercent;
                  } else if (detailProduct.status === 'CLEARANCE') {
                    detailDiscount = defaultClearanceDiscount;
                  } else if (showBadges) {
                    detailDiscount = defaultCatalogDiscount;
                  }

                  const hasDetailDiscount = detailDiscount > 0;
                  const detailOriginalPrice = hasDetailDiscount
                    ? Math.round(detailProduct.sellingPrice / (1 - detailDiscount / 100))
                    : detailProduct.sellingPrice;

                  return (
                    <div className="p-3.5 bg-[#F8FAF9] rounded-[12px] border border-[#DDE5DF] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#66736B] block">
                          Price
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl sm:text-3xl font-black text-[#16803C] leading-none">
                            {formatNaira(detailProduct.sellingPrice)}
                          </span>
                          {hasDetailDiscount && (
                            <>
                              <span className="text-sm text-[#8A968F] line-through font-medium">
                                {formatNaira(detailOriginalPrice)}
                              </span>
                              <span className="bg-[#DC2626] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                                -{detailDiscount}%
                              </span>
                            </>
                          )}
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
                  );
                })()}

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
                  {detailProduct.design && (
                    <div className="p-2.5 rounded-[10px] bg-white border border-[#DDE5DF]">
                      <span className="text-[#66736B] block text-[11px]">Design / Style</span>
                      <span className="font-bold text-[#17211B] text-sm mt-0.5 block">{detailProduct.design}</span>
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
                      onClick={() => handleWhatsAppProductClick(detailProduct)}
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

                  {/* Share Piece */}
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => handleShareProduct(detailProduct)}
                    className="w-full font-bold border-[#DDE5DF] hover:bg-[#F8FAF9] text-[#17211B]"
                  >
                    <Share2 className="w-4 h-4 shrink-0 mr-1.5 text-[#16803C]" />
                    <span>Share This Piece</span>
                  </Button>

                  <p className="text-[11px] text-center text-[#8A968F] font-medium">
                    ⚡ Fast FCT Delivery & Nationwide Waybill
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
                      placeholder="e.g. Kubwa, FCT (or Pickup at Amarantus Clothings Shop)"
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
                            {shop?.bankName ? `Pay via ${shop.bankName}` : 'Instant Transfer'}
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
            <div className="p-4 bg-white border border-[#DDE5DF] rounded-[14px] space-y-3 shadow-xs">
              <div className="pb-2 border-b border-[#F0F4F1]">
                <h4 className="font-bold text-sm text-[#17211B]">
                  Shop Bank Transfer Information
                </h4>
                <p className="text-xs text-[#66736B] mt-0.5">
                  Transfer to any of our official shop accounts below:
                </p>
              </div>

              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-0.5">
                {((orderSuccess.bankAccounts && orderSuccess.bankAccounts.length > 0)
                  ? orderSuccess.bankAccounts
                  : (orderSuccess.bankDetails ? [orderSuccess.bankDetails] : [])
                ).map((acc: any, index: number) => {
                  const isCopied = copiedAccount === acc.accountNumber;
                  return (
                    <div
                      key={acc.id || index}
                      className={`p-3 rounded-[10px] border transition-all text-xs ${
                        acc.isPrimary
                          ? 'border-[#A4D4B4] bg-[#F2FAF5]/70'
                          : 'border-[#E4EBE6] bg-[#F9FCFA]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#17211B]">{acc.bankName}</span>
                          {acc.isPrimary && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#16803C] text-white tracking-wide uppercase">
                              Primary
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                              navigator.clipboard.writeText(acc.accountNumber);
                            } else {
                              const textArea = document.createElement('textarea');
                              textArea.value = acc.accountNumber;
                              document.body.appendChild(textArea);
                              textArea.select();
                              document.execCommand('copy');
                              document.body.removeChild(textArea);
                            }
                            setCopiedAccount(acc.accountNumber);
                            setTimeout(() => setCopiedAccount(null), 2500);
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-sans font-bold cursor-pointer transition-all shadow-xs active:scale-95 ${
                            isCopied
                              ? 'bg-[#16803C] text-white'
                              : 'bg-[#EAF7EE] text-[#16803C] hover:bg-[#16803C] hover:text-white'
                          }`}
                          title="Copy Account Number"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="space-y-0.5 font-mono text-[#3D4A41]">
                        <p className="flex items-center gap-1.5 text-xs">
                          <span className="text-[#66736B] font-sans text-[11px]">Account Number:</span>
                          <strong className="text-sm font-mono tracking-wider text-[#16803C]">
                            {acc.accountNumber}
                          </strong>
                        </p>
                        <p className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-[#66736B] font-sans">Account Name:</span>
                          <span className="font-medium text-[#17211B]">{acc.accountName}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-[#F0F4F1] flex items-center justify-between text-xs text-[#66736B]">
                <span>Amount to Transfer:</span>
                <strong className="text-base text-[#16803C] font-mono">
                  {formatNaira(orderSuccess.order.totalAmount)}
                </strong>
              </div>
            </div>

            {/* Direct WhatsApp Confirmation Button */}
            <a
              href={getWhatsAppCartLink(orderSuccess.order)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleGeneralWhatsAppClick('cart_order_dispatch')}
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
              Located Right In FCT
            </h2>
            <p className="text-xs sm:text-sm text-[#66736B] leading-relaxed">
              Prefer to see, touch, and try on our clothes in person? Visit our physical thrift boutique at Amarantus Clothings in FCT.
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
              Grade A Thrift Boutique • Amarantus Clothings, FCT, Nigeria
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

      {/* Storefront Mobile Bottom Navigation Bar (like dashboard BottomNav) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-[#DDE5DF] px-2 flex items-center justify-around z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        {/* 1. Store / Home */}
        <button
          onClick={() => {
            setSelectedCategory('');
            setClearanceOnly(false);
            setSearch('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center justify-center flex-1 py-1 text-center group cursor-pointer"
        >
          <Home
            className={`w-5 h-5 transition-colors ${
              selectedCategory === '' && !clearanceOnly && !search
                ? 'text-[#16803C]'
                : 'text-[#66736B] group-hover:text-[#17211B]'
            }`}
          />
          <span
            className={`text-[10px] font-bold mt-1 transition-colors ${
              selectedCategory === '' && !clearanceOnly && !search
                ? 'text-[#16803C]'
                : 'text-[#66736B] group-hover:text-[#17211B]'
            }`}
          >
            Store
          </span>
        </button>

        {/* 2. Categories Drawer */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-center group cursor-pointer"
        >
          <Filter
            className={`w-5 h-5 transition-colors ${
              selectedCategory !== '' || clearanceOnly
                ? 'text-[#16803C]'
                : 'text-[#66736B] group-hover:text-[#17211B]'
            }`}
          />
          <span
            className={`text-[10px] font-bold mt-1 transition-colors ${
              selectedCategory !== '' || clearanceOnly
                ? 'text-[#16803C]'
                : 'text-[#66736B] group-hover:text-[#17211B]'
            }`}
          >
            Categories
          </span>
        </button>

        {/* 3. Floating Center Cart Button */}
        <button
          onClick={() => setCartOpen(true)}
          className="flex flex-col items-center justify-center -mt-5 flex-1 relative group cursor-pointer"
        >
          <div className="w-13 h-13 rounded-full bg-[#16803C] hover:bg-[#0F5C2E] text-white flex items-center justify-center shadow-lg border-2 border-white transition-transform active:scale-95">
            <ShoppingCart className="w-6 h-6" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1 right-2 min-w-5 h-5 rounded-full bg-[#F28C28] text-white text-[10px] font-black flex items-center justify-center px-1 border-2 border-white shadow">
                {totalCartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-1 text-[#17211B]">
            Bag {totalCartAmount > 0 && `(${formatCompactNaira(totalCartAmount)})`}
          </span>
        </button>

        {/* 4. WhatsApp Chat */}
        <a
          href={`https://wa.me/${shop.phone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(
            shop.name
          )},%20I%20want%20to%20inquire%20about%20your%20clothes.`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleGeneralWhatsAppClick('bottom_bar_chat')}
          className="flex flex-col items-center justify-center flex-1 py-1 text-center group cursor-pointer"
        >
          <MessageCircle className="w-5 h-5 text-[#16803C]" />
          <span className="text-[10px] font-bold mt-1 text-[#66736B] group-hover:text-[#17211B]">
            WhatsApp
          </span>
        </a>

        {/* 5. Account / Staff Sign In */}
        <Link
          href="/dashboard"
          className="flex flex-col items-center justify-center flex-1 py-1 text-center group cursor-pointer"
        >
          <User className="w-5 h-5 text-[#66736B] group-hover:text-[#17211B]" />
          <span className="text-[10px] font-bold mt-1 text-[#66736B] group-hover:text-[#17211B]">
            Admin
          </span>
        </Link>
      </nav>

      {/* Mobile Slide-Out Navigation Drawer (like dashboard AppShell Drawer) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-slideRight">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#F0F4F1] bg-[#F8FAF9]">
              <Logo size="sm" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-full text-[#66736B] hover:bg-white hover:shadow-sm transition-all"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions / Categories inside Drawer */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Install PWA App Card in Mobile Drawer */}
              <div className="p-3 bg-[#EAF7EE] rounded-[12px] border border-[#C5E9CE] flex items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[8px] bg-[#16803C] p-0.5 shrink-0 overflow-hidden shadow-xs">
                    <img src="/icon-192.png" alt="Amarantus" className="w-full h-full object-cover rounded-[6px]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#17211B] leading-tight">Amarantus App</p>
                    <p className="text-[10px] text-[#16803C] font-semibold">Install to phone screen</p>
                  </div>
                </div>
                <InstallAppButton />
              </div>
              {/* Category Collections */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#8A968F] mb-2 px-1">
                  Browse Collections
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setClearanceOnly(false);
                      setMobileMenuOpen(false);
                      const el = document.getElementById('catalog');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] text-xs font-bold transition-all ${
                      selectedCategory === '' && !clearanceOnly
                        ? 'bg-[#16803C] text-white shadow-sm'
                        : 'text-[#17211B] hover:bg-[#F8FAF9]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span>🏛️</span>
                      <span>All Items</span>
                    </div>
                    <span className="text-[10px] opacity-80">{products.length} pcs</span>
                  </button>

                  {categories.map((c) => {
                    const isSelected = selectedCategory === c.id && !clearanceOnly;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCategory(c.id);
                          setClearanceOnly(false);
                          setMobileMenuOpen(false);
                          const el = document.getElementById('catalog');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-[#16803C] text-white font-bold shadow-sm'
                            : 'text-[#55635B] hover:bg-[#F8FAF9] hover:text-[#17211B]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span>{getCategoryIcon(c.name)}</span>
                          <span>{c.name}</span>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            isSelected ? 'bg-white/20 text-white' : 'text-[#8A968F] bg-[#F8FAF9]'
                          }`}
                        >
                          {c.count}
                        </span>
                      </button>
                    );
                  })}

                  <button
                    onClick={() => {
                      setClearanceOnly(true);
                      setMobileMenuOpen(false);
                      const el = document.getElementById('catalog');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] text-xs font-bold transition-all ${
                      clearanceOnly
                        ? 'bg-[#DC2626] text-white shadow-sm'
                        : 'text-[#DC2626] hover:bg-red-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span>🔥</span>
                      <span>Clearance Deals</span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-[#FFF1E2] text-[#D96F0B]">
                      -50%
                    </span>
                  </button>
                </div>
              </div>

              {/* Customer Support Links in Drawer */}
              <div className="pt-2 border-t border-[#F0F4F1]">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#8A968F] mb-2 px-1">
                  Customer Support
                </p>
                <div className="space-y-1.5">
                  <a
                    href={`https://wa.me/${shop.phone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(
                      shop.name
                    )},%20I%20need%20assistance%20with%20an%20order.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleGeneralWhatsAppClick('drawer_support_chat')}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#16803C] bg-[#EAF7EE] hover:bg-[#d4f2dc] rounded-[10px] transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-[#16803C]" />
                    <span>WhatsApp Live Chat</span>
                  </a>

                  {/* Share Storefront Link in Mobile Drawer */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleShareStore();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[#17211B] bg-[#F4F7F5] hover:bg-[#EAEFEA] rounded-[10px] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Share2 className="w-4 h-4 text-[#16803C]" />
                      <span>Share Shop with Friends</span>
                    </div>
                    <span className="text-[10px] text-[#16803C] font-bold">Invite</span>
                  </button>

                  <a
                    href={`tel:${shop.phone.replace(/\D/g, '')}`}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#17211B] hover:bg-[#F8FAF9] rounded-[10px] transition-colors"
                  >
                    <Phone className="w-4 h-4 text-[#F28C28]" />
                    <span>Call Customer Care</span>
                  </a>

                  <div className="flex items-start gap-2.5 px-3 py-2 text-[11px] text-[#66736B]">
                    <MapPin className="w-4 h-4 text-[#8A968F] shrink-0 mt-0.5" />
                    <span>{shop.address}</span>
                  </div>
                </div>
              </div>

              {/* Staff Portal Link */}
              <div className="pt-2 border-t border-[#F0F4F1]">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] bg-[#F8FAF9] hover:bg-[#EAF7EE] text-xs font-bold text-[#17211B] hover:text-[#16803C] border border-[#DDE5DF] transition-all"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#16803C]" />
                    <span>Staff & Owner Sign In</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal Dialog */}
      <Modal
        isOpen={Boolean(shareModalData)}
        onClose={() => setShareModalData(null)}
        title="Share with Friends & Family"
        maxWidth="md"
      >
        {shareModalData && (
          <div className="p-4 sm:p-6 space-y-5">
            {/* Target Item / Store Summary Card */}
            <div className="p-3.5 bg-[#F8FAF9] rounded-[12px] border border-[#DDE5DF] flex items-center gap-3">
              {shareModalData.product ? (
                <>
                  <div className="w-14 h-14 rounded-[8px] bg-white border border-[#DDE5DF] overflow-hidden shrink-0">
                    {shareModalData.product.primaryImageUrl ? (
                      <img
                        src={shareModalData.product.primaryImageUrl}
                        alt={shareModalData.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-xs text-gray-300">
                        CS
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#17211B] truncate">
                      {shareModalData.product.name}
                    </p>
                    <p className="text-[11px] text-[#66736B]">
                      Size: <strong className="text-[#17211B]">{shareModalData.product.size}</strong> • Grade:{' '}
                      <strong className="text-[#16803C]">{shareModalData.product.condition}</strong>
                    </p>
                    <p className="text-xs font-extrabold text-[#16803C] mt-0.5">
                      {formatNaira(shareModalData.product.sellingPrice)}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-[10px] bg-[#16803C] text-white flex items-center justify-center font-black text-base shrink-0 shadow-sm">
                    AC
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#17211B]">{shop.name}</h4>
                    <p className="text-xs text-[#66736B]">
                      Handpicked UK Thrift Boutique • Direct Delivery
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Social Share Buttons Grid */}
            <div>
              <p className="text-xs font-bold text-[#17211B] mb-2.5">Share via social media:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    shareModalData.text + '\n' + shareModalData.url
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-[12px] bg-[#EAF7EE] text-[#16803C] hover:bg-[#d4f2dc] transition-all text-xs font-bold shadow-sm"
                >
                  <MessageCircle className="w-5 h-5 text-[#16803C]" />
                  <span>WhatsApp</span>
                </a>

                {/* X / Twitter */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    shareModalData.text
                  )}&url=${encodeURIComponent(shareModalData.url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-[12px] bg-[#F4F7F5] text-[#17211B] hover:bg-[#EAEFEA] transition-all text-xs font-bold shadow-sm"
                >
                  <span className="text-base font-black leading-none">𝕏</span>
                  <span>X / Twitter</span>
                </a>

                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    shareModalData.url
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-[12px] bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 transition-all text-xs font-bold shadow-sm"
                >
                  <span className="text-base font-black leading-none">f</span>
                  <span>Facebook</span>
                </a>

                {/* Telegram */}
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(
                    shareModalData.url
                  )}&text=${encodeURIComponent(shareModalData.text)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-[12px] bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc]/20 transition-all text-xs font-bold shadow-sm"
                >
                  <Send className="w-5 h-5 text-[#0088cc]" />
                  <span>Telegram</span>
                </a>
              </div>
            </div>

            {/* Direct Link Copy Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17211B]">Or copy link:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareModalData.url}
                  className="w-full text-xs bg-[#F8FAF9] border border-[#DDE5DF] rounded-[8px] px-3 py-2 text-[#17211B] focus:outline-none select-all"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => copyToClipboard(shareModalData.url)}
                  className="shrink-0 font-bold"
                >
                  {copiedToast ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Floating Copied Toast Alert */}
      {copiedToast && (
        <div className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#17211B] text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-white/20 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#16803C]" />
          <span className="text-xs font-semibold">Link copied to clipboard!</span>
        </div>
      )}

      {/* Full-Screen Zoomable Image Lightbox */}
      <ImageLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={detailImageList}
        initialIndex={selectedImageIndex}
        title={detailProduct?.name}
        subtitle={
          detailProduct
            ? `${formatNaira(detailProduct.sellingPrice)} • Grade: ${detailProduct.condition} • Size: ${detailProduct.size}`
            : undefined
        }
      />
    </div>
  );
}
