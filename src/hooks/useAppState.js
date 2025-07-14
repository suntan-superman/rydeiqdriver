import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useDispatch } from 'react-redux';
import { setAppState } from '@/store/slices/appSlice';

export const useAppState = () => {
  const dispatch = useDispatch();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      // Log app state changes for debugging
      console.log('App state changed from', appState.current, 'to', nextAppState);
      
      // Update Redux store
      dispatch(setAppState(nextAppState));
      
      // Handle specific state transitions
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground!');
        // App has come to the foreground - refresh critical data
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        console.log('App has gone to the background!');
        // App has gone to the background - save state, pause location updates
      }

      appState.current = nextAppState;
    };

    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup subscription
    return () => subscription?.remove();
  }, [dispatch]);

  return appState.current;
}; 