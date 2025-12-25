import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import earningsOptimizationService from '../../services/earningsOptimizationService';
import * as Haptics from 'expo-haptics';

const EarningsGoalsManager = ({ driverId, onClose, visible = false }) => {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    goalType: 'weekly',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    isActive: true
  });

  const goalTypes = [
    { value: 'daily', label: 'Daily', icon: 'calendar-outline', multiplier: 1 },
    { value: 'weekly', label: 'Weekly', icon: 'calendar', multiplier: 7 },
    { value: 'monthly', label: 'Monthly', icon: 'calendar-sharp', multiplier: 30 },
    { value: 'quarterly', label: 'Quarterly', icon: 'calendar-number', multiplier: 90 },
    { value: 'yearly', label: 'Yearly', icon: 'calendar-number', multiplier: 365 }
  ];

  useEffect(() => {
    if (visible && driverId) {
      loadGoals();
    }
  }, [visible, driverId]);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      await earningsOptimizationService.initialize(driverId);
      const goalsData = await earningsOptimizationService.getEarningsGoals();
      setGoals(goalsData);
    } catch (error) {
      console.error('Error loading earnings goals:', error);
      Alert.alert('Error', 'Failed to load earnings goals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGoal = () => {
    setFormData({
      name: '',
      targetAmount: '',
      goalType: 'weekly',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true
    });
    setEditingGoal(null);
    setShowAddGoal(true);
  };

  const handleEditGoal = (goal) => {
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      goalType: goal.goalType,
      startDate: goal.startDate.toDate(),
      endDate: goal.endDate.toDate(),
      isActive: goal.isActive
    });
    setEditingGoal(goal);
    setShowAddGoal(true);
  };

  const handleSaveGoal = async () => {
    try {
      if (!formData.name.trim() || !formData.targetAmount) {
        Alert.alert('Validation Error', 'Name and target amount are required');
        return;
      }

      const targetAmount = parseFloat(formData.targetAmount);
      if (isNaN(targetAmount) || targetAmount <= 0) {
        Alert.alert('Validation Error', 'Target amount must be a positive number');
        return;
      }

      setIsSaving(true);
      
      const goalData = {
        name: formData.name.trim(),
        targetAmount: targetAmount,
        goalType: formData.goalType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isActive: formData.isActive,
        status: 'active'
      };

      if (editingGoal) {
        // Update existing goal
        await earningsOptimizationService.updateEarningsGoal(editingGoal.id, goalData);
      } else {
        // Add new goal
        await earningsOptimizationService.setEarningsGoal(goalData);
      }

      setShowAddGoal(false);
      setEditingGoal(null);
      await loadGoals();
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Success', editingGoal ? 'Goal updated successfully' : 'Goal added successfully');
    } catch (error) {
      console.error('Error saving goal:', error);
      Alert.alert('Error', 'Failed to save goal');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGoal = (goal) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteGoal(goal.id)
        }
      ]
    );
  };

  const deleteGoal = async (goalId) => {
    try {
      await earningsOptimizationService.updateEarningsGoal(goalId, { status: 'deleted' });
      await loadGoals();
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Success', 'Goal deleted successfully');
    } catch (error) {
      console.error('Error deleting goal:', error);
      Alert.alert('Error', 'Failed to delete goal');
    }
  };

  const handleToggleGoal = async (goal) => {
    try {
      await earningsOptimizationService.updateEarningsGoal(goal.id, { 
        isActive: !goal.isActive 
      });
      await loadGoals();
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error toggling goal:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getGoalTypeIcon = (goalType) => {
    const type = goalTypes.find(t => t.value === goalType);
    return type?.icon || 'calendar';
  };

  const getGoalTypeColor = (goalType) => {
    const colors = {
      daily: COLORS.primary[600],
      weekly: COLORS.success[600],
      monthly: COLORS.warning[600],
      quarterly: COLORS.info[600],
      yearly: COLORS.purple[600]
    };
    return colors[goalType] || COLORS.gray[600];
  };

  const calculateGoalProgress = (goal) => {
    // This would calculate actual progress based on current earnings
    // For now, we'll simulate progress
    const progress = Math.random() * 100;
    const remaining = goal.targetAmount * (1 - progress / 100);
    const onTrack = progress >= 50; // Simplified on-track calculation
    
    return {
      percentage: Math.min(progress, 100),
      remaining: Math.max(remaining, 0),
      onTrack
    };
  };

  const activeGoals = goals.filter(goal => goal.isActive && goal.status !== 'deleted');
  const completedGoals = goals.filter(goal => goal.status === 'completed');

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="flag" size={24} color={COLORS.primary[600]} />
          <Text style={styles.headerTitle}>Earnings Goals</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={COLORS.gray[600]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Add Goal Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddGoal}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Add Earnings Goal</Text>
        </TouchableOpacity>

        {/* Goals Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{activeGoals.length}</Text>
            <Text style={styles.summaryLabel}>Active Goals</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{completedGoals.length}</Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
        </View>

        {/* Active Goals */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary[600]} />
            <Text style={styles.loadingText}>Loading goals...</Text>
          </View>
        ) : activeGoals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="flag-outline" size={64} color={COLORS.gray[400]} />
            <Text style={styles.emptyTitle}>No Active Goals</Text>
            <Text style={styles.emptyText}>
              Set earnings goals to track your progress and stay motivated
            </Text>
          </View>
        ) : (
          <View style={styles.goalsContainer}>
            <Text style={styles.sectionTitle}>Active Goals</Text>
            
            {activeGoals.map((goal) => {
              const progress = calculateGoalProgress(goal);
              
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalInfo}>
                      <View style={styles.goalNameRow}>
                        <Ionicons 
                          name={getGoalTypeIcon(goal.goalType)} 
                          size={20} 
                          color={getGoalTypeColor(goal.goalType)} 
                        />
                        <Text style={styles.goalName}>{goal.name}</Text>
                        <View style={[
                          styles.goalTypeBadge,
                          { backgroundColor: getGoalTypeColor(goal.goalType) }
                        ]}>
                          <Text style={styles.goalTypeText}>{goal.goalType}</Text>
                        </View>
                      </View>
                      <Text style={styles.goalTarget}>
                        Target: {formatCurrency(goal.targetAmount)}
                      </Text>
                    </View>
                    
                    <View style={styles.goalActions}>
                      <Switch
                        trackColor={{ false: COLORS.gray[300], true: COLORS.primary[400] }}
                        thumbColor={goal.isActive ? COLORS.primary[600] : COLORS.gray[500]}
                        ios_backgroundColor={COLORS.gray[300]}
                        onValueChange={() => handleToggleGoal(goal)}
                        value={goal.isActive}
                      />
                    </View>
                  </View>

                  <View style={styles.goalProgress}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill,
                          { width: `${Math.min(progress.percentage, 100)}%` }
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {progress.percentage.toFixed(1)}%
                    </Text>
                  </View>

                  <View style={styles.goalDetails}>
                    <View style={styles.goalDetailItem}>
                      <Text style={styles.goalDetailLabel}>Remaining</Text>
                      <Text style={styles.goalDetailValue}>
                        {formatCurrency(progress.remaining)}
                      </Text>
                    </View>
                    
                    <View style={styles.goalDetailItem}>
                      <Text style={styles.goalDetailLabel}>End Date</Text>
                      <Text style={styles.goalDetailValue}>
                        {formatDate(goal.endDate)}
                      </Text>
                    </View>
                    
                    <View style={[
                      styles.goalStatus,
                      { backgroundColor: progress.onTrack ? COLORS.success[100] : COLORS.warning[100] }
                    ]}>
                      <Text style={[
                        styles.goalStatusText,
                        { color: progress.onTrack ? COLORS.success[700] : COLORS.warning[700] }
                      ]}>
                        {progress.onTrack ? 'On Track' : 'Behind'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.goalFooter}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditGoal(goal)}
                    >
                      <Ionicons name="pencil" size={16} color={COLORS.primary[600]} />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteGoal(goal)}
                    >
                      <Ionicons name="trash" size={16} color={COLORS.error[600]} />
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <View style={styles.completedContainer}>
            <Text style={styles.sectionTitle}>Completed Goals</Text>
            
            {completedGoals.map((goal) => (
              <View key={goal.id} style={styles.completedGoalCard}>
                <View style={styles.completedGoalHeader}>
                  <View style={styles.completedGoalInfo}>
                    <Ionicons 
                      name={getGoalTypeIcon(goal.goalType)} 
                      size={16} 
                      color={COLORS.success[600]} 
                    />
                    <Text style={styles.completedGoalName}>{goal.name}</Text>
                  </View>
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>Completed</Text>
                  </View>
                </View>
                <Text style={styles.completedGoalTarget}>
                  {formatCurrency(goal.targetAmount)} • {goal.goalType}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Add/Edit Goal Modal */}
      <Modal
        visible={showAddGoal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddGoal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddGoal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingGoal ? 'Edit Goal' : 'Add Goal'}
            </Text>
            <TouchableOpacity onPress={handleSaveGoal} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator size="small" color={COLORS.primary[600]} />
              ) : (
                <Text style={styles.modalSaveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Goal Name *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter goal name (e.g., Weekly $500)"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Target Amount *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.targetAmount}
                onChangeText={(text) => setFormData(prev => ({ ...prev, targetAmount: text }))}
                placeholder="Enter target amount"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Goal Type</Text>
              <View style={styles.goalTypeButtons}>
                {goalTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.goalTypeButton,
                      formData.goalType === type.value && styles.goalTypeButtonActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, goalType: type.value }))}
                  >
                    <Ionicons 
                      name={type.icon} 
                      size={16} 
                      color={formData.goalType === type.value ? 'white' : COLORS.gray[600]} 
                    />
                    <Text style={[
                      styles.goalTypeButtonText,
                      formData.goalType === type.value && styles.goalTypeButtonTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Start Date</Text>
              <TouchableOpacity style={styles.dateButton}>
                <Text style={styles.dateButtonText}>
                  {formatDate(formData.startDate)}
                </Text>
                <Ionicons name="calendar" size={16} color={COLORS.gray[600]} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>End Date</Text>
              <TouchableOpacity style={styles.dateButton}>
                <Text style={styles.dateButtonText}>
                  {formatDate(formData.endDate)}
                </Text>
                <Ionicons name="calendar" size={16} color={COLORS.gray[600]} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Active Goal</Text>
                  <Text style={styles.switchDescription}>
                    Enable this goal for tracking
                  </Text>
                </View>
                <Switch
                  trackColor={{ false: COLORS.gray[300], true: COLORS.primary[400] }}
                  thumbColor={formData.isActive ? COLORS.primary[600] : COLORS.gray[500]}
                  ios_backgroundColor={COLORS.gray[300]}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value }))}
                  value={formData.isActive}
                />
              </View>
            </View>

            {/* Preview */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Preview</Text>
              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <Ionicons 
                    name={getGoalTypeIcon(formData.goalType)} 
                    size={16} 
                    color={getGoalTypeColor(formData.goalType)} 
                  />
                  <Text style={styles.previewName}>
                    {formData.name || 'Your goal name'}
                  </Text>
                  <View style={[
                    styles.previewTypeBadge,
                    { backgroundColor: getGoalTypeColor(formData.goalType) }
                  ]}>
                    <Text style={styles.previewTypeText}>{formData.goalType}</Text>
                  </View>
                </View>
                <Text style={styles.previewTarget}>
                  Target: {formData.targetAmount ? formatCurrency(parseFloat(formData.targetAmount)) : '$0.00'}
                </Text>
                <Text style={styles.previewDates}>
                  {formatDate(formData.startDate)} - {formatDate(formData.endDate)}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary[600],
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary[600],
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray[600],
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  goalsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 16,
  },
  goalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  goalTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  goalTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  goalTarget: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  goalActions: {
    marginLeft: 12,
  },
  goalProgress: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.gray[200],
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary[600],
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary[600],
    textAlign: 'center',
  },
  goalDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  goalDetailItem: {
    alignItems: 'center',
  },
  goalDetailLabel: {
    fontSize: 10,
    color: COLORS.gray[500],
    marginBottom: 2,
  },
  goalDetailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  goalStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  goalStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    color: COLORS.primary[600],
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteButtonText: {
    fontSize: 14,
    color: COLORS.error[600],
    fontWeight: '500',
  },
  completedContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  completedGoalCard: {
    backgroundColor: COLORS.success[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success[500],
  },
  completedGoalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  completedGoalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedGoalName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  completedBadge: {
    backgroundColor: COLORS.success[500],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  completedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  completedGoalTarget: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
  bottomSpacing: {
    height: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  modalCancelText: {
    fontSize: 16,
    color: COLORS.gray[600],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  modalSaveText: {
    fontSize: 16,
    color: COLORS.primary[600],
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  goalTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    gap: 6,
  },
  goalTypeButtonActive: {
    backgroundColor: COLORS.primary[600],
    borderColor: COLORS.primary[600],
  },
  goalTypeButtonText: {
    fontSize: 12,
    color: COLORS.gray[700],
    fontWeight: '500',
  },
  goalTypeButtonTextActive: {
    color: 'white',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  dateButtonText: {
    fontSize: 16,
    color: COLORS.gray[900],
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 12,
    color: COLORS.gray[600],
    lineHeight: 16,
  },
  previewCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  previewName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
    flex: 1,
  },
  previewTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  previewTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  previewTarget: {
    fontSize: 12,
    color: COLORS.primary[600],
    fontWeight: '600',
    marginBottom: 4,
  },
  previewDates: {
    fontSize: 11,
    color: COLORS.gray[600],
  },
});

export default EarningsGoalsManager;
