'use client';

import * as React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { ReceiptModal } from '@/components/sales/receipt-modal';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  Receipt,
  Phone,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { formatNaira } from '@/lib/calculations';
import { Product, Customer, CartItem, PaymentMethod } from '@/lib/types';

export default function SalesPage() {
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters & POS search
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');

  // Cart State
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = React.useState<string>('');
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('CASH');
  const [overallDiscount, setOverallDiscount] = React.useState<number>(0);
  const [notes, setNotes] = React.useState<string>('');

  // Transaction processing
  const [processing, setProcessing] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const [completedSaleId, setCompletedSaleId] = React.useState<string | null>(null);

  // Quick New Customer Modal
  const [newCustomerModal, setNewCustomerModal] = React.useState(false);
  const [newCustName, setNewCustName] = React.useState('');
  const [newCustPhone, setNewCustPhone] = React.useState('');
  const [newCustAddress, setNewCustAddress] = React.useState('');
  const [savingCustomer, setSavingCustomer] = React.useState(false);

  // Active view: 'pos' or 'history'
  const [activeTab, setActiveTab] = React.useState<'pos' | 'history'>('pos');
  const [salesHistory, setSalesHistory] = React.useState<any[]>([]);

  // Delete Sale (Owner Only)
  const [saleToDelete, setSaleToDelete] = React.useState<any | null>(null);
  const [deletingSale, setDeletingSale] = React.useState(false);
  const [deleteSaleError, setDeleteSaleError] = React.useState('');
  const [deleteSaleSuccess, setDeleteSaleSuccess] = React.useState('');

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, pRes, cRes, cuRes, sRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/products').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/categories').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/customers').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/sales').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (uRes?.user) setCurrentUser(uRes.user);
      if (pRes?.products) setProducts(pRes.products);
      if (cRes?.categories) setCategories(cRes.categories);
      if (cuRes?.customers) setCustomers(cuRes.customers);
      if (sRes?.sales) setSalesHistory(sRes.sales);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteSale = async () => {
    if (!saleToDelete) return;
    setDeletingSale(true);
    setDeleteSaleError('');
    try {
      const res = await fetch(`/api/sales/${saleToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete sale');
      }
      setSaleToDelete(null);
      setDeleteSaleSuccess(`Sale ${saleToDelete.saleNumber} deleted and stock restored.`);
      setTimeout(() => setDeleteSaleSuccess(''), 4000);
      loadData();
    } catch (err: any) {
      setDeleteSaleError(err?.message || 'Error deleting sale');
    } finally {
      setDeletingSale(false);
    }
  };

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.quantity <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          setError(`Cannot add more than ${product.quantity} items available in stock.`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.unitPrice - item.discount,
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            unitPrice: product.sellingPrice,
            discount: 0,
            total: product.sellingPrice,
          },
        ];
      }
    });
    setError('');
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.product.quantity) {
            setError(`Only ${item.product.quantity} units available in stock.`);
            return item;
          }
          return {
            ...item,
            quantity: newQty,
            total: newQty * item.unitPrice - item.discount,
          };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setOverallDiscount(0);
    setNotes('');
    setError('');
  };

  // Cart Totals
  const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
  const grandTotal = Math.max(0, subtotal - overallDiscount);

  // Submit Sale
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      setError('Please add at least one product to the cart');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const payload = {
        customerId: selectedCustomer || null,
        paymentMethod,
        discount: overallDiscount,
        notes: notes || null,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitSellingPrice: item.unitPrice,
          discount: item.discount,
          totalAmount: item.total,
        })),
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete sale');
      }

      // Success: open receipt modal, clear cart, refresh product stock
      setCompletedSaleId(data.sale.saleId);
      clearCart();
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Transaction failed');
    } finally {
      setProcessing(false);
    }
  };

  // Quick Customer Creation
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    setSavingCustomer(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustName.trim(),
          phone: newCustPhone.trim() || null,
          address: newCustAddress.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.customer) {
        setCustomers((prev) => [data.customer, ...prev]);
        setSelectedCustomer(data.customer.id);
        setNewCustomerModal(false);
        setNewCustName('');
        setNewCustPhone('');
        setNewCustAddress('');
      }
    } finally {
      setSavingCustomer(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <AppShell
      user={currentUser}
      title="Point of Sale (POS)"
      subtitle="Fast touch-friendly retail checkout and customer receipting"
    >
      <div className="space-y-4">
        {/* Navigation Tabs: Sell (POS) vs Sales History */}
        <div className="flex items-center justify-between border-b border-[#DDE5DF] pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('pos')}
              className={`px-4 py-2 rounded-[10px] text-sm font-bold transition-all ${
                activeTab === 'pos'
                  ? 'bg-[#16803C] text-white shadow-sm'
                  : 'bg-white text-[#66736B] hover:text-[#17211B] border border-[#DDE5DF]'
              }`}
            >
              🛒 Register (POS)
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-[10px] text-sm font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-[#16803C] text-white shadow-sm'
                  : 'bg-white text-[#66736B] hover:text-[#17211B] border border-[#DDE5DF]'
              }`}
            >
              📜 Sales History ({salesHistory.length})
            </button>
          </div>

          {activeTab === 'pos' && cart.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-xs text-red-600 hover:bg-red-50"
            >
              Clear Cart
            </Button>
          )}
        </div>

        {activeTab === 'history' ? (
          /* Sales History Tab */
          <div className="space-y-4">
            {deleteSaleSuccess && (
              <div className="p-3 bg-[#EAF7EE] border border-[#C5E9CE] rounded-[10px] text-xs font-bold text-[#16803C] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{deleteSaleSuccess}</span>
              </div>
            )}
            <Card>
            <CardHeader className="pb-3 flex items-center justify-between">
              <div>
                <CardTitle>Sales History</CardTitle>
                <p className="text-xs text-[#66736B]">All processed sales and receipts</p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAF9] text-[#66736B] border-b border-[#DDE5DF]">
                    <tr>
                      <th className="py-2.5 px-4 font-medium">Sale #</th>
                      <th className="py-2.5 px-3 font-medium">Customer</th>
                      <th className="py-2.5 px-3 font-medium">Items</th>
                      <th className="py-2.5 px-3 font-medium">Payment</th>
                      <th className="py-2.5 px-3 font-medium text-right">Total</th>
                      <th className="py-2.5 px-3 font-medium text-right">Profit</th>
                      <th className="py-2.5 px-4 text-center font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F1]">
                    {salesHistory.map((s) => (
                      <tr key={s.id} className="hover:bg-[#F8FAF9] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#17211B]">
                          {s.saleNumber}
                          <p className="text-[10px] text-[#66736B] font-normal">
                            {new Date(s.saleDate).toLocaleDateString('en-NG')}
                          </p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-[#17211B]">
                            {s.customerName || 'Walk-in'}
                          </p>
                          {s.customerPhone && (
                            <p className="text-[10px] text-[#66736B]">{s.customerPhone}</p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[#17211B]">
                          {s.itemCount} items
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              s.paymentMethod === 'TRANSFER'
                                ? 'blue'
                                : s.paymentMethod === 'POS'
                                ? 'orange'
                                : 'green'
                            }
                            className="text-[10px]"
                          >
                            {s.paymentMethod}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-[#16803C]">
                          {formatNaira(s.totalAmount)}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-[#17211B]">
                          {formatNaira(s.totalProfit)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => setCompletedSaleId(s.id)}
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Receipt</span>
                            </Button>
                            {currentUser?.role === 'OWNER' && (
                              <Button
                                variant="danger"
                                size="sm"
                                className="h-7 text-xs px-2"
                                onClick={() => {
                                  setDeleteSaleError('');
                                  setSaleToDelete(s);
                                }}
                                title="Delete Sale & Restore Product Stock"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
        ) : (
          /* Register (POS) Tab */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Cols: Product Catalog & Search */}
            <div className="lg:col-span-7 space-y-4">
              {/* Search & Category Pills */}
              <div className="space-y-3">
                <Input
                  placeholder="Search products by name, SKU, or brand..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                  className="bg-white"
                />

                {/* Category Horizontal Scrolling Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                      selectedCategory === ''
                        ? 'bg-[#16803C] text-white shadow-sm'
                        : 'bg-white text-[#66736B] hover:text-[#17211B] border border-[#DDE5DF]'
                    }`}
                  >
                    All Items
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                        selectedCategory === c.id
                          ? 'bg-[#16803C] text-white shadow-sm'
                          : 'bg-white text-[#66736B] hover:text-[#17211B] border border-[#DDE5DF]'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Grid */}
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-44 bg-white rounded-[12px] p-3 animate-pulse border border-[#DDE5DF]" />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <EmptyState
                  title="No Products Found"
                  description="Try adjusting your search query or selecting a different category."
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto pr-1">
                  {filteredProducts.map((p) => {
                    const isOutOfStock = p.quantity <= 0;
                    const inCartItem = cart.find((it) => it.product.id === p.id);

                    return (
                      <div
                        key={p.id}
                        onClick={() => !isOutOfStock && addToCart(p)}
                        className={`bg-white rounded-[12px] border border-[#DDE5DF] p-3 flex flex-col justify-between transition-all select-none relative ${
                          isOutOfStock
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer hover:border-[#16803C] hover:shadow-cardHover active:scale-[0.98]'
                        } ${inCartItem ? 'ring-2 ring-[#16803C] border-[#16803C]' : ''}`}
                      >
                        {/* Image & Badges */}
                        <div className="relative aspect-square w-full rounded-[8px] bg-gray-100 overflow-hidden mb-2 border border-[#F0F4F1]">
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

                          {inCartItem && (
                            <div className="absolute top-1.5 right-1.5 bg-[#16803C] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                              {inCartItem.quantity}
                            </div>
                          )}

                          {p.status === 'CLEARANCE' && (
                            <div className="absolute bottom-1.5 left-1.5 bg-[#F28C28] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                              CLEARANCE
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#17211B] line-clamp-1">
                            {p.name}
                          </h4>
                          <p className="text-[10px] text-[#66736B] mt-0.5">
                            Size: {p.size} • Stock: {p.quantity}
                          </p>
                        </div>

                        {/* Price & Add Touch Button */}
                        <div className="mt-2 pt-2 border-t border-[#F0F4F1] flex items-center justify-between">
                          <span className="text-xs font-bold text-[#16803C]">
                            {formatNaira(p.sellingPrice)}
                          </span>
                          <span className="p-1 rounded-full bg-[#EAF7EE] text-[#16803C]">
                            <Plus className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right 5 Cols: Current Cart & Checkout Panel */}
            <div className="lg:col-span-5">
              <Card className="shadow-md sticky top-20 border-[#DDE5DF]">
                <CardHeader className="py-3 px-4 flex items-center justify-between border-b border-[#F0F4F1]">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-[#16803C]" />
                    <CardTitle className="text-sm font-bold">
                      Current Order ({cart.reduce((a, b) => a + b.quantity, 0)} items)
                    </CardTitle>
                  </div>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Empty
                    </button>
                  )}
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  {error && (
                    <div className="p-2.5 rounded-[8px] bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Cart Items List */}
                  {cart.length === 0 ? (
                    <div className="py-8 text-center text-[#66736B] space-y-2">
                      <div className="w-12 h-12 rounded-full bg-[#F8FAF9] mx-auto flex items-center justify-center text-gray-400 border border-[#DDE5DF]">
                        <ShoppingCart className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-medium">Cart is empty</p>
                      <p className="text-[11px] text-gray-400">
                        Tap any clothing item on the left to add it to the ticket.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#F0F4F1] max-h-60 overflow-y-auto pr-1">
                      {cart.map((item) => (
                        <div
                          key={item.product.id}
                          className="py-2.5 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#17211B] truncate">
                              {item.product.name}
                            </p>
                            <p className="text-[10px] text-[#66736B]">
                              {formatNaira(item.unitPrice)} each • Size: {item.product.size}
                            </p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => updateCartQuantity(item.product.id, -1)}
                              className="w-6 h-6 rounded bg-[#F8FAF9] hover:bg-[#E5EBE7] flex items-center justify-center text-[#17211B] border border-[#DDE5DF]"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.product.id, 1)}
                              className="w-6 h-6 rounded bg-[#F8FAF9] hover:bg-[#E5EBE7] flex items-center justify-center text-[#17211B] border border-[#DDE5DF]"
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

                          {/* Item Total */}
                          <div className="text-right w-16 shrink-0">
                            <span className="text-xs font-bold text-[#17211B]">
                              {formatNaira(item.total)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Customer Selection */}
                  <div className="pt-2 border-t border-[#F0F4F1] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#17211B]">Customer</span>
                      <button
                        onClick={() => setNewCustomerModal(true)}
                        className="text-[#16803C] hover:underline font-bold text-[11px] flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>New Customer</span>
                      </button>
                    </div>

                    <select
                      value={selectedCustomer}
                      onChange={(e) => setSelectedCustomer(e.target.value)}
                      className="w-full rounded-[10px] border border-[#DDE5DF] bg-white px-3 py-2 text-xs text-[#17211B] focus:border-[#16803C] focus:outline-none"
                    >
                      <option value="">Walk-in Customer</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-1.5">
                    <span className="block text-xs font-semibold text-[#17211B]">
                      Payment Method
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['CASH', 'TRANSFER', 'POS', 'OTHER'] as PaymentMethod[]).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMethod(m)}
                          className={`py-2 rounded-[8px] text-xs font-bold border transition-colors ${
                            paymentMethod === m
                              ? 'bg-[#16803C] text-white border-[#16803C] shadow-sm'
                              : 'bg-white text-[#66736B] hover:text-[#17211B] border-[#DDE5DF]'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Overall Discount Input */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#66736B]">General Discount (₦)</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0"
                        value={overallDiscount || ''}
                        onChange={(e) => setOverallDiscount(Number(e.target.value) || 0)}
                        className="w-24 px-2 py-1 text-right text-xs rounded border border-[#DDE5DF] focus:border-[#16803C] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Total Calculations */}
                  <div className="pt-3 border-t border-[#F0F4F1] space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#66736B]">
                      <span>Subtotal:</span>
                      <span>{formatNaira(subtotal)}</span>
                    </div>
                    {overallDiscount > 0 && (
                      <div className="flex justify-between text-[#D96F0B]">
                        <span>Discount:</span>
                        <span>-{formatNaira(overallDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-base font-bold text-[#17211B] pt-1 border-t border-[#F0F4F1]">
                      <span>Total to Pay:</span>
                      <span className="text-xl text-[#16803C]">
                        {formatNaira(grandTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Complete Sale Action Button */}
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full font-bold text-base mt-2"
                    disabled={cart.length === 0}
                    isLoading={processing}
                    onClick={handleCompleteSale}
                  >
                    <span>Complete Sale ({formatNaira(grandTotal)})</span>
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Quick New Customer Modal */}
      <Modal
        isOpen={newCustomerModal}
        onClose={() => setNewCustomerModal(false)}
        title="Register New Customer"
        description="Quickly save customer contact for receipting and WhatsApp broadcasts"
        maxWidth="sm"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <Input
            label="Customer Full Name"
            placeholder="e.g. Funke Akindele"
            value={newCustName}
            onChange={(e) => setNewCustName(e.target.value)}
            required
          />
          <Input
            label="Phone Number (WhatsApp)"
            placeholder="e.g. +234 803 123 4567"
            value={newCustPhone}
            onChange={(e) => setNewCustPhone(e.target.value)}
          />
          <Input
            label="Address or Area"
            placeholder="e.g. Kubwa, FCT"
            value={newCustAddress}
            onChange={(e) => setNewCustAddress(e.target.value)}
          />
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setNewCustomerModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={savingCustomer}
            >
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Sale Confirmation Modal */}
      <Modal
        isOpen={Boolean(saleToDelete)}
        onClose={() => !deletingSale && setSaleToDelete(null)}
        title="Delete Sale Record"
        maxWidth="md"
      >
        {saleToDelete && (
          <div className="p-4 sm:p-6 space-y-4">
            {deleteSaleError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-[10px] text-xs font-bold text-red-600">
                {deleteSaleError}
              </div>
            )}

            <div className="flex items-start gap-3 p-3.5 bg-red-50/60 rounded-[12px] border border-red-200/80">
              <div className="p-2 bg-red-100 rounded-full text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="text-xs text-[#17211B] space-y-1">
                <p className="font-bold text-red-900">
                  Are you sure you want to delete this completed sale?
                </p>
                <p className="text-[#66736B]">
                  Deleting this sale will permanently remove the transaction and <strong>automatically return all sold items back to your inventory stock</strong>.
                </p>
              </div>
            </div>

            {/* Sale Summary Card */}
            <div className="p-3 bg-[#F8FAF9] rounded-[10px] border border-[#DDE5DF] text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#17211B]">{saleToDelete.saleNumber}</span>
                <span className="font-extrabold text-[#16803C] text-sm">
                  {formatNaira(saleToDelete.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-[#66736B] text-[11px]">
                <span>Customer: {saleToDelete.customerName || 'Walk-in'}</span>
                <span>{saleToDelete.itemCount} items • {saleToDelete.paymentMethod}</span>
              </div>
              <p className="text-[10px] text-[#66736B]">
                Date: {new Date(saleToDelete.saleDate).toLocaleString('en-NG')}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0F4F1]">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setSaleToDelete(null)}
                disabled={deletingSale}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={handleDeleteSale}
                disabled={deletingSale}
                className="font-bold min-w-[120px]"
              >
                {deletingSale ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(completedSaleId)}
        onClose={() => setCompletedSaleId(null)}
        saleId={completedSaleId}
      />
    </AppShell>
  );
}
