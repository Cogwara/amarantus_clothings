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
  Wallet,
  Plus,
  Trash2,
  Calendar,
  Filter,
  PieChart as PieIcon,
  TrendingDown,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { formatNaira } from '@/lib/calculations';
import { Expense, ExpenseCategory } from '@/lib/types';

// Helper for local date string YYYY-MM-DD
function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper for local month string YYYY-MM
function getLocalMonthString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export default function ExpensesPage() {
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [breakdown, setBreakdown] = React.useState<any[]>([]);
  const [currentMonthTotal, setCurrentMonthTotal] = React.useState<number>(0);
  const [allTimeTotal, setAllTimeTotal] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(true);

  // Filters - default to '' (All Months) so all operating expenses are visible
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [selectedMonth, setSelectedMonth] = React.useState('');

  // Add Expense Modal
  const [addModal, setAddModal] = React.useState(false);
  const [category, setCategory] = React.useState<ExpenseCategory>('TRANSPORT');
  const [description, setDescription] = React.useState('');
  const [amount, setAmount] = React.useState<number>(5000);
  const [expenseDate, setExpenseDate] = React.useState(getLocalDateString());
  const [submitting, setSubmitting] = React.useState(false);
  const [modalError, setModalError] = React.useState('');

  // Edit Expense Modal
  const [editModal, setEditModal] = React.useState(false);
  const [editingExpenseId, setEditingExpenseId] = React.useState('');
  const [editCategory, setEditCategory] = React.useState<ExpenseCategory>('TRANSPORT');
  const [editDescription, setEditDescription] = React.useState('');
  const [editAmount, setEditAmount] = React.useState<number>(0);
  const [editDate, setEditDate] = React.useState('');
  const [updating, setUpdating] = React.useState(false);
  const [editError, setEditError] = React.useState('');

  // Page feedback notification
  const [toastMessage, setToastMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const thisMonthString = React.useMemo(() => getLocalMonthString(new Date()), []);
  const lastMonthString = React.useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return getLocalMonthString(d);
  }, []);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedMonth) params.append('month', selectedMonth);

      const [uRes, eRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/expenses?${params.toString()}`).then((r) =>
          r.ok ? r.json() : null
        ),
      ]);

      if (uRes?.user) setCurrentUser(uRes.user);
      if (eRes?.expenses) setExpenses(eRes.expenses);
      if (eRes?.monthlyBreakdown) setBreakdown(eRes.monthlyBreakdown);
      if (eRes?.currentMonthTotal !== undefined) setCurrentMonthTotal(eRes.currentMonthTotal);
      if (eRes?.allTimeTotal !== undefined) setAllTimeTotal(eRes.allTimeTotal);
    } catch (err: any) {
      console.error('Failed to load expenses data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedMonth]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-dismiss toast
  React.useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      setModalError('Please enter a description or purpose for the expense.');
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setModalError('Please enter an expense amount greater than ₦0.');
      return;
    }

    if (!expenseDate) {
      setModalError('Please select a valid expense date.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          description: trimmedDesc,
          amount: numAmount,
          expenseDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record expense');
      }

      setAddModal(false);
      setDescription('');
      setAmount(5000);
      setExpenseDate(getLocalDateString());

      // If month filter is currently active and does not match the new expense date, reset month filter so user sees the new item
      const expenseMonth = expenseDate.slice(0, 7);
      if (selectedMonth && selectedMonth !== expenseMonth) {
        setSelectedMonth('');
      }

      setToastMessage({
        type: 'success',
        text: `Expense of ${formatNaira(numAmount)} ("${trimmedDesc}") recorded successfully!`,
      });

      loadData();
    } catch (err: any) {
      setModalError(err?.message || 'Error recording expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (exp: Expense) => {
    setEditingExpenseId(exp.id);
    setEditCategory(exp.category);
    setEditDescription(exp.description);
    setEditAmount(exp.amount);
    const dStr = exp.expenseDate ? exp.expenseDate.slice(0, 10) : getLocalDateString();
    setEditDate(dStr);
    setEditError('');
    setEditModal(true);
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');

    const trimmedDesc = editDescription.trim();
    if (!trimmedDesc) {
      setEditError('Please enter a description or purpose.');
      return;
    }

    const numAmount = Number(editAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setEditError('Please enter an amount greater than ₦0.');
      return;
    }

    setUpdating(true);

    try {
      const res = await fetch('/api/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingExpenseId,
          category: editCategory,
          description: trimmedDesc,
          amount: numAmount,
          expenseDate: editDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update expense');
      }

      setEditModal(false);
      setToastMessage({
        type: 'success',
        text: `Expense updated successfully!`,
      });

      loadData();
    } catch (err: any) {
      setEditError(err?.message || 'Error updating expense');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteExpense = async (id: string, desc: string, amt: number) => {
    if (!confirm(`Are you sure you want to delete this expense record?\n\n"${desc}" (${formatNaira(amt)})`)) {
      return;
    }

    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setToastMessage({
          type: 'success',
          text: `Expense record deleted successfully.`,
        });
        loadData();
      } else {
        setToastMessage({
          type: 'error',
          text: data.error || 'Failed to delete expense',
        });
      }
    } catch (err: any) {
      console.error(err);
      setToastMessage({
        type: 'error',
        text: 'Error deleting expense record',
      });
    }
  };

  const totalFilteredAmount = expenses.reduce((a, b) => a + Number(b.amount || 0), 0);

  return (
    <AppShell
      user={currentUser}
      title="Operating Expenses"
      subtitle="Shop running costs, logistics, packaging, utilities, generator fuel and staff allowances"
    >
      <div className="space-y-6">
        {/* Floating / Top Alert Toast */}
        {toastMessage && (
          <div
            className={`p-3.5 rounded-[12px] flex items-center justify-between text-xs font-semibold shadow-sm transition-all ${
              toastMessage.type === 'success'
                ? 'bg-[#EAF7EE] text-[#0F5C2E] border border-[#A4D4B4]'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#16803C]" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 hover:opacity-75"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Monthly & Overall Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-[#F28C28]">
            <CardContent className="p-4 sm:p-5">
              <span className="text-xs font-bold text-[#66736B] uppercase tracking-wider">
                {selectedMonth ? `Expenses (${selectedMonth})` : 'Total Listed Expenses'}
              </span>
              <h3 className="text-2xl font-bold text-[#17211B] mt-2">
                {formatNaira(totalFilteredAmount)}
              </h3>
              <p className="text-xs text-[#66736B] mt-1">
                {expenses.length} record{expenses.length === 1 ? '' : 's'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#16803C]">
            <CardContent className="p-4 sm:p-5">
              <span className="text-xs font-bold text-[#66736B] uppercase tracking-wider">
                This Month ({thisMonthString})
              </span>
              <h3 className="text-2xl font-bold text-[#16803C] mt-2">
                {formatNaira(currentMonthTotal)}
              </h3>
              <p className="text-xs text-[#66736B] mt-1">
                Current month overhead
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#0F5C2E]">
            <CardContent className="p-4 sm:p-5">
              <span className="text-xs font-bold text-[#66736B] uppercase tracking-wider">
                All-Time Expenses
              </span>
              <h3 className="text-2xl font-bold text-[#17211B] mt-2 truncate">
                {formatNaira(allTimeTotal)}
              </h3>
              <p className="text-xs text-[#66736B] mt-1 truncate">
                Top: {breakdown[0]?.category?.replace('_', ' ') || 'None'}
              </p>
            </CardContent>
          </Card>

          <div className="flex items-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setExpenseDate(getLocalDateString());
                setModalError('');
                setAddModal(true);
              }}
              className="w-full h-full py-4 gap-2 text-base font-bold shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Record New Expense</span>
            </Button>
          </div>
        </div>

        {/* Categories Breakdown & Quick Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-[12px] border border-[#DDE5DF] shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Pills */}
            <button
              type="button"
              onClick={() => setSelectedMonth('')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedMonth === ''
                  ? 'bg-[#16803C] text-white shadow-xs'
                  : 'bg-[#F0F4F1] text-[#66736B] hover:bg-[#E4EBE6]'
              }`}
            >
              All Records
            </button>
            <button
              type="button"
              onClick={() => setSelectedMonth(thisMonthString)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedMonth === thisMonthString
                  ? 'bg-[#16803C] text-white shadow-xs'
                  : 'bg-[#F0F4F1] text-[#66736B] hover:bg-[#E4EBE6]'
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setSelectedMonth(lastMonthString)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedMonth === lastMonthString
                  ? 'bg-[#16803C] text-white shadow-xs'
                  : 'bg-[#F0F4F1] text-[#66736B] hover:bg-[#E4EBE6]'
              }`}
            >
              Last Month
            </button>

            <span className="text-[#DDE5DF] mx-1">|</span>

            {/* Custom Month Picker */}
            <div className="flex items-center gap-1.5 text-xs text-[#66736B]">
              <span>Month:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-[8px] border border-[#DDE5DF] bg-white px-2.5 py-1 text-xs text-[#17211B] focus:border-[#16803C] focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-[8px] border border-[#DDE5DF] bg-white px-3 py-1.5 text-xs text-[#17211B] focus:border-[#16803C] focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="TRANSPORT">Transport & Logistics</option>
              <option value="MARKET_EXPENSE">Market Gate Fee / Porters</option>
              <option value="PACKAGING">Packaging & Bags</option>
              <option value="ELECTRICITY">Electricity & Fuel</option>
              <option value="RENT">Shop Rent</option>
              <option value="STAFF">Staff Allowance</option>
              <option value="MARKETING">Marketing & Socials</option>
              <option value="OTHER">Others</option>
            </select>
          </div>

          {(selectedCategory || selectedMonth) && (
            <button
              onClick={() => {
                setSelectedCategory('');
                setSelectedMonth('');
              }}
              className="text-xs text-[#16803C] font-semibold hover:underline text-right"
            >
              Clear Filters ({expenses.length} results)
            </button>
          )}
        </div>

        {/* Expenses Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Operating Expense Records</CardTitle>
              <p className="text-xs text-[#66736B]">
                Track all shop cash, fuel, transport, allowances, and bank transfers
              </p>
            </div>
            <span className="text-xs font-semibold text-[#16803C]">
              Total Shown: {formatNaira(totalFilteredAmount)}
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-[8px] animate-pulse" />
                ))}
              </div>
            ) : expenses.length === 0 ? (
              <EmptyState
                title={
                  selectedCategory || selectedMonth
                    ? 'No Expenses Match Filters'
                    : 'No Expenses Recorded'
                }
                description={
                  selectedCategory || selectedMonth
                    ? 'Try clearing the category or month filter to view other operating expenses.'
                    : 'Keep track of overhead costs, generator fuel, packing nylon, and transport expenses.'
                }
                actionLabel={
                  selectedCategory || selectedMonth ? 'Clear Filters' : 'Record First Expense'
                }
                onAction={() => {
                  if (selectedCategory || selectedMonth) {
                    setSelectedCategory('');
                    setSelectedMonth('');
                  } else {
                    setAddModal(true);
                  }
                }}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAF9] text-[#66736B] border-b border-[#DDE5DF]">
                    <tr>
                      <th className="py-3 px-4 font-medium">Date</th>
                      <th className="py-3 px-3 font-medium">Category</th>
                      <th className="py-3 px-4 font-medium">Description</th>
                      <th className="py-3 px-3 font-medium text-right">Amount</th>
                      <th className="py-3 px-3 font-medium">Recorded By</th>
                      <th className="py-3 px-4 text-center font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F1]">
                    {expenses.map((e) => (
                      <tr key={e.id} className="hover:bg-[#F8FAF9] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#17211B] whitespace-nowrap">
                          {new Date(e.expenseDate).toLocaleDateString('en-NG', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              e.category === 'TRANSPORT' || e.category === 'MARKET_EXPENSE'
                                ? 'orange'
                                : e.category === 'ELECTRICITY'
                                ? 'blue'
                                : 'gray'
                            }
                            className="text-[10px]"
                          >
                            {e.category.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-[#17211B] font-medium max-w-sm">
                          {e.description}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-sm text-[#16803C] whitespace-nowrap">
                          {formatNaira(e.amount)}
                        </td>
                        <td className="py-3 px-3 text-[#66736B] whitespace-nowrap">
                          {e.createdByName || 'Staff'}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {/* Edit Expense Button (Owners & Managers) */}
                            {(currentUser?.role === 'OWNER' || currentUser?.role === 'MANAGER') && (
                              <button
                                onClick={() => handleOpenEdit(e)}
                                className="p-1 rounded text-[#66736B] hover:text-[#16803C] hover:bg-[#EAF7EE] transition-colors"
                                title="Edit Expense"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete Expense Button (Owners only) */}
                            {currentUser?.role === 'OWNER' && (
                              <button
                                onClick={() => handleDeleteExpense(e.id, e.description, e.amount)}
                                className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                                title="Delete Expense"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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

      {/* Add Expense Modal */}
      <Modal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        title="Record Operating Expense"
        description="Log transport, rent, light bills, packing nylon, fuel or allowances"
        maxWidth="sm"
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          {modalError && (
            <div className="p-2.5 rounded-[8px] bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#17211B] mb-1.5">
              Expense Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full rounded-[10px] border border-[#DDE5DF] bg-white px-3 py-2 text-xs text-[#17211B] focus:border-[#16803C] focus:outline-none"
            >
              <option value="TRANSPORT">Transport & Market Trip Fare</option>
              <option value="MARKET_EXPENSE">Market Gate Fee / Porter Wheelbarrow</option>
              <option value="PACKAGING">Packaging Nylon Bags & Branded Tags</option>
              <option value="ELECTRICITY">Electricity (EKEDC / Generator Fuel)</option>
              <option value="RENT">Shop Rent Contribution</option>
              <option value="STAFF">Staff Lunch & Travel Allowance</option>
              <option value="MARKETING">Marketing & Social Media Ads</option>
              <option value="OTHER">Other Miscellaneous</option>
            </select>
          </div>

          <Input
            label="Expense Amount (₦)"
            type="number"
            min="1"
            step="100"
            placeholder="e.g. 8500"
            value={amount || ''}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            required
          />

          <Input
            label="Description / Purpose"
            placeholder="e.g. Bus fare to Amarantus Clothings for Thursday bale opening"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <Input
            label="Expense Date"
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submitting}
            >
              Record Expense
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="Edit Operating Expense"
        description="Update the amount, purpose, category or date of this expense"
        maxWidth="sm"
      >
        <form onSubmit={handleUpdateExpense} className="space-y-4">
          {editError && (
            <div className="p-2.5 rounded-[8px] bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{editError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#17211B] mb-1.5">
              Expense Category
            </label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value as ExpenseCategory)}
              className="w-full rounded-[10px] border border-[#DDE5DF] bg-white px-3 py-2 text-xs text-[#17211B] focus:border-[#16803C] focus:outline-none"
            >
              <option value="TRANSPORT">Transport & Market Trip Fare</option>
              <option value="MARKET_EXPENSE">Market Gate Fee / Porter Wheelbarrow</option>
              <option value="PACKAGING">Packaging Nylon Bags & Branded Tags</option>
              <option value="ELECTRICITY">Electricity (EKEDC / Generator Fuel)</option>
              <option value="RENT">Shop Rent Contribution</option>
              <option value="STAFF">Staff Lunch & Travel Allowance</option>
              <option value="MARKETING">Marketing & Social Media Ads</option>
              <option value="OTHER">Other Miscellaneous</option>
            </select>
          </div>

          <Input
            label="Expense Amount (₦)"
            type="number"
            min="1"
            step="100"
            value={editAmount || ''}
            onChange={(e) => setEditAmount(Number(e.target.value) || 0)}
            required
          />

          <Input
            label="Description / Purpose"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            required
          />

          <Input
            label="Expense Date"
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setEditModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={updating}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
