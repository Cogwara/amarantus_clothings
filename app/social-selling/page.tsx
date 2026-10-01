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
} from 'lucide-react';
import { formatNaira, generateSocialCaptions } from '@/lib/calculations';
import { Product } from '@/lib/types';

export default function SocialSellingPage() {
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [posts, setPosts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Captions
  const [whatsappCaption, setWhatsappCaption] = React.useState('');
  const [instagramCaption, setInstagramCaption] = React.useState('');
  const [copiedType, setCopiedType] = React.useState<'wa' | 'ig' | null>(null);
  const [savingPost, setSavingPost] = React.useState(false);

  const shopDetails = {
    name: 'Amarantus Clothings',
    phone: '+234 9065043549',
    address: 'Plot 78 Gbazango Kubwa FCT',
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
        if (pRes.products.length > 0) {
          handleSelectProduct(pRes.products[0]);
        }
      }
      if (sRes?.posts) setPosts(sRes.posts);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
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
    });

    setWhatsappCaption(captions.whatsapp);
    setInstagramCaption(captions.instagram);
  };

  const handleCopy = (text: string, type: 'wa' | 'ig') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
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
          imageUrl: selectedProduct.primaryImageUrl || null,
          status: 'READY',
        }),
      });

      if (res.ok) {
        const pRes = await fetch('/api/social-posts');
        const data = await pRes.json();
        if (data.posts) setPosts(data.posts);
      }
    } finally {
      setSavingPost(false);
    }
  };

  return (
    <AppShell
      user={currentUser}
      title="Social Selling Studio"
      subtitle="Generate high-converting WhatsApp status and Instagram captions for thrift drops"
    >
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-[#EAF7EE] border border-[#C5E9CE] rounded-[12px] p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-white text-[#16803C] flex items-center justify-center shrink-0 shadow-sm">
              <Share2 className="w-5 h-5 text-[#16803C]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#0F5C2E]">
                Thrift Social Media Generator
              </h3>
              <p className="text-xs text-[#16803C] mt-0.5">
                Select any clothing piece to generate ready-to-copy WhatsApp Status broadcasts and Instagram drops.
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Studio: Product Picker (4 cols) & Caption Workspace (8 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Product Selection Grid */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#66736B]">
              Select Item to Advertise ({products.length})
            </h3>

            <div className="max-h-[600px] overflow-y-auto space-y-2 pr-1">
              {products.map((p) => {
                const isSelected = selectedProduct?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    className={`p-3 bg-white rounded-[10px] border flex items-center gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#16803C] ring-2 ring-[#EAF7EE] shadow-sm'
                        : 'border-[#DDE5DF] hover:border-[#16803C]'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-[8px] bg-gray-100 overflow-hidden shrink-0 border border-[#F0F4F1]">
                      {p.primaryImageUrl ? (
                        <img
                          src={p.primaryImageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-gray-300">
                          CS
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#17211B] truncate">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-[#66736B]">
                        Size: {p.size} • {p.condition}
                      </p>
                      <p className="text-xs font-bold text-[#16803C] mt-0.5">
                        {formatNaira(p.sellingPrice)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Previews & Copyable Captions */}
          <div className="lg:col-span-8 space-y-5">
            {selectedProduct && (
              <Card className="border-[#DDE5DF]">
                <CardHeader className="pb-3 border-b border-[#F0F4F1] flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{selectedProduct.name}</CardTitle>
                    <p className="text-xs text-[#66736B]">
                      SKU: {selectedProduct.sku} • Price: {formatNaira(selectedProduct.sellingPrice)}
                    </p>
                  </div>
                  <Badge variant="green">{selectedProduct.condition}</Badge>
                </CardHeader>
                <CardContent className="p-5 space-y-6">
                  {/* WhatsApp Status Box */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#16803C]">
                        <MessageCircle className="w-4 h-4 text-[#16803C]" />
                        <span>WhatsApp Status Ready Format</span>
                      </div>
                      <div className="flex items-center gap-2">
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
                              <span>Copy WhatsApp Text</span>
                            </>
                          )}
                        </Button>
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
                      rows={7}
                      value={whatsappCaption}
                      onChange={(e) => setWhatsappCaption(e.target.value)}
                      className="w-full rounded-[10px] border border-[#DDE5DF] bg-[#F8FAF9] p-3 text-xs font-mono text-[#17211B] focus:border-[#16803C] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Instagram Post Box */}
                  <div className="space-y-2 pt-2 border-t border-[#F0F4F1]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#D96F0B]">
                        <Instagram className="w-4 h-4 text-[#D96F0B]" />
                        <span>Instagram Drop Format (with hashtags)</span>
                      </div>
                      <div className="flex items-center gap-2">
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
                              <span>Copy Instagram Caption</span>
                            </>
                          )}
                        </Button>
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
                      rows={8}
                      value={instagramCaption}
                      onChange={(e) => setInstagramCaption(e.target.value)}
                      className="w-full rounded-[10px] border border-[#DDE5DF] bg-[#F8FAF9] p-3 text-xs font-sans text-[#17211B] focus:border-[#F28C28] focus:bg-white focus:outline-none"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Saved Social Posts History */}
            {posts.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Prepared Social Posts Tracker</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-[#F0F4F1] max-h-60 overflow-y-auto">
                    {posts.map((post) => (
                      <div key={post.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={post.platform === 'WHATSAPP' ? 'green' : 'orange'}
                              className="text-[10px]"
                            >
                              {post.platform}
                            </Badge>
                            <span className="font-bold text-[#17211B]">
                              {post.productName}
                            </span>
                            <span className="text-[#66736B]">
                              ({formatNaira(post.productPrice || 0)})
                            </span>
                          </div>
                          <p className="text-[11px] text-[#66736B] line-clamp-2 mt-1">
                            {post.caption}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 shrink-0"
                          onClick={() =>
                            handleCopy(
                              post.caption,
                              post.platform === 'WHATSAPP' ? 'wa' : 'ig'
                            )
                          }
                        >
                          Copy
                        </Button>
                      </div>
                    ))}
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
