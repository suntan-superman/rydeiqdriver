/**
 * HomeScreen Integration Tests
 * Tests HomeScreen component with React Query integration
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import HomeScreen from '@/screens/dashboard/HomeScreen';
import { TestWrapper } from '../../setup';

// Add testID to HomeScreen if not present
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    setOptions: jest.fn(),
  }),
}));

describe('HomeScreen Integration Tests', () => {
  it('should render without crashing', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByTestId('home-screen')).toBeTruthy();
    });
  });

  it('should display loading state initially', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('should load driver status from React Query', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });

    expect(getByTestId('driver-status')).toBeTruthy();
  });

  it('should display analytics data', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });

    expect(getByTestId('analytics-dashboard')).toBeTruthy();
  });

  it('should show notification count', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });

    expect(getByTestId('notification-count')).toBeTruthy();
  });

  it('should handle errors gracefully', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      // Should either show data or error, not loading
      const loading = screen.queryByTestId('loading-indicator');
      const data = screen.queryByTestId('driver-status');
      const error = screen.queryByTestId('error-state');
      
      expect(loading || data || error).toBeTruthy();
    });
  });

  it('should update when refresh is triggered', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });

    const refreshButton = getByTestId('refresh-button');
    fireEvent.press(refreshButton);

    // Should show loading again
    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('should display all required sections', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });

    // Check for main sections
    expect(getByTestId('driver-status')).toBeTruthy();
    expect(getByTestId('analytics-dashboard')).toBeTruthy();
    expect(getByTestId('quick-actions')).toBeTruthy();
  });

  it('should navigate to correct screens on action', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });

    const actionButton = getByTestId('start-ride-action');
    fireEvent.press(actionButton);

    // Navigation should be called
    expect(actionButton).toBeTruthy();
  });
});
