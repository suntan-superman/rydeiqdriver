import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
// MIGRATED: Removed Redux - using React Query instead
// import { useSelector, useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { playSuccessSound, playErrorSound } from '@/utils/soundEffects';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
// React Query hooks for profile and vehicle management
import { useDriverProfile, useUpdateDriverProfile, useVehicleInfo, useUpdateVehicleInfo } from '@/hooks/queries';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/services/firebase/config';
import { profilePictureService } from '@/services/profilePictureService';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

const ProfileScreen = () => {
  const navigation = useNavigation();
  // MIGRATED: Removed useDispatch - no Redux needed
  const { user } = useAuth();
  
  // React Query hooks for fetching and updating profile data
  const driverId = user?.uid || user?.id;
  const { data: profileFromQuery, isLoading: profileLoading } = useDriverProfile(driverId);
  const { data: vehicleFromQuery, isLoading: vehicleLoading } = useVehicleInfo(driverId);
  
  // Mutations for updating profile and vehicle
  const { mutate: updateProfile } = useUpdateDriverProfile(driverId);
  const { mutate: updateVehicle } = useUpdateVehicleInfo(driverId);
  
  // Real profile data from Firebase (kept for local state management)
  const [profileData, setProfileData] = useState({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      address: '',
      profilePhoto: null
    },
    vehicleInfo: {
      make: '',
      model: '',
      year: '',
      color: '',
      licensePlate: '',
      vehicleType: 'standard',
      photos: []
    },
    specialtyVehicleInfo: {
      specialtyVehicleType: '',
      serviceCapabilities: [],
      certificationFiles: {}
    },
    documents: {
      driverLicense: null,
      insurance: null,
      registration: null,
      backgroundCheck: 'pending',
      vehicleInspection: null
    },
    bankingInfo: {
      accountHolderName: '',
      routingNumber: '',
      accountNumber: '',
      bankName: '',
      isVerified: false
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  

  const [activeSection, setActiveSection] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [bankingUnlocked, setBankingUnlocked] = useState(false);
  const [pendingBankingEdit, setPendingBankingEdit] = useState(null);
  const [showEmergencyContactModal, setShowEmergencyContactModal] = useState(false);
  const [emergencyContactData, setEmergencyContactData] = useState({
    name: '',
    phone: '',
    relationship: ''
  });
  
  // Update local state from React Query data when available
  useEffect(() => {
    if (profileFromQuery && profileFromQuery.id) {
      setProfileData(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          firstName: profileFromQuery.firstName || '',
          lastName: profileFromQuery.lastName || '',
          email: profileFromQuery.email || '',
          phone: profileFromQuery.phone || '',
          profilePhoto: profileFromQuery.profilePhoto || null
        }
      }));
    }
    if (vehicleFromQuery) {
      setProfileData(prev => ({
        ...prev,
        vehicleInfo: vehicleFromQuery || prev.vehicleInfo
      }));
    }
    setLoading(profileLoading || vehicleLoading);
  }, [profileFromQuery, vehicleFromQuery, profileLoading, vehicleLoading]);

  // Vehicle type options
  const VEHICLE_TYPES = [
    { value: 'standard', label: 'Standard', icon: 'car' },
    { value: 'premium', label: 'Premium', icon: 'car-sport' },
    { value: 'wheelchair', label: 'Wheelchair Accessible', icon: 'accessibility' },
    { value: 'pet', label: 'Pet Friendly', icon: 'paw' }
  ];

  const handleEditField = (section, field, currentValue) => {
    // If trying to edit banking info and not unlocked, show password modal
    if (section === 'bankingInfo' && !bankingUnlocked) {
      setPendingBankingEdit({ section, field, currentValue });
      setShowPasswordModal(true);
      return;
    }
    
    setEditingField({ section, field });
    setEditValue(currentValue || '');
  };

  const handleVerifyPassword = async () => {
    if (!user || !passwordInput) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    try {
      setVerifyingPassword(true);
      
      // Ensure Firebase Auth is initialized
      if (!auth) {
        throw new Error('Firebase Authentication is not initialized');
      }
      
      // Get the current Firebase Auth user
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('No authenticated user found. Please sign in again.');
      }
      
      // Re-authenticate user with their password
      const credential = EmailAuthProvider.credential(currentUser.email, passwordInput);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Password verified successfully
      setBankingUnlocked(true);
      setShowPasswordModal(false);
      setPasswordInput('');
      
      // If there was a pending edit, proceed with it
      if (pendingBankingEdit) {
        setEditingField({ 
          section: pendingBankingEdit.section, 
          field: pendingBankingEdit.field 
        });
        setEditValue(pendingBankingEdit.currentValue || '');
        setPendingBankingEdit(null);
      }
      
      playSuccessSound();
      Alert.alert('Success', 'Banking information unlocked. You can now edit your banking details.');
      
      // Auto-lock after 5 minutes of inactivity
      setTimeout(() => {
        setBankingUnlocked(false);
      }, 5 * 60 * 1000);
      
    } catch (error) {
      console.error('Password verification error:', error);
      playErrorSound();
      
      // Provide more specific error messages
      let errorMessage = 'Incorrect password. Please try again.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/user-mismatch') {
        errorMessage = 'Authentication error. Please sign out and sign in again.';
      } else if (error.message && !error.code) {
        // For non-Firebase errors (like our custom errors)
        errorMessage = error.message;
      }
      
      Alert.alert('Verification Failed', errorMessage);
    } finally {
      setVerifyingPassword(false);
    }
  };

  const handleCancelPasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordInput('');
    setPendingBankingEdit(null);
  };

  const handleSaveField = async () => {
    if (editingField && user?.id) {
      try {
        setSaving(true);
        
        // Update local state
        setProfileData(prev => ({
          ...prev,
          [editingField.section]: {
            ...prev[editingField.section],
            [editingField.field]: editValue
          }
        }));
        
        // Update Firebase using correct nested structure
        const updateData = {};
        
        if (editingField.section === 'personalInfo') {
          updateData[`personal_info.${editingField.field}`] = editValue;
          if (editingField.field === 'firstName' || editingField.field === 'lastName') {
            const firstName = editingField.field === 'firstName' ? editValue : profileData.personalInfo.firstName;
            const lastName = editingField.field === 'lastName' ? editValue : profileData.personalInfo.lastName;
            updateData.displayName = `${firstName} ${lastName}`.trim();
          }
        } else if (editingField.section === 'vehicleInfo') {
          updateData[`vehicle_info.${editingField.field}`] = editValue;
        } else if (editingField.section === 'specialtyVehicleInfo') {
          updateData[`specialtyVehicleInfo.${editingField.field}`] = editValue;
        } else if (editingField.section === 'bankingInfo') {
          updateData[`payout_setup.${editingField.field}`] = editValue;
        } else if (editingField.section === 'documents') {
          updateData[`documents.${editingField.field}`] = editValue;
        }
        
        updateData.updatedAt = new Date().toISOString();
        await updateDoc(doc(db, 'driverApplications', user.id), updateData);
        
        setEditingField(null);
        setEditValue('');
        playSuccessSound();
      } catch (error) {
        console.error('Error saving field:', error);
        playErrorSound();
        Alert.alert('Error', 'Failed to save changes');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleEditEmergencyContact = () => {
    // Pre-fill with existing data if available
    setEmergencyContactData({
      name: profileData.emergencyContact.name || '',
      phone: profileData.emergencyContact.phone || '',
      relationship: profileData.emergencyContact.relationship || ''
    });
    setShowEmergencyContactModal(true);
  };

  const handleSaveEmergencyContact = async () => {
    // Validate emergency contact data
    if (!emergencyContactData.name.trim()) {
      Alert.alert('Validation Error', 'Please enter contact name');
      return;
    }
    if (!emergencyContactData.phone.trim()) {
      Alert.alert('Validation Error', 'Please enter contact phone number');
      return;
    }
    if (!emergencyContactData.relationship.trim()) {
      Alert.alert('Validation Error', 'Please enter relationship');
      return;
    }

    try {
      setSaving(true);
      
      // Save to Firebase under availability.emergencyContact
      await updateDoc(doc(db, 'driverApplications', user.id), {
        'availability.emergencyContact': emergencyContactData,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setProfileData(prev => ({
        ...prev,
        emergencyContact: emergencyContactData
      }));

      setShowEmergencyContactModal(false);
      playSuccessSound();
      Alert.alert('Success', 'Emergency contact saved successfully!');
    } catch (error) {
      console.error('Error saving emergency contact:', error);
      playErrorSound();
      Alert.alert('Error', 'Failed to save emergency contact');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEmergencyContact = () => {
    setShowEmergencyContactModal(false);
    setEmergencyContactData({
      name: '',
      phone: '',
      relationship: ''
    });
  };

  // Save specialty vehicle information to Firebase
  const saveSpecialtyVehicleInfo = async (specialtyVehicleInfo) => {
    if (!user?.id) return;
    
    try {
      setSaving(true);
      await updateDoc(doc(db, 'driverApplications', user.id), {
        specialtyVehicleInfo: specialtyVehicleInfo,
        updatedAt: new Date().toISOString()
      });
      playSuccessSound();
    } catch (error) {
      console.error('Error saving specialty vehicle info:', error);
      playErrorSound();
      Alert.alert('Error', 'Failed to save specialty vehicle information');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (section, field) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        playErrorSound();
        Alert.alert('Permission needed', 'Please grant photo library access to upload images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: section === 'personalInfo' ? [1, 1] : [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        if (section === 'vehicleInfo' && field === 'photos') {
          // Add to photos array
          setProfileData(prev => ({
            ...prev,
            vehicleInfo: {
              ...prev.vehicleInfo,
              photos: [...prev.vehicleInfo.photos, result.assets[0].uri]
            }
          }));
        } else {
          // Handle profile photo upload to Firebase Storage
          if (section === 'personalInfo' && field === 'profilePhoto') {
            try {
              setSaving(true);
              const uploadResult = await profilePictureService.uploadProfilePicture(user.id, result.assets[0].uri);
              
              if (uploadResult.success) {
                // Update local state with the Firebase Storage URL
                setProfileData(prev => ({
                  ...prev,
                  [section]: {
                    ...prev[section],
                    [field]: uploadResult.photoURL
                  }
                }));
                
                playSuccessSound();
                Alert.alert('Success', 'Profile photo uploaded successfully!');
              } else {
                throw new Error(uploadResult.error);
              }
            } catch (uploadError) {
              console.error('Profile photo upload error:', uploadError);
              playErrorSound();
              Alert.alert('Upload Failed', uploadError.message || 'Failed to upload profile photo');
            } finally {
              setSaving(false);
            }
          } else {
            // Set single photo (for other photos)
            setProfileData(prev => ({
              ...prev,
              [section]: {
                ...prev[section],
                [field]: result.assets[0].uri
              }
            }));
          }
        }
      }
    } catch (error) {
      playErrorSound();
      Alert.alert('Error', 'Failed to upload photo');
    }
  };

  const handleDocumentUpload = (docType) => {
    Alert.alert(
      'Upload Document',
      `Upload your ${docType.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => takeDocumentPhoto(docType) },
        { text: 'Choose from Library', onPress: () => chooseDocumentPhoto(docType) }
      ]
    );
  };

  const takeDocumentPhoto = async (docType) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        playErrorSound();
        Alert.alert('Permission needed', 'Please grant camera access to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfileData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [docType]: result.assets[0].uri
          }
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const chooseDocumentPhoto = async (docType) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfileData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [docType]: result.assets[0].uri
          }
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to choose photo');
    }
  };

  const ProfileField = ({ label, value, section, field, placeholder, keyboardType = 'default', editable = true, secure = false }) => {
    const isEditing = editingField?.section === section && editingField?.field === field;
    
    // For secure banking fields, always mask the value in display mode
    // Only show full value when actively editing
    const displayValue = secure && !isEditing && value 
      ? '••••' + value.slice(-4)
      : value;
    
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {label}
          {secure && !bankingUnlocked && (
            <Text style={styles.secureIndicator}> 🔒</Text>
          )}
        </Text>
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={placeholder}
              keyboardType={keyboardType}
              autoFocus
            />
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
                <Ionicons name="close" size={20} color={COLORS.error} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveField}>
                <Ionicons name="checkmark" size={20} color={COLORS.success} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.fieldValueContainer}
            onPress={() => editable && handleEditField(section, field, value)}
            disabled={!editable}
          >
            <Text style={[styles.fieldValue, !value && styles.fieldValueEmpty]}>
              {displayValue || placeholder}
            </Text>
            {editable && <Ionicons name={secure && !bankingUnlocked ? "lock-closed" : "pencil"} size={16} color={COLORS.secondary[500]} />}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const PhotoUpload = ({ photo, onUpload, placeholder, style }) => (
    <TouchableOpacity style={[styles.photoUpload, style]} onPress={onUpload}>
      {photo ? (
        <Image source={{ uri: photo }} style={styles.uploadedPhoto} />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Ionicons name="camera" size={32} color={COLORS.secondary[500]} />
          <Text style={styles.photoPlaceholderText}>{placeholder}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const DocumentItem = ({ title, status, docType, icon }) => (
    <TouchableOpacity 
      style={styles.documentItem}
      onPress={() => handleDocumentUpload(docType)}
    >
      <View style={styles.documentLeft}>
        <View style={styles.documentIcon}>
          <Ionicons name={icon} size={24} color={COLORS.primary[500]} />
        </View>
        <Text style={styles.documentTitle}>{title}</Text>
      </View>
      <View style={styles.documentRight}>
        <View style={[
          styles.statusBadge,
          status === 'verified' ? styles.statusVerified : 
          status === 'pending' ? styles.statusPending : styles.statusMissing
        ]}>
          <Text style={[
            styles.statusText,
            status === 'verified' ? styles.statusTextVerified : 
            status === 'pending' ? styles.statusTextPending : styles.statusTextMissing
          ]}>
            {status || 'Missing'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.secondary[500]} />
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title, icon, isExpanded, onToggle }) => (
    <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
      <View style={styles.sectionHeaderLeft}>
        <Ionicons name={icon} size={24} color={COLORS.primary[500]} />
        <Text style={styles.sectionHeaderText}>{title}</Text>
      </View>
      <Ionicons 
        name={isExpanded ? "chevron-up" : "chevron-down"} 
        size={20} 
        color={COLORS.secondary[500]} 
      />
    </TouchableOpacity>
  );

  const Card = ({ children, style }) => (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? 8 : 0 }]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary[500]} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? 8 : 0 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.secondary[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        {saving ? (
          <View style={styles.savingContainer}>
            <ActivityIndicator size="small" color={COLORS.white} />
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        ) : (
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Profile Photo Section */}
        <Card style={styles.profilePhotoCard}>
          <View style={styles.profilePhotoContainer}>
            <PhotoUpload
              photo={profileData.personalInfo.profilePhoto}
              onUpload={() => handlePhotoUpload('personalInfo', 'profilePhoto')}
              placeholder="Add Photo"
              style={styles.profilePhoto}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {`${profileData.personalInfo.firstName} ${profileData.personalInfo.lastName}`}
              </Text>
              <Text style={styles.profileEmail}>{profileData.personalInfo.email}</Text>
              <View style={styles.verificationBadge}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.verificationText}>Verified Driver</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Personal Information */}
        <SectionHeader
          title="Personal Information"
          icon="person-outline"
          isExpanded={activeSection === 'personal'}
          onToggle={() => setActiveSection(activeSection === 'personal' ? null : 'personal')}
        />
        {activeSection === 'personal' && (
          <Card>
            <ProfileField
              label="First Name"
              value={profileData.personalInfo.firstName}
              section="personalInfo"
              field="firstName"
              placeholder="Enter first name"
            />
            <ProfileField
              label="Last Name"
              value={profileData.personalInfo.lastName}
              section="personalInfo"
              field="lastName"
              placeholder="Enter last name"
            />
            <ProfileField
              label="Email Address"
              value={profileData.personalInfo.email}
              section="personalInfo"
              field="email"
              placeholder="Enter email address"
              keyboardType="email-address"
            />
            <ProfileField
              label="Phone Number"
              value={profileData.personalInfo.phone}
              section="personalInfo"
              field="phone"
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
            <ProfileField
              label="Date of Birth"
              value={profileData.personalInfo.dateOfBirth}
              section="personalInfo"
              field="dateOfBirth"
              placeholder="YYYY-MM-DD"
            />
            <ProfileField
              label="Address"
              value={profileData.personalInfo.address}
              section="personalInfo"
              field="address"
              placeholder="Enter full address"
            />
          </Card>
        )}

        {/* Vehicle Information */}
        <SectionHeader
          title="Vehicle Information"
          icon="car-outline"
          isExpanded={activeSection === 'vehicle'}
          onToggle={() => setActiveSection(activeSection === 'vehicle' ? null : 'vehicle')}
        />
        {activeSection === 'vehicle' && (
          <Card>
            <ProfileField
              label="Make"
              value={profileData.vehicleInfo.make}
              section="vehicleInfo"
              field="make"
              placeholder="e.g., Toyota"
            />
            <ProfileField
              label="Model"
              value={profileData.vehicleInfo.model}
              section="vehicleInfo"
              field="model"
              placeholder="e.g., Camry"
            />
            <ProfileField
              label="Year"
              value={profileData.vehicleInfo.year}
              section="vehicleInfo"
              field="year"
              placeholder="e.g., 2020"
              keyboardType="numeric"
            />
            <ProfileField
              label="Color"
              value={profileData.vehicleInfo.color}
              section="vehicleInfo"
              field="color"
              placeholder="e.g., Silver"
            />
            <ProfileField
              label="License Plate"
              value={profileData.vehicleInfo.licensePlate}
              section="vehicleInfo"
              field="licensePlate"
              placeholder="e.g., ABC-1234"
            />
            
            {/* Vehicle Type Selection */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Vehicle Type</Text>
              <View style={styles.vehicleTypeGrid}>
                {VEHICLE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.vehicleTypeOption,
                      profileData.vehicleInfo.vehicleType === type.value && styles.vehicleTypeSelected
                    ]}
                    onPress={() => setProfileData(prev => ({
                      ...prev,
                      vehicleInfo: { ...prev.vehicleInfo, vehicleType: type.value }
                    }))}
                  >
                    <Ionicons 
                      name={type.icon} 
                      size={24} 
                      color={profileData.vehicleInfo.vehicleType === type.value ? COLORS.white : COLORS.primary[500]} 
                    />
                    <Text style={[
                      styles.vehicleTypeText,
                      profileData.vehicleInfo.vehicleType === type.value && styles.vehicleTypeTextSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Vehicle Photos */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Vehicle Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
                {profileData.vehicleInfo.photos.map((photo, index) => (
                  <Image key={index} source={{ uri: photo }} style={styles.vehiclePhoto} />
                ))}
                <TouchableOpacity 
                  style={styles.addPhotoButton}
                  onPress={() => handlePhotoUpload('vehicleInfo', 'photos')}
                >
                  <Ionicons name="add" size={32} color={COLORS.primary[500]} />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Specialty Vehicle Information */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Specialty Vehicle Type</Text>
              <View style={styles.specialtyVehicleGrid}>
                {SPECIALTY_VEHICLE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.specialtyVehicleOption,
                      profileData.specialtyVehicleInfo.specialtyVehicleType === type.value && styles.specialtyVehicleSelected
                    ]}
                    onPress={async () => {
                      const newSpecialtyVehicleInfo = {
                        ...profileData.specialtyVehicleInfo,
                        specialtyVehicleType: type.value
                      };
                      setProfileData(prev => ({
                        ...prev,
                        specialtyVehicleInfo: newSpecialtyVehicleInfo
                      }));
                      await saveSpecialtyVehicleInfo(newSpecialtyVehicleInfo);
                    }}
                  >
                    <Text style={[
                      styles.specialtyVehicleLabel,
                      profileData.specialtyVehicleInfo.specialtyVehicleType === type.value && styles.specialtyVehicleLabelSelected
                    ]}>
                      {type.label}
                    </Text>
                    <Text style={[
                      styles.specialtyVehicleDescription,
                      profileData.specialtyVehicleInfo.specialtyVehicleType === type.value && styles.specialtyVehicleDescriptionSelected
                    ]}>
                      {type.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Service Capabilities */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Service Capabilities</Text>
              <Text style={styles.fieldSubtext}>Select all capabilities you can provide</Text>
              <View style={styles.serviceCapabilitiesGrid}>
                {SERVICE_CAPABILITIES.map((capability) => (
                  <TouchableOpacity
                    key={capability.value}
                    style={[
                      styles.serviceCapabilityOption,
                      profileData.specialtyVehicleInfo.serviceCapabilities.includes(capability.value) && styles.serviceCapabilitySelected
                    ]}
                    onPress={async () => {
                      const currentCapabilities = profileData.specialtyVehicleInfo.serviceCapabilities;
                      const newCapabilities = currentCapabilities.includes(capability.value)
                        ? currentCapabilities.filter(c => c !== capability.value)
                        : [...currentCapabilities, capability.value];
                      
                      const newSpecialtyVehicleInfo = {
                        ...profileData.specialtyVehicleInfo,
                        serviceCapabilities: newCapabilities
                      };
                      
                      setProfileData(prev => ({
                        ...prev,
                        specialtyVehicleInfo: newSpecialtyVehicleInfo
                      }));
                      await saveSpecialtyVehicleInfo(newSpecialtyVehicleInfo);
                    }}
                  >
                    <Text style={[
                      styles.serviceCapabilityLabel,
                      profileData.specialtyVehicleInfo.serviceCapabilities.includes(capability.value) && styles.serviceCapabilityLabelSelected
                    ]}>
                      {capability.label}
                    </Text>
                    <Text style={[
                      styles.serviceCapabilityDescription,
                      profileData.specialtyVehicleInfo.serviceCapabilities.includes(capability.value) && styles.serviceCapabilityDescriptionSelected
                    ]}>
                      {capability.description}
                    </Text>
                    {capability.requiresApproval && (
                      <Text style={styles.approvalRequiredText}>⚠️ Requires approval</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>
        )}

        {/* Documents */}
        <SectionHeader
          title="Documents"
          icon="document-text-outline"
          isExpanded={activeSection === 'documents'}
          onToggle={() => setActiveSection(activeSection === 'documents' ? null : 'documents')}
        />
        {activeSection === 'documents' && (
          <Card>
            <DocumentItem
              title="Driver's License"
              status={profileData.documents.driverLicense ? 'verified' : null}
              docType="driverLicense"
              icon="card-outline"
            />
            <DocumentItem
              title="Vehicle Insurance"
              status={profileData.documents.insurance ? 'verified' : null}
              docType="insurance"
              icon="shield-outline"
            />
            <DocumentItem
              title="Vehicle Registration"
              status={profileData.documents.registration ? 'verified' : null}
              docType="registration"
              icon="document-outline"
            />
            <DocumentItem
              title="Background Check"
              status={profileData.documents.backgroundCheck}
              docType="backgroundCheck"
              icon="checkmark-circle-outline"
            />
            <DocumentItem
              title="Vehicle Inspection"
              status={profileData.documents.vehicleInspection ? 'verified' : null}
              docType="vehicleInspection"
              icon="search-outline"
            />
          </Card>
        )}

        {/* Banking Information */}
        <SectionHeader
          title="Banking Information"
          icon="card-outline"
          isExpanded={activeSection === 'banking'}
          onToggle={() => setActiveSection(activeSection === 'banking' ? null : 'banking')}
        />
        {activeSection === 'banking' && (
          <Card>
            {!bankingUnlocked && (
              <View style={styles.securityNotice}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.primary[500]} />
                <Text style={styles.securityNoticeText}>
                  Banking information is protected. Click any field to verify your password and unlock.
                </Text>
              </View>
            )}
            {bankingUnlocked && (
              <View style={styles.unlockedNotice}>
                <Ionicons name="lock-open" size={20} color={COLORS.success} />
                <Text style={styles.unlockedNoticeText}>
                  Banking information unlocked for editing. Auto-locks in 5 minutes.
                </Text>
              </View>
            )}
            <ProfileField
              label="Account Holder Name"
              value={profileData.bankingInfo.accountHolderName}
              section="bankingInfo"
              field="accountHolderName"
              placeholder="Full name on account"
            />
            <ProfileField
              label="Bank Name"
              value={profileData.bankingInfo.bankName}
              section="bankingInfo"
              field="bankName"
              placeholder="Bank name"
            />
            <ProfileField
              label="Routing Number"
              value={profileData.bankingInfo.routingNumber}
              section="bankingInfo"
              field="routingNumber"
              placeholder="9-digit routing number"
              keyboardType="numeric"
              secure={true}
            />
            <ProfileField
              label="Account Number"
              value={profileData.bankingInfo.accountNumber}
              section="bankingInfo"
              field="accountNumber"
              placeholder="Account number"
              keyboardType="numeric"
              secure={true}
            />
            <View style={styles.bankingVerification}>
              <Ionicons 
                name={profileData.bankingInfo.isVerified ? "checkmark-circle" : "time-outline"} 
                size={20} 
                color={profileData.bankingInfo.isVerified ? COLORS.success : COLORS.warning} 
              />
              <Text style={[
                styles.verificationStatusText,
                { color: profileData.bankingInfo.isVerified ? COLORS.success : COLORS.warning }
              ]}>
                {profileData.bankingInfo.isVerified ? 'Verified' : 'Pending Verification'}
              </Text>
            </View>
          </Card>
        )}

        {/* Emergency Contact */}
        <SectionHeader
          title="Emergency Contact"
          icon="call-outline"
          isExpanded={activeSection === 'emergency'}
          onToggle={() => setActiveSection(activeSection === 'emergency' ? null : 'emergency')}
        />
        {activeSection === 'emergency' && (
          <Card>
            <View style={styles.emergencyContactSection}>
              <View style={styles.emergencyContactInfo}>
                {profileData.emergencyContact.name ? (
                  <>
                    <Text style={styles.emergencyContactName}>{profileData.emergencyContact.name}</Text>
                    <Text style={styles.emergencyContactDetails}>
                      {profileData.emergencyContact.relationship} • {profileData.emergencyContact.phone}
                    </Text>
                    <View style={styles.verificationStatus}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                      <Text style={[styles.verificationStatusText, { color: COLORS.success }]}>
                        Verified
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.emptyEmergencyContact}>
                    <Ionicons name="person-add-outline" size={24} color={COLORS.secondary[400]} />
                    <Text style={styles.emptyEmergencyContactText}>No emergency contact added</Text>
                    <Text style={styles.emptyEmergencyContactSubtext}>Add an emergency contact for safety</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity 
                style={styles.manageButton}
                onPress={() => handleEditEmergencyContact()}
              >
                <Text style={styles.manageButtonText}>
                  {profileData.emergencyContact.name ? 'Edit' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Password Verification Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelPasswordModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="shield-checkmark" size={32} color={COLORS.primary[500]} />
              <Text style={styles.modalTitle}>Verify Your Password</Text>
              <Text style={styles.modalSubtitle}>
                Enter your password to unlock and edit banking information
              </Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.passwordInput}
                value={passwordInput}
                onChangeText={setPasswordInput}
                placeholder="Enter your password"
                secureTextEntry={true}
                autoFocus={true}
                editable={!verifyingPassword}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={handleCancelPasswordModal}
                disabled={verifyingPassword}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalVerifyButton} 
                onPress={handleVerifyPassword}
                disabled={verifyingPassword || !passwordInput}
              >
                {verifyingPassword ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.modalVerifyButtonText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Emergency Contact Modal */}
      <Modal
        visible={showEmergencyContactModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelEmergencyContact}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 450 }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="call-outline" size={32} color={COLORS.primary[500]} />
              <Text style={styles.modalTitle}>Emergency Contact</Text>
              <Text style={styles.modalSubtitle}>
                Add or update your emergency contact information
              </Text>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Contact Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={emergencyContactData.name}
                  onChangeText={(text) => setEmergencyContactData(prev => ({ ...prev, name: text }))}
                  placeholder="Full name"
                  editable={!saving}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={emergencyContactData.phone}
                  onChangeText={(text) => setEmergencyContactData(prev => ({ ...prev, phone: text }))}
                  placeholder="(555) 123-4567"
                  keyboardType="phone-pad"
                  editable={!saving}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Relationship *</Text>
                <TextInput
                  style={styles.textInput}
                  value={emergencyContactData.relationship}
                  onChangeText={(text) => setEmergencyContactData(prev => ({ ...prev, relationship: text }))}
                  placeholder="e.g., Spouse, Parent, Sibling"
                  editable={!saving}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={handleCancelEmergencyContact}
                disabled={saving}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalVerifyButton} 
                onPress={handleSaveEmergencyContact}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.modalVerifyButtonText}>Save</Text>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DIMENSIONS.paddingL,
    paddingVertical: DIMENSIONS.paddingM,
    paddingTop: Platform.OS === 'android' ? DIMENSIONS.paddingL + 20 : DIMENSIONS.paddingM,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[200],
  },
  backButton: {
    padding: DIMENSIONS.paddingS,
    paddingTop: Platform.OS === 'android' ? DIMENSIONS.paddingS + 10 : DIMENSIONS.paddingS,
    paddingBottom: Platform.OS === 'android' ? DIMENSIONS.paddingS + 10 : DIMENSIONS.paddingS,
    borderRadius: DIMENSIONS.radiusM,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.secondary[900],
  },
  saveButton: {
    paddingHorizontal: DIMENSIONS.paddingL,
    paddingVertical: DIMENSIONS.paddingS,
    backgroundColor: COLORS.primary[500],
    borderRadius: DIMENSIONS.radiusM,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: DIMENSIONS.paddingM,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.radiusL,
    marginBottom: DIMENSIONS.paddingM,
    paddingVertical: DIMENSIONS.paddingM,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profilePhotoCard: {
    marginTop: DIMENSIONS.paddingM,
  },
  profilePhotoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.paddingL,
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInfo: {
    flex: 1,
    marginLeft: DIMENSIONS.paddingL,
  },
  profileName: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.secondary[900],
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.secondary[600],
    marginBottom: DIMENSIONS.paddingS,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.success,
    marginLeft: 4,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DIMENSIONS.paddingM,
    paddingVertical: DIMENSIONS.paddingL,
    marginTop: DIMENSIONS.paddingL,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderText: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.secondary[800],
    marginLeft: DIMENSIONS.paddingM,
  },
  fieldContainer: {
    paddingHorizontal: DIMENSIONS.paddingL,
    paddingVertical: DIMENSIONS.paddingM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[100],
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.secondary[700],
    marginBottom: DIMENSIONS.paddingS,
  },
  fieldValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValue: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.secondary[900],
    flex: 1,
  },
  fieldValueEmpty: {
    color: COLORS.secondary[500],
    fontStyle: 'italic',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.secondary[900],
    borderWidth: 1,
    borderColor: COLORS.primary[500],
    borderRadius: DIMENSIONS.radiusS,
    paddingHorizontal: DIMENSIONS.paddingM,
    paddingVertical: DIMENSIONS.paddingS,
    marginRight: DIMENSIONS.paddingM,
  },
  editActions: {
    flexDirection: 'row',
  },
  cancelButton: {
    padding: DIMENSIONS.paddingS,
    marginRight: DIMENSIONS.paddingS,
  },
  saveButton: {
    padding: DIMENSIONS.paddingS,
  },
  photoUpload: {
    borderRadius: DIMENSIONS.radiusM,
    overflow: 'hidden',
  },
  uploadedPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    backgroundColor: COLORS.secondary[100],
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  photoPlaceholderText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.secondary[600],
    marginTop: DIMENSIONS.paddingS,
    textAlign: 'center',
  },
  vehicleTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: DIMENSIONS.paddingS,
  },
  vehicleTypeOption: {
    width: '48%',
    marginRight: '2%',
    marginBottom: DIMENSIONS.paddingM,
    padding: DIMENSIONS.paddingM,
    borderRadius: DIMENSIONS.radiusM,
    borderWidth: 2,
    borderColor: COLORS.primary[200] || COLORS.secondary[200],
    alignItems: 'center',
  },
  vehicleTypeSelected: {
    backgroundColor: COLORS.primary[500],
    borderColor: COLORS.primary[500],
  },
  vehicleTypeText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.primary[500],
    marginTop: DIMENSIONS.paddingS,
    textAlign: 'center',
  },
  vehicleTypeTextSelected: {
    color: COLORS.white,
  },
  photosScroll: {
    marginTop: DIMENSIONS.paddingS,
  },
  vehiclePhoto: {
    width: 100,
    height: 75,
    borderRadius: DIMENSIONS.radiusM,
    marginRight: DIMENSIONS.paddingM,
  },
  addPhotoButton: {
    width: 100,
    height: 75,
    borderRadius: DIMENSIONS.radiusM,
    borderWidth: 2,
    borderColor: COLORS.primary[500],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.primary[500],
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    marginTop: 4,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DIMENSIONS.paddingL,
    paddingVertical: DIMENSIONS.paddingL,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary[100],
  },
  documentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary[50] || COLORS.secondary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DIMENSIONS.paddingM,
  },
  documentTitle: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.secondary[900],
  },
  documentRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: DIMENSIONS.paddingM,
    paddingVertical: DIMENSIONS.paddingXS,
    borderRadius: DIMENSIONS.radiusM,
    marginRight: DIMENSIONS.paddingM,
  },
  statusVerified: {
    backgroundColor: COLORS.success + '20',
  },
  statusPending: {
    backgroundColor: COLORS.warning + '20',
  },
  statusMissing: {
    backgroundColor: COLORS.error + '20',
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  statusTextVerified: {
    color: COLORS.success,
  },
  statusTextPending: {
    color: COLORS.warning,
  },
  statusTextMissing: {
    color: COLORS.error,
  },
  bankingVerification: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.paddingL,
    paddingVertical: DIMENSIONS.paddingM,
    backgroundColor: COLORS.secondary[50],
    borderRadius: DIMENSIONS.radiusM,
    marginTop: DIMENSIONS.paddingM,
  },
  verificationStatusText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    marginLeft: DIMENSIONS.paddingS,
  },
  bottomPadding: {
    height: DIMENSIONS.paddingXL,
  },
  emergencyContactSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DIMENSIONS.paddingM,
  },
  emergencyContactInfo: {
    flex: 1,
  },
  emergencyContactName: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.secondary[900],
    marginBottom: 4,
  },
  emergencyContactDetails: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.secondary[600],
    marginBottom: 2,
  },
  emergencyContactEmail: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.secondary[600],
    marginBottom: DIMENSIONS.paddingS,
  },
  verificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manageButton: {
    backgroundColor: COLORS.primary[500],
    paddingHorizontal: DIMENSIONS.paddingM,
    paddingVertical: DIMENSIONS.paddingS,
    borderRadius: DIMENSIONS.radiusM,
  },
  manageButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  emptyEmergencyContact: {
    alignItems: 'center',
    paddingVertical: DIMENSIONS.paddingM,
  },
  emptyEmergencyContactText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.secondary[600],
    marginTop: DIMENSIONS.paddingS,
    marginBottom: 4,
  },
  emptyEmergencyContactSubtext: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.secondary[500],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.secondary[50],
    paddingTop: Platform.OS === 'android' ? 50 : 0,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.secondary[600],
    marginTop: DIMENSIONS.paddingM,
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.paddingL,
    paddingVertical: DIMENSIONS.paddingS,
    backgroundColor: COLORS.primary[500],
    borderRadius: DIMENSIONS.radiusM,
  },
  savingText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.white,
    marginLeft: DIMENSIONS.paddingS,
  },
  // Specialty Vehicle Styles
  specialtyVehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DIMENSIONS.paddingS,
  },
  specialtyVehicleOption: {
    flex: 1,
    minWidth: '45%',
    padding: DIMENSIONS.paddingM,
    borderWidth: 2,
    borderColor: COLORS.secondary[200],
    borderRadius: DIMENSIONS.radiusM,
    backgroundColor: COLORS.white,
  },
  specialtyVehicleSelected: {
    borderColor: COLORS.primary[500],
    backgroundColor: COLORS.primary[50],
  },
  specialtyVehicleLabel: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.secondary[900],
    marginBottom: 4,
  },
  specialtyVehicleLabelSelected: {
    color: COLORS.primary[700],
  },
  specialtyVehicleDescription: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.secondary[600],
  },
  specialtyVehicleDescriptionSelected: {
    color: COLORS.primary[600],
  },
  // Service Capabilities Styles
  fieldSubtext: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.secondary[600],
    marginBottom: DIMENSIONS.paddingM,
  },
  serviceCapabilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DIMENSIONS.paddingS,
  },
  serviceCapabilityOption: {
    flex: 1,
    minWidth: '45%',
    padding: DIMENSIONS.paddingM,
    borderWidth: 1,
    borderColor: COLORS.secondary[200],
    borderRadius: DIMENSIONS.radiusM,
    backgroundColor: COLORS.white,
  },
  serviceCapabilitySelected: {
    borderColor: COLORS.primary[500],
    backgroundColor: COLORS.primary[50],
  },
  serviceCapabilityLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.secondary[900],
    marginBottom: 4,
  },
  serviceCapabilityLabelSelected: {
    color: COLORS.primary[700],
  },
  serviceCapabilityDescription: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.secondary[600],
    marginBottom: 4,
  },
  serviceCapabilityDescriptionSelected: {
    color: COLORS.primary[600],
  },
  approvalRequiredText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.warning,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  secureIndicator: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    marginLeft: 4,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary[50],
    padding: DIMENSIONS.paddingM,
    borderRadius: DIMENSIONS.radiusM,
    marginHorizontal: DIMENSIONS.paddingL,
    marginBottom: DIMENSIONS.paddingM,
  },
  securityNoticeText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.primary[700],
    marginLeft: DIMENSIONS.paddingS,
  },
  unlockedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '20',
    padding: DIMENSIONS.paddingM,
    borderRadius: DIMENSIONS.radiusM,
    marginHorizontal: DIMENSIONS.paddingL,
    marginBottom: DIMENSIONS.paddingM,
  },
  unlockedNoticeText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.success,
    marginLeft: DIMENSIONS.paddingS,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: DIMENSIONS.paddingL,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.radiusL,
    width: '100%',
    maxWidth: 400,
    padding: DIMENSIONS.paddingXL,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: DIMENSIONS.paddingXL,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.secondary[900],
    marginTop: DIMENSIONS.paddingM,
    marginBottom: DIMENSIONS.paddingS,
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.secondary[600],
    textAlign: 'center',
  },
  modalBody: {
    marginBottom: DIMENSIONS.paddingXL,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.secondary[700],
    marginBottom: DIMENSIONS.paddingS,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: COLORS.secondary[300],
    borderRadius: DIMENSIONS.radiusM,
    paddingHorizontal: DIMENSIONS.paddingL,
    paddingVertical: DIMENSIONS.paddingM,
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.secondary[900],
  },
  formGroup: {
    marginBottom: DIMENSIONS.paddingL,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.secondary[300],
    borderRadius: DIMENSIONS.radiusM,
    paddingHorizontal: DIMENSIONS.paddingL,
    paddingVertical: DIMENSIONS.paddingM,
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.secondary[900],
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: DIMENSIONS.paddingM,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: DIMENSIONS.paddingM,
    borderRadius: DIMENSIONS.radiusM,
    borderWidth: 1,
    borderColor: COLORS.secondary[300],
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.secondary[700],
  },
  modalVerifyButton: {
    flex: 1,
    paddingVertical: DIMENSIONS.paddingM,
    borderRadius: DIMENSIONS.radiusM,
    backgroundColor: COLORS.primary[500],
    alignItems: 'center',
  },
  modalVerifyButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.white,
  },
});

// Specialty Vehicle Types for AnyRyde
const SPECIALTY_VEHICLE_TYPES = [
  { value: 'standard', label: '🚘 Standard Car', description: '1–4 passengers' },
  { value: 'large', label: '🚐 Large Vehicle', description: '5+ passengers / Van / SUV' },
  { value: 'tow_truck', label: '🚛 Tow Truck', description: 'For vehicle transport and towing' },
  { value: 'wheelchair_accessible', label: '♿ Wheelchair-Accessible', description: 'ADA compliant vehicle' },
  { value: 'taxi_metered', label: '🚖 Taxi-Style Metered', description: 'For licensed taxi providers' }
];

// Service Capabilities for AnyRyde
const SERVICE_CAPABILITIES = [
  { 
    value: 'video_enabled', 
    label: '🎥 Video-Enabled Ride', 
    description: 'Dashcam installed for ride recording',
    requiresApproval: false
  },
  { 
    value: 'paired_driver', 
    label: '👥 Paired Driver Available', 
    description: 'Ride-along driver option',
    requiresApproval: false
  },
  { 
    value: 'medical_transport', 
    label: '🏥 Medical Transport Certified', 
    description: 'Certified for medical transportation',
    requiresApproval: true
  },
  { 
    value: 'pet_friendly', 
    label: '🐶 Pet-Friendly Vehicle', 
    description: 'Suitable for pets and service animals',
    requiresApproval: false
  },
  { 
    value: 'car_seat_infant', 
    label: '👶 Infant Car Seat Available', 
    description: 'Rear-facing infant car seat',
    requiresApproval: false
  },
  { 
    value: 'car_seat_toddler', 
    label: '👶 Toddler Car Seat Available', 
    description: 'Forward-facing toddler car seat',
    requiresApproval: false
  },
  { 
    value: 'car_seat_booster', 
    label: '👶 Booster Seat Available', 
    description: 'Booster seat for older children',
    requiresApproval: false
  }
];

// Legacy vehicle types for backward compatibility
const VEHICLE_TYPES = [
  { value: 'sedan', label: 'Sedan', icon: 'car-outline' },
  { value: 'suv', label: 'SUV', icon: 'car-sport-outline' },
  { value: 'van', label: 'Van', icon: 'bus-outline' },
  { value: 'truck', label: 'Truck', icon: 'car-outline' }
];

export default ProfileScreen; 