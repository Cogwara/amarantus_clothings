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
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  CreditCard,
  Banknote,
  Send,
  X,
  ShoppingBag,
} from 'lucide-react-native';

export const POSScreen = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Cart state: map of productId -> { product, quantity, discount }
  const [cart, setCart] = useState<Record<string, { product: any; quantity: number }>>({});
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'POS'>('CASH');
  const [customerName, setCustomerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        apiRequest('/api/products?limit=100'),
        apiRequest('/api/categories'),
      ]);

      if (prodRes.ok && prodRes.data) {
        setProducts(prodRes.data.products || prodRes.data || []);
      }
      if (catRes.ok && catRes.data) {
        setCategories(catRes.data.categories || catRes.data || []);
      }
    } catch (err) {
      console.log('Error loading POS catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesSearch =
      search.trim() === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev[product.id];
      const newQty = existing ? existing.quantity + 1 : 1;
      if (newQty > product.quantity) {
        Alert.alert('Low Stock', `Only ${product.quantity} units available in store.`);
        return prev;
      }
      return {
        ...prev,
        [product.id]: { product, quantity: newQty },
      };
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      const nextQty = existing.quantity + delta;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      if (nextQty > existing.product.quantity) {
        Alert.alert('Max Stock', `Only ${existing.product.quantity} in inventory.`);
        return prev;
      }
      return {
        ...prev,
        [productId]: { ...existing, quantity: nextQty },
      };
    });
  };

  const cartItems = Object.values(cart);
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.sellingPrice * item.quantity,
    0
  );
  const grandTotal = subtotal;

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    setSubmitting(true);
    try {
      const payload = {
        paymentMethod,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitSellingPrice: item.product.sellingPrice,
          unitCostPrice: item.product.costPrice || 0,
        })),
        notes: customerName ? `Customer: ${customerName}` : undefined,
      };

      const res = await apiRequest('/api/sales', {
        method: 'POST',
        body: payload,
      });

      if (res.ok && res.data) {
        setSuccessReceipt(res.data.sale || res.data);
        setCart({});
        setCartModalVisible(false);
        setCustomerName('');
        // Refresh product stock
        fetchCatalog();
      } else {
        Alert.alert('Checkout Failed', res.error || 'Could not record sale');
      }
    } catch (err: any) {
      Alert.alert('Checkout Error', err.message || 'Error recording sale');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="Sell (POS)"
        subtitle="Quick Checkout & Billing"
        rightAction={
          <TouchableOpacity
            style={[styles.cartBadgeBtn, totalCartCount > 0 && styles.cartBadgeActive]}
            onPress={() => setCartModalVisible(true)}
          >
            <ShoppingBag size={20} color={totalCartCount > 0 ? '#FFF' : COLORS.textMain} />
            {totalCartCount > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{totalCartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Search size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items or enter SKU (e.g. DRS-001)..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories Filter Carousel */}
      <View style={styles.categoriesRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContent}>
          <TouchableOpacity
            style={[
              styles.catChip,
              selectedCategory === 'ALL' && styles.catChipActive,
            ]}
            onPress={() => setSelectedCategory('ALL')}
          >
            <Text
              style={[
                styles.catChipText,
                selectedCategory === 'ALL' && styles.catChipTextActive,
              ]}
            >
              All Items
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.catChip,
                selectedCategory === cat.id && styles.catChipActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.catChipText,
                  selectedCategory === cat.id && styles.catChipTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading items...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const inCartQty = cart[item.id]?.quantity || 0;
            const isOutOfStock = item.quantity <= 0;

            return (
              <View style={[styles.productCard, isOutOfStock && styles.productCardDisabled]}>
                <View style={styles.productInfoCol}>
                  <View style={styles.skuRow}>
                    <Text style={styles.skuBadge}>{item.sku}</Text>
                    <Text style={styles.conditionBadge}>{item.condition || 'EXCELLENT'}</Text>
                    <Text
                      style={[
                        styles.stockBadge,
                        item.quantity <= 2 ? styles.stockLow : styles.stockOk,
                      ]}
                    >
                      {item.quantity} in stock
                    </Text>
                  </View>
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.productPrice}>{formatNaira(item.sellingPrice)}</Text>
                </View>

                {inCartQty > 0 ? (
                  <View style={styles.qtyControlRow}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateCartQty(item.id, -1)}
                    >
                      <Minus size={14} color={COLORS.primary} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{inCartQty}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateCartQty(item.id, 1)}
                    >
                      <Plus size={14} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.addBtn, isOutOfStock && styles.addBtnDisabled]}
                    onPress={() => addToCart(item)}
                    disabled={isOutOfStock}
                  >
                    <Plus size={16} color="#FFF" />
                    <Text style={styles.addBtnText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No matching clothes found</Text>
              <Text style={styles.emptySubtitle}>Try changing your search or category filter.</Text>
            </View>
          }
        />
      )}

      {/* Floating Bottom Bar if Cart has items */}
      {totalCartCount > 0 && (
        <View style={styles.floatingBar}>
          <View>
            <Text style={styles.floatingCountText}>{totalCartCount} item(s) selected</Text>
            <Text style={styles.floatingTotalText}>{formatNaira(grandTotal)}</Text>
          </View>
          <TouchableOpacity
            style={styles.viewCartBtn}
            onPress={() => setCartModalVisible(true)}
          >
            <Text style={styles.viewCartBtnText}>Review & Pay →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Cart & Checkout Modal */}
      <Modal visible={cartModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Checkout Cart</Text>
                <Text style={styles.modalSubtitle}>{totalCartCount} items selected</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setCartModalVisible(false)}
              >
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Cart items list */}
              {cartItems.map(({ product, quantity }) => (
                <View key={product.id} style={styles.cartItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cartItemName} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text style={styles.cartItemPrice}>
                      {formatNaira(product.sellingPrice)} × {quantity} ={' '}
                      <Text style={{ fontWeight: '700', color: COLORS.primary }}>
                        {formatNaira(product.sellingPrice * quantity)}
                      </Text>
                    </Text>
                  </View>
                  <View style={styles.cartItemQtyCol}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateCartQty(product.id, -1)}
                    >
                      <Minus size={14} color={COLORS.primary} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateCartQty(product.id, 1)}
                    >
                      <Plus size={14} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Payment Method Selector */}
              <Text style={styles.inputHeading}>Payment Method</Text>
              <View style={styles.paymentMethodRow}>
                {[
                  { key: 'CASH', label: 'Cash', icon: Banknote },
                  { key: 'TRANSFER', label: 'Transfer', icon: Send },
                  { key: 'POS', label: 'POS Card', icon: CreditCard },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = paymentMethod === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.payMethodBtn, active && styles.payMethodBtnActive]}
                      onPress={() => setPaymentMethod(item.key as any)}
                    >
                      <Icon size={18} color={active ? '#FFF' : COLORS.textMain} />
                      <Text
                        style={[styles.payMethodText, active && styles.payMethodTextActive]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Customer / Notes */}
              <Text style={styles.inputHeading}>Customer Note (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Customer name or reference..."
                value={customerName}
                onChangeText={setCustomerName}
              />

              {/* Price Breakdown */}
              <View style={styles.breakdownBox}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Subtotal</Text>
                  <Text style={styles.breakdownVal}>{formatNaira(subtotal)}</Text>
                </View>
                <View style={[styles.breakdownRow, { marginTop: 6 }]}>
                  <Text style={[styles.breakdownLabel, { fontWeight: '700', fontSize: 16 }]}>
                    Total Due
                  </Text>
                  <Text style={[styles.breakdownVal, { color: COLORS.primary, fontSize: 20 }]}>
                    {formatNaira(grandTotal)}
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Confirm Checkout Button */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.confirmBtn, submitting && styles.btnDisabled]}
                onPress={handleCheckout}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.confirmBtnText}>Complete Sale ({formatNaira(grandTotal)})</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sale Success Dialog */}
      <Modal visible={!!successReceipt} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconBadge}>
              <CheckCircle size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.successTitle}>Sale Completed!</Text>
            <Text style={styles.successSubtitle}>
              Receipt #{successReceipt?.saleNumber}
            </Text>
            <Text style={styles.successAmount}>
              {formatNaira(successReceipt?.totalAmount)}
            </Text>
            <Text style={styles.successMeta}>
              Paid via {successReceipt?.paymentMethod || paymentMethod}
            </Text>

            <TouchableOpacity
              style={styles.newSaleBtn}
              onPress={() => setSuccessReceipt(null)}
            >
              <Text style={styles.newSaleBtnText}>Start New Sale</Text>
            </TouchableOpacity>
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
  cartBadgeBtn: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  cartBadgeActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  badgeCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeCountText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  searchSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textMain,
    marginLeft: SPACING.sm,
  },
  categoriesRow: {
    paddingVertical: SPACING.sm,
  },
  categoriesContent: {
    paddingHorizontal: SPACING.lg,
    gap: 8,
  },
  catChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  catChipTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
    gap: 10,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  productCardDisabled: {
    opacity: 0.6,
  },
  productInfoCol: {
    flex: 1,
    marginRight: SPACING.md,
  },
  skuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  skuBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    backgroundColor: COLORS.background,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  conditionBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.accentDark,
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  stockBadge: {
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  stockOk: {
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  stockLow: {
    color: COLORS.danger,
    backgroundColor: COLORS.dangerLight,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  addBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: 4,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    minWidth: 18,
    textAlign: 'center',
  },
  centerBox: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  floatingBar: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.textMain,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.modal,
  },
  floatingCountText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  floatingTotalText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  viewCartBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  viewCartBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
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
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: SPACING.xs,
  },
  modalScroll: {
    padding: SPACING.lg,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  cartItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  cartItemPrice: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cartItemQtyCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMain,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  payMethodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
  },
  payMethodBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  payMethodText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  payMethodTextActive: {
    color: '#FFF',
  },
  notesInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 42,
    fontSize: 13,
    color: COLORS.textMain,
  },
  breakdownBox: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginVertical: SPACING.lg,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  breakdownVal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  modalFooter: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.button,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  successCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.xl,
    padding: SPACING.xxl,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    alignSelf: 'center',
    width: '85%',
    ...SHADOWS.modal,
  },
  successIconBadge: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  successSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  successAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.primary,
    marginVertical: SPACING.md,
  },
  successMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  newSaleBtn: {
    backgroundColor: COLORS.primary,
    width: '100%',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  newSaleBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
