import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAccessibilityDashboard, clearAccessibilityError } from '../../store/slices/accessibilitySlice';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const AccessibilityDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { dashboard, isLoading, error, currentSettings, voiceNavigationActive, accessibilityAlerts, complianceStatus, recentAudit } = useSelector(state => state.accessibility);

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchAccessibilityDashboard({ userId: user.uid }));
    }
    return () => dispatch(clearAccessibilityError());
  }, [dispatch, user?.uid]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Accessibility Hub</Text>
      
      {/* Compliance Status Card */}
      {complianceStatus && (
        <View style={styles.complianceCard}>
          <View style={styles.complianceHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            <Text style={styles.complianceTitle}>Accessibility Compliance</Text>
          </View>
          <View style={styles.complianceContent}>
            <View style={styles.complianceRow}>
              <Text style={styles.complianceLabel}>WCAG 2.1</Text>
              <Text style={styles.complianceValue}>{complianceStatus.wcag2_1}</Text>
            </View>
            <View style={styles.complianceRow}>
              <Text style={styles.complianceLabel}>Section 508</Text>
              <Text style={styles.complianceValue}>{complianceStatus.section508}</Text>
            </View>
            <View style={styles.complianceRow}>
              <Text style={styles.complianceLabel}>ADA</Text>
              <Text style={styles.complianceValue}>{complianceStatus.ada}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Voice Navigation Status */}
      {dashboard?.voiceNavigation && (
        <View style={styles.voiceCard}>
          <View style={styles.voiceHeader}>
            <Ionicons name="mic" size={24} color={voiceNavigationActive ? "#10B981" : "#6B7280"} />
            <Text style={styles.voiceTitle}>Voice Navigation</Text>
            <View style={[styles.statusIndicator, voiceNavigationActive && styles.statusActive]} />
          </View>
          <View style={styles.voiceContent}>
            <Text style={styles.voiceStatus}>
              {voiceNavigationActive ? 'Active' : 'Inactive'}
            </Text>
            <Text style={styles.voiceAccuracy}>
              Accuracy: {dashboard.voiceNavigation.voiceRecognition.accuracy}
            </Text>
            <Text style={styles.voiceCommands}>
              {dashboard.voiceNavigation.voiceCommands.length} commands available
            </Text>
          </View>
        </View>
      )}

      {/* Screen Reader Support */}
      {dashboard?.screenReader && (
        <View style={styles.screenReaderCard}>
          <View style={styles.screenReaderHeader}>
            <Ionicons name="ear" size={24} color="#8B5CF6" />
            <Text style={styles.screenReaderTitle}>Screen Reader Support</Text>
          </View>
          <View style={styles.screenReaderContent}>
            <Text style={styles.screenReaderStatus}>
              {dashboard.screenReader.enabled ? 'Enabled' : 'Disabled'}
            </Text>
            <Text style={styles.screenReaderCoverage}>
              Labels: {dashboard.screenReader.accessibilityLabels.coverage}
            </Text>
            <Text style={styles.screenReaderCompatibility}>
              Compatible with: {Object.keys(dashboard.screenReader.compatibility).join(', ')}
            </Text>
          </View>
        </View>
      )}

      {/* High Contrast Mode */}
      {dashboard?.highContrast && (
        <View style={styles.contrastCard}>
          <View style={styles.contrastHeader}>
            <Ionicons name="contrast" size={24} color="#F59E0B" />
            <Text style={styles.contrastTitle}>High Contrast Mode</Text>
          </View>
          <View style={styles.contrastContent}>
            <Text style={styles.contrastStatus}>
              {dashboard.highContrast.enabled ? 'Enabled' : 'Disabled'}
            </Text>
            <Text style={styles.contrastRatio}>
              Ratio: {dashboard.highContrast.contrastRatio}
            </Text>
            <Text style={styles.contrastScheme}>
              Scheme: {dashboard.highContrast.currentScheme}
            </Text>
          </View>
        </View>
      )}

      {/* Large Text Scaling */}
      {dashboard?.largeText && (
        <View style={styles.textCard}>
          <View style={styles.textHeader}>
            <Ionicons name="text" size={24} color="#EF4444" />
            <Text style={styles.textTitle}>Large Text Scaling</Text>
          </View>
          <View style={styles.textContent}>
            <Text style={styles.textStatus}>
              {dashboard.largeText.enabled ? 'Enabled' : 'Disabled'}
            </Text>
            <Text style={styles.textScale}>
              Scale: {dashboard.largeText.currentScale}x
            </Text>
            <Text style={styles.textFont}>
              Font: {dashboard.largeText.currentFont}
            </Text>
          </View>
        </View>
      )}

      {/* Color Blind Support */}
      {dashboard?.colorBlindSupport && (
        <View style={styles.colorBlindCard}>
          <View style={styles.colorBlindHeader}>
            <Ionicons name="color-palette" size={24} color="#06B6D4" />
            <Text style={styles.colorBlindTitle}>Color Blind Support</Text>
          </View>
          <View style={styles.colorBlindContent}>
            <Text style={styles.colorBlindStatus}>
              {dashboard.colorBlindSupport.enabled ? 'Enabled' : 'Disabled'}
            </Text>
            <Text style={styles.colorBlindType}>
              Type: {dashboard.colorBlindSupport.colorBlindType}
            </Text>
            <Text style={styles.colorBlindTypes}>
              {dashboard.colorBlindSupport.supportedTypes.length} types supported
            </Text>
          </View>
        </View>
      )}

      {/* Motor Accessibility */}
      {dashboard?.motorAccessibility && (
        <View style={styles.motorCard}>
          <View style={styles.motorHeader}>
            <Ionicons name="hand-left" size={24} color="#84CC16" />
            <Text style={styles.motorTitle}>Motor Accessibility</Text>
          </View>
          <View style={styles.motorContent}>
            <Text style={styles.motorStatus}>
              {dashboard.motorAccessibility.enabled ? 'Enabled' : 'Disabled'}
            </Text>
            <Text style={styles.motorTargets}>
              Touch Targets: {dashboard.motorAccessibility.touchTargets.currentSize}px
            </Text>
            <Text style={styles.motorCompliance}>
              Compliance: {dashboard.motorAccessibility.touchTargets.compliance}
            </Text>
          </View>
        </View>
      )}

      {/* Accessibility Alerts */}
      {accessibilityAlerts.length > 0 && (
        <View style={styles.alertsCard}>
          <Text style={styles.alertsTitle}>Accessibility Alerts</Text>
          {accessibilityAlerts.slice(0, 3).map((alert, index) => (
            <View key={index} style={styles.alertItem}>
              <Ionicons name="notifications" size={16} color="#EF4444" />
              <Text style={styles.alertText}>{alert.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recent Audit */}
      {recentAudit && (
        <View style={styles.auditCard}>
          <Text style={styles.auditTitle}>Recent Accessibility Audit</Text>
          <Text style={styles.auditDate}>
            {new Date(recentAudit.auditDate).toLocaleDateString()}
          </Text>
          <Text style={styles.auditStatus}>
            Status: {recentAudit.wcag2_1}
          </Text>
        </View>
      )}
      
      {isLoading && <ActivityIndicator size="large" style={styles.loading} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {!isLoading && !error && dashboard && (
        <>
          <Section title="Voice Navigation" data={dashboard.voiceNavigation} />
          <Section title="Screen Reader Support" data={dashboard.screenReader} />
          <Section title="High Contrast Mode" data={dashboard.highContrast} />
          <Section title="Large Text Scaling" data={dashboard.largeText} />
          <Section title="Color Blind Support" data={dashboard.colorBlindSupport} />
          <Section title="Motor Accessibility" data={dashboard.motorAccessibility} />
          <Section title="Accessibility Analytics" data={dashboard.accessibilityAnalytics} />
          <Section title="Accessibility Settings" data={dashboard.accessibilitySettings} />
        </>
      )}
    </ScrollView>
  );
};

const Section = ({ title, data }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {data && typeof data === 'object' && Object.keys(data).length > 0 ? (
      Object.entries(data).map(([key, value]) => (
        <View key={key} style={styles.row}>
          <Text style={styles.label}>{formatKey(key)}</Text>
          <Text style={styles.value}>{formatValue(value)}</Text>
        </View>
      ))
    ) : (
      <Text style={styles.empty}>No data</Text>
    )}
  </View>
);

function formatKey(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ');
}

function formatValue(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) return 'None';
    if (value.length <= 3) return value.map(item => item.name || item.title || item).join(', ');
    return `${value.length} items`;
  }
  if (typeof value === 'object' && value !== null) {
    if (value.name || value.title) return value.name || value.title;
    if (value.level || value.demand) return `${value.level || value.demand}`;
    if (value.average || value.price) return `$${value.average || value.price}`;
    if (value.current || value.total) return `${value.current}/${value.total}`;
    if (value.percentage) return `${value.percentage.toFixed(1)}%`;
    return '[Object]';
  }
  return value === undefined || value === null ? '—' : value;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#111827',
    textAlign: 'center',
  },
  complianceCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  complianceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  complianceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginLeft: 8,
  },
  complianceContent: {
    gap: 8,
  },
  complianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  complianceLabel: {
    color: '#065F46',
    fontWeight: '500',
  },
  complianceValue: {
    color: '#065F46',
    fontWeight: '600',
  },
  voiceCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  voiceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D1D5DB',
  },
  statusActive: {
    backgroundColor: '#10B981',
  },
  voiceContent: {
    gap: 4,
  },
  voiceStatus: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
  },
  voiceAccuracy: {
    fontSize: 12,
    color: '#92400E',
  },
  voiceCommands: {
    fontSize: 12,
    color: '#92400E',
  },
  screenReaderCard: {
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  screenReaderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  screenReaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#581C87',
    marginLeft: 8,
  },
  screenReaderContent: {
    gap: 4,
  },
  screenReaderStatus: {
    fontSize: 14,
    color: '#581C87',
    fontWeight: '600',
  },
  screenReaderCoverage: {
    fontSize: 12,
    color: '#581C87',
  },
  screenReaderCompatibility: {
    fontSize: 12,
    color: '#581C87',
  },
  contrastCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  contrastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contrastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  contrastContent: {
    gap: 4,
  },
  contrastStatus: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
  },
  contrastRatio: {
    fontSize: 12,
    color: '#92400E',
  },
  contrastScheme: {
    fontSize: 12,
    color: '#92400E',
  },
  textCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  textHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  textTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991B1B',
    marginLeft: 8,
  },
  textContent: {
    gap: 4,
  },
  textStatus: {
    fontSize: 14,
    color: '#991B1B',
    fontWeight: '600',
  },
  textScale: {
    fontSize: 12,
    color: '#991B1B',
  },
  textFont: {
    fontSize: 12,
    color: '#991B1B',
  },
  colorBlindCard: {
    backgroundColor: '#ECFEFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  colorBlindHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorBlindTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#164E63',
    marginLeft: 8,
  },
  colorBlindContent: {
    gap: 4,
  },
  colorBlindStatus: {
    fontSize: 14,
    color: '#164E63',
    fontWeight: '600',
  },
  colorBlindType: {
    fontSize: 12,
    color: '#164E63',
  },
  colorBlindTypes: {
    fontSize: 12,
    color: '#164E63',
  },
  motorCard: {
    backgroundColor: '#F7FEE7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  motorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  motorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#365314',
    marginLeft: 8,
  },
  motorContent: {
    gap: 4,
  },
  motorStatus: {
    fontSize: 14,
    color: '#365314',
    fontWeight: '600',
  },
  motorTargets: {
    fontSize: 12,
    color: '#365314',
  },
  motorCompliance: {
    fontSize: 12,
    color: '#365314',
  },
  alertsCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: '#991B1B',
    marginLeft: 8,
    flex: 1,
  },
  auditCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  auditTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  auditDate: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 4,
  },
  auditStatus: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
  },
  loading: {
    marginVertical: 40,
  },
  error: {
    color: '#EF4444',
    textAlign: 'center',
    marginVertical: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: '#6B7280',
    fontWeight: '500',
  },
  value: {
    color: '#111827',
    fontWeight: '600',
  },
  empty: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

export default AccessibilityDashboard; 