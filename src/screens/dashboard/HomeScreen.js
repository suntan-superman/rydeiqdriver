import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';
import RideRequestScreen from '@/screens/ride/RideRequestScreen';
import { playRideRequestSound } from '@/utils/soundEffects';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Navigation Menu Component
const NavigationMenu = ({ visible, onClose, navigation, user }) => {
  const { signOut } = useAuth();

  const menuItems = [
    { id: 'earnings', title: 'Earnings', icon: 'wallet', screen: 'Earnings' },
    { id: 'trips', title: 'Trip History', icon: 'car', screen: 'TripHistory' },
    { id: 'profile', title: 'Profile', icon: 'person', screen: 'Profile' },
    { id: 'settings', title: 'Settings', icon: 'settings', screen: 'Settings' },
    { id: 'support', title: 'Support', icon: 'help-circle', screen: 'Support' },
  ];

  const handleMenuItemPress = (screen) => {
    onClose();
    navigation.navigate(screen);
  };

  const handleSignOut = () => {
    onClose();
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await signOut();
              if (result.success) {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              } else {
                Alert.alert('Error', result.error?.message || 'Failed to sign out. Please try again.');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.menuOverlay}>
        <TouchableOpacity style={styles.menuBackdrop} onPress={onClose} />
        <View style={styles.menuContainer}>
          {/* Menu Header */}
          <View style={styles.menuHeader}>
            <View style={styles.menuHeaderLeft}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={24} color={COLORS.white} />
              </View>
              <View style={styles.menuHeaderText}>
                <Text style={styles.menuUserName}>{user?.displayName || 'Driver'}</Text>
                <Text style={styles.menuUserEmail}>{user?.email || 'driver@anyryde.com'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeMenuButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.secondary[500]} />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.menuContent}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item.screen)}
              >
                <Ionicons name={item.icon} size={24} color={COLORS.secondary[700]} />
                <Text style={styles.menuItemText}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.secondary[400]} />
              </TouchableOpacity>
            ))}
            
            {/* Divider */}
            <View style={styles.menuDivider} />
            
            {/* Sign Out */}
            <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
              <Ionicons name="log-out" size={24} color={COLORS.error} />
              <Text style={[styles.menuItemText, { color: COLORS.error }]}>Sign Out</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.secondary[400]} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const WEB_ONBOARDING_URL = 'https://anyryde.com/register';

const HomeScreen = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  
  // Driver status state
  const [isOnline, setIsOnline] = useState(false);
  const [currentEarnings, setCurrentEarnings] = useState(0);
  const [ridesCompleted, setRidesCompleted] = useState(0);
  const [driverRating, setDriverRating] = useState(4.8);
  const [activeRideId, setActiveRideId] = useState(null);
  
  // Ride request modal state
  const [showRideRequest, setShowRideRequest] = useState(false);
  const [showNavigationMenu, setShowNavigationMenu] = useState(false);

  // Determine approval status - check both approval status and onboarding completion
  const isApproved = user?.approvalStatus?.status === 'approved' && user?.onboardingStatus?.completed === true;
  


  // Handle online/offline toggle
  const handleStatusToggle = () => {
    if (isOnline) {
      Alert.alert(
        'Go Offline',
        'Are you sure you want to go offline? You will stop receiving ride requests.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Go Offline', 
            style: 'destructive',
            onPress: () => setIsOnline(false)
          }
        ]
      );
    } else {
      setIsOnline(true);
    }
  };

  // Status button configuration
  const statusConfig = isOnline 
    ? {
        text: 'ONLINE',
        subtext: 'Receiving ride requests',
        backgroundColor: COLORS.success,
        icon: 'radio-button-on'
      }
    : {
        text: 'OFFLINE', 
        subtext: 'Tap to go online',
        backgroundColor: COLORS.offline,
        icon: 'radio-button-off'
      };

  // Handle ride request actions
  const handleAcceptRide = (request) => {
    setShowRideRequest(false);
    setActiveRideId(request.customerId); // Set active ride
    navigation.navigate('ActiveRide', { 
      rideData: {
        ...request,
        rideId: `ride_${Date.now()}`,
        bidAmount: request.companyBid,
        state: 'ride-accepted'
      }
    });
  };

  const handleDeclineRide = (request, reason) => {
    setShowRideRequest(false);
    const reasonText = reason === 'timeout' ? 'automatically declined due to timeout' : 'declined';
    Alert.alert('Ride Declined', `Request ${reasonText}`);
  };

  const handleCustomBid = (request, amount, bidType) => {
    setShowRideRequest(false);
    setActiveRideId(request.customerId); // Set active ride
    navigation.navigate('ActiveRide', { 
      rideData: {
        ...request,
        rideId: `ride_${Date.now()}`,
        bidAmount: amount,
        state: 'bid-submitted'
      }
    });
  };

  // Demo function to trigger ride request
  const triggerDemoRideRequest = () => {
    if (!isOnline) {
      Alert.alert('Go Online First', 'You need to be online to receive ride requests');
      return;
    }
    playRideRequestSound();
    setShowRideRequest(true);
  };

  // Pending approval banner
  const PendingApprovalBanner = () => (
    <View style={styles.pendingBanner}>
      <Ionicons name="alert-circle" size={20} color={COLORS.warning} style={{ marginRight: 8 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.pendingBannerText}>
          Your account is pending approval. Please complete onboarding on the web to unlock all features.
        </Text>
      </View>
      <TouchableOpacity
        style={styles.pendingBannerButton}
        onPress={() => Linking.openURL(WEB_ONBOARDING_URL)}
      >
        <Text style={styles.pendingBannerButtonText}>Continue Onboarding</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      {/* Pending Approval Banner */}
      {!isApproved && <PendingApprovalBanner />}
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowNavigationMenu(true)}
        >
          <Ionicons name="menu" size={24} color={COLORS.secondary[700]} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.driverName}>{user?.displayName || 'Driver'}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-circle" size={40} color={COLORS.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* Main content, restrict features if not approved */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Online/Offline Status Card */}
        <View style={styles.statusCard}>
          {/* Online/Offline Toggle - disabled if not approved */}
          <TouchableOpacity
            style={[styles.statusButton, { backgroundColor: statusConfig.backgroundColor, opacity: isApproved ? 1 : 0.5 }]}
            onPress={isApproved ? handleStatusToggle : undefined}
            disabled={!isApproved}
          >
            <Ionicons 
              name={statusConfig.icon} 
              size={24} 
              color={COLORS.white} 
              style={styles.statusIcon}
            />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusText}>{statusConfig.text}</Text>
              <Text style={styles.statusSubtext}>{statusConfig.subtext}</Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={COLORS.white} 
            />
          </TouchableOpacity>
        </View>

        {/* Earnings Today Card */}
        <View style={styles.earningsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Today's Earnings</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.earningsAmount}>${currentEarnings.toFixed(2)}</Text>
          <View style={styles.earningsDetails}>
            <View style={styles.earningsItem}>
              <Ionicons name="car" size={16} color={COLORS.secondary[500]} />
              <Text style={styles.earningsItemText}>{ridesCompleted} rides</Text>
            </View>
            <View style={styles.earningsItem}>
              <Ionicons name="time" size={16} color={COLORS.secondary[500]} />
              <Text style={styles.earningsItemText}>8h 30m online</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="star" size={24} color={COLORS.warning} />
            <Text style={styles.statValue}>{driverRating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color={COLORS.primary[500]} />
            <Text style={styles.statValue}>97%</Text>
            <Text style={styles.statLabel}>Acceptance</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <Text style={styles.statValue}>156</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>
        </View>

        {/* Active Ride Card (if applicable) */}
        {activeRideId && (
          <View style={styles.activeRideCard}>
            <View style={styles.activeRideHeader}>
              <Text style={styles.activeRideTitle}>Active Ride</Text>
              <View style={styles.activeRideHeaderRight}>
                <View style={styles.activeRideBadge}>
                  <Text style={styles.activeRideBadgeText}>EN ROUTE</Text>
                </View>
                <TouchableOpacity 
                  style={styles.closeActiveRide}
                  onPress={() => setActiveRideId(null)}
                >
                  <Ionicons name="close" size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.activeRideDetails}>
              <Text style={styles.activeRideText}>Pickup: 123 Main Street, Downtown</Text>
              <Text style={styles.activeRideText}>Customer: Sarah M.</Text>
              <Text style={styles.activeRideText}>ETA: 8 minutes</Text>
            </View>
            <TouchableOpacity 
              style={styles.continueRideButton}
              onPress={() => navigation.navigate('ActiveRide', { 
                rideData: {
                  rideId: activeRideId,
                  state: 'en-route-pickup'
                }
              })}
            >
              <Text style={styles.continueRideButtonText}>Continue Ride</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Earnings')}
            >
              <Ionicons name="wallet" size={28} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Earnings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('TripHistory')}
            >
              <Ionicons name="car-sport" size={28} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Trip History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings" size={28} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Support')}
            >
              <Ionicons name="help-circle" size={28} color={COLORS.primary[500]} />
              <Text style={styles.actionText}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Demo Section (for testing) */}
        {isOnline && (
          <View style={styles.demoSection}>
            <TouchableOpacity 
              style={styles.demoButton}
              onPress={triggerDemoRideRequest}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications" size={20} color={COLORS.white} />
              <Text style={styles.demoButtonText}>Simulate Ride Request</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Ride Request Modal */}
      <RideRequestScreen
        visible={showRideRequest}
        onAccept={handleAcceptRide}
        onDecline={handleDeclineRide}
        onCustomBid={handleCustomBid}
      />

      {/* Navigation Menu Modal */}
      <NavigationMenu
        visible={showNavigationMenu}
        onClose={() => setShowNavigationMenu(false)}
        navigation={navigation}
        user={user}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[200],
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: COLORS.secondary[500],
    fontWeight: '400',
  },
  driverName: {
    fontSize: 24,
    color: COLORS.secondary[900],
    fontWeight: '700',
    marginTop: 2,
  },
  profileButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusCard: {
    marginTop: 20,
    marginBottom: 16,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statusIcon: {
    marginRight: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  statusSubtext: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 2,
  },
  earningsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary[900],
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary[500],
    fontWeight: '600',
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.success,
    marginBottom: 12,
  },
  earningsDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  earningsItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningsItemText: {
    fontSize: 14,
    color: COLORS.secondary[500],
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.secondary[900],
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.secondary[500],
    fontWeight: '500',
  },
  activeRideCard: {
    backgroundColor: COLORS.primary[500],
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  activeRideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeRideHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeRideTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  activeRideBadge: {
    backgroundColor: COLORS.primary[700],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeRideBadgeText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
  },
  closeActiveRide: {
    marginLeft: 12,
    padding: 4,
  },
  activeRideDetails: {
    marginBottom: 16,
  },
  activeRideText: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 4,
  },
  continueRideButton: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueRideButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary[500],
    marginRight: 8,
  },
  quickActions: {
    marginBottom: 20,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: (SCREEN_WIDTH - 52) / 2,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary[900],
    marginTop: 8,
    textAlign: 'center',
  },
  demoSection: {
    marginBottom: 20,
  },
  demoButton: {
    backgroundColor: COLORS.warning,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  demoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 20,
  },
  // New styles for Navigation Menu
  menuOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuContainer: {
    width: SCREEN_WIDTH * 0.8,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[200],
  },
  menuHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuHeaderText: {
    flex: 1,
  },
  menuUserName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.secondary[900],
  },
  menuUserEmail: {
    fontSize: 14,
    color: COLORS.secondary[500],
    marginTop: 2,
  },
  closeMenuButton: {
    padding: 8,
  },
  menuContent: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[100],
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.secondary[900],
    marginLeft: 12,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.secondary[200],
    marginVertical: 16,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    padding: 12,
    borderRadius: 8,
    margin: 16,
    marginBottom: 0,
  },
  pendingBannerText: {
    color: COLORS.warning,
    fontWeight: '500',
    fontSize: 14,
  },
  pendingBannerButton: {
    backgroundColor: COLORS.warning,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  pendingBannerButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 13,
  },
});

export default HomeScreen; 