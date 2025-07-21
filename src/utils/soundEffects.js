import { Audio } from 'expo-av';
import { store } from '@/store';

// Sound configuration - set to null for missing files, will use system sounds as fallback
const SOUND_URIS = {
  rideRequest: null, // require('../../assets/sounds/ride_request.mp3'),
  bid: null, // require('../../assets/sounds/bid.mp3'),
  success: null, // require('../../assets/sounds/success.mp3'),
  error: null, // require('../../assets/sounds/error.mp3'),
  signInOut: null, // require('../../assets/sounds/sign_in_out.mp3'),
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
    console.log(`Sound effect '${type}' triggered (no custom file available)`);
    
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