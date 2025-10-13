// Reliability Score Card Component
// Displays driver's reliability score and breakdown

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import reliabilityService from '@/services/reliabilityService';
import { getScoreRange, RELIABILITY_CONFIG } from '@/constants/reliabilityConfig';

const ReliabilityScoreCard = ({ driverId, compact = false, onPress }) => {
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [cancelEvents, setCancelEvents] = useState([]);

  useEffect(() => {
    if (driverId) {
      loadScoreData();
    }
  }, [driverId]);

  const loadScoreData = async () => {
    try {
      setLoading(true);
      const data = await reliabilityService.getDriverReliabilityScore(driverId);
      setScoreData(data);
    } catch (error) {
      console.error('Error loading reliability score:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCancelEvents = async () => {
    try {
      const result = await reliabilityService.getDriverCancelEvents(driverId, 5);
      if (result.success) {
        setCancelEvents(result.events);
      }
    } catch (error) {
      console.error('Error loading cancel events:', error);
    }
  };

  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else {
      loadCancelEvents();
      setShowDetailModal(true);
    }
  };

  if (loading) {
    return (
      <View style={[styles.card, compact && styles.cardCompact]}>
        <ActivityIndicator size="small" color={COLORS.primary[500]} />
      </View>
    );
  }

  if (!scoreData || !scoreData.hasData) {
    return (
      <View style={[styles.card, compact && styles.cardCompact]}>
        <View style={styles.header}>
          <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.secondary[400]} />
          <Text style={styles.noDataText}>Building your reliability score...</Text>
        </View>
        <Text style={styles.noDataSubtext}>
          Complete {RELIABILITY_CONFIG.SCORE_MIN_AWARDED} rides to see your score
        </Text>
      </View>
    );
  }

  const scoreRange = getScoreRange(scoreData.score);
  const scoreColor = scoreRange.color;

  if (compact) {
    return (
      <TouchableOpacity 
        style={styles.cardCompact} 
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        <View style={styles.compactContent}>
          <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '20' }]}>
            <Text style={[styles.scoreValueCompact, { color: scoreColor }]}>
              {scoreData.score}
            </Text>
          </View>
          <View style={styles.compactInfo}>
            <Text style={styles.compactLabel}>Reliability</Text>
            <Text style={[styles.compactStatus, { color: scoreColor }]}>
              {scoreRange.label}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.secondary[400]} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <TouchableOpacity 
        style={styles.card} 
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="shield-checkmark" size={24} color={scoreColor} />
            <View style={styles.headerText}>
              <Text style={styles.title}>Reliability Score</Text>
              <Text style={[styles.statusLabel, { color: scoreColor }]}>
                {scoreRange.label}
              </Text>
            </View>
          </View>
          <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
            <Text style={[styles.scoreValue, { color: scoreColor }]}>
              {scoreData.score}
            </Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
        </View>

        <View style={styles.breakdown}>
          <ScoreBar 
            label="Acceptance" 
            value={scoreData.breakdown.acceptance_rate} 
            color={COLORS.success}
          />
          <ScoreBar 
            label="Cancellation" 
            value={100 - scoreData.breakdown.cancellation_rate} 
            color={COLORS.info}
          />
          <ScoreBar 
            label="On-Time" 
            value={scoreData.breakdown.ontime_arrival} 
            color={COLORS.warning}
          />
          <ScoreBar 
            label="Bid Honoring" 
            value={scoreData.breakdown.bid_honoring} 
            color={COLORS.primary[500]}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Based on {scoreData.total_rides} rides in last 90 days
          </Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.secondary[400]} />
        </View>
      </TouchableOpacity>

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reliability Details</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.secondary[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Score Overview */}
              <View style={styles.modalSection}>
                <View style={[styles.modalScoreCircle, { borderColor: scoreColor }]}>
                  <Text style={[styles.modalScoreValue, { color: scoreColor }]}>
                    {scoreData.score}
                  </Text>
                  <Text style={styles.modalScoreLabel}>{scoreRange.label}</Text>
                </View>
              </View>

              {/* Component Breakdown */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Score Breakdown</Text>
                <DetailRow 
                  icon="checkmark-circle" 
                  label="Acceptance Rate" 
                  value={`${scoreData.breakdown.acceptance_rate}%`}
                  description="Awarded rides that you accepted"
                />
                <DetailRow 
                  icon="close-circle" 
                  label="Cancellation Rate" 
                  value={`${scoreData.breakdown.cancellation_rate}%`}
                  description="Rides canceled after acceptance"
                  warning={scoreData.breakdown.cancellation_rate > 10}
                />
                <DetailRow 
                  icon="time" 
                  label="On-Time Arrival" 
                  value={`${scoreData.breakdown.ontime_arrival}%`}
                  description="Pickups within 3 minutes of ETA"
                />
                <DetailRow 
                  icon="ribbon" 
                  label="Bid Honoring" 
                  value={`${scoreData.breakdown.bid_honoring}%`}
                  description="Awarded bids completed successfully"
                />
              </View>

              {/* Recent Cancellations */}
              {cancelEvents.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Recent Cancellations</Text>
                  {cancelEvents.map((event, index) => (
                    <View key={event.id || index} style={styles.cancelEventRow}>
                      <View style={styles.cancelEventLeft}>
                        <Ionicons 
                          name={event.exempted ? "checkmark-circle" : "alert-circle"} 
                          size={20} 
                          color={event.exempted ? COLORS.success : COLORS.warning} 
                        />
                        <View style={styles.cancelEventText}>
                          <Text style={styles.cancelEventLabel}>{event.reason_label}</Text>
                          <Text style={styles.cancelEventTime}>
                            {event.ts?.toDate ? event.ts.toDate().toLocaleDateString() : 'Recent'}
                          </Text>
                        </View>
                      </View>
                      {event.exempted && (
                        <Text style={styles.exemptBadge}>Exempt</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Tips */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Improve Your Score</Text>
                <TipRow text="Only accept rides you can complete" />
                <TipRow text="Arrive within 3 minutes of your ETA" />
                <TipRow text="Use exempt reasons for legitimate cancellations" />
                <TipRow text="Communicate with riders if issues arise" />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

// Score Bar Component
const ScoreBar = ({ label, value, color }) => (
  <View style={styles.scoreBarContainer}>
    <Text style={styles.scoreBarLabel}>{label}</Text>
    <View style={styles.scoreBarTrack}>
      <View 
        style={[
          styles.scoreBarFill, 
          { width: `${value}%`, backgroundColor: color }
        ]} 
      />
    </View>
    <Text style={styles.scoreBarValue}>{value}%</Text>
  </View>
);

// Detail Row Component
const DetailRow = ({ icon, label, value, description, warning }) => (
  <View style={styles.detailRow}>
    <Ionicons 
      name={icon} 
      size={24} 
      color={warning ? COLORS.warning : COLORS.primary[500]} 
    />
    <View style={styles.detailRowText}>
      <View style={styles.detailRowHeader}>
        <Text style={styles.detailRowLabel}>{label}</Text>
        <Text style={[styles.detailRowValue, warning && styles.warningText]}>
          {value}
        </Text>
      </View>
      <Text style={styles.detailRowDescription}>{description}</Text>
    </View>
  </View>
);

// Tip Row Component
const TipRow = ({ text }) => (
  <View style={styles.tipRow}>
    <Ionicons name="bulb-outline" size={16} color={COLORS.primary[500]} />
    <Text style={styles.tipText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardCompact: {
    padding: 12,
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  scoreMax: {
    fontSize: 10,
    color: COLORS.secondary[400],
  },
  breakdown: {
    marginVertical: 8,
  },
  scoreBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  scoreBarLabel: {
    fontSize: 12,
    color: COLORS.secondary[600],
    width: 80,
  },
  scoreBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.secondary[100],
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  scoreBarValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary[700],
    width: 35,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary[100],
  },
  footerText: {
    fontSize: 12,
    color: COLORS.secondary[500],
  },
  noDataText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.secondary[600],
    marginLeft: 8,
  },
  noDataSubtext: {
    fontSize: 12,
    color: COLORS.secondary[400],
    marginTop: 8,
    textAlign: 'center',
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValueCompact: {
    fontSize: 18,
    fontWeight: '700',
  },
  compactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  compactLabel: {
    fontSize: 12,
    color: COLORS.secondary[600],
  },
  compactStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[100],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.secondary[900],
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalScoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: COLORS.white,
  },
  modalScoreValue: {
    fontSize: 36,
    fontWeight: '700',
  },
  modalScoreLabel: {
    fontSize: 14,
    color: COLORS.secondary[600],
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  detailRowText: {
    flex: 1,
    marginLeft: 12,
  },
  detailRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailRowLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.secondary[900],
  },
  detailRowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary[500],
  },
  warningText: {
    color: COLORS.warning,
  },
  detailRowDescription: {
    fontSize: 12,
    color: COLORS.secondary[500],
    marginTop: 2,
  },
  cancelEventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[50],
  },
  cancelEventLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cancelEventText: {
    marginLeft: 12,
  },
  cancelEventLabel: {
    fontSize: 14,
    color: COLORS.secondary[700],
  },
  cancelEventTime: {
    fontSize: 12,
    color: COLORS.secondary[400],
    marginTop: 2,
  },
  exemptBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.success,
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 6,
  },
  tipText: {
    fontSize: 13,
    color: COLORS.secondary[600],
    marginLeft: 8,
    flex: 1,
  },
});

export default ReliabilityScoreCard;

