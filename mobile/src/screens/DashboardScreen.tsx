import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../components/Header';
import { apiRequest, formatNaira } from '../config/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../config/theme';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  Calendar,
  Receipt,
  ArrowRight,
  PlusCircle,
} from 'lucide-react-native';

export const DashboardScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const res = await apiRequest('/api/dashboard');
      if (res.ok && res.data) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to load dashboard data');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const todaySales = data?.todaySales?.totalRevenue || 0;
  const todayCount = data?.todaySales?.count || 0;
  const todayProfit = data?.todaySales?.totalProfit || 0;
  const lowStockCount = data?.lowStockCount || 0;
  const totalStockItems = data?.totalProducts || 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="Dashboard"
        subtitle="Live Retail Summary"
        rightAction={
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Text style={styles.refreshBtnText}>↻</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Fetching store data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <AlertTriangle size={24} color={COLORS.danger} />
            <Text style={styles.errorTitle}>Could not load dashboard</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchDashboard}>
              <Text style={styles.retryBtnText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Low Stock Alert Banner */}
            {lowStockCount > 0 && (
              <TouchableOpacity
                style={styles.alertBanner}
                onPress={() => navigation.navigate('Inventory')}
              >
                <AlertTriangle size={18} color={COLORS.warning} />
                <View style={styles.alertTextCol}>
                  <Text style={styles.alertTitle}>
                    {lowStockCount} item{lowStockCount > 1 ? 's' : ''} low on stock
                  </Text>
                  <Text style={styles.alertSubtitle}>
                    Restock soon or add to Thursday plan
                  </Text>
                </View>
                <ArrowRight size={16} color={COLORS.warning} />
              </TouchableOpacity>
            )}

            {/* Today's Sales Primary Card */}
            <View style={styles.mainSalesCard}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardSuperTitle}>TODAY'S REVENUE</Text>
                  <Text style={styles.cardMainValue}>{formatNaira(todaySales)}</Text>
                </View>
                <View style={styles.salesIconBadge}>
                  <TrendingUp size={22} color={COLORS.primary} />
                </View>
              </View>

              <View style={styles.metricGrid}>
                <View style={styles.metricSubItem}>
                  <Text style={styles.metricSubLabel}>Transactions</Text>
                  <Text style={styles.metricSubValue}>{todayCount}</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricSubItem}>
                  <Text style={styles.metricSubLabel}>Est. Profit</Text>
                  <Text style={[styles.metricSubValue, { color: COLORS.primary }]}>
                    {formatNaira(todayProfit)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Action Grid */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: COLORS.primaryLight }]}
                onPress={() => navigation.navigate('POS')}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBox, { backgroundColor: COLORS.primary }]}>
                  <ShoppingCart size={20} color="#FFF" />
                </View>
                <Text style={styles.actionCardTitle}>Make a Sale</Text>
                <Text style={styles.actionCardSubtitle}>New POS checkout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: COLORS.accentLight }]}
                onPress={() => navigation.navigate('Thursday')}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBox, { backgroundColor: COLORS.accent }]}>
                  <Calendar size={20} color="#FFF" />
                </View>
                <Text style={styles.actionCardTitle}>Thursday Plan</Text>
                <Text style={styles.actionCardSubtitle}>Market budget & buy list</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: '#F0FDF4' }]}
                onPress={() => navigation.navigate('Inventory')}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#15803D' }]}>
                  <Package size={20} color="#FFF" />
                </View>
                <Text style={styles.actionCardTitle}>Inventory</Text>
                <Text style={styles.actionCardSubtitle}>{totalStockItems} items logged</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: '#FEF2F2' }]}
                onPress={() => navigation.navigate('Expenses')}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBox, { backgroundColor: COLORS.danger }]}>
                  <PlusCircle size={20} color="#FFF" />
                </View>
                <Text style={styles.actionCardTitle}>Log Expense</Text>
                <Text style={styles.actionCardSubtitle}>Transport, rent, food</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Sales Section */}
            {data?.recentSales && data.recentSales.length > 0 && (
              <View style={styles.recentSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Recent Sales</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('POS')}>
                    <Text style={styles.seeAllText}>New Sale →</Text>
                  </TouchableOpacity>
                </View>

                {data.recentSales.slice(0, 5).map((sale: any) => (
                  <View key={sale.id} style={styles.saleRow}>
                    <View style={styles.saleReceiptBadge}>
                      <Receipt size={16} color={COLORS.primary} />
                    </View>
                    <View style={styles.saleInfoCol}>
                      <Text style={styles.saleNumber}>{sale.saleNumber}</Text>
                      <Text style={styles.saleMeta}>
                        {sale.paymentMethod} · {new Date(sale.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={styles.saleAmount}>{formatNaira(sale.totalAmount)}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  refreshBtn: {
    padding: SPACING.xs,
  },
  refreshBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  centerBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorBox: {
    backgroundColor: COLORS.dangerLight,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.danger,
    marginTop: SPACING.sm,
  },
  errorSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginVertical: SPACING.sm,
  },
  retryBtn: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
  },
  retryBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  alertTextCol: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  alertSubtitle: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },
  mainSalesCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardSuperTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  cardMainValue: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.textMain,
    marginTop: 4,
  },
  salesIconBadge: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricGrid: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  metricSubItem: {
    flex: 1,
  },
  metricSubLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  metricSubValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMain,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: '100%',
    backgroundColor: COLORS.divider,
    marginHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: SPACING.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: SPACING.xl,
  },
  actionCard: {
    width: '48%',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  actionCardSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  recentSection: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  saleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  saleReceiptBadge: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  saleInfoCol: {
    flex: 1,
  },
  saleNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  saleMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  saleAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
