import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DashboardHeader = ({ title, onBack, showBack = true }) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {showBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{title}</Text>
        <View style={styles.spacer} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 50, // Safe area for status bar
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  spacer: {
    width: 40, // Same width as back button for centering
  },
});

export default DashboardHeader; 