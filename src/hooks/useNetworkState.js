import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import * as Network from 'expo-network';
import { setConnectionStatus } from '@/store/slices/appSlice';

export const useNetworkState = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    let networkSubscription;

    const checkInitialNetworkState = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        dispatch(setConnectionStatus(networkState.isConnected));
      } catch (error) {
        console.error('Error checking initial network state:', error);
        // Assume connected if we can't check
        dispatch(setConnectionStatus(true));
      }
    };

    const setupNetworkListener = async () => {
      try {
        // Check initial state
        await checkInitialNetworkState();

        // Listen for network changes
        networkSubscription = Network.addNetworkStateListener((networkState) => {
          console.log('Network state changed:', networkState);
          dispatch(setConnectionStatus(networkState.isConnected));
          
          // Log connectivity changes for debugging
          if (networkState.isConnected) {
            console.log('Device is online');
          } else {
            console.log('Device is offline');
          }
        });
      } catch (error) {
        console.error('Error setting up network listener:', error);
      }
    };

    setupNetworkListener();

    // Cleanup
    return () => {
      if (networkSubscription) {
        networkSubscription.remove();
      }
    };
  }, [dispatch]);
}; 