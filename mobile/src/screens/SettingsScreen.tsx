import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../config/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../config/theme';
import {
  User,
  Store,
  Globe,
  LogOut,
  CheckCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react-native';

export const SettingsScreen = () => {
  const { user, logout, serverUrl, updateServerUrl } = useAuth();
  const [customUrl, setCustomUrl] = useState(serverUrl);
  const [testing, setTesting] = useState(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);

  const handleSaveUrl = async () => {
    if (!customUrl.trim()) return;
    await updateServerUrl(customUrl.trim());
    Alert.alert('Settings Saved', `Connecting to: ${customUrl.trim()}`);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setPingStatus(null);
    try {
      const res = await apiRequest('/api/public/products?limit=1');
      if (res.ok) {
        setPingStatus('Connected successfully! API is responding (HTTP 200).');
      } else {
        setPingStatus(`Connection failed: ${res.error}`);
      }
    } catch (err: any) {
      setPingStatus(`Error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Amarantus Clothings?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Settings" subtitle="System & Store Profile" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarBox}>
            <User size={28} color="#FFF" />
          </View>
          <View style={styles.profileInfoCol}>
            <Text style={styles.profileName}>{user?.name || 'Amarantus Clothings'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'amarantus@gmail.com'}</Text>
            <View style={styles.roleTag}>
              <Text style={styles.roleText}>{user?.role || 'OWNER'} ACCOUNT</Text>
            </View>
          </View>
        </View>

        {/* Store Profile Section */}
        <Text style={styles.sectionTitle}>Shop Information</Text>
        <View style={styles.sectionCard}>
          <View style={styles.infoRow}>
            <Store size={18} color={COLORS.primary} style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Shop Name</Text>
              <Text style={styles.infoValue}>Amarantus Clothings</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Globe size={18} color={COLORS.primary} style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Store Address</Text>
              <Text style={styles.infoValue}>Plot 78 Gbazango Kubwa FCT, Nigeria</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <HelpCircle size={18} color={COLORS.primary} style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Customer Hotline</Text>
              <Text style={styles.infoValue}>+234 9065043549</Text>
            </View>
          </View>
        </View>

        {/* Server Configuration */}
        <Text style={styles.sectionTitle}>Server & API Endpoint</Text>
        <View style={styles.sectionCard}>
          <Text style={styles.inputLabel}>Current Backend URL</Text>
          <TextInput
            style={styles.urlInput}
            value={customUrl}
            onChangeText={setCustomUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.btnCloud]}
              onPress={() => setCustomUrl('https://amarantus-clothings.vercel.app')}
            >
              <Text style={styles.btnCloudText}>Vercel Cloud</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.btnSave]}
              onPress={handleSaveUrl}
            >
              <Text style={styles.btnSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.testBtn}
            onPress={handleTestConnection}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Text style={styles.testBtnText}>Test Server Connection</Text>
            )}
          </TouchableOpacity>

          {pingStatus && (
            <View
              style={[
                styles.pingBox,
                pingStatus.includes('successfully') ? styles.pingSuccess : styles.pingError,
              ]}
            >
              <Text
                style={[
                  styles.pingText,
                  pingStatus.includes('successfully') ? styles.pingTextSuccess : styles.pingTextError,
                ]}
              >
                {pingStatus}
              </Text>
            </View>
          )}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color={COLORS.danger} />
          <Text style={styles.logoutBtnText}>Sign Out of Mobile App</Text>
        </TouchableOpacity>

        {/* App Version */}
        <View style={styles.versionFooter}>
          <Text style={styles.versionText}>Amarantus Clothings Mobile v1.0.0</Text>
          <Text style={styles.versionSubText}>React Native · Expo SDK 57</Text>
        </View>
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
  profileCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  avatarBox: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  profileInfoCol: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  profileEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  roleTag: {
    backgroundColor: COLORS.primaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginTop: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoIcon: {
    marginRight: SPACING.md,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMain,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 6,
  },
  urlInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 42,
    fontSize: 13,
    color: COLORS.textMain,
    marginBottom: SPACING.sm,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    marginBottom: SPACING.sm,
  },
  actionBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
  },
  btnCloud: {
    backgroundColor: COLORS.primaryLight,
  },
  btnCloudText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  btnSave: {
    backgroundColor: COLORS.primary,
  },
  btnSaveText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },
  testBtn: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  pingBox: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  pingSuccess: {
    backgroundColor: COLORS.successLight,
  },
  pingError: {
    backgroundColor: COLORS.dangerLight,
  },
  pingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pingTextSuccess: {
    color: COLORS.success,
  },
  pingTextError: {
    color: COLORS.danger,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.dangerLight,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: SPACING.sm,
  },
  logoutBtnText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  versionFooter: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  versionSubText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
