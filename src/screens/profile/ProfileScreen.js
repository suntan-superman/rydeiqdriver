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
import { useSelector, useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { playSuccessSound, playErrorSound } from '@/utils/soundEffects';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useAuth();
  
  // Real profile data from Firebase
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
      relationship: '',
      email: ''
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  

  const [activeSection, setActiveSection] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  // Load profile data from Firebase
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Load driver data from drivers collection
        const driverDoc = await getDoc(doc(db, 'drivers', user.id));
        let driverData = {};
        if (driverDoc.exists()) {
          driverData = driverDoc.data();
        } else {
          // Initialize driver document with basic data
          await setDoc(doc(db, 'drivers', user.id), {
            email: user.email,
            displayName: user.displayName || 'Driver',
            phoneNumber: '',
            address: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        
        // Load vehicle data from vehicle_info collection
        const vehicleDoc = await getDoc(doc(db, 'vehicle_info', user.id));
        let vehicleData = {};
        if (vehicleDoc.exists()) {
          vehicleData = vehicleDoc.data();
        }
        
        // Map Firebase data to profile structure using CORRECT priority order
        const mappedProfileData = {
          personalInfo: {
            firstName: driverData.personal_info?.firstName || driverData.firstName || driverData.displayName?.split(' ')[0] || '',
            lastName: driverData.personal_info?.lastName || driverData.lastName || driverData.displayName?.split(' ').slice(1).join(' ') || '',
            email: user.email || driverData.personal_info?.email || driverData.email || '',
            phone: driverData.personal_info?.phoneNumber || driverData.phone || driverData.phoneNumber || '',
            dateOfBirth: driverData.personal_info?.dateOfBirth || driverData.dateOfBirth || driverData.dob || '',
            address: driverData.personal_info?.address ? 
              `${driverData.personal_info.address}, ${driverData.personal_info.city}, ${driverData.personal_info.state} ${driverData.personal_info.zipCode}` :
              driverData.address || driverData.homeAddress || '',
            profilePhoto: driverData.documents?.profile_photo?.url || driverData.document_upload?.profile_photo?.url || driverData.profilePhoto || driverData.photoURL || null
          },
          vehicleInfo: {
            make: driverData.vehicle_info?.make || vehicleData.make || driverData.vehicleInfo?.make || driverData.vehicle?.make || '',
            model: driverData.vehicle_info?.model || vehicleData.model || driverData.vehicleInfo?.model || driverData.vehicle?.model || '',
            year: driverData.vehicle_info?.year || vehicleData.year || driverData.vehicleInfo?.year || driverData.vehicle?.year || '',
            color: driverData.vehicle_info?.color || vehicleData.color || driverData.vehicleInfo?.color || driverData.vehicle?.color || '',
            licensePlate: driverData.vehicle_info?.licensePlate || vehicleData.licensePlate || driverData.vehicleInfo?.licensePlate || driverData.vehicle?.licensePlate || '',
            vehicleType: driverData.vehicle_info?.vehicleType || vehicleData.vehicleType || driverData.vehicleInfo?.vehicleType || driverData.vehicle?.vehicleType || 'standard',
            photos: driverData.vehicle_info?.photos || vehicleData.photos || driverData.vehicleInfo?.photos || driverData.vehicle?.photos || []
          },
          documents: {
            driverLicense: driverData.documents?.drivers_license_front?.url || driverData.document_upload?.drivers_license_front?.url || driverData.driverLicense || null,
            insurance: driverData.documents?.insurance_proof?.url || driverData.document_upload?.insurance_proof?.url || driverData.insurance || null,
            registration: driverData.documents?.vehicle_registration?.url || driverData.document_upload?.vehicle_registration?.url || driverData.registration || null,
            backgroundCheck: driverData.backgroundCheck?.currentStep || driverData.documents?.backgroundCheck || 'pending',
            vehicleInspection: driverData.documents?.vehicleInspection || driverData.vehicleInspection || null
          },
          bankingInfo: {
            accountHolderName: driverData.payout_setup?.accountHolderName || driverData.payoutInfo?.payout_setup?.accountHolderName || driverData.bankingInfo?.accountHolderName || driverData.accountHolderName || '',
            routingNumber: driverData.payout_setup?.routingNumber || driverData.payoutInfo?.payout_setup?.routingNumber || driverData.bankingInfo?.routingNumber || driverData.routingNumber || '',
            accountNumber: driverData.payout_setup?.accountNumber || driverData.payoutInfo?.payout_setup?.accountNumber || driverData.bankingInfo?.accountNumber || driverData.accountNumber || '',
            bankName: driverData.payout_setup?.bankName || driverData.payoutInfo?.payout_setup?.bankName || driverData.bankingInfo?.bankName || driverData.bankName || '',
            isVerified: driverData.payout_setup?.verificationMethod === 'microdeposit' || driverData.payoutInfo?.payout_setup?.verificationMethod === 'microdeposit' || driverData.bankingInfo?.isVerified || driverData.bankingVerified || false
          },
          emergencyContact: {
            name: driverData.availability?.emergencyContact?.name || driverData.emergencyContact?.name || '',
            phone: driverData.availability?.emergencyContact?.phone || driverData.emergencyContact?.phone || '',
            relationship: driverData.availability?.emergencyContact?.relationship || driverData.emergencyContact?.relationship || '',
            email: driverData.availability?.emergencyContact?.email || driverData.emergencyContact?.email || ''
          }
        };
        
        setProfileData(mappedProfileData);
      } catch (error) {
        console.error('Error loading profile data:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    loadProfileData();
  }, [user?.id]);

  // Vehicle type options
  const VEHICLE_TYPES = [
    { value: 'standard', label: 'Standard', icon: 'car' },
    { value: 'premium', label: 'Premium', icon: 'car-sport' },
    { value: 'wheelchair', label: 'Wheelchair Accessible', icon: 'accessibility' },
    { value: 'pet', label: 'Pet Friendly', icon: 'paw' }
  ];

  const handleEditField = (section, field, currentValue) => {
    setEditingField({ section, field });
    setEditValue(currentValue || '');
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
        } else if (editingField.section === 'bankingInfo') {
          updateData[`payout_setup.${editingField.field}`] = editValue;
        } else if (editingField.section === 'documents') {
          updateData[`documents.${editingField.field}`] = editValue;
        }
        
        updateData.updatedAt = new Date().toISOString();
        await updateDoc(doc(db, 'drivers', user.id), updateData);
        
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
    Alert.alert(
      'Emergency Contact',
      'Emergency contact management will be available in a future update. For now, you can update this information through the web app.',
      [{ text: 'OK' }]
    );
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
          // Set single photo
          setProfileData(prev => ({
            ...prev,
            [section]: {
              ...prev[section],
              [field]: result.assets[0].uri
            }
          }));
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

  const ProfileField = ({ label, value, section, field, placeholder, keyboardType = 'default', editable = true }) => {
    const isEditing = editingField?.section === section && editingField?.field === field;
    
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
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
              {value || placeholder}
            </Text>
            {editable && <Ionicons name="pencil" size={16} color={COLORS.secondary[500]} />}
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
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary[500]} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
            />
            <ProfileField
              label="Account Number"
              value={profileData.bankingInfo.accountNumber}
              section="bankingInfo"
              field="accountNumber"
              placeholder="Account number"
              keyboardType="numeric"
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
                    {profileData.emergencyContact.email && (
                      <Text style={styles.emergencyContactEmail}>{profileData.emergencyContact.email}</Text>
                    )}
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
});

export default ProfileScreen; 