'use client';

import * as React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/ui/image-upload';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Search,
  Plus,
  Filter,
  SlidersHorizontal,
  History,
  AlertTriangle,
  ArrowUpDown,
  Tag,
  Package,
  Layers,
  LayoutGrid,
  List,
  Pencil,
  Image as ImageIcon,
} from 'lucide-react';
import { formatNaira, calculateMarginPercentage } from '@/lib/calculations';
import { Product, Condition, ProductStatus, MovementType } from '@/lib/types';

export default function InventoryPage() {
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [selectedCondition, setSelectedCondition] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid');

  // Add Product Modal
  const [addProductModal, setAddProductModal] = React.useState(false);
  const [newProdName, setNewProdName] = React.useState('');
  const [newProdCategory, setNewProdCategory] = React.useState('');
  const [newProdSku, setNewProdSku] = React.useState('');
  const [newProdSize, setNewProdSize] = React.useState('M');
  const [newProdGender, setNewProdGender] = React.useState('UNISEX');
  const [newProdCondition, setNewProdCondition] = React.useState<Condition>('EXCELLENT');
  const [newProdBrand, setNewProdBrand] = React.useState('');
  const [newProdColor, setNewProdColor] = React.useState('');
  const [newProdCost, setNewProdCost] = React.useState<number>(3000);
  const [newProdPrice, setNewProdPrice] = React.useState<number>(7500);
  const [newProdQty, setNewProdQty] = React.useState<number>(5);
  const [newProdMinStock, setNewProdMinStock] = React.useState<number>(2);
  const [newProdImages, setNewProdImages] = React.useState<string[]>([]);
  const [submittingProduct, setSubmittingProduct] = React.useState(false);
  const [productError, setProductError] = React.useState('');

  // Edit Product Modal
  const [editModalProduct, setEditModalProduct] = React.useState<Product | null>(null);
  const [editProdName, setEditProdName] = React.useState('');
  const [editProdCategory, setEditProdCategory] = React.useState('');
  const [editProdSize, setEditProdSize] = React.useState('M');
  const [editProdGender, setEditProdGender] = React.useState('UNISEX');
  const [editProdCondition, setEditProdCondition] = React.useState<Condition>('EXCELLENT');
  const [editProdBrand, setEditProdBrand] = React.useState('');
  const [editProdColor, setEditProdColor] = React.useState('');
  const [editProdCost, setEditProdCost] = React.useState<number>(3000);
  const [editProdPrice, setEditProdPrice] = React.useState<number>(7500);
  const [editProdMinStock, setEditProdMinStock] = React.useState<number>(2);
  const [editProdImages, setEditProdImages] = React.useState<string[]>([]);
  const [submittingEdit, setSubmittingEdit] = React.useState(false);
  const [editProductError, setEditProductError] = React.useState('');

  // Stock Adjustment Modal
  const [adjustModalProduct, setAdjustModalProduct] = React.useState<Product | null>(null);
  const [adjustType, setAdjustType] = React.useState<MovementType>('ADJUSTMENT');
  const [adjustQuantityChange, setAdjustQuantityChange] = React.useState<number>(0);
  const [adjustNotes, setAdjustNotes] = React.useState<string>('');
  const [submittingAdjustment, setSubmittingAdjustment] = React.useState(false);
  const [adjustError, setAdjustError] = React.useState('');

  // Movements History Drawer Modal
  const [historyProduct, setHistoryProduct] = React.useState<Product | null>(null);
  const [movements, setMovements] = React.useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, pRes, cRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/products').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/categories').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (uRes?.user) setCurrentUser(uRes.user);
      if (pRes?.products) setProducts(pRes.products);
      if (cRes?.categories) setCategories(cRes.categories);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Open movement history
  const handleOpenHistory = async (prod: Product) => {
    setHistoryProduct(prod);
    setLoadingMovements(true);
    try {
      const res = await fetch(`/api/products/${prod.id}`);
      const data = await res.json();
      if (data.movements) setMovements(data.movements);
    } finally {
      setLoadingMovements(false);
    }
  };

  // Submit new product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdCategory) {
      setProductError('Please fill in product name and select a category.');
      return;
    }

    setSubmittingProduct(true);
    setProductError('');

    try {
      const payload = {
        name: newProdName.trim(),
        categoryId: newProdCategory,
        sku: newProdSku.trim() || undefined,
        size: newProdSize,
        gender: newProdGender,
        condition: newProdCondition,
        brand: newProdBrand.trim() || undefined,
        color: newProdColor.trim() || undefined,
        costPrice: Number(newProdCost),
        sellingPrice: Number(newProdPrice),
        quantity: Number(newProdQty),
        minimumStock: Number(newProdMinStock),
        images: newProdImages,
        imageUrl: newProdImages[0] || undefined,
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add product');
      }

      setAddProductModal(false);
      resetAddForm();
      loadData();
    } catch (err: any) {
      setProductError(err?.message || 'Error creating product');
    } finally {
      setSubmittingProduct(false);
    }
  };

  const resetAddForm = () => {
    setNewProdName('');
    setNewProdSku('');
    setNewProdBrand('');
    setNewProdColor('');
    setNewProdImages([]);
    setNewProdQty(5);
    setNewProdCost(3000);
    setNewProdPrice(7500);
  };

  // Open edit product modal
  const handleOpenEdit = (prod: Product) => {
    setEditModalProduct(prod);
    setEditProdName(prod.name);
    setEditProdCategory(prod.categoryId);
    setEditProdSize(prod.size);
    setEditProdGender(prod.gender);
    setEditProdCondition(prod.condition);
    setEditProdBrand(prod.brand || '');
    setEditProdColor(prod.color || '');
    setEditProdCost(prod.costPrice);
    setEditProdPrice(prod.sellingPrice);
    setEditProdMinStock(prod.minimumStock);

    const existingImages: string[] = [];
    if (prod.images && Array.isArray(prod.images) && prod.images.length > 0) {
      existingImages.push(...prod.images.map((img: any) => img.url));
    } else if (prod.primaryImageUrl) {
      existingImages.push(prod.primaryImageUrl);
    }
    setEditProdImages(existingImages);
    setEditProductError('');
  };

  // Submit edit product changes
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalProduct) return;
    if (!editProdName.trim() || !editProdCategory) {
      setEditProductError('Please fill in product name and select a category.');
      return;
    }

    setSubmittingEdit(true);
    setEditProductError('');

    try {
      const payload = {
        name: editProdName.trim(),
        categoryId: editProdCategory,
        size: editProdSize,
        gender: editProdGender,
        condition: editProdCondition,
        brand: editProdBrand.trim() || null,
        color: editProdColor.trim() || null,
        costPrice: Number(editProdCost),
        sellingPrice: Number(editProdPrice),
        minimumStock: Number(editProdMinStock),
        images: editProdImages,
        imageUrl: editProdImages[0] || undefined,
      };

      const res = await fetch(`/api/products/${editModalProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update product');
      }

      setEditModalProduct(null);
      loadData();
    } catch (err: any) {
      setEditProductError(err?.message || 'Error updating product');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Submit stock adjustment
  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalProduct) return;
    if (adjustQuantityChange === 0) {
      setAdjustError('Please specify a positive or negative quantity change.');
      return;
    }
    if (!adjustNotes.trim()) {
      setAdjustError('Please provide a reason or note for this stock adjustment.');
      return;
    }

    setSubmittingAdjustment(true);
    setAdjustError('');

    try {
      const res = await fetch(`/api/products/${adjustModalProduct.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: adjustType,
          quantityChange: Number(adjustQuantityChange),
          notes: adjustNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to adjust stock');
      }

      setAdjustModalProduct(null);
      setAdjustQuantityChange(0);
      setAdjustNotes('');
      loadData();
    } catch (err: any) {
      setAdjustError(err?.message || 'Adjustment error');
    } finally {
      setSubmittingAdjustment(false);
    }
  };

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    const matchesCondition = !selectedCondition || p.condition === selectedCondition;

    let matchesStatus = true;
    if (selectedStatus === 'LOW_STOCK') {
      matchesStatus = p.quantity <= p.minimumStock && p.quantity > 0;
    } else if (selectedStatus === 'OUT_OF_STOCK') {
      matchesStatus = p.quantity === 0;
    } else if (selectedStatus) {
      matchesStatus = p.status === selectedStatus;
    }

    return matchesSearch && matchesCategory && matchesCondition && matchesStatus;
  });

  const getStatusBadge = (p: Product) => {
    if (p.quantity === 0) {
      return <Badge variant="red">Out of Stock</Badge>;
    }
    if (p.quantity <= p.minimumStock) {
      return <Badge variant="orange">Low Stock ({p.quantity})</Badge>;
    }
    if (p.status === 'CLEARANCE') {
      return <Badge variant="orange">Clearance</Badge>;
    }
    return <Badge variant="green">In Stock ({p.quantity})</Badge>;
  };

  return (
    <AppShell
      user={currentUser}
      title="Thrift Inventory"
      subtitle="Complete stock monitoring, product details and movement audit"
    >
      <div className="space-y-5">
        {/* Header Actions & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-[12px] border border-[#DDE5DF] shadow-sm">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Input
              placeholder="Search by item name, SKU, brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-[#F8FAF9] p-1 rounded-[8px] border border-[#DDE5DF]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-[6px] ${
                  viewMode === 'grid' ? 'bg-white shadow text-[#16803C]' : 'text-[#66736B]'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-[6px] ${
                  viewMode === 'table' ? 'bg-white shadow text-[#16803C]' : 'text-[#66736B]'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {currentUser?.role !== 'STAFF' && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setAddProductModal(true)}
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-[10px] border border-[#DDE5DF] bg-white px-3 py-2 text-xs text-[#17211B] focus:border-[#16803C] focus:outline-none"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Condition Filter */}
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="w-full rounded-[10px] border border-[#DDE5DF] bg-white px-3 py-2 text-xs text-[#17211B] focus:border-[#16803C] focus:outline-none"
          >
            <option value="">All Conditions</option>
            <option value="EXCELLENT">Grade A (Excellent)</option>
            <option value="VERY_GOOD">Grade A- (Very Good)</option>
            <option value="GOOD">Good Condition</option>
            <option value="FAIR">Fair Condition</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full rounded-[10px] border border-[#DDE5DF] bg-white px-3 py-2 text-xs text-[#17211B] focus:border-[#16803C] focus:outline-none"
          >
            <option value="">All Stock Statuses</option>
            <option value="AVAILABLE">Available (In Stock)</option>
            <option value="LOW_STOCK">Low Stock (≤ Minimum)</option>
            <option value="OUT_OF_STOCK">Sold Out / Zero Stock</option>
            <option value="CLEARANCE">Clearance Items</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('');
              setSelectedCondition('');
              setSelectedStatus('');
            }}
            className="px-3 py-2 rounded-[10px] border border-[#DDE5DF] bg-white text-xs font-semibold text-[#66736B] hover:text-[#17211B] hover:bg-[#F8FAF9]"
          >
            Reset Filters
          </button>
        </div>

        {/* Content: Grid or Table View */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-64 bg-white rounded-[12px] p-4 animate-pulse border border-[#DDE5DF]" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            title="No Clothing Items Found"
            description="No inventory items match your current filter parameters."
            actionLabel="Add New Product"
            onAction={() => setAddProductModal(true)}
          />
        ) : viewMode === 'grid' ? (
          /* Card Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((p) => {
              const profitPerItem = p.sellingPrice - p.costPrice;
              const margin = calculateMarginPercentage(profitPerItem, p.sellingPrice);

              return (
                <Card
                  key={p.id}
                  className="flex flex-col justify-between overflow-hidden hover:shadow-cardHover transition-all border-[#DDE5DF]"
                >
                  <div>
                    {/* Photo & Status Badge */}
                    <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden border-b border-[#F0F4F1]">
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
                      <div className="absolute top-2 left-2">
                        {getStatusBadge(p)}
                      </div>
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {p.condition}
                      </div>
                      {p.images && p.images.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/65 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <ImageIcon className="w-3 h-3 text-white" />
                          <span>{p.images.length} photos</span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#66736B]">
                            {p.categoryName} • {p.sku}
                          </p>
                          <h4 className="text-sm font-bold text-[#17211B] line-clamp-1 mt-0.5">
                            {p.name}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#66736B]">
                        <span>Size: <strong className="text-[#17211B]">{p.size}</strong></span>
                        <span>•</span>
                        <span>Brand: <strong className="text-[#17211B]">{p.brand || 'Unbranded'}</strong></span>
                      </div>

                      {/* Pricing Box */}
                      <div className="pt-2 border-t border-[#F0F4F1] flex items-baseline justify-between">
                        <div>
                          <p className="text-[10px] text-[#66736B]">Selling Price</p>
                          <p className="text-base font-bold text-[#16803C]">
                            {formatNaira(p.sellingPrice)}
                          </p>
                        </div>

                        {currentUser?.role !== 'STAFF' && (
                          <div className="text-right">
                            <p className="text-[10px] text-[#66736B]">
                              Cost: {formatNaira(p.costPrice)}
                            </p>
                            <p className="text-[11px] font-bold text-[#17211B]">
                              Margin: +{margin}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-3 bg-[#F8FAF9] border-t border-[#F0F4F1] flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenHistory(p)}
                      className="text-xs font-semibold text-[#66736B] hover:text-[#17211B] flex items-center gap-1"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>History</span>
                    </button>

                    {currentUser?.role !== 'STAFF' && (
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(p)}
                          className="text-xs h-7 px-2"
                          title="Edit Details & Photo"
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAdjustModalProduct(p);
                            setAdjustQuantityChange(0);
                            setAdjustNotes('');
                            setAdjustError('');
                          }}
                          className="text-xs h-7 px-2.5"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
                          <span>Adjust Stock</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAF9] text-[#66736B] border-b border-[#DDE5DF]">
                    <tr>
                      <th className="py-3 px-4 font-medium">Product / SKU</th>
                      <th className="py-3 px-3 font-medium">Category</th>
                      <th className="py-3 px-3 font-medium">Size</th>
                      <th className="py-3 px-3 font-medium">Condition</th>
                      <th className="py-3 px-3 font-medium text-right">Cost Price</th>
                      <th className="py-3 px-3 font-medium text-right">Selling Price</th>
                      <th className="py-3 px-3 font-medium text-center">Stock</th>
                      <th className="py-3 px-3 font-medium">Status</th>
                      <th className="py-3 px-4 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F1]">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-[#F8FAF9] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="relative w-8 h-8 rounded-[6px] overflow-hidden bg-gray-100 border border-[#DDE5DF] shrink-0 flex items-center justify-center">
                              {p.primaryImageUrl ? (
                                <img
                                  src={p.primaryImageUrl}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-[9px] font-bold text-gray-400">CS</span>
                              )}
                              {p.images && p.images.length > 1 && (
                                <div className="absolute bottom-0 right-0 bg-[#16803C] text-white text-[8px] font-bold px-1 rounded-tl shadow-xs" title={`${p.images.length} photos`}>
                                  {p.images.length}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-[#17211B]">{p.name}</p>
                              <p className="text-[10px] text-[#66736B]">
                                {p.sku} {p.brand ? `• ${p.brand}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-[#17211B]">{p.categoryName}</td>
                        <td className="py-3 px-3 font-semibold">{p.size}</td>
                        <td className="py-3 px-3">{p.condition}</td>
                        <td className="py-3 px-3 text-right text-[#66736B]">
                          {formatNaira(p.costPrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-[#16803C]">
                          {formatNaira(p.sellingPrice)}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-base">
                          {p.quantity}
                        </td>
                        <td className="py-3 px-3">{getStatusBadge(p)}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenHistory(p)}
                              className="p-1 rounded text-[#66736B] hover:text-[#17211B]"
                              title="Audit History"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            {currentUser?.role !== 'STAFF' && (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(p)}
                                  className="p-1 rounded text-[#17211B] hover:bg-[#F0F4F1]"
                                  title="Edit Product & Photo"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setAdjustModalProduct(p);
                                    setAdjustQuantityChange(0);
                                    setAdjustNotes('');
                                    setAdjustError('');
                                  }}
                                  className="p-1 rounded text-[#16803C] hover:bg-[#EAF7EE]"
                                  title="Adjust Stock"
                                >
                                  <ArrowUpDown className="w-4 h-4" />
                                </button>
                              </>
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
        )}
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={addProductModal}
        onClose={() => setAddProductModal(false)}
        title="Add New Clothing Item"
        description="Record single thrift clothing pieces into shop inventory"
        maxWidth="lg"
      >
        <form onSubmit={handleAddProduct} className="space-y-4">
          {productError && (
            <div className="p-2.5 rounded-[8px] bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {productError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Product Name"
                placeholder="e.g. Vintage Floral Chiffon Wrap Dress"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#17211B] mb-1.5">
                Category
              </label>
              <select
                value={newProdCategory}
                onChange={(e) => setNewProdCategory(e.target.value)}
                className="w-full rounded-[10px] border border-[#DDE5DF] bg-white px-3.5 py-2.5 text-sm text-[#17211B] focus:border-[#16803C] focus:outline-none"
                required
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Input
                label="Custom SKU (Optional)"
                placeholder="e.g. DRS-001"
                value={newProdSku}
                onChange={(e) => setNewProdSku(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Size"
                placeholder="e.g. S, M, L, XL, 32, Free Size"
                value={newProdSize}
                onChange={(e) => setNewProdSize(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#17211B] mb-1.5">
                Condition
              </label>
              <select
                value={newProdCondition}
                onChange={(e) => setNewProdCondition(e.target.value as Condition)}
                className="w-full rounded-[10px] border border-[#DDE5DF] bg-white px-3.5 py-2.5 text-sm text-[#17211B] focus:border-[#16803C] focus:outline-none"
              >
                <option value="EXCELLENT">Grade A (Like New / First Selection)</option>
                <option value="VERY_GOOD">Grade A- (Very Good)</option>
                <option value="GOOD">Good Condition</option>
                <option value="FAIR">Fair Condition</option>
              </select>
            </div>

            <div>
              <Input
                label="Brand"
                placeholder="e.g. Zara, H&M, Vintage"
                value={newProdBrand}
                onChange={(e) => setNewProdBrand(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Color"
                placeholder="e.g. Navy Blue, Floral Cream"
                value={newProdColor}
                onChange={(e) => setNewProdColor(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Cost Price (₦)"
                type="number"
                min="0"
                step="100"
                placeholder="e.g. 3500"
                value={newProdCost}
                onChange={(e) => setNewProdCost(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <Input
                label="Selling Price (₦)"
                type="number"
                min="0"
                step="100"
                placeholder="e.g. 8500"
                value={newProdPrice}
                onChange={(e) => setNewProdPrice(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <Input
                label="Initial Quantity"
                type="number"
                min="0"
                placeholder="e.g. 5"
                value={newProdQty}
                onChange={(e) => setNewProdQty(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <Input
                label="Low Stock Alert Threshold"
                type="number"
                min="1"
                placeholder="3"
                value={newProdMinStock}
                onChange={(e) => setNewProdMinStock(Number(e.target.value))}
              />
            </div>

            <div className="sm:col-span-2">
              <ImageUpload
                label="Product Photos (Upload multiple photos from device or enter URLs)"
                values={newProdImages}
                onChangeMultiple={(urls) => setNewProdImages(urls)}
                maxFiles={6}
                disabled={submittingProduct}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F4F1]">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setAddProductModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submittingProduct}
            >
              Save Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={Boolean(editModalProduct)}
        onClose={() => setEditModalProduct(null)}
        title={`Edit Product: ${editModalProduct?.name}`}
        description="Update clothing piece details, pricing, or product photo"
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateProduct} className="space-y-4">
          {editProductError && (
            <div className="p-3 rounded-[8px] bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {editProductError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Product Name"
                placeholder="e.g. Floral Chiffon Midi Dress"
                value={editProdName}
                onChange={(e) => setEditProdName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#17211B] mb-1.5">
                Category
              </label>
              <select
                value={editProdCategory}
                onChange={(e) => setEditProdCategory(e.target.value)}
                className="w-full rounded-[10px] border border-[#DDE5DF] bg-white px-3.5 py-2.5 text-sm text-[#17211B] focus:border-[#16803C] focus:outline-none"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Input
                label="Size"
                placeholder="e.g. S, M, L, XL, Free Size"
                value={editProdSize}
                onChange={(e) => setEditProdSize(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#17211B] mb-1.5">
                Condition
              </label>
              <select
                value={editProdCondition}
                onChange={(e) => setEditProdCondition(e.target.value as Condition)}
                className="w-full rounded-[10px] border border-[#DDE5DF] bg-white px-3.5 py-2.5 text-sm text-[#17211B] focus:border-[#16803C] focus:outline-none"
              >
                <option value="EXCELLENT">Grade A (Like New / First Selection)</option>
                <option value="VERY_GOOD">Grade A- (Very Good)</option>
                <option value="GOOD">Good Condition</option>
                <option value="FAIR">Fair Condition</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#17211B] mb-1.5">
                Gender / Department
              </label>
              <select
                value={editProdGender}
                onChange={(e) => setEditProdGender(e.target.value)}
                className="w-full rounded-[10px] border border-[#DDE5DF] bg-white px-3.5 py-2.5 text-sm text-[#17211B] focus:border-[#16803C] focus:outline-none"
              >
                <option value="WOMEN">Women</option>
                <option value="MEN">Men</option>
                <option value="UNISEX">Unisex</option>
                <option value="KIDS">Kids</option>
              </select>
            </div>

            <div>
              <Input
                label="Brand"
                placeholder="e.g. Zara, H&M, Vintage"
                value={editProdBrand}
                onChange={(e) => setEditProdBrand(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Color"
                placeholder="e.g. Navy Blue, Floral Cream"
                value={editProdColor}
                onChange={(e) => setEditProdColor(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Cost Price (₦)"
                type="number"
                min="0"
                step="100"
                value={editProdCost}
                onChange={(e) => setEditProdCost(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <Input
                label="Selling Price (₦)"
                type="number"
                min="0"
                step="100"
                value={editProdPrice}
                onChange={(e) => setEditProdPrice(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <Input
                label="Low Stock Alert Threshold"
                type="number"
                min="1"
                value={editProdMinStock}
                onChange={(e) => setEditProdMinStock(Number(e.target.value))}
              />
            </div>

            <div className="sm:col-span-2">
              <ImageUpload
                label="Product Photos (Upload multiple photos from device or enter URLs)"
                values={editProdImages}
                onChangeMultiple={(urls) => setEditProdImages(urls)}
                maxFiles={6}
                disabled={submittingEdit}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F4F1]">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setEditModalProduct(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submittingEdit}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={Boolean(adjustModalProduct)}
        onClose={() => setAdjustModalProduct(null)}
        title={`Adjust Stock: ${adjustModalProduct?.name}`}
        description="Correct inventory counts with an audit record"
        maxWidth="sm"
      >
        <form onSubmit={handleStockAdjustment} className="space-y-4">
          {adjustError && (
            <div className="p-2.5 rounded-[8px] bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {adjustError}
            </div>
          )}

          <div className="p-3 bg-[#F8FAF9] rounded-[10px] border border-[#DDE5DF] text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-[#66736B]">Current In Stock:</span>
              <span className="font-bold text-[#17211B] text-sm">
                {adjustModalProduct?.quantity} pcs
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#66736B]">After Adjustment:</span>
              <span className="font-bold text-[#16803C] text-sm">
                {(adjustModalProduct?.quantity || 0) + Number(adjustQuantityChange)} pcs
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#17211B] mb-1.5">
              Adjustment Type
            </label>
            <select
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value as MovementType)}
              className="w-full rounded-[10px] border border-[#DDE5DF] bg-white px-3 py-2 text-xs text-[#17211B] focus:border-[#16803C] focus:outline-none"
            >
              <option value="ADJUSTMENT">Stock Count Adjustment / Correction</option>
              <option value="RETURN">Customer Return (+ stock)</option>
              <option value="DAMAGE">Damaged / Stained / Discarded (- stock)</option>
              <option value="CLEARANCE">Clearance Special Transfer</option>
              <option value="PURCHASE">Additional Stock Received</option>
            </select>
          </div>

          <div>
            <Input
              label="Quantity Change (+ or -)"
              type="number"
              placeholder="+2 or -1"
              value={adjustQuantityChange || ''}
              onChange={(e) => setAdjustQuantityChange(Number(e.target.value) || 0)}
              helperText="Use positive number to add stock, negative number to deduct."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#17211B] mb-1.5">
              Reason / Audit Note
            </label>
            <textarea
              rows={2}
              value={adjustNotes}
              onChange={(e) => setAdjustNotes(e.target.value)}
              placeholder="e.g. Physical inventory count verified 2 extra shirts in store"
              className="w-full rounded-[10px] border border-[#DDE5DF] p-2.5 text-xs text-[#17211B] focus:border-[#16803C] focus:outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAdjustModalProduct(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submittingAdjustment}
            >
              Apply Adjustment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Movement History Drawer Modal */}
      <Modal
        isOpen={Boolean(historyProduct)}
        onClose={() => setHistoryProduct(null)}
        title={`Stock Movements: ${historyProduct?.name}`}
        description={`SKU: ${historyProduct?.sku} • Full chronological stock audit`}
        maxWidth="md"
      >
        {loadingMovements ? (
          <div className="py-8 text-center text-xs text-[#66736B]">
            Loading audit movements...
          </div>
        ) : movements.length === 0 ? (
          <p className="text-center py-6 text-xs text-[#66736B]">
            No movement events recorded for this product yet.
          </p>
        ) : (
          <div className="divide-y divide-[#F0F4F1] max-h-96 overflow-y-auto">
            {movements.map((m) => (
              <div key={m.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        m.type === 'PURCHASE'
                          ? 'green'
                          : m.type === 'SALE'
                          ? 'blue'
                          : m.type === 'DAMAGE'
                          ? 'red'
                          : 'orange'
                      }
                      className="text-[10px]"
                    >
                      {m.type}
                    </Badge>
                    <span className="font-bold text-[#17211B]">
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity} pcs
                    </span>
                  </div>
                  <p className="text-[11px] text-[#66736B] mt-1">{m.notes}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    By {m.createdByName || 'System'} • {new Date(m.createdAt).toLocaleString('en-NG')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
