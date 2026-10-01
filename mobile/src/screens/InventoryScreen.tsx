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
  X,
  Layers,
  CheckCircle,
} from 'lucide-react-native';

export const InventoryScreen = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [categories, setCategories] = useState<any[]>([]);

  // Stock adjustment modal state
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustType, setAdjustType] = useState<'ADD' | 'REMOVE'>('ADD');
  const [adjustReason, setAdjustReason] = useState('Physical count count-up');
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
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
      console.log('Error loading inventory:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedProduct) return;
    setAdjusting(true);

    try {
      const quantityDelta = adjustType === 'ADD' ? adjustQty : -adjustQty;
      const res = await apiRequest(`/api/products/${selectedProduct.id}/adjust`, {
        method: 'POST',
        body: {
          quantity: quantityDelta,
          type: adjustType === 'ADD' ? 'ADJUSTMENT' : 'DAMAGE',
          notes: adjustReason,
        },
      });

      if (res.ok) {
        Alert.alert('Stock Updated', `New quantity: ${selectedProduct.quantity + quantityDelta}`);
        setSelectedProduct(null);
        setAdjustQty(1);
        loadInventory();
      } else {
        Alert.alert('Update Failed', res.error || 'Could not adjust stock');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Network error');
    } finally {
      setAdjusting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesSearch =
      search.trim() === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="Inventory"
        subtitle={`${products.length} Products Tracked`}
        rightAction={
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => {
              setRefreshing(true);
              loadInventory();
            }}
          >
            <Text style={styles.refreshBtnText}>↻</Text>
          </TouchableOpacity>
        }
      />

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Search size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items, SKU, or brands..."
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

      {/* Category Pills */}
      <View style={styles.categoryRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContent}>
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
              All
            </Text>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.catChip,
                selectedCategory === c.id && styles.catChipActive,
              ]}
              onPress={() => setSelectedCategory(c.id)}
            >
              <Text
                style={[
                  styles.catChipText,
                  selectedCategory === c.id && styles.catChipTextActive,
                ]}
              >
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching inventory...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isLowStock = item.quantity <= 3;
            const isOutOfStock = item.quantity <= 0;

            return (
              <TouchableOpacity
                style={styles.itemCard}
                onPress={() => {
                  setSelectedProduct(item);
                  setAdjustQty(1);
                  setAdjustType('ADD');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.itemHeaderRow}>
                  <View style={styles.skuTag}>
                    <Text style={styles.skuTagText}>{item.sku}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      isOutOfStock
                        ? styles.statusOut
                        : isLowStock
                        ? styles.statusLow
                        : styles.statusIn,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        isOutOfStock
                          ? styles.statusTextOut
                          : isLowStock
                          ? styles.statusTextLow
                          : styles.statusTextIn,
                      ]}
                    >
                      {isOutOfStock
                        ? 'Sold Out'
                        : isLowStock
                        ? `Low (${item.quantity})`
                        : `${item.quantity} in stock`}
                    </Text>
                  </View>
                </View>

                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>

                <View style={styles.itemMetaRow}>
                  <Text style={styles.itemCategory}>{item.categoryName || item.category?.name || 'Thrift'}</Text>
                  <Text style={styles.itemDot}>·</Text>
                  <Text style={styles.itemCondition}>{item.condition || 'EXCELLENT'}</Text>
                  <Text style={styles.itemDot}>·</Text>
                  <Text style={styles.itemSize}>Size {item.size || 'M'}</Text>
                </View>

                <View style={styles.itemFooterRow}>
                  <View>
                    <Text style={styles.priceLabel}>Selling Price</Text>
                    <Text style={styles.itemPrice}>{formatNaira(item.sellingPrice)}</Text>
                  </View>
                  <View style={styles.adjustPill}>
                    <Text style={styles.adjustPillText}>Tap to Adjust Stock</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No items found</Text>
            </View>
          }
        />
      )}

      {/* Stock Adjust Modal */}
      <Modal visible={!!selectedProduct} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Adjust Stock Quantity</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {selectedProduct?.name} ({selectedProduct?.sku})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.currentStockText}>
                Current Stock: <Text style={{ fontWeight: '800', color: COLORS.textMain }}>{selectedProduct?.quantity} units</Text>
              </Text>

              {/* Action Type: Add vs Remove */}
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, adjustType === 'ADD' && styles.toggleBtnActiveAdd]}
                  onPress={() => setAdjustType('ADD')}
                >
                  <Plus size={16} color={adjustType === 'ADD' ? '#FFF' : COLORS.textMain} />
                  <Text style={[styles.toggleBtnText, adjustType === 'ADD' && styles.toggleBtnTextActive]}>
                    Restock (Add)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleBtn, adjustType === 'REMOVE' && styles.toggleBtnActiveRemove]}
                  onPress={() => setAdjustType('REMOVE')}
                >
                  <Minus size={16} color={adjustType === 'REMOVE' ? '#FFF' : COLORS.textMain} />
                  <Text style={[styles.toggleBtnText, adjustType === 'REMOVE' && styles.toggleBtnTextActive]}>
                    Write-off (Subtract)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Quantity Counter */}
              <View style={styles.counterRow}>
                <TouchableOpacity
                  style={styles.counterStepBtn}
                  onPress={() => setAdjustQty(Math.max(1, adjustQty - 1))}
                >
                  <Minus size={20} color={COLORS.textMain} />
                </TouchableOpacity>

                <View style={styles.counterValueBox}>
                  <Text style={styles.counterValueText}>{adjustQty}</Text>
                  <Text style={styles.counterValueSub}>units</Text>
                </View>

                <TouchableOpacity
                  style={styles.counterStepBtn}
                  onPress={() => setAdjustQty(adjustQty + 1)}
                >
                  <Plus size={20} color={COLORS.textMain} />
                </TouchableOpacity>
              </View>

              {/* Quick increment buttons */}
              <View style={styles.quickStepRow}>
                {[1, 5, 10, 20].map((step) => (
                  <TouchableOpacity
                    key={step}
                    style={styles.quickStepBtn}
                    onPress={() => setAdjustQty(step)}
                  >
                    <Text style={styles.quickStepText}>+{step}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Reason note */}
              <Text style={styles.reasonLabel}>Reason for Adjustment</Text>
              <TextInput
                style={styles.reasonInput}
                value={adjustReason}
                onChangeText={setAdjustReason}
                placeholder="e.g. Thursday market restock, damaged garment..."
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveBtn, adjusting && styles.btnDisabled]}
                onPress={handleAdjustStock}
                disabled={adjusting}
              >
                {adjusting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    Confirm {adjustType === 'ADD' ? `+${adjustQty}` : `-${adjustQty}`} Change
                  </Text>
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
  refreshBtn: {
    padding: SPACING.xs,
  },
  refreshBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
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
  categoryRow: {
    paddingVertical: SPACING.sm,
  },
  categoryContent: {
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
    paddingBottom: 80,
    gap: 10,
  },
  itemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  skuTag: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  skuTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  statusIn: {
    backgroundColor: COLORS.primaryLight,
  },
  statusLow: {
    backgroundColor: COLORS.warningLight,
  },
  statusOut: {
    backgroundColor: COLORS.dangerLight,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextIn: {
    color: COLORS.primary,
  },
  statusTextLow: {
    color: COLORS.warning,
  },
  statusTextOut: {
    color: COLORS.danger,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textMain,
    marginVertical: 2,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemCategory: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  itemDot: {
    marginHorizontal: 4,
    color: COLORS.textMuted,
  },
  itemCondition: {
    fontSize: 11,
    color: COLORS.accentDark,
    fontWeight: '600',
  },
  itemSize: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  itemFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: 8,
    marginTop: 4,
  },
  priceLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  adjustPill: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  adjustPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  centerBox: {
    paddingVertical: 80,
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
    paddingBottom: SPACING.xl,
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
  modalBody: {
    padding: SPACING.lg,
  },
  currentStockText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  toggleBtn: {
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
  toggleBtnActiveAdd: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  toggleBtnActiveRemove: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  toggleBtnTextActive: {
    color: '#FFF',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: SPACING.md,
  },
  counterStepBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValueBox: {
    alignItems: 'center',
    minWidth: 80,
  },
  counterValueText: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.textMain,
  },
  counterValueSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  quickStepRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  quickStepBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickStepText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 6,
  },
  reasonInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 42,
    fontSize: 13,
    color: COLORS.textMain,
  },
  modalFooter: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
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
