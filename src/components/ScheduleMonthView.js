import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';

/**
 * Schedule Month View Component
 * Shows calendar grid with ride counts per day
 */
const ScheduleMonthView = ({ allRides, onDayTap }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, firstDay, lastDay };
  };

  // Get rides for specific day
  const getRidesForDay = (date) => {
    return allRides.filter(ride => {
      const rideTime = ride.pickupDateTime || ride.scheduledDateTime || ride.appointmentDateTime;
      const rideDate = rideTime?.toDate ? rideTime.toDate() : new Date(rideTime);
      return (
        rideDate.getDate() === date.getDate() &&
        rideDate.getMonth() === date.getMonth() &&
        rideDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const { daysInMonth, startingDayOfWeek, firstDay } = getDaysInMonth(currentMonth);
  
  // Create calendar grid
  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push({ isEmpty: true, key: `empty-${i}` });
  }
  
  // Add actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const rides = getRidesForDay(date);
    const isToday = 
      date.getDate() === new Date().getDate() &&
      date.getMonth() === new Date().getMonth() &&
      date.getFullYear() === new Date().getFullYear();
    
    calendarDays.push({
      isEmpty: false,
      day,
      date,
      rides,
      rideCount: rides.length,
      isToday,
      key: `day-${day}`
    });
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getDayColor = (count) => {
    if (count === 0) return COLORS.gray100 || '#F3F4F6';
    if (count === 1) return COLORS.success?.[100] || '#D1FAE5';
    if (count === 2) return COLORS.primary?.[200] || '#BFDBFE';
    if (count === 3) return COLORS.warning?.[200] || '#FDE68A';
    return COLORS.error?.[200] || '#FECACA';
  };

  return (
    <View style={styles.container}>
      {/* Month Header with Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary?.[600] || '#2563EB'} />
        </TouchableOpacity>
        
        <Text style={styles.monthTitle}>{monthName}</Text>
        
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={COLORS.primary?.[600] || '#2563EB'} />
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdayHeader}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.calendarGrid}>
          {calendarDays.map((dayData) => {
            if (dayData.isEmpty) {
              return <View key={dayData.key} style={styles.emptyCell} />;
            }

            return (
              <TouchableOpacity
                key={dayData.key}
                style={[
                  styles.dayCell,
                  { backgroundColor: getDayColor(dayData.rideCount) },
                  dayData.isToday && styles.todayCell
                ]}
                onPress={() => onDayTap?.(dayData.date, dayData.rides)}
                activeOpacity={0.7}
              >
                {dayData.isToday && (
                  <View style={styles.todayIndicator} />
                )}
                <Text style={[
                  styles.dayNumber,
                  dayData.isToday && styles.todayNumber
                ]}>
                  {dayData.day}
                </Text>
                {dayData.rideCount > 0 && (
                  <View style={styles.rideBadge}>
                    <Text style={styles.rideBadgeText}>{dayData.rideCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Ride Count:</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: COLORS.gray100 }]} />
              <Text style={styles.legendText}>0</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: COLORS.success?.[100] }]} />
              <Text style={styles.legendText}>1</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: COLORS.primary?.[200] }]} />
              <Text style={styles.legendText}>2</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: COLORS.warning?.[200] }]} />
              <Text style={styles.legendText}>3</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: COLORS.error?.[200] }]} />
              <Text style={styles.legendText}>4+</Text>
            </View>
          </View>
        </View>

        {/* Month Summary */}
        <View style={styles.monthSummary}>
          <Text style={styles.monthSummaryTitle}>📊 This Month</Text>
          <View style={styles.monthSummaryStats}>
            <View style={styles.monthStat}>
              <Text style={styles.monthStatNumber}>
                {allRides.filter(r => {
                  const rideDate = (r.pickupDateTime || r.scheduledDateTime || r.appointmentDateTime)?.toDate 
                    ? (r.pickupDateTime || r.scheduledDateTime || r.appointmentDateTime).toDate()
                    : new Date(r.pickupDateTime || r.scheduledDateTime || r.appointmentDateTime);
                  return rideDate.getMonth() === currentMonth.getMonth() &&
                         rideDate.getFullYear() === currentMonth.getFullYear();
                }).length}
              </Text>
              <Text style={styles.monthStatLabel}>Total Rides</Text>
            </View>
            <View style={styles.monthStat}>
              <Text style={styles.monthStatNumber}>
                {calendarDays.filter(d => !d.isEmpty && d.rideCount === 0).length}
              </Text>
              <Text style={styles.monthStatLabel}>Free Days</Text>
            </View>
            <View style={styles.monthStat}>
              <Text style={styles.monthStatNumber}>
                {calendarDays.filter(d => !d.isEmpty && d.rideCount >= 3).length}
              </Text>
              <Text style={styles.monthStatLabel}>Busy Days</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.white || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#E5E7EB',
  },
  navButton: {
    padding: 4,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary || '#111827',
  },
  weekdayHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.white || '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#E5E7EB',
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary || '#6B7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 4,
  },
  emptyCell: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    padding: 2,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  dayCellInner: {
    flex: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  todayCell: {
    borderWidth: 2,
    borderColor: COLORS.primary?.[500] || '#3B82F6',
    borderRadius: 10,
  },
  todayIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary?.[500] || '#3B82F6',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary || '#111827',
    marginTop: 8,
  },
  todayNumber: {
    color: COLORS.primary?.[700] || '#1D4ED8',
    fontWeight: '800',
  },
  rideBadge: {
    backgroundColor: COLORS.primary?.[600] || '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  rideBadgeText: {
    color: COLORS.white || '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  legend: {
    backgroundColor: COLORS.white || '#FFFFFF',
    padding: 14,
    marginTop: 16,
    marginHorizontal: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary || '#111827',
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    alignItems: 'center',
    gap: 4,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: COLORS.textSecondary || '#6B7280',
  },
  monthSummary: {
    backgroundColor: COLORS.primary?.[50] || '#EFF6FF',
    borderRadius: 10,
    padding: 14,
    margin: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.primary?.[200] || '#BFDBFE',
  },
  monthSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary?.[800] || '#1E40AF',
    marginBottom: 12,
  },
  monthSummaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  monthStat: {
    alignItems: 'center',
  },
  monthStatNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary?.[700] || '#1D4ED8',
    marginBottom: 4,
  },
  monthStatLabel: {
    fontSize: 10,
    color: COLORS.primary?.[600] || '#2563EB',
    textAlign: 'center',
  },
});

export default ScheduleMonthView;

