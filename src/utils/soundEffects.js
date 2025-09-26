import { Audio } from 'expo-av';
import { store } from '@/store';

// Sound configuration - using actual sound files from assets
const SOUND_URIS = {
  rideRequest: require('../../assets/sounds/mixkit-fast-car-drive-by-1538.wav'), // Car-themed sound for ride requests
  bid: require('../../assets/sounds/classified-stamp-soundroll-7-7-00-01.mp3'),
  success: require('../../assets/sounds/success.mp3'),
  error: require('../../assets/sounds/error.mp3'), // ✅ Now available
  signInOut: require('../../assets/sounds/signInOut.mp3'),
  // Additional sounds for notifications
  achievement: require('../../assets/sounds/mixkit-achievement-bell-600.wav'),
  notification: require('../../assets/sounds/notification-confirmation-with-echo-smartsound-fx-lower-tone-2-00-01.mp3'),
  
  // Bid notification sounds (using existing files for compatibility)
  bidAccepted: require('../../assets/sounds/mixkit-achievement-bell-600.wav'), // Achievement bell for bid acceptance
  rideStart: require('../../assets/sounds/mixkit-fast-car-drive-by-1538.wav'), // Car sound for ride start
  rideCompleted: require('../../assets/sounds/success.mp3'), // Success sound for completion
  rideCancelled: require('../../assets/sounds/error.mp3'), // Error sound for cancellation
  paymentReceived: require('../../assets/sounds/success.mp3'), // Success sound for payment
};

// System sound fallbacks (these work without requiring files)
const SYSTEM_SOUNDS = {
  rideRequest: Audio.Sound.createAsync({ uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' }),
  bid: Audio.Sound.createAsync({ uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' }),
  success: Audio.Sound.createAsync({ uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' }),
  error: Audio.Sound.createAsync({ uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' }),
  signInOut: Audio.Sound.createAsync({ uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' }),
};

export async function playSound(type) {
  try {
    // Check if sound is enabled in settings
    const state = store.getState();
    const soundEnabled = state.app.settings.sound;
    
    if (!soundEnabled) return;

    // Set audio mode for iOS compatibility
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        // Remove iOS interruption mode to avoid the error
      });
    } catch (audioModeError) {
      console.warn('⚠️ Could not set audio mode:', audioModeError.message);
    }
    
    // Try to use custom sound file first
    const customUri = SOUND_URIS[type];
    if (customUri) {
      const { sound } = await Audio.Sound.createAsync(customUri);
      await sound.playAsync();
      
      // Unload after playback
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
      return;
    }
    
    // Fallback to system sound or silent (for now)
    // console.log(`Sound effect '${type}' triggered (no custom file available)`);
    
  } catch (error) {
    // Fail silently - don't break the app if sounds fail
    console.log(`Sound effect '${type}' failed to play:`, error.message);
  }
}

// Convenience functions for specific sound types
export const playRideRequestSound = () => playSound('rideRequest');
export const playBidSound = () => playSound('bid');
export const playSuccessSound = () => playSound('success');
export const playErrorSound = () => playSound('error');
export const playSignInOutSound = () => playSound('signInOut');
export const playAchievementSound = () => playSound('achievement');
export const playNotificationSound = () => playSound('notification');

// Bid notification convenience functions
export const playBidAcceptedSound = () => playSound('bidAccepted');
export const playRideStartSound = () => playSound('rideStart');
export const playRideCompletedSound = () => playSound('rideCompleted');
export const playRideCancelledSound = () => playSound('rideCancelled');
export const playPaymentReceivedSound = () => playSound('paymentReceived'); 