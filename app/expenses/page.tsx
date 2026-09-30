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
} from 'lucide-react';
import { formatNaira } from '@/lib/calculations';
import { Expense, ExpenseCategory } from '@/lib/types';

export default function ExpensesPage() {
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [breakdown, setBreakdown] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [selectedMonth, setSelectedMonth] = React.useState(
    new Date().toISOString().slice(0, 7) // 'YYYY-MM'
  );

  // Add Expense Modal
  const [addModal, setAddModal] = React.useState(false);
  const [category, setCategory] = React.useState<ExpenseCategory>('TRANSPORT');
  const [description, setDescription] = React.useState('');
  const [amount, setAmount] = React.useState<number>(5000);
  const [expenseDate, setExpenseDate] = React.useState(
    new Date().toISOString().slice(0, 10)
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

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
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedMonth]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          description: description.trim(),
          amount: Number(amount),
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
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Error recording expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;

    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalExpensesAmount = expenses.reduce((a, b) => a + b.amount, 0);

  return (
    <AppShell
      user={currentUser}
      title="Operating Expenses"
      subtitle="Shop running costs, logistics, packaging, utilities and staff allowances"
    >
      <div className="space-y-6">
        {/* Monthly Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-[#F28C28]">
            <CardContent className="p-4 sm:p-5">
              <span className="text-xs font-bold text-[#66736B] uppercase tracking-wider">
                Total Filtered Expenses
              </span>
              <h3 className="text-2xl font-bold text-[#17211B] mt-2">
                {formatNaira(totalExpensesAmount)}
              </h3>
              <p className="text-xs text-[#66736B] mt-1">
                {expenses.length} expense record{expenses.length === 1 ? '' : 's'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#16803C]">
            <CardContent className="p-4 sm:p-5">
              <span className="text-xs font-bold text-[#66736B] uppercase tracking-wider">
                Top Spending Category
              </span>
              <h3 className="text-xl font-bold text-[#17211B] mt-2 truncate">
                {breakdown[0]?.category || 'None'}
              </h3>
              <p className="text-xs text-[#16803C] font-semibold mt-1">
                {breakdown[0] ? formatNaira(breakdown[0].totalAmount) : '₦0'} this month
              </p>
            </CardContent>
          </Card>

          <div className="flex items-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setAddModal(true)}
              className="w-full h-full py-4 gap-2 text-base font-bold shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Record New Expense</span>
            </Button>
          </div>
        </div>

        {/* Categories Breakdown & Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-[12px] border border-[#DDE5DF] shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-[10px] border border-[#DDE5DF] bg-white px-3 py-2 text-xs text-[#17211B] focus:border-[#16803C] focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="TRANSPORT">Transport & Logistics</option>
              <option value="PACKAGING">Packaging & Bags</option>
              <option value="ELECTRICITY">Electricity & Fuel</option>
              <option value="RENT">Shop Rent</option>
              <option value="STAFF">Staff Allowance</option>
              <option value="MARKETING">Marketing & Socials</option>
              <option value="MARKET_EXPENSE">Market Gate & Porters</option>
              <option value="OTHER">Others</option>
            </select>

            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-[10px] border border-[#DDE5DF] bg-white px-3 py-1.5 text-xs text-[#17211B] focus:border-[#16803C] focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              setSelectedCategory('');
              setSelectedMonth('');
            }}
            className="text-xs text-[#66736B] hover:text-[#17211B] underline text-right"
          >
            Clear Filters
          </button>
        </div>

        {/* Expenses Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Expense Records</CardTitle>
              <p className="text-xs text-[#66736B]">
                Track all cash and transfer disbursements
              </p>
            </div>
            <span className="text-xs font-semibold text-[#16803C]">
              Total: {formatNaira(totalExpensesAmount)}
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
                title="No Expenses Recorded"
                description="Keep track of your overhead costs, fuel, and market transport expenses."
                actionLabel="Add Expense"
                onAction={() => setAddModal(true)}
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
                      {currentUser?.role === 'OWNER' && (
                        <th className="py-3 px-4 text-center font-medium">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F1]">
                    {expenses.map((e) => (
                      <tr key={e.id} className="hover:bg-[#F8FAF9] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#17211B]">
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
                        <td className="py-3 px-4 text-[#17211B] font-medium max-w-xs">
                          {e.description}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-sm text-[#17211B]">
                          {formatNaira(e.amount)}
                        </td>
                        <td className="py-3 px-3 text-[#66736B]">
                          {e.createdByName}
                        </td>
                        {currentUser?.role === 'OWNER' && (
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleDeleteExpense(e.id)}
                              className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
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
        description="Log transport, rent, light bills, packaging or allowances"
        maxWidth="sm"
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          {error && (
            <div className="p-2.5 rounded-[8px] bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
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
            placeholder="e.g. Bus fare to Katangua market for Thursday bale opening"
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
    </AppShell>
  );
}
