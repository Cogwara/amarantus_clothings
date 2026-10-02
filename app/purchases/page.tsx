'use client';

import * as React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Truck,
  Plus,
  Trash2,
  Calendar,
  Building,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { formatNaira } from '@/lib/calculations';
import { PurchaseBatch, Supplier, Product } from '@/lib/types';

interface NewBatchItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  sellingPrice?: number;
}

export default function PurchasesPage() {
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [batches, setBatches] = React.useState<PurchaseBatch[]>([]);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);

  // New Purchase Batch Modal
  const [newBatchModal, setNewBatchModal] = React.useState(false);
  const [supplierId, setSupplierId] = React.useState('');
  const [purchaseDate, setPurchaseDate] = React.useState(
    new Date().toISOString().slice(0, 10)
  );
  const [transportCost, setTransportCost] = React.useState<number>(7500);
  const [otherCosts, setOtherCosts] = React.useState<number>(2000);
  const [batchNotes, setBatchNotes] = React.useState('Thursday market bale opening and first selection items.');
  const [batchItems, setBatchItems] = React.useState<NewBatchItem[]>([]);
  const [submittingBatch, setSubmittingBatch] = React.useState(false);
  const [batchError, setBatchError] = React.useState('');

  // Selected item selector in modal
  const [selectedProdId, setSelectedProdId] = React.useState('');
  const [itemQty, setItemQty] = React.useState<number>(10);
  const [itemCost, setItemCost] = React.useState<number>(3000);
  const [itemSellingPrice, setItemSellingPrice] = React.useState<number>(7500);

  // Batch Detail Modal
  const [viewingBatchId, setViewingBatchId] = React.useState<string | null>(null);
  const [batchDetails, setBatchDetails] = React.useState<any>(null);
  const [loadingDetails, setLoadingDetails] = React.useState(false);

  // Delete Batch (Owner Only)
  const [batchToDelete, setBatchToDelete] = React.useState<any | null>(null);
  const [deletingBatch, setDeletingBatch] = React.useState(false);
  const [deleteBatchError, setDeleteBatchError] = React.useState('');
  const [deleteBatchSuccess, setDeleteBatchSuccess] = React.useState('');

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, bRes, sRes, pRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/purchases').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/suppliers').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/products').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (uRes?.user) setCurrentUser(uRes.user);
      if (bRes?.batches) setBatches(bRes.batches);
      if (sRes?.suppliers) setSuppliers(sRes.suppliers);
      if (pRes?.products) setProducts(pRes.products);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteBatch = async () => {
    if (!batchToDelete) return;
    setDeletingBatch(true);
    setDeleteBatchError('');
    try {
      const res = await fetch(`/api/purchases/${batchToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete purchase batch');
      }
      setBatchToDelete(null);
      setViewingBatchId(null);
      setDeleteBatchSuccess(`Batch ${batchToDelete.batchNumber} deleted successfully.`);
      setTimeout(() => setDeleteBatchSuccess(''), 4000);
      loadData();
    } catch (err: any) {
      setDeleteBatchError(err?.message || 'Error deleting purchase batch');
    } finally {
      setDeletingBatch(false);
    }
  };

  // When product is selected in item adder, default to its cost & price
  const handleProductSelectChange = (id: string) => {
    setSelectedProdId(id);
    const found = products.find((p) => p.id === id);
    if (found) {
      setItemCost(found.costPrice || 3000);
      setItemSellingPrice(found.sellingPrice || 7500);
    }
  };

  const handleAddItemToBatch = () => {
    if (!selectedProdId) return;
    const found = products.find((p) => p.id === selectedProdId);
    if (!found) return;

    // Check if already in batchItems
    setBatchItems((prev) => {
      const idx = prev.findIndex((it) => it.productId === selectedProdId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].quantity += itemQty;
        copy[idx].unitCost = itemCost;
        copy[idx].sellingPrice = itemSellingPrice;
        return copy;
      }
      return [
        ...prev,
        {
          productId: found.id,
          productName: found.name,
          quantity: itemQty,
          unitCost: itemCost,
          sellingPrice: itemSellingPrice,
        },
      ];
    });

    setSelectedProdId('');
  };

  const handleRemoveItem = (index: number) => {
    setBatchItems((prev) => prev.filter((_, i) => i !== index));
  };

  const itemsTotalCost = batchItems.reduce(
    (acc, it) => acc + it.quantity * it.unitCost,
    0
  );
  const totalBatchInvestment =
    itemsTotalCost + Number(transportCost) + Number(otherCosts);

  // Submit batch
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batchItems.length === 0) {
      setBatchError('Please add at least one purchased clothing item.');
      return;
    }

    setSubmittingBatch(true);
    setBatchError('');

    try {
      const payload = {
        supplierId: supplierId || null,
        purchaseDate,
        purchaseAmount: itemsTotalCost,
        transportCost: Number(transportCost),
        otherCosts: Number(otherCosts),
        notes: batchNotes.trim() || null,
        items: batchItems.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitCost: it.unitCost,
          sellingPrice: it.sellingPrice,
        })),
      };

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record purchase batch');
      }

      setNewBatchModal(false);
      setBatchItems([]);
      setBatchNotes('');
      loadData();
    } catch (err: any) {
      setBatchError(err?.message || 'Error recording batch');
    } finally {
      setSubmittingBatch(false);
    }
  };

  // View batch detail
  const handleViewBatch = async (batchId: string) => {
    setViewingBatchId(batchId);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/purchases/${batchId}`);
      const data = await res.json();
      if (data.batch) setBatchDetails(data);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <AppShell
      user={currentUser}
      title="Purchasing & Market Bales"
      subtitle="Manage weekly Thursday market restocks and supplier investments"
    >
      <div className="space-y-6">
        {/* Top Banner: Thursday Market Workflow */}
        <div className="bg-[#EAF7EE] border border-[#C5E9CE] rounded-[12px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-white text-[#16803C] flex items-center justify-center shrink-0 shadow-sm">
              <Truck className="w-5 h-5 text-[#F28C28]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#0F5C2E]">
                Thursday Market Day Workflow
              </h3>
              <p className="text-xs text-[#16803C] mt-1 max-w-2xl leading-relaxed">
                1. Review Thursday recommended quantities → 2. Purchase thrift bales at Amarantus Clothings / Balogun → 3. Record purchase batch and costs → 4. Stock automatically increases in inventory!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={() => setNewBatchModal(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Record Market Batch</span>
            </Button>
          </div>
        </div>

        {deleteBatchSuccess && (
          <div className="p-3 bg-[#EAF7EE] border border-[#C5E9CE] rounded-[10px] text-xs font-bold text-[#16803C] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{deleteBatchSuccess}</span>
          </div>
        )}

        {/* Batches List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Recorded Purchase Batches</CardTitle>
              <p className="text-xs text-[#66736B]">
                Historical stock intake and supplier investments
              </p>
            </div>
            <span className="text-xs font-semibold text-[#16803C]">
              {batches.length} Batches Recorded
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-[10px] animate-pulse" />
                ))}
              </div>
            ) : batches.length === 0 ? (
              <EmptyState
                title="No Purchase Batches Yet"
                description="Record your Thursday market thrift purchases to update your stock."
                actionLabel="Record First Batch"
                onAction={() => setNewBatchModal(true)}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAF9] text-[#66736B] border-b border-[#DDE5DF]">
                    <tr>
                      <th className="py-3 px-4 font-medium">Batch #</th>
                      <th className="py-3 px-3 font-medium">Purchase Date</th>
                      <th className="py-3 px-3 font-medium">Supplier & Market</th>
                      <th className="py-3 px-3 font-medium text-center">Items & Pieces</th>
                      <th className="py-3 px-3 font-medium text-right">Items Cost</th>
                      <th className="py-3 px-3 font-medium text-right">Transport & Other</th>
                      <th className="py-3 px-4 font-medium text-right">Total Investment</th>
                      <th className="py-3 px-4 text-center font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F1]">
                    {batches.map((b) => (
                      <tr key={b.id} className="hover:bg-[#F8FAF9] transition-colors">
                        <td className="py-3 px-4 font-bold text-[#17211B]">
                          {b.batchNumber}
                        </td>
                        <td className="py-3 px-3 text-[#17211B]">
                          {new Date(b.purchaseDate).toLocaleDateString('en-NG', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-[#17211B]">
                            {b.supplierName || 'Market Wholesaler'}
                          </p>
                          <p className="text-[10px] text-[#66736B]">
                            {b.market || 'Amarantus Clothings'}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant="green" className="text-[10px]">
                            {b.itemCount} items ({b.totalPieces || 0} pcs)
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right text-[#17211B]">
                          {formatNaira(b.purchaseAmount)}
                        </td>
                        <td className="py-3 px-3 text-right text-[#66736B]">
                          {formatNaira(b.transportCost + b.otherCosts)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[#16803C] text-sm">
                          {formatNaira(b.totalCost)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewBatch(b.id)}
                              className="h-7 text-xs"
                            >
                              Details
                            </Button>
                            {currentUser?.role === 'OWNER' && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  setDeleteBatchError('');
                                  setBatchToDelete(b);
                                }}
                                className="h-7 text-xs px-2"
                                title="Delete Purchase Batch"
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Record Purchase Batch Modal */}
      <Modal
        isOpen={newBatchModal}
        onClose={() => setNewBatchModal(false)}
        title="Record Thursday Market Purchasing"
        description="Add clothing pieces received and automatically increase store inventory"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateBatch} className="space-y-4">
          {batchError && (
            <div className="p-2.5 rounded-[8px] bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {batchError}
            </div>
          )}

          {/* Supplier, Market Date, Costs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#F8FAF9] rounded-[12px] border border-[#DDE5DF]">
            <div>
              <label className="block text-xs font-medium text-[#17211B] mb-1.5">
                Supplier & Bale Importer
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-[10px] border border-[#DDE5DF] bg-white px-3 py-2 text-xs text-[#17211B] focus:border-[#16803C] focus:outline-none"
              >
                <option value="">Independent Market Seller</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.market})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Input
                label="Purchase Date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Transport / Logistics (₦)"
                type="number"
                min="0"
                step="500"
                placeholder="7500"
                value={transportCost || ''}
                onChange={(e) => setTransportCost(Number(e.target.value) || 0)}
              />
            </div>

            <div className="sm:col-span-2">
              <Input
                label="Notes / Market Trip Comments"
                placeholder="e.g. Amarantus Clothings Thursday early opening, Grade A floral chiffon bales"
                value={batchNotes}
                onChange={(e) => setBatchNotes(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Porter / Gate Fees (₦)"
                type="number"
                min="0"
                step="500"
                placeholder="2000"
                value={otherCosts || ''}
                onChange={(e) => setOtherCosts(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Purchased Items Section */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-[#17211B]">
              Add Purchased Clothes to Batch
            </h4>

            {/* Item selector toolbar */}
            <div className="p-3 bg-white border border-[#DDE5DF] rounded-[10px] grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-medium text-[#17211B] mb-1">
                  Select Product in Catalog
                </label>
                <select
                  value={selectedProdId}
                  onChange={(e) => handleProductSelectChange(e.target.value)}
                  className="w-full rounded-[8px] border border-[#DDE5DF] bg-white px-2.5 py-1.5 text-xs text-[#17211B] focus:border-[#16803C] focus:outline-none"
                >
                  <option value="">Choose item...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Quantity"
                  type="number"
                  min="1"
                  value={itemQty}
                  onChange={(e) => setItemQty(Number(e.target.value) || 1)}
                  className="h-8 py-1 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Unit Cost (₦)"
                  type="number"
                  min="0"
                  step="100"
                  value={itemCost}
                  onChange={(e) => setItemCost(Number(e.target.value) || 0)}
                  className="h-8 py-1 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Selling Price (₦)"
                  type="number"
                  min="0"
                  step="100"
                  value={itemSellingPrice}
                  onChange={(e) => setItemSellingPrice(Number(e.target.value) || 0)}
                  className="h-8 py-1 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAddItemToBatch}
                  disabled={!selectedProdId}
                  className="w-full h-8 text-xs font-bold"
                >
                  + Add Item
                </Button>
              </div>
            </div>

            {/* Items Added List */}
            {batchItems.length === 0 ? (
              <p className="text-center py-4 text-xs text-[#66736B] border border-dashed border-[#DDE5DF] rounded-[10px]">
                No items added to this purchase batch yet. Select clothes above.
              </p>
            ) : (
              <div className="border border-[#DDE5DF] rounded-[10px] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAF9] text-[#66736B] border-b border-[#DDE5DF]">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-2 text-center">Qty</th>
                      <th className="py-2 px-2 text-right">Cost Price</th>
                      <th className="py-2 px-2 text-right">Selling Price</th>
                      <th className="py-2 px-3 text-right">Total Cost</th>
                      <th className="py-2 px-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F1]">
                    {batchItems.map((item, index) => (
                      <tr key={index}>
                        <td className="py-2 px-3 font-semibold text-[#17211B]">
                          {item.productName}
                        </td>
                        <td className="py-2 px-2 text-center font-bold">
                          {item.quantity}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {formatNaira(item.unitCost)}
                        </td>
                        <td className="py-2 px-2 text-right font-medium text-[#16803C]">
                          {formatNaira(item.sellingPrice || 0)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-[#17211B]">
                          {formatNaira(item.quantity * item.unitCost)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 rounded text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Investment Summary */}
          <div className="p-4 bg-[#F8FAF9] rounded-[12px] border border-[#DDE5DF] space-y-1 text-xs">
            <div className="flex justify-between text-[#66736B]">
              <span>Purchased Clothes Subtotal:</span>
              <span>{formatNaira(itemsTotalCost)}</span>
            </div>
            <div className="flex justify-between text-[#66736B]">
              <span>Transport & Porter Fees:</span>
              <span>{formatNaira(Number(transportCost) + Number(otherCosts))}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[#17211B] pt-1 border-t border-[#DDE5DF]">
              <span>TOTAL INVESTMENT:</span>
              <span className="text-[#16803C] text-base">
                {formatNaira(totalBatchInvestment)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setNewBatchModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submittingBatch}
              disabled={batchItems.length === 0}
            >
              Confirm & Receive Stock
            </Button>
          </div>
        </form>
      </Modal>

      {/* Batch Details Modal */}
      <Modal
        isOpen={Boolean(viewingBatchId)}
        onClose={() => setViewingBatchId(null)}
        title={`Batch: ${batchDetails?.batch?.batchNumber}`}
        description="Detailed market purchase intake and received inventory"
        maxWidth="lg"
      >
        {loadingDetails || !batchDetails ? (
          <div className="py-8 text-center text-xs text-[#66736B]">
            Loading batch intake details...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#F8FAF9] rounded-[10px] border border-[#DDE5DF] text-xs">
              <div>
                <p className="text-[#66736B]">Supplier:</p>
                <p className="font-bold text-[#17211B]">{batchDetails.batch.supplierName}</p>
              </div>
              <div>
                <p className="text-[#66736B]">Market:</p>
                <p className="font-bold text-[#17211B]">{batchDetails.batch.market}</p>
              </div>
              <div>
                <p className="text-[#66736B]">Date:</p>
                <p className="font-bold text-[#17211B]">
                  {new Date(batchDetails.batch.purchaseDate).toLocaleDateString('en-NG')}
                </p>
              </div>
              <div>
                <p className="text-[#66736B]">Total Investment:</p>
                <p className="font-bold text-[#16803C] text-sm">
                  {formatNaira(batchDetails.batch.totalCost)}
                </p>
              </div>
            </div>

            <div className="border border-[#DDE5DF] rounded-[10px] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAF9] text-[#66736B] border-b border-[#DDE5DF]">
                  <tr>
                    <th className="py-2 px-3">Product Name</th>
                    <th className="py-2 px-2 text-center">Qty</th>
                    <th className="py-2 px-2 text-right">Unit Cost</th>
                    <th className="py-2 px-2 text-right">Selling Price</th>
                    <th className="py-2 px-3 text-right">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F4F1]">
                  {batchDetails.items.map((it: any) => (
                    <tr key={it.id}>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-[#17211B]">{it.productName}</p>
                        <p className="text-[10px] text-[#66736B]">
                          Size: {it.size} • SKU: {it.productSku}
                        </p>
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-sm">
                        {it.quantity}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {formatNaira(it.unitCost)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-[#16803C] font-semibold">
                        {formatNaira(it.sellingPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {formatNaira(it.totalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {batchDetails.batch.notes && (
              <p className="text-xs text-[#66736B] italic">
                Notes: &quot;{batchDetails.batch.notes}&quot;
              </p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-[#F0F4F1]">
              <div>
                {currentUser?.role === 'OWNER' && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      const toDelete = batchDetails.batch;
                      setViewingBatchId(null);
                      setDeleteBatchError('');
                      setBatchToDelete(toDelete);
                    }}
                    className="text-xs font-semibold"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    <span>Delete Batch</span>
                  </Button>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setViewingBatchId(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Purchase Batch Confirmation Modal */}
      <Modal
        isOpen={Boolean(batchToDelete)}
        onClose={() => !deletingBatch && setBatchToDelete(null)}
        title="Delete Purchase Batch"
        maxWidth="md"
      >
        {batchToDelete && (
          <div className="p-4 sm:p-6 space-y-4">
            {deleteBatchError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-[10px] text-xs font-bold text-red-600">
                {deleteBatchError}
              </div>
            )}

            <div className="flex items-start gap-3 p-3.5 bg-red-50/60 rounded-[12px] border border-red-200/80">
              <div className="p-2 bg-red-100 rounded-full text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="text-xs text-[#17211B] space-y-1">
                <p className="font-bold text-red-900">
                  Are you sure you want to delete this purchase intake?
                </p>
                <p className="text-[#66736B]">
                  This will remove batch <strong>{batchToDelete.batchNumber}</strong> and <strong>reduce received item quantities from current shop stock</strong>.
                </p>
              </div>
            </div>

            {/* Batch Summary Card */}
            <div className="p-3 bg-[#F8FAF9] rounded-[10px] border border-[#DDE5DF] text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#17211B]">{batchToDelete.batchNumber}</span>
                <span className="font-extrabold text-[#16803C] text-sm">
                  {formatNaira(batchToDelete.totalCost)}
                </span>
              </div>
              <div className="flex justify-between text-[#66736B] text-[11px]">
                <span>Supplier: {batchToDelete.supplierName || 'Market Seller'}</span>
                <span>{batchToDelete.itemCount || 0} product types ({batchToDelete.totalPieces || 0} pcs)</span>
              </div>
              <p className="text-[10px] text-[#66736B]">
                Date: {new Date(batchToDelete.purchaseDate).toLocaleDateString('en-NG')}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0F4F1]">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setBatchToDelete(null)}
                disabled={deletingBatch}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={handleDeleteBatch}
                disabled={deletingBatch}
                className="font-bold min-w-[120px]"
              >
                {deletingBatch ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
