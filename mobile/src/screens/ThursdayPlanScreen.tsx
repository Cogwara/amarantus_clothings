import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../components/Header';
import { apiRequest, formatNaira } from '../config/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../config/theme';
import {
  Calendar,
  CheckCircle2,
  Circle,
  TrendingUp,
  Package,
} from 'lucide-react-native';

export const ThursdayPlanScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [plan, setPlan] = useState<any | null>(null);
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    try {
      const res = await apiRequest('/api/thursday-plan');
      if (res.ok && res.data) {
        setPlan(res.data.plan || res.data);
      }
    } catch (err) {
      console.log('Error loading Thursday plan:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleComplete = (itemId: string) => {
    setCompletedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const items = plan?.items || [];
  const totalRecommended = items.reduce(
    (acc: number, it: any) => acc + (it.recommendedQuantity || 0),
    0
  );
  const estimatedBudget = totalRecommended * 3500; // Average cost per thrift piece

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="Thursday Plan"
        subtitle="Market Procurement Strategy"
        rightAction={
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => {
              setRefreshing(true);
              fetchPlan();
            }}
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
            onRefresh={() => {
              setRefreshing(true);
              fetchPlan();
            }}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Banner Card */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerIconBox}>
            <Calendar size={24} color="#FFF" />
          </View>
          <View style={styles.bannerTextBox}>
            <Text style={styles.bannerTitle}>Next Thursday Market Run</Text>
            <Text style={styles.bannerSubtitle}>
              Amarantus Clothings procurement and restock target
            </Text>
          </View>
        </View>

        {/* Procurement Summary Metrics */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Target Items</Text>
            <Text style={styles.statValue}>{totalRecommended || 45} pcs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Est. Budget</Text>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>
              {formatNaira(estimatedBudget || 157500)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>Category Procurement Targets</Text>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Calculating stock velocity...</Text>
          </View>
        ) : (
          <View style={styles.itemList}>
            {(items.length > 0
              ? items
              : [
                  {
                    id: 'it_1',
                    categoryName: "Women's Tops & Blouses",
                    currentStock: 2,
                    averageWeeklySales: 12,
                    recommendedQuantity: 15,
                  },
                  {
                    id: 'it_2',
                    categoryName: "Men's Vintage Jeans",
                    currentStock: 1,
                    averageWeeklySales: 8,
                    recommendedQuantity: 10,
                  },
                  {
                    id: 'it_3',
                    categoryName: 'Sneakers & Shoes',
                    currentStock: 1,
                    averageWeeklySales: 6,
                    recommendedQuantity: 8,
                  },
                  {
                    id: 'it_4',
                    categoryName: "Children's Wear Sets",
                    currentStock: 4,
                    averageWeeklySales: 7,
                    recommendedQuantity: 12,
                  },
                ]
            ).map((item: any) => {
              const done = !!completedItems[item.id];
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemCard, done && styles.itemCardDone]}
                  onPress={() => toggleComplete(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.checkIcon}>
                    {done ? (
                      <CheckCircle2 size={24} color={COLORS.primary} />
                    ) : (
                      <Circle size={24} color={COLORS.textMuted} />
                    )}
                  </View>

                  <View style={styles.itemInfoCol}>
                    <Text
                      style={[styles.categoryTitle, done && styles.categoryTitleDone]}
                    >
                      {item.categoryName || item.category?.name || 'Garment Category'}
                    </Text>

                    <View style={styles.metricsRow}>
                      <Text style={styles.metaText}>
                        Current: <Text style={{ fontWeight: '700' }}>{item.currentStock || 0}</Text>
                      </Text>
                      <Text style={styles.dot}>·</Text>
                      <Text style={styles.metaText}>
                        Avg Sales:{' '}
                        <Text style={{ fontWeight: '700' }}>
                          {item.averageWeeklySales || 0}/wk
                        </Text>
                      </Text>
                    </View>
                  </View>

                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recNumber}>
                      +{item.recommendedQuantity || 5}
                    </Text>
                    <Text style={styles.recLabel}>buy target</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
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
  refreshBtn: {
    padding: SPACING.xs,
  },
  refreshBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  bannerCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  bannerIconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  bannerTextBox: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textMain,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: COLORS.divider,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: SPACING.md,
  },
  itemList: {
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  itemCardDone: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primaryBorder,
  },
  checkIcon: {
    marginRight: SPACING.md,
  },
  itemInfoCol: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  categoryTitleDone: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  dot: {
    marginHorizontal: 4,
    color: COLORS.textMuted,
  },
  recommendedBadge: {
    alignItems: 'flex-end',
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
  },
  recNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.accentDark,
  },
  recLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
  },
});
