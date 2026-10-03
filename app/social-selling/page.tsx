'use client';

import * as React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Share2,
  Copy,
  CheckCircle2,
  MessageCircle,
  Instagram,
  Sparkles,
  ExternalLink,
  Tag,
  Trash2,
  Search,
  Filter,
  Download,
  Image as ImageIcon,
  Check,
  X,
  SlidersHorizontal,
  Layers,
  ArrowUpRight,
  Info,
  Clock,
  Eye,
} from 'lucide-react';
import { formatNaira, generateSocialCaptions } from '@/lib/calculations';
import { Product } from '@/lib/types';

export default function SocialSellingPage() {
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = React.useState<string | null>(null);
  const [posts, setPosts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('ALL');
  const [stockFilter, setStockFilter] = React.useState<'ALL' | 'IN_STOCK' | 'CLEARANCE' | 'WITH_IMAGE'>('ALL');
  const [sortBy, setSortBy] = React.useState<'NEWEST' | 'PRICE_DESC' | 'PRICE_ASC' | 'NAME'>('NEWEST');

  // Captions & Options
  const [includeLink, setIncludeLink] = React.useState(true);
  const [whatsappCaption, setWhatsappCaption] = React.useState('');
  const [instagramCaption, setInstagramCaption] = React.useState('');
  const [copiedType, setCopiedType] = React.useState<'wa' | 'ig' | 'img' | 'post-wa' | 'post-ig' | null>(null);
  const [savingPost, setSavingPost] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const shopDetails = {
    name: 'Amarantus Clothings',
    phone: '+234 9065043549',
    address: 'Plot 78 Gbazango Kubwa FCT',
  };

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, pRes, sRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/products').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/social-posts').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (uRes?.user) setCurrentUser(uRes.user);
      if (pRes?.products) {
        setProducts(pRes.products);
        if (pRes.products.length > 0 && !selectedProduct) {
          handleSelectProduct(pRes.products[0], includeLink);
        }
      }
      if (sRes?.posts) setPosts(sRes.posts);
    } finally {
      setLoading(false);
    }
  }, [includeLink, selectedProduct]);

  React.useEffect(() => {
    loadData();
  }, []);

  // Compute Categories from products
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.categoryName) set.add(p.categoryName);
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = React.useMemo(() => {
    return products
      .filter((p) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = p.name?.toLowerCase().includes(q);
          const matchSku = p.sku?.toLowerCase().includes(q);
          const matchBrand = p.brand?.toLowerCase().includes(q);
          const matchCat = p.categoryName?.toLowerCase().includes(q);
          const matchColor = p.color?.toLowerCase().includes(q);
          if (!matchName && !matchSku && !matchBrand && !matchCat && !matchColor) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'ALL') {
          if (p.categoryName !== selectedCategory) return false;
        }

        // Stock / Status filter
        if (stockFilter === 'IN_STOCK' && p.quantity <= 0) return false;
        if (stockFilter === 'CLEARANCE' && p.status !== 'CLEARANCE') return false;
        if (stockFilter === 'WITH_IMAGE') {
          const hasImage = Boolean(p.primaryImageUrl || (p.images && p.images.length > 0));
          if (!hasImage) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'PRICE_DESC') return b.sellingPrice - a.sellingPrice;
        if (sortBy === 'PRICE_ASC') return a.sellingPrice - b.sellingPrice;
        if (sortBy === 'NAME') return a.name.localeCompare(b.name);
        // Default: Newest first
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [products, searchQuery, selectedCategory, stockFilter, sortBy]);

  const handleSelectProduct = (prod: Product, withLinks: boolean = includeLink, specificImage?: string) => {
    setSelectedProduct(prod);

    // Set chosen image
    const initialImg = specificImage || prod.primaryImageUrl || (prod.images && prod.images[0]?.url) || null;
    setSelectedImageUrl(initialImg);

    // Compute direct store link and image link
    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://amarantus-clothings.vercel.app';
    const itemUrl = `${origin}/?item=${encodeURIComponent(prod.sku || prod.id)}`;
    const fullImageUrl = initialImg
      ? initialImg.startsWith('http')
        ? initialImg
        : `${origin}${initialImg}`
      : null;

    const captions = generateSocialCaptions({
      productName: prod.name,
      category: prod.categoryName || 'Clothing',
      size: prod.size,
      condition: prod.condition,
      price: prod.sellingPrice,
      brand: prod.brand,
      shopName: shopDetails.name,
      shopPhone: shopDetails.phone,
      shopAddress: shopDetails.address,
      imageUrl: fullImageUrl,
      itemUrl: itemUrl,
      includeLink: withLinks,
    });

    setWhatsappCaption(captions.whatsapp);
    setInstagramCaption(captions.instagram);
  };

  const handleToggleIncludeLink = (checked: boolean) => {
    setIncludeLink(checked);
    if (selectedProduct) {
      handleSelectProduct(selectedProduct, checked, selectedImageUrl || undefined);
    }
  };

  const handleSelectImageThumbnail = (imgUrl: string) => {
    setSelectedImageUrl(imgUrl);
    if (selectedProduct) {
      handleSelectProduct(selectedProduct, includeLink, imgUrl);
    }
  };

  const handleCopy = (text: string, type: 'wa' | 'ig' | 'post-wa' | 'post-ig') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    showToast('Caption copied to clipboard!', 'success');
    setTimeout(() => setCopiedType(null), 2500);
  };

  // Helper: Download Image
  const handleDownloadImage = async (imgUrl: string | null, customFilename?: string) => {
    if (!imgUrl) {
      showToast('No image available to download', 'info');
      return;
    }
    try {
      const filename =
        customFilename ||
        `Amarantus-${(selectedProduct?.name || 'clothing-item').replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;

      const res = await fetch(imgUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      showToast('Photo downloaded! Ready to upload or share.', 'success');
    } catch (err) {
      // Fallback direct link download
      const a = document.createElement('a');
      a.href = imgUrl;
      a.download = customFilename || 'clothing-photo.jpg';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Photo opened in browser for saving.', 'info');
    }
  };

  // Helper: Copy Image to Clipboard
  const handleCopyImageToClipboard = async (imgUrl: string | null) => {
    if (!imgUrl) {
      showToast('No image available to copy', 'info');
      return;
    }
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imgUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 600;
      canvas.height = img.naturalHeight || 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      ctx.drawImage(img, 0, 0);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (!blob) throw new Error('Canvas conversion failed');

      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopiedType('img');
        showToast('Image copied to clipboard! Paste directly into WhatsApp Web or photo editor.', 'success');
        setTimeout(() => setCopiedType(null), 2500);
        return;
      }
      throw new Error('ClipboardItem write not supported');
    } catch (err) {
      // Fallback: download the image
      handleDownloadImage(imgUrl);
      showToast('Image downloaded to your device.', 'info');
    }
  };

  // Helper: Web Share API with File Attachment
  const handleShareWithPhoto = async (platform: 'WHATSAPP' | 'INSTAGRAM' | 'GENERIC', caption: string, imgUrl?: string | null) => {
    const title = selectedProduct
      ? `${selectedProduct.name} - Amarantus Clothings`
      : 'Amarantus Thrift Drop';
    const activeImg = imgUrl || selectedImageUrl;

    // Check if navigator.share is available
    if (typeof navigator !== 'undefined' && navigator.share) {
      if (activeImg) {
        try {
          const res = await fetch(activeImg);
          const blob = await res.blob();
          const mimeType = blob.type || 'image/jpeg';
          const ext = mimeType.includes('png') ? 'png' : 'jpg';
          const cleanName = (selectedProduct?.name || 'thrift-item').replace(/[^a-zA-Z0-9]/g, '_');
          const file = new File([blob], `${cleanName}.${ext}`, { type: mimeType });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title,
              text: caption,
              files: [file],
            });
            showToast('Post shared with photo successfully!', 'success');
            return;
          }
        } catch (err: any) {
          if (err?.name === 'AbortError') return;
          console.warn('File share failed, attempting text share:', err);
        }
      }

      // Fallback to text sharing via Web Share API
      try {
        await navigator.share({ title, text: caption });
        showToast('Post shared successfully!', 'success');
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    // Fallback for Desktop browsers without Web Share:
    // 1. Copy caption to clipboard
    navigator.clipboard.writeText(caption);

    // 2. Download photo if present
    if (activeImg) {
      handleDownloadImage(activeImg);
    }

    // 3. For WhatsApp, open WhatsApp Web/URL
    if (platform === 'WHATSAPP') {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(caption)}`;
      window.open(waUrl, '_blank');
      showToast('📋 Caption copied & photo downloaded! Paste into WhatsApp chat.', 'info');
    } else {
      showToast('📋 Caption copied & photo downloaded! Ready to post on Instagram.', 'info');
    }
  };

  // Helper: Direct WhatsApp Open
  const handleOpenWhatsAppDirect = (caption: string) => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(caption)}`;
    window.open(waUrl, '_blank');
  };

  const handleSavePost = async (platform: 'WHATSAPP' | 'INSTAGRAM', caption: string) => {
    if (!selectedProduct) return;
    setSavingPost(true);
    try {
      const res = await fetch('/api/social-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          platform,
          caption,
          imageUrl: selectedImageUrl || selectedProduct.primaryImageUrl || null,
          status: 'READY',
        }),
      });

      if (res.ok) {
        const pRes = await fetch('/api/social-posts');
        const data = await pRes.json();
        if (data.posts) setPosts(data.posts);
        showToast(`Saved to Prepared Social Posts tracker!`, 'success');
      }
    } finally {
      setSavingPost(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prepared social post?')) return;
    try {
      const res = await fetch(`/api/social-posts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        showToast('Prepared post removed', 'info');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppShell
      user={currentUser}
      title="Thrift Social Media Generator"
      subtitle="Select listed inventory items, attach high-resolution photos, and post directly to WhatsApp Status and Instagram"
    >
      <div className="space-y-6">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div
              className={`px-4 py-3 rounded-[10px] shadow-lg flex items-center gap-2.5 text-xs font-semibold ${
                toastMessage.type === 'success'
                  ? 'bg-[#16803C] text-white'
                  : 'bg-[#17211B] text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
              <span>{toastMessage.text}</span>
            </div>
          </div>
        )}

        {/* Studio Top Banner */}
        <div className="bg-[#EAF7EE] border border-[#C5E9CE] rounded-[14px] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-white text-[#16803C] flex items-center justify-center shrink-0 shadow-sm border border-[#C5E9CE]">
              <Share2 className="w-5 h-5 text-[#16803C]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#0F5C2E] flex items-center gap-2">
                <span>Thrift Drop & Social Selling Studio</span>
                <Badge variant="green" className="text-[10px] px-2 py-0.5">
                  Live Sync
                </Badge>
              </h3>
              <p className="text-xs text-[#16803C] mt-0.5">
                Pick any item from your catalog to generate high-converting WhatsApp Status drops and Instagram captions with attached photos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <label className="flex items-center gap-2 text-xs font-medium text-[#0F5C2E] cursor-pointer bg-white px-3 py-1.5 rounded-full border border-[#C5E9CE] shadow-2xs">
              <input
                type="checkbox"
                checked={includeLink}
                onChange={(e) => handleToggleIncludeLink(e.target.checked)}
                className="rounded text-[#16803C] focus:ring-[#16803C]"
              />
              <span>Include Photo & Web Links</span>
            </label>
          </div>
        </div>

        {/* 2-Column Studio Grid: Left Catalog Picker (4 cols) & Right Studio Workspace (8 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Listed Items Picker */}
          <div className="lg:col-span-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#66736B] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#16803C]" />
                <span>Listed Items Catalog ({filteredProducts.length})</span>
              </h3>
              {products.length > 0 && (
                <span className="text-[11px] text-[#66736B]">
                  {products.length} total
                </span>
              )}
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#8A968F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, SKU, brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-white border border-[#DDE5DF] rounded-[10px] text-xs text-[#17211B] placeholder:text-[#8A968F] focus:outline-none focus:border-[#16803C] focus:ring-1 focus:ring-[#16803C] shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#8A968F] hover:text-[#17211B]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Chips & Stock Status */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <button
                onClick={() => setStockFilter('ALL')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all ${
                  stockFilter === 'ALL'
                    ? 'bg-[#16803C] text-white border-[#16803C]'
                    : 'bg-white text-[#66736B] border-[#DDE5DF] hover:border-[#16803C]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStockFilter('IN_STOCK')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all ${
                  stockFilter === 'IN_STOCK'
                    ? 'bg-[#16803C] text-white border-[#16803C]'
                    : 'bg-white text-[#66736B] border-[#DDE5DF] hover:border-[#16803C]'
                }`}
              >
                In Stock
              </button>
              <button
                onClick={() => setStockFilter('WITH_IMAGE')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all ${
                  stockFilter === 'WITH_IMAGE'
                    ? 'bg-[#16803C] text-white border-[#16803C]'
                    : 'bg-white text-[#66736B] border-[#DDE5DF] hover:border-[#16803C]'
                }`}
              >
                With Photo
              </button>
              <button
                onClick={() => setStockFilter('CLEARANCE')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all ${
                  stockFilter === 'CLEARANCE'
                    ? 'bg-[#D96F0B] text-white border-[#D96F0B]'
                    : 'bg-white text-[#66736B] border-[#DDE5DF] hover:border-[#D96F0B]'
                }`}
              >
                Clearance
              </button>
            </div>

            {/* Category Dropdown & Sort */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full py-1.5 px-2 bg-white border border-[#DDE5DF] rounded-[8px] text-[11px] text-[#17211B] focus:border-[#16803C] focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full py-1.5 px-2 bg-white border border-[#DDE5DF] rounded-[8px] text-[11px] text-[#17211B] focus:border-[#16803C] focus:outline-none"
                >
                  <option value="NEWEST">Newest First</option>
                  <option value="PRICE_DESC">Price: High to Low</option>
                  <option value="PRICE_ASC">Price: Low to High</option>
                  <option value="NAME">Alphabetical</option>
                </select>
              </div>
            </div>

            {/* Product Scrollable Cards List */}
            <div className="max-h-[640px] overflow-y-auto space-y-2 pr-1 rounded-[12px]">
              {loading && products.length === 0 ? (
                <div className="p-8 text-center bg-white border border-[#DDE5DF] rounded-[12px] space-y-2">
                  <div className="w-6 h-6 border-2 border-[#16803C] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#66736B]">Loading listed items...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-6 text-center bg-white border border-dashed border-[#DDE5DF] rounded-[12px] space-y-2">
                  <p className="text-xs text-[#66736B] font-medium">
                    No items match your filter.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('ALL');
                      setStockFilter('ALL');
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedProduct?.id === p.id;
                  const thumb = p.primaryImageUrl || (p.images && p.images[0]?.url);
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      className={`p-3 bg-white rounded-[12px] border flex items-center gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#16803C] ring-2 ring-[#EAF7EE] shadow-sm bg-[#F9FDFB]'
                          : 'border-[#DDE5DF] hover:border-[#16803C] hover:bg-[#FAFBFB]'
                      }`}
                    >
                      {/* Product Thumbnail */}
                      <div className="w-14 h-14 rounded-[10px] bg-[#F4F7F5] overflow-hidden shrink-0 border border-[#E5EBE7] relative flex items-center justify-center">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-[#8A968F]">
                            <ImageIcon className="w-5 h-5 stroke-[1.5]" />
                            <span className="text-[9px] font-bold mt-0.5">NO IMG</span>
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#16803C] text-white flex items-center justify-center shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-[#17211B] truncate">
                            {p.name}
                          </p>
                          <span className="text-xs font-bold text-[#16803C] shrink-0">
                            {formatNaira(p.sellingPrice)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[10px] text-[#66736B] font-mono bg-gray-50 px-1 rounded border border-gray-200">
                            {p.sku}
                          </span>
                          <span className="text-[10px] text-[#66736B]">
                            Size: <span className="font-semibold text-[#17211B]">{p.size}</span>
                          </span>
                          <span className="text-[10px] text-[#66736B]">
                            • {p.condition === 'EXCELLENT' ? 'Grade A' : p.condition}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-1 text-[10px]">
                          <span className="text-[#8A968F] truncate max-w-[120px]">
                            {p.categoryName || 'Clothing'}
                          </span>
                          {p.quantity > 0 ? (
                            <span className="text-[#16803C] font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#16803C] inline-block" />
                              {p.quantity} in stock
                            </span>
                          ) : (
                            <span className="text-[#DC2626] font-semibold">
                              Out of stock
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Previews, Image Showcase & Social Drop Studio */}
          <div className="lg:col-span-8 space-y-5">
            {selectedProduct ? (
              <Card className="border-[#DDE5DF] shadow-xs">
                {/* Header with Title and Badges */}
                <CardHeader className="pb-3 border-b border-[#F0F4F1] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base text-[#17211B] font-bold">
                        {selectedProduct.name}
                      </CardTitle>
                      {selectedProduct.status === 'CLEARANCE' && (
                        <Badge variant="orange" className="text-[10px]">
                          CLEARANCE
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#66736B] mt-0.5">
                      SKU: <span className="font-mono text-[#17211B] font-semibold">{selectedProduct.sku}</span> • Price:{' '}
                      <span className="text-[#16803C] font-bold">
                        {formatNaira(selectedProduct.sellingPrice)}
                      </span>{' '}
                      • Category: {selectedProduct.categoryName || 'Apparel'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="green" className="text-xs">
                      {selectedProduct.condition === 'EXCELLENT'
                        ? 'Grade A (First Selection)'
                        : selectedProduct.condition}
                    </Badge>
                    <Badge variant={selectedProduct.quantity > 0 ? 'green' : 'red'} className="text-xs">
                      {selectedProduct.quantity > 0 ? `${selectedProduct.quantity} Available` : 'Sold Out'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-6">
                  {/* Photo Showcase & Image Tools */}
                  <div className="bg-[#FAFBFB] border border-[#E5EBE7] rounded-[12px] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#17211B]">
                        <ImageIcon className="w-4 h-4 text-[#16803C]" />
                        <span>Attached Thrift Photo</span>
                        <Badge variant="outline" className="text-[10px] bg-white font-normal">
                          {selectedImageUrl ? 'Photo Ready' : 'No Photo'}
                        </Badge>
                      </div>

                      {/* Photo Action Buttons */}
                      {selectedImageUrl && (
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 gap-1 bg-white hover:bg-gray-50"
                            onClick={() => handleDownloadImage(selectedImageUrl)}
                            title="Download high-res image to device"
                          >
                            <Download className="w-3.5 h-3.5 text-[#16803C]" />
                            <span>Download Photo</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 gap-1 bg-white hover:bg-gray-50"
                            onClick={() => handleCopyImageToClipboard(selectedImageUrl)}
                            title="Copy image to clipboard"
                          >
                            {copiedType === 'img' ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#16803C]" />
                                <span>Image Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-[#66736B]" />
                                <span>Copy Image</span>
                              </>
                            )}
                          </Button>

                          <a
                            href={selectedImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-1.5 rounded-[8px] border border-[#DDE5DF] bg-white text-[#66736B] hover:text-[#17211B] text-xs h-7 w-7"
                            title="Open full photo in new tab"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Image Preview & Multi-image Switcher */}
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Main Featured Photo */}
                      <div className="w-full sm:w-44 h-44 rounded-[10px] bg-white border border-[#DDE5DF] overflow-hidden shrink-0 flex items-center justify-center shadow-2xs relative group">
                        {selectedImageUrl ? (
                          <img
                            src={selectedImageUrl}
                            alt={selectedProduct.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="text-center p-4 text-[#8A968F] space-y-1">
                            <ImageIcon className="w-8 h-8 mx-auto text-[#C5E9CE]" />
                            <p className="text-xs font-semibold text-[#66736B]">No Photo Uploaded</p>
                            <p className="text-[10px]">Add photo via Inventory to include with social drops</p>
                          </div>
                        )}
                        {selectedImageUrl && (
                          <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                            {formatNaira(selectedProduct.sellingPrice)}
                          </div>
                        )}
                      </div>

                      {/* Photo Selector / Info Column */}
                      <div className="flex-1 min-w-0 space-y-2 text-xs">
                        <div className="flex items-center gap-1.5 text-xs text-[#17211B]">
                          <span className="font-semibold">{selectedProduct.name}</span>
                          <span className="text-[#66736B]">• Size {selectedProduct.size}</span>
                        </div>

                        {/* Alternate images if product has multiple */}
                        {selectedProduct.images && selectedProduct.images.length > 1 && (
                          <div className="space-y-1 pt-1">
                            <p className="text-[11px] font-semibold text-[#66736B]">
                              Available Angles / Photos ({selectedProduct.images.length}):
                            </p>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                              {selectedProduct.images.map((img, idx) => {
                                const isCurrent = selectedImageUrl === img.url;
                                return (
                                  <button
                                    key={img.id || idx}
                                    type="button"
                                    onClick={() => handleSelectImageThumbnail(img.url)}
                                    className={`w-12 h-12 rounded-[8px] overflow-hidden border-2 shrink-0 transition-all ${
                                      isCurrent
                                        ? 'border-[#16803C] ring-2 ring-[#EAF7EE] scale-105'
                                        : 'border-[#DDE5DF] opacity-75 hover:opacity-100'
                                    }`}
                                  >
                                    <img
                                      src={img.url}
                                      alt={`View ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="bg-white p-2.5 rounded-[8px] border border-[#E5EBE7] text-[11px] text-[#66736B] space-y-1">
                          <p className="flex items-center gap-1.5 text-[#16803C] font-semibold">
                            <Sparkles className="w-3.5 h-3.5 text-[#16803C]" />
                            <span>One-Tap Direct Posting:</span>
                          </p>
                          <p>
                            Click <strong className="text-[#17211B]">Share with Photo</strong> on mobile or desktop to open your native share sheet with the clothing photo and caption attached automatically!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Status Box */}
                  <div className="space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#16803C]">
                        <MessageCircle className="w-4 h-4 text-[#16803C]" />
                        <span>WhatsApp Status Ready Format</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Primary: Share with Photo via Web Share API */}
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-xs h-7 gap-1.5 bg-[#16803C] hover:bg-[#0F5C2E]"
                          onClick={() =>
                            handleShareWithPhoto(
                              'WHATSAPP',
                              whatsappCaption,
                              selectedImageUrl
                            )
                          }
                          title="Share post with photo directly to WhatsApp Status"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share with Photo</span>
                        </Button>

                        {/* Open Direct WhatsApp */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 gap-1 border-[#C5E9CE] text-[#0F5C2E] hover:bg-[#EAF7EE]"
                          onClick={() => handleOpenWhatsAppDirect(whatsappCaption)}
                          title="Open WhatsApp chat with pre-filled caption"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#16803C]" />
                          <span>Open WhatsApp</span>
                        </Button>

                        {/* Copy WhatsApp Text */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 gap-1"
                          onClick={() => handleCopy(whatsappCaption, 'wa')}
                        >
                          {copiedType === 'wa' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#16803C]" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Text</span>
                            </>
                          )}
                        </Button>

                        {/* Save Post */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-[#16803C]"
                          onClick={() => handleSavePost('WHATSAPP', whatsappCaption)}
                          disabled={savingPost}
                        >
                          Save Post
                        </Button>
                      </div>
                    </div>

                    <textarea
                      rows={8}
                      value={whatsappCaption}
                      onChange={(e) => setWhatsappCaption(e.target.value)}
                      className="w-full rounded-[10px] border border-[#DDE5DF] bg-[#F8FAF9] p-3 text-xs font-mono text-[#17211B] focus:border-[#16803C] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Instagram Post Box */}
                  <div className="space-y-2.5 pt-3 border-t border-[#F0F4F1]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#D96F0B]">
                        <Instagram className="w-4 h-4 text-[#D96F0B]" />
                        <span>Instagram Drop Format (with hashtags)</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Primary: Share to Instagram with Photo */}
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs h-7 gap-1.5 bg-[#F28C28] hover:bg-[#D96F0B]"
                          onClick={() =>
                            handleShareWithPhoto(
                              'INSTAGRAM',
                              instagramCaption,
                              selectedImageUrl
                            )
                          }
                          title="Share photo and caption to Instagram"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share with Photo</span>
                        </Button>

                        {/* Download Photo for Instagram */}
                        {selectedImageUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 gap-1 border-[#FCD9B8] text-[#D96F0B] hover:bg-[#FFF1E2]"
                            onClick={() => handleDownloadImage(selectedImageUrl)}
                            title="Download photo for Instagram upload"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Photo</span>
                          </Button>
                        )}

                        {/* Copy Instagram Caption */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 gap-1"
                          onClick={() => handleCopy(instagramCaption, 'ig')}
                        >
                          {copiedType === 'ig' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#16803C]" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Caption</span>
                            </>
                          )}
                        </Button>

                        {/* Save Post */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-[#D96F0B]"
                          onClick={() => handleSavePost('INSTAGRAM', instagramCaption)}
                          disabled={savingPost}
                        >
                          Save Post
                        </Button>
                      </div>
                    </div>

                    <textarea
                      rows={9}
                      value={instagramCaption}
                      onChange={(e) => setInstagramCaption(e.target.value)}
                      className="w-full rounded-[10px] border border-[#DDE5DF] bg-[#F8FAF9] p-3 text-xs font-sans text-[#17211B] focus:border-[#F28C28] focus:bg-white focus:outline-none"
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-[#DDE5DF] p-12 text-center">
                <div className="space-y-3 max-w-sm mx-auto">
                  <div className="w-12 h-12 rounded-full bg-[#EAF7EE] text-[#16803C] flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-[#17211B]">
                    Select an Item to Start Generating
                  </h3>
                  <p className="text-xs text-[#66736B]">
                    Pick any clothing piece from the catalog on the left to generate formatted captions and post with attached photos.
                  </p>
                </div>
              </Card>
            )}

            {/* Prepared Social Posts Tracker */}
            {posts.length > 0 && (
              <Card className="border-[#DDE5DF] shadow-xs">
                <CardHeader className="pb-3 border-b border-[#F0F4F1] flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-[#17211B] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#16803C]" />
                    <span>Prepared Social Posts Tracker ({posts.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-[#F0F4F1] max-h-80 overflow-y-auto">
                    {posts.map((post) => {
                      const postImg = post.imageUrl;
                      return (
                        <div
                          key={post.id}
                          className="p-3.5 flex flex-col sm:flex-row items-start justify-between gap-3 text-xs hover:bg-[#FAFBFB] transition-colors"
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            {/* Saved Post Thumbnail */}
                            <div className="w-12 h-12 rounded-[8px] bg-[#F4F7F5] border border-[#E5EBE7] overflow-hidden shrink-0 flex items-center justify-center">
                              {postImg ? (
                                <img
                                  src={postImg}
                                  alt={post.productName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-[#8A968F]" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  variant={post.platform === 'WHATSAPP' ? 'green' : 'orange'}
                                  className="text-[10px] px-2 py-0.5 font-bold"
                                >
                                  {post.platform}
                                </Badge>
                                <span className="font-bold text-[#17211B] truncate">
                                  {post.productName}
                                </span>
                                <span className="text-[#16803C] font-semibold">
                                  {formatNaira(post.productPrice || 0)}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#66736B] line-clamp-2 mt-1 font-mono">
                                {post.caption}
                              </p>
                            </div>
                          </div>

                          {/* Post Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            {/* Share with Photo */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2.5 gap-1 border-[#16803C] text-[#16803C] hover:bg-[#EAF7EE]"
                              onClick={() =>
                                handleShareWithPhoto(
                                  post.platform,
                                  post.caption,
                                  postImg
                                )
                              }
                              title="Share post with photo"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Share</span>
                            </Button>

                            {/* Download Image if present */}
                            {postImg && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 px-2"
                                onClick={() => handleDownloadImage(postImg)}
                                title="Download photo"
                              >
                                <Download className="w-3.5 h-3.5 text-[#66736B]" />
                              </Button>
                            )}

                            {/* Open WhatsApp directly if WA post */}
                            {post.platform === 'WHATSAPP' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 px-2 text-[#16803C]"
                                onClick={() => handleOpenWhatsAppDirect(post.caption)}
                                title="Open in WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            {/* Copy Caption */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2.5"
                              onClick={() =>
                                handleCopy(
                                  post.caption,
                                  post.platform === 'WHATSAPP' ? 'post-wa' : 'post-ig'
                                )
                              }
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Copy</span>
                            </Button>

                            {/* Delete Post (Owner) */}
                            {currentUser?.role === 'OWNER' && (
                              <Button
                                variant="danger"
                                size="sm"
                                className="text-xs h-7 px-2"
                                onClick={() => handleDeletePost(post.id)}
                                title="Delete Social Post"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
