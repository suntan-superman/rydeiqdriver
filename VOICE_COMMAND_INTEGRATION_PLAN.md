# Voice Command Integration Plan

## 🎯 Overview
Enable hands-free voice commands for drivers to accept/decline ride requests without touching the device.

## 📋 Implementation Strategy

### Phase 1: Ride Request Voice Commands ✅
**Goal**: Driver can say "accept" or "decline" when a ride request arrives

**Flow**:
1. Ride request notification arrives
2. Sound plays (2 seconds)
3. Voice announcement: "New ride request from [pickup]"
4. **Auto-start listening** for voice commands
5. Driver says "accept" or "decline"
6. **Confirmation required** for safety:
   - If "decline": Ask "Are you sure you want to decline? Say confirm or cancel"
   - If "accept": Proceed to bid submission (optional: voice confirmation)
7. Execute action based on confirmation

**Key Features**:
- **10-second timeout**: Auto-stop listening if no command
- **Visual indicator**: Pulsing microphone icon + "Say 'Accept' or 'Decline'"
- **Error handling**: Falls back to manual touch if voice fails
- **Background safe**: Only listens when modal is visible

### Phase 2: Bid Amount Voice Input (Future)
**Goal**: Driver can speak bid amount instead of typing

**Flow**:
1. After accepting ride request
2. Voice asks: "What's your bid amount?"
3. Driver says: "Fifteen dollars" or "15 dollars"
4. System confirms: "Your bid is $15, say confirm or cancel"
5. Execute on confirmation

### Phase 3: Navigation Commands (Future)
**Goal**: Hands-free navigation during active rides

**Commands**:
- "Arrived at pickup"
- "Start trip"
- "Complete trip"
- "Need help" (emergency)

### Phase 4: Extended Commands (Future)
**Other use cases**:
- Going online/offline: "Go online" / "Go offline"
- Checking earnings: "What are my earnings?"
- Next scheduled ride: "What's my next ride?"

---

## 🔧 Technical Implementation

### File Structure
```
src/
├── services/
│   ├── voiceCommandService.js      ✅ Created
│   └── speechService.js            ✅ Exists (TTS)
├── components/
│   ├── VoiceCommandIndicator.js    ✅ Created
│   └── DriverBidSubmissionScreen.js (To be modified)
└── screens/
    └── dashboard/
        └── HomeScreen.js           (To be modified)
```

### Integration Steps

#### Step 1: Modify DriverBidSubmissionScreen
Add voice command support to the bid submission modal:

```javascript
import voiceCommandService from '@/services/voiceCommandService';
import VoiceCommandIndicator from '@/components/VoiceCommandIndicator';

// Add state
const [isVoiceListening, setIsVoiceListening] = useState(false);
const [voiceContext, setVoiceContext] = useState(null);
const [needsConfirmation, setNeedsConfirmation] = useState(false);
const [pendingAction, setPendingAction] = useState(null);

// Initialize voice service
useEffect(() => {
  voiceCommandService.initialize();
  return () => voiceCommandService.destroy();
}, []);

// Start listening when modal opens
useEffect(() => {
  if (visible && rideRequest) {
    // Wait for voice announcement to finish (2s sound + 3s speech)
    setTimeout(() => {
      startVoiceListening();
    }, 5000);
  } else {
    stopVoiceListening();
  }
}, [visible, rideRequest]);

// Voice listening functions
const startVoiceListening = async () => {
  setIsVoiceListening(true);
  setVoiceContext('ride_request');
  
  await voiceCommandService.startListening('ride_request', handleVoiceCommand, 10000);
};

const stopVoiceListening = async () => {
  await voiceCommandService.stopListening();
  setIsVoiceListening(false);
  setVoiceContext(null);
};

const handleVoiceCommand = async (result) => {
  console.log('🎤 Voice command result:', result);
  
  if (result.type === 'success') {
    const { command } = result;
    
    if (command === 'decline') {
      // Ask for confirmation
      setPendingAction('decline');
      setNeedsConfirmation(true);
      setVoiceContext('confirmation');
      
      // Speak confirmation request
      await speechService.speak('Are you sure you want to decline this ride? Say confirm or cancel', null);
      
      // Start listening for confirmation
      setTimeout(() => {
        voiceCommandService.startListening('confirmation', handleConfirmation, 10000);
      }, 3000);
      
    } else if (command === 'accept') {
      // Optionally ask for confirmation or proceed directly
      setPendingAction('accept');
      // For now, proceed directly to bid screen
      handleAcceptRide();
    }
  } else if (result.type === 'timeout') {
    console.log('⏱️ Voice command timeout - user can use touch');
    setIsVoiceListening(false);
  } else if (result.type === 'error') {
    console.error('❌ Voice error:', result.error);
    setIsVoiceListening(false);
  }
};

const handleConfirmation = async (result) => {
  if (result.type === 'success') {
    const { command } = result;
    
    if (command === 'confirm' && pendingAction === 'decline') {
      // Execute decline
      handleDeclineRide();
    } else if (command === 'cancel') {
      // Cancel action, go back to listening for accept/decline
      setPendingAction(null);
      setNeedsConfirmation(false);
      await speechService.speak('Cancelled. Say accept or decline', null);
      setTimeout(() => startVoiceListening(), 2000);
    }
  }
  
  setIsVoiceListening(false);
  setNeedsConfirmation(false);
};

// Add indicator to render
<VoiceCommandIndicator 
  isListening={isVoiceListening} 
  context={voiceContext} 
/>
```

#### Step 2: Settings Toggle
Add voice command enable/disable in settings:

```javascript
// In SpeechSettingsModal or new VoiceCommandSettingsModal
const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(true);

// Save to AsyncStorage
await AsyncStorage.setItem('voiceCommandsEnabled', JSON.stringify(enabled));
```

#### Step 3: Safety Considerations
1. **Confirmation required for decline** - Prevents accidental declines
2. **Timeout protection** - Auto-stops listening after 10 seconds
3. **Manual override** - Touch buttons always work
4. **Visual feedback** - Clear indication when listening
5. **Disable while driving** - Optional: disable during active rides

---

## 🎨 UX Flow Diagram

```
[Ride Request Arrives]
         ↓
[🔔 Sound Plays (2s)]
         ↓
[🎤 Voice: "New ride from Main St"]
         ↓
[🎧 Auto-start listening]
         ↓
[👂 Waiting for command (10s)]
         ↓
    ┌────────────┴────────────┐
    ↓                         ↓
[Says "Accept"]         [Says "Decline"]
    ↓                         ↓
[Show Bid Screen]      [🎤 "Confirm decline?"]
                              ↓
                         [Says "Confirm"]
                              ↓
                         [Decline Ride]
```

---

## ⚠️ Important Notes

1. **iOS**: Speech recognition prompts user permission automatically
2. **Android**: Requires RECORD_AUDIO permission (already in app.json ✅)
3. **Locale**: Currently set to 'en-US' - can be configurable
4. **Performance**: Voice service is lightweight, minimal battery impact
5. **Testing**: Test in noisy environments for accuracy

---

## 📊 Success Metrics

After implementation, track:
- % of rides accepted/declined by voice
- Voice command accuracy rate
- User feedback on hands-free experience
- Time saved vs manual interaction

---

## 🚀 Next Steps

1. ✅ Review voice command service
2. ⏳ Integrate into DriverBidSubmissionScreen
3. ⏳ Add visual indicator
4. ⏳ Test on physical device (requires rebuild for native module)
5. ⏳ Collect driver feedback
6. ⏳ Expand to other commands (Phase 2-4)

---

## 🔧 Required Package

The implementation uses `@react-native-voice/voice` package. Install with:

```bash
yarn add @react-native-voice/voice
```

Then rebuild with EAS:
```bash
eas build --profile development --platform all
```

