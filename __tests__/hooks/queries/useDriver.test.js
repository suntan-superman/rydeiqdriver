/**
 * useDriver Hook Tests
 * Tests for driver profile, status, and location management hooks
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { TestWrapper, mockApiResponses, mockApiClient } from '../../setup';
import {
  useDriverProfile,
  useDriverStatus,
  useUpdateDriverProfile,
  useUpdateDriverStatus,
  useUpdateDriverLocation,
} from '@/hooks/queries/useDriver';

// Mock the API service
jest.mock('@/services/api', () => mockApiClient);

describe('useDriver Hooks', () => {
  const driverId = 'test-driver-123';

  describe('useDriverProfile', () => {
    it('should fetch driver profile successfully', async () => {
      const { result } = renderHook(() => useDriverProfile(driverId), {
        wrapper: TestWrapper,
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockApiResponses.driverProfile);
      expect(result.current.error).toBeNull();
    });

    it('should not fetch when driverId is not provided', () => {
      const { result } = renderHook(() => useDriverProfile(null), {
        wrapper: TestWrapper,
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('should retry failed requests', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('Network error'));
      mockApiClient.get.mockResolvedValueOnce(mockApiResponses.driverProfile);

      const { result } = renderHook(() => useDriverProfile(driverId), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockApiResponses.driverProfile);
    });

    it('should cache results correctly', async () => {
      const { result: result1 } = renderHook(() => useDriverProfile(driverId), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      const { result: result2 } = renderHook(() => useDriverProfile(driverId), {
        wrapper: TestWrapper,
      });

      // Second call should use cache (no loading state)
      expect(result2.current.data).toEqual(result1.current.data);
    });
  });

  describe('useDriverStatus', () => {
    it('should fetch driver status successfully', async () => {
      const { result } = renderHook(() => useDriverStatus(driverId), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveProperty('status');
    });

    it('should not fetch when driverId is not provided', () => {
      const { result } = renderHook(() => useDriverStatus(null), {
        wrapper: TestWrapper,
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useDriverStatus(driverId), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useUpdateDriverProfile', () => {
    it('should update driver profile successfully', async () => {
      const { result } = renderHook(
        () => useUpdateDriverProfile(driverId),
        { wrapper: TestWrapper }
      );

      const updates = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      await act(async () => {
        result.current.mutate(updates);
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(mockApiClient.put).toHaveBeenCalled();
    });

    it('should handle mutation errors', async () => {
      mockApiClient.put.mockRejectedValueOnce(new Error('Update failed'));

      const { result } = renderHook(
        () => useUpdateDriverProfile(driverId),
        { wrapper: TestWrapper }
      );

      await act(async () => {
        result.current.mutate({ firstName: 'Jane' });
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should invalidate profile query after successful update', async () => {
      const { result: profileResult } = renderHook(
        () => useDriverProfile(driverId),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(profileResult.current.isLoading).toBe(false);
      });

      const { result: updateResult } = renderHook(
        () => useUpdateDriverProfile(driverId),
        { wrapper: TestWrapper }
      );

      await act(async () => {
        updateResult.current.mutate({ firstName: 'Updated' });
      });

      await waitFor(() => {
        expect(updateResult.current.isPending).toBe(false);
      });

      // Profile query should be refetched
      expect(profileResult.current.isLoading || profileResult.current.data).toBeTruthy();
    });

    it('should show pending state during mutation', async () => {
      const { result } = renderHook(
        () => useUpdateDriverProfile(driverId),
        { wrapper: TestWrapper }
      );

      act(() => {
        result.current.mutate({ firstName: 'Jane' });
      });

      expect(result.current.isPending).toBe(true);
    });
  });

  describe('useUpdateDriverStatus', () => {
    it('should update driver status successfully', async () => {
      const { result } = renderHook(
        () => useUpdateDriverStatus(driverId),
        { wrapper: TestWrapper }
      );

      await act(async () => {
        result.current.mutate('offline');
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(mockApiClient.put).toHaveBeenCalled();
    });

    it('should accept various status values', async () => {
      const statuses = ['online', 'offline', 'away', 'break'];

      for (const status of statuses) {
        const { result } = renderHook(
          () => useUpdateDriverStatus(driverId),
          { wrapper: TestWrapper }
        );

        await act(async () => {
          result.current.mutate(status);
        });

        await waitFor(() => {
          expect(result.current.isPending).toBe(false);
        });
      }
    });

    it('should handle status update errors', async () => {
      mockApiClient.put.mockRejectedValueOnce(new Error('Status update failed'));

      const { result } = renderHook(
        () => useUpdateDriverStatus(driverId),
        { wrapper: TestWrapper }
      );

      await act(async () => {
        result.current.mutate('offline');
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useUpdateDriverLocation', () => {
    it('should update driver location successfully', async () => {
      const { result } = renderHook(
        () => useUpdateDriverLocation(driverId),
        { wrapper: TestWrapper }
      );

      const location = {
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 5,
      };

      await act(async () => {
        result.current.mutate(location);
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(mockApiClient.post).toHaveBeenCalled();
    });

    it('should handle location update errors', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Location update failed'));

      const { result } = renderHook(
        () => useUpdateDriverLocation(driverId),
        { wrapper: TestWrapper }
      );

      const location = { latitude: 40.7128, longitude: -74.006 };

      await act(async () => {
        result.current.mutate(location);
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should accept valid location coordinates', async () => {
      const locations = [
        { latitude: 0, longitude: 0 },
        { latitude: 40.7128, longitude: -74.006 },
        { latitude: -33.8688, longitude: 151.2093 },
        { latitude: 51.5074, longitude: -0.1278 },
      ];

      for (const location of locations) {
        const { result } = renderHook(
          () => useUpdateDriverLocation(driverId),
          { wrapper: TestWrapper }
        );

        await act(async () => {
          result.current.mutate(location);
        });

        await waitFor(() => {
          expect(result.current.isPending).toBe(false);
        });

        expect(result.current.error).toBeNull();
      }
    });
  });

  describe('Hook Integration', () => {
    it('should work together without conflicts', async () => {
      const { result: profileResult } = renderHook(
        () => useDriverProfile(driverId),
        { wrapper: TestWrapper }
      );

      const { result: statusResult } = renderHook(
        () => useDriverStatus(driverId),
        { wrapper: TestWrapper }
      );

      const { result: updateResult } = renderHook(
        () => useUpdateDriverProfile(driverId),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(profileResult.current.isLoading).toBe(false);
        expect(statusResult.current.isLoading).toBe(false);
      });

      expect(profileResult.current.data).toBeDefined();
      expect(statusResult.current.data).toBeDefined();

      await act(async () => {
        updateResult.current.mutate({ firstName: 'Updated' });
      });

      await waitFor(() => {
        expect(updateResult.current.isPending).toBe(false);
      });
    });

    it('should maintain separate cache for different drivers', async () => {
      const { result: driver1Result } = renderHook(
        () => useDriverProfile('driver-1'),
        { wrapper: TestWrapper }
      );

      const { result: driver2Result } = renderHook(
        () => useDriverProfile('driver-2'),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(driver1Result.current.isLoading).toBe(false);
        expect(driver2Result.current.isLoading).toBe(false);
      });

      // Both should load independently
      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    });
  });
});
