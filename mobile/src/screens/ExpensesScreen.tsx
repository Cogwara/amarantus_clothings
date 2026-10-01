import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../components/Header';
import { apiRequest, formatNaira } from '../config/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../config/theme';
import {
  Plus,
  Receipt,
  X,
  CreditCard,
  Truck,
  Building,
  Zap,
  ShoppingBag,
  Users,
  MoreHorizontal,
} from 'lucide-react-native';

const EXPENSE_CATEGORIES = [
  { key: 'TRANSPORT', label: 'Transport / Logistics', icon: Truck },
  { key: 'PACKAGING', label: 'Packaging / Nylons', icon: ShoppingBag },
  { key: 'MARKET_EXPENSE', label: 'Market Fees', icon: CreditCard },
  { key: 'ELECTRICITY', label: 'Electricity / NEPA', icon: Zap },
  { key: 'RENT', label: 'Shop Rent', icon: Building },
  { key: 'STAFF', label: 'Staff Allowances', icon: Users },
  { key: 'OTHER', label: 'Other Sundry', icon: MoreHorizontal },
];

export const ExpensesScreen = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // New expense form
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('TRANSPORT');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await apiRequest('/api/expenses');
      if (res.ok && res.data) {
        setExpenses(res.data.expenses || res.data || []);
      }
    } catch (err) {
      console.log('Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async () => {
    const numAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount in ₦.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Description Required', 'Please enter what this expense was for.');
      return;
    }

    setSaving(true);
    try {
      const res = await apiRequest('/api/expenses', {
        method: 'POST',
        body: {
          amount: numAmount,
          category,
          description: description.trim(),
        },
      });

      if (res.ok) {
        setModalVisible(false);
        setAmount('');
        setDescription('');
        setCategory('TRANSPORT');
        fetchExpenses();
      } else {
        Alert.alert('Save Failed', res.error || 'Could not save expense');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const totalExpense = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="Expenses"
        subtitle="Operational Costs"
        rightAction={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setModalVisible(true)}
          >
            <Plus size={18} color="#FFF" />
            <Text style={styles.addBtnText}>Log</Text>
          </TouchableOpacity>
        }
      />

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>TOTAL EXPENSES LOGGED</Text>
        <Text style={styles.summaryAmount}>{formatNaira(totalExpense)}</Text>
        <Text style={styles.summaryMeta}>{expenses.length} expense records on file</Text>
      </View>

      {/* Expense List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching expenses...</Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.expenseCard}>
              <View style={styles.expenseIconBox}>
                <Receipt size={20} color={COLORS.danger} />
              </View>
              <View style={styles.expenseInfoCol}>
                <Text style={styles.expenseDesc} numberOfLines={1}>
                  {item.description}
                </Text>
                <Text style={styles.expenseMeta}>
                  {item.category} · {new Date(item.expenseDate || item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.expenseAmount}>-{formatNaira(item.amount)}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No expenses logged yet</Text>
            </View>
          }
        />
      )}

      {/* Add Expense Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Store Expense</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Amount */}
              <Text style={styles.inputLabel}>Amount (₦)</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                placeholder="₦ 0.00"
                value={amount}
                onChangeText={setAmount}
              />

              {/* Category */}
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {EXPENSE_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const active = category === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[styles.catGridBtn, active && styles.catGridBtnActive]}
                      onPress={() => setCategory(cat.key)}
                    >
                      <Icon size={16} color={active ? '#FFF' : COLORS.textMain} />
                      <Text
                        style={[
                          styles.catGridText,
                          active && styles.catGridTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Description */}
              <Text style={styles.inputLabel}>Description / Notes</Text>
              <TextInput
                style={styles.descInput}
                placeholder="e.g. Transport to Thursday market, packing bags..."
                value={description}
                onChangeText={setDescription}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.btnDisabled]}
                onPress={handleCreateExpense}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Expense</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    margin: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  summaryAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.danger,
    marginTop: 2,
  },
  summaryMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 80,
    gap: 8,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expenseIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  expenseInfoCol: {
    flex: 1,
  },
  expenseDesc: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  expenseMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.danger,
  },
  centerBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 6,
    marginTop: 10,
  },
  amountInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 48,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catGridBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catGridBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catGridText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  catGridTextActive: {
    color: '#FFF',
  },
  descInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
    fontSize: 13,
    color: COLORS.textMain,
  },
  modalFooter: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
