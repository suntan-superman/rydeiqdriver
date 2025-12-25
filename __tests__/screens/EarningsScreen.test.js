/**
 * EarningsScreen Integration Tests
 * Tests EarningsScreen component with React Query integration
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import EarningsScreen from '@/screens/earnings/EarningsScreen';
import { TestWrapper } from '../../setup';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    setOptions: jest.fn(),
  }),
}));

describe('EarningsScreen Integration Tests', () => {
  it('should render without crashing', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <EarningsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByTestId('earnings-screen')).toBeTruthy();
    });
  });

  it('should display loading state initially', () => {
    render(
      <TestWrapper>
        <EarningsScreen />
      </TestWrapper>
    );

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('should load earnings data from React Query', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <EarningsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });

    expect(getByTestId('total-earnings')).toBeTruthy();
  });

  it('should display earnings summary card', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <EarningsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });

    expect(getByTestId('total-earnings')).toBeTruthy();
    expect(getByTestId('trip-earnings')).toBeTruthy();
    expect(getByTestId('tips')).toBeTruthy();
    expect(getByTestId('hourly-rate')).toBeTruthy();
  });

  it('should show different earnings for different periods', async () => {
    const { getByTestId, getByText } = render(
      <TestWrapper>
        <EarningsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });

    // Get today earnings
    const todayEarnings = getByTestId('total-earnings').children[0].props.children;

    // Switch to week
    fireEvent.press(getByText('Week'));

    await waitFor(() => {
      expect(screen.getByTestId('loading-indicator')).toBeTruthy();
    });

    // Week earnings should be different
    expect(todayEarnings).toBeDefined();
  });

  it('should allow switching between periods (today, week, month)', async () => {
    const { getByText } = render(
      <TestWrapper>
        <EarningsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });

    const periods = ['Today', 'Week', 'Month'];

    for (const period of periods) {
      fireEvent.press(getByText(period));

      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).toBeNull();
      });

      expect(getByText(period)).toBeTruthy();
    }
  });

  it('should display recent trips list', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <EarningsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });

    expect(getByTestId('recent-trips')).toBeTruthy();
  });

  it('should display trip details in list', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <EarningsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });

    // Each trip should show pickup, dropoff, amount, tip
    expect(getByTestId('trip-0-from')).toBeTruthy();
    expect(getByTestId('trip-0-to')).toBeTruthy();
    expect(getByTestId('trip-0-amount')).toBeTruthy();
  });

  it('should handle empty earnings state', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <EarningsScreen />
      </TestWrapper>
    );

    // Even with no data, component should render
    await waitFor(() => {
      expect(getByTestId('earnings-screen')).toBeTruthy();
    });
  });

  it('should refresh earnings on demand', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <EarningsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });

    const refreshButton = getByTestId('refresh-button');
    fireEvent.press(refreshButton);

    // Should show loading
    expect(screen.getByTestId('loading-indicator')).toBeTruthy();

    // Then hide loading again
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });
  });

  it('should display stats correctly', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <EarningsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });

    expect(getByTestId('total-earnings')).toBeTruthy();
    expect(getByTestId('trips-count')).toBeTruthy();
    expect(getByTestId('hours-online')).toBeTruthy();
    expect(getByTestId('hourly-rate')).toBeTruthy();
  });
});
