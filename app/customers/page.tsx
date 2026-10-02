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
  Users,
  Search,
  Plus,
  Phone,
  MessageCircle,
  Receipt,
  Mail,
  MapPin,
  ExternalLink,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { formatNaira } from '@/lib/calculations';
import { Customer } from '@/lib/types';

export default function CustomersPage() {
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  // Add Customer Modal
  const [addCustomerModal, setAddCustomerModal] = React.useState(false);
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  // Customer Detail Modal
  const [viewingCustomer, setViewingCustomer] = React.useState<Customer | null>(null);
  const [customerSales, setCustomerSales] = React.useState<any[]>([]);
  const [loadingSales, setLoadingSales] = React.useState(false);

  // Selected receipt
  const [selectedReceiptId, setSelectedReceiptId] = React.useState<string | null>(null);

  // Delete Customer (Owner Only)
  const [customerToDelete, setCustomerToDelete] = React.useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = React.useState(false);
  const [deleteCustomerError, setDeleteCustomerError] = React.useState('');
  const [deleteCustomerSuccess, setDeleteCustomerSuccess] = React.useState('');

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, cRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/customers').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (uRes?.user) setCurrentUser(uRes.user);
      if (cRes?.customers) setCustomers(cRes.customers);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setDeletingCustomer(true);
    setDeleteCustomerError('');
    try {
      const res = await fetch(`/api/customers/${customerToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete customer');
      }
      setCustomerToDelete(null);
      setViewingCustomer(null);
      setDeleteCustomerSuccess(`Customer "${customerToDelete.name}" deleted successfully.`);
      setTimeout(() => setDeleteCustomerSuccess(''), 4000);
      loadData();
    } catch (err: any) {
      setDeleteCustomerError(err?.message || 'Error deleting customer');
    } finally {
      setDeletingCustomer(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add customer');
      }

      setAddCustomerModal(false);
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNotes('');
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Error saving customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewCustomer = async (cust: Customer) => {
    setViewingCustomer(cust);
    setLoadingSales(true);
    try {
      const res = await fetch(`/api/customers/${cust.id}`);
      const data = await res.json();
      if (data.sales) setCustomerSales(data.sales);
    } finally {
      setLoadingSales(false);
    }
  };

  const cleanWhatsAppNumber = (phoneStr?: string | null) => {
    if (!phoneStr) return '';
    const digits = phoneStr.replace(/\D/g, '');
    if (digits.startsWith('0')) return '234' + digits.slice(1);
    if (digits.startsWith('234')) return digits;
    return digits;
  };

  const filtered = customers.filter(
    (c) =>
      !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.address && c.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AppShell
      user={currentUser}
      title="Customer Directory"
      subtitle="Client purchase histories, total spend and direct WhatsApp contacts"
    >
      <div className="space-y-5">
        {/* Search & Actions Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-[12px] border border-[#DDE5DF] shadow-sm">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Input
              placeholder="Search by customer name, phone, area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => setAddCustomerModal(true)}
            className="gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </Button>
        </div>

        {deleteCustomerSuccess && (
          <div className="p-3 bg-[#EAF7EE] border border-[#C5E9CE] rounded-[10px] text-xs font-bold text-[#16803C] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{deleteCustomerSuccess}</span>
          </div>
        )}

        {/* Customer Cards & Directory */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Customer Directory</CardTitle>
              <p className="text-xs text-[#66736B]">
                Sorted by total lifetime spend
              </p>
            </div>
            <span className="text-xs font-semibold text-[#16803C]">
              {customers.length} Registered Customers
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-[10px] animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                title="No Customers Found"
                description="Save your customer details to track sales and send WhatsApp updates."
                actionLabel="Add Customer"
                onAction={() => setAddCustomerModal(true)}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAF9] text-[#66736B] border-b border-[#DDE5DF]">
                    <tr>
                      <th className="py-3 px-4 font-medium">Customer</th>
                      <th className="py-3 px-3 font-medium">Contact Details</th>
                      <th className="py-3 px-3 font-medium">Address</th>
                      <th className="py-3 px-3 font-medium text-center">Purchases</th>
                      <th className="py-3 px-3 font-medium text-right">Total Spent</th>
                      <th className="py-3 px-3 font-medium">Last Purchase</th>
                      <th className="py-3 px-4 text-center font-medium">Connect</th>
                      {currentUser?.role === 'OWNER' && (
                        <th className="py-3 px-3 text-center font-medium">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F1]">
                    {filtered.map((c) => {
                      const waPhone = cleanWhatsAppNumber(c.phone);

                      return (
                        <tr
                          key={c.id}
                          className="hover:bg-[#F8FAF9] transition-colors cursor-pointer"
                          onClick={() => handleViewCustomer(c)}
                        >
                          <td className="py-3 px-4">
                            <p className="font-bold text-[#17211B] text-sm">{c.name}</p>
                            {c.notes && (
                              <p className="text-[10px] text-[#66736B] line-clamp-1 italic">
                                &quot;{c.notes}&quot;
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <p className="text-[#17211B] font-medium">{c.phone || '—'}</p>
                            {c.email && (
                              <p className="text-[10px] text-[#66736B]">{c.email}</p>
                            )}
                          </td>
                          <td className="py-3 px-3 text-[#66736B] max-w-[160px] truncate">
                            {c.address || '—'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge variant="green" className="text-[10px] font-bold">
                              {c.totalPurchases || 0} orders
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-sm text-[#16803C]">
                            {formatNaira(c.totalSpent || 0)}
                          </td>
                          <td className="py-3 px-3 text-[#66736B]">
                            {c.lastPurchaseDate
                              ? new Date(c.lastPurchaseDate).toLocaleDateString('en-NG')
                              : 'No purchases yet'}
                          </td>
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              {waPhone && (
                                <a
                                  href={`https://wa.me/${waPhone}?text=Hello%20${encodeURIComponent(
                                    c.name
                                  )},%20thank%20you%20for%20shopping%20with%20Elegance%20Thrift%20Haven!`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-full bg-[#EAF7EE] text-[#16803C] hover:bg-[#16803C] hover:text-white transition-colors"
                                  title="Chat on WhatsApp"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </a>
                              )}
                              {c.phone && (
                                <a
                                  href={`tel:${c.phone}`}
                                  className="p-1.5 rounded-full bg-gray-100 text-[#17211B] hover:bg-gray-200 transition-colors"
                                  title="Call Customer"
                                >
                                  <Phone className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </td>
                          {currentUser?.role === 'OWNER' && (
                            <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  setDeleteCustomerError('');
                                  setCustomerToDelete(c);
                                }}
                                className="h-7 text-xs px-2"
                                title="Delete Customer Profile"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={addCustomerModal}
        onClose={() => setAddCustomerModal(false)}
        title="Add Customer Profile"
        description="Save customer info for repeat thrift orders and broadcasts"
        maxWidth="sm"
      >
        <form onSubmit={handleAddCustomer} className="space-y-4">
          {error && (
            <div className="p-2.5 rounded-[8px] bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <Input
            label="Full Name"
            placeholder="e.g. Funke Akindele"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Phone Number (WhatsApp)"
            placeholder="+234 803 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            label="Email Address (Optional)"
            type="email"
            placeholder="funke@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Address or FCT Area"
            placeholder="e.g. Garki, Kubwa, FCT"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <div>
            <label className="block text-xs font-medium text-[#17211B] mb-1.5">
              Clothing Preferences / Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Loves chiffon dresses, size M, corporate shirts"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-[10px] border border-[#DDE5DF] p-2.5 text-xs text-[#17211B] focus:border-[#16803C] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setAddCustomerModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submitting}
            >
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Customer Detail & History Modal */}
      <Modal
        isOpen={Boolean(viewingCustomer)}
        onClose={() => setViewingCustomer(null)}
        title={viewingCustomer?.name || 'Customer Profile'}
        description={`Total Spend: ${formatNaira(viewingCustomer?.totalSpent || 0)} across ${viewingCustomer?.totalPurchases || 0} orders`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-[#F8FAF9] rounded-[10px] border border-[#DDE5DF] text-xs">
            <div>
              <p className="text-[#66736B]">Phone:</p>
              <p className="font-bold text-[#17211B]">{viewingCustomer?.phone || '—'}</p>
            </div>
            <div>
              <p className="text-[#66736B]">Address:</p>
              <p className="font-bold text-[#17211B]">{viewingCustomer?.address || '—'}</p>
            </div>
            <div>
              <p className="text-[#66736B]">Preferences:</p>
              <p className="text-[#17211B] italic">{viewingCustomer?.notes || 'None noted'}</p>
            </div>
          </div>

          <h4 className="font-bold text-sm text-[#17211B] pt-2">
            Purchase History
          </h4>

          {loadingSales ? (
            <p className="text-center py-6 text-xs text-[#66736B]">
              Loading orders...
            </p>
          ) : customerSales.length === 0 ? (
            <p className="text-center py-6 text-xs text-[#66736B]">
              No sales recorded for this customer yet.
            </p>
          ) : (
            <div className="border border-[#DDE5DF] rounded-[10px] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAF9] text-[#66736B] border-b border-[#DDE5DF]">
                  <tr>
                    <th className="py-2 px-3">Sale #</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-2 text-center">Items</th>
                    <th className="py-2 px-2">Payment</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                    <th className="py-2 px-2 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F4F1]">
                  {customerSales.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2.5 px-3 font-semibold text-[#17211B]">
                        {s.saleNumber}
                      </td>
                      <td className="py-2.5 px-3 text-[#66736B]">
                        {new Date(s.saleDate).toLocaleDateString('en-NG')}
                      </td>
                      <td className="py-2.5 px-2 text-center">{s.itemCount}</td>
                      <td className="py-2.5 px-2">
                        <Badge variant="green" className="text-[10px]">
                          {s.paymentMethod}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#16803C]">
                        {formatNaira(s.totalAmount)}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => setSelectedReceiptId(s.id)}
                          className="p-1 rounded text-[#16803C] hover:bg-[#EAF7EE]"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-[#F0F4F1]">
            <div>
              {currentUser?.role === 'OWNER' && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    const toDelete = viewingCustomer;
                    setViewingCustomer(null);
                    setDeleteCustomerError('');
                    setCustomerToDelete(toDelete);
                  }}
                  className="text-xs font-semibold"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  <span>Delete Customer</span>
                </Button>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewingCustomer(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Customer Confirmation Modal */}
      <Modal
        isOpen={Boolean(customerToDelete)}
        onClose={() => !deletingCustomer && setCustomerToDelete(null)}
        title="Delete Customer Profile"
        maxWidth="md"
      >
        {customerToDelete && (
          <div className="p-4 sm:p-6 space-y-4">
            {deleteCustomerError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-[10px] text-xs font-bold text-red-600">
                {deleteCustomerError}
              </div>
            )}

            <div className="flex items-start gap-3 p-3.5 bg-red-50/60 rounded-[12px] border border-red-200/80">
              <div className="p-2 bg-red-100 rounded-full text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="text-xs text-[#17211B] space-y-1">
                <p className="font-bold text-red-900">
                  Are you sure you want to delete this customer profile?
                </p>
                <p className="text-[#66736B]">
                  Deleting <strong>{customerToDelete.name}</strong> will remove their profile and WhatsApp history. Past transactions and sales receipts will remain intact.
                </p>
              </div>
            </div>

            {/* Customer Summary Card */}
            <div className="p-3 bg-[#F8FAF9] rounded-[10px] border border-[#DDE5DF] text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#17211B]">{customerToDelete.name}</span>
                <span className="font-extrabold text-[#16803C] text-sm">
                  {formatNaira(customerToDelete.totalSpent || 0)}
                </span>
              </div>
              <div className="flex justify-between text-[#66736B] text-[11px]">
                <span>Phone: {customerToDelete.phone || 'No phone'}</span>
                <span>{customerToDelete.totalPurchases || 0} completed orders</span>
              </div>
              {customerToDelete.address && (
                <p className="text-[10px] text-[#66736B]">
                  Address: {customerToDelete.address}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0F4F1]">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setCustomerToDelete(null)}
                disabled={deletingCustomer}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={handleDeleteCustomer}
                disabled={deletingCustomer}
                className="font-bold min-w-[120px]"
              >
                {deletingCustomer ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(selectedReceiptId)}
        onClose={() => setSelectedReceiptId(null)}
        saleId={selectedReceiptId}
      />
    </AppShell>
  );
}
