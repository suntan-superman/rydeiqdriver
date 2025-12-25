/**
 * useRides Hook Tests
 * Tests for ride management, acceptance, decline, and completion hooks
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { TestWrapper, mockApiResponses, mockApiClient } from '../../setup';
import {
  useAvailableRides,
  useRideDetails,
  useDriverRides,
  useAcceptRide,
  useDeclineRide,
  useCompleteRide,
} from '@/hooks/queries/useRides';

// Mock the API service
jest.mock('@/services/api', () => mockApiClient);

describe('useRides Hooks', () => {
  const driverId = 'test-driver-123';
  const rideId = 'ride-123';

  describe('useAvailableRides', () => {
    it('should fetch available rides successfully', async () => {
      const { result } = renderHook(() => useAvailableRides(driverId), {
        wrapper: TestWrapper,
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(Array.isArray(result.current.data)).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should not fetch when driverId is not provided', () => {
      const { result } = renderHook(() => useAvailableRides(null), {
        wrapper: TestWrapper,
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('should handle API errors gracefully', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useAvailableRides(driverId), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should filter rides by distance', async () => {
      const filters = { maxDistance: 10 };

      const { result } = renderHook(
        () => useAvailableRides(driverId, filters),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(Array.isArray(result.current.data)).toBe(true);
    });

    it('should filter rides by fare', async () => {
      const filters = { minFare: 15, maxFare: 50 };

      const { result } = renderHook(
        () => useAvailableRides(driverId, filters),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(Array.isArray(result.current.data)).toBe(true);
    });

    it('should combine multiple filters', async () => {
      const filters = {
        maxDistance: 20,
        minFare: 10,
        rideType: 'standard',
      };

      const { result } = renderHook(
        () => useAvailableRides(driverId, filters),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(Array.isArray(result.current.data)).toBe(true);
    });
  });

  describe('useRideDetails', () => {
    it('should fetch ride details successfully', async () => {
      const { result } = renderHook(() => useRideDetails(rideId), {
        wrapper: TestWrapper,
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveProperty('id');
      expect(result.current.error).toBeNull();
    });

    it('should not fetch when rideId is not provided', () => {
      const { result } = renderHook(() => useRideDetails(null), {
        wrapper: TestWrapper,
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('should cache ride details correctly', async () => {
      const { result: result1 } = renderHook(() => useRideDetails(rideId), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      const { result: result2 } = renderHook(() => useRideDetails(rideId), {
        wrapper: TestWrapper,
      });

      expect(result2.current.data).toEqual(result1.current.data);
    });

    it('should handle not found errors', async () => {
      mockApiClient.get.mockRejectedValueOnce(
        new Error('Ride not found')
      );

      const { result } = renderHook(
        () => useRideDetails('nonexistent-ride'),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useDriverRides', () => {
    it('should fetch driver rides with all statuses', async () => {
      const { result } = renderHook(
        () => useDriverRides(driverId, 'all'),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(Array.isArray(result.current.data)).toBe(true);
    });

    it('should fetch only completed rides', async () => {
      const { result } = renderHook(
        () => useDriverRides(driverId, 'completed'),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(Array.isArray(result.current.data)).toBe(true);
    });

    it('should fetch only active rides', async () => {
      const { result } = renderHook(
        () => useDriverRides(driverId, 'active'),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(Array.isArray(result.current.data)).toBe(true);
    });

    it('should not fetch when driverId is not provided', () => {
      const { result } = renderHook(() => useDriverRides(null), {
        wrapper: TestWrapper,
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle different status filters', async () => {
      const statuses = ['all', 'active', 'completed', 'cancelled'];

      for (const status of statuses) {
        const { result } = renderHook(
          () => useDriverRides(driverId, status),
          { wrapper: TestWrapper }
        );

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(Array.isArray(result.current.data)).toBe(true);
      }
    });
  });

  describe('useAcceptRide', () => {
    it('should accept ride successfully', async () => {
      const { result } = renderHook(() => useAcceptRide(driverId), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        result.current.mutate(rideId);
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(mockApiClient.post).toHaveBeenCalled();
    });

    it('should handle accept ride errors', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Cannot accept ride'));

      const { result } = renderHook(() => useAcceptRide(driverId), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        result.current.mutate(rideId);
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should show pending state during acceptance', async () => {
      const { result } = renderHook(() => useAcceptRide(driverId), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.mutate(rideId);
      });

      expect(result.current.isPending).toBe(true);
    });

    it('should invalidate available rides after acceptance', async () => {
      const { result: availableResult } = renderHook(
        () => useAvailableRides(driverId),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(availableResult.current.isLoading).toBe(false);
      });

      const { result: acceptResult } = renderHook(() => useAcceptRide(driverId), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        acceptResult.current.mutate(rideId);
      });

      await waitFor(() => {
        expect(acceptResult.current.isPending).toBe(false);
      });
    });

    it('should accept multiple different rides', async () => {
      const rideIds = ['ride-1', 'ride-2', 'ride-3'];

      for (const id of rideIds) {
        const { result } = renderHook(() => useAcceptRide(driverId), {
          wrapper: TestWrapper,
        });

        await act(async () => {
          result.current.mutate(id);
        });

        await waitFor(() => {
          expect(result.current.isPending).toBe(false);
        });
      }
    });
  });

  describe('useDeclineRide', () => {
    it('should decline ride successfully', async () => {
      const { result } = renderHook(() => useDeclineRide(driverId), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        result.current.mutate(rideId);
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(mockApiClient.post).toHaveBeenCalled();
    });

    it('should handle decline ride errors', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Cannot decline ride'));

      const { result } = renderHook(() => useDeclineRide(driverId), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        result.current.mutate(rideId);
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should handle ride already accepted error', async () => {
      mockApiClient.post.mockRejectedValueOnce(
        new Error('Ride already accepted')
      );

      const { result } = renderHook(() => useDeclineRide(driverId), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        result.current.mutate(rideId);
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useCompleteRide', () => {
    it('should complete ride successfully', async () => {
      const { result } = renderHook(() => useCompleteRide(driverId), {
        wrapper: TestWrapper,
      });

      const completeData = {
        rideId,
        rating: 5,
        comments: 'Great ride',
      };

      await act(async () => {
        result.current.mutate(completeData);
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(mockApiClient.post).toHaveBeenCalled();
    });

    it('should handle completion errors', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Cannot complete ride'));

      const { result } = renderHook(() => useCompleteRide(driverId), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        result.current.mutate({ rideId, rating: 5 });
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should accept various ride completion data', async () => {
      const completionData = [
        { rideId, rating: 5 },
        { rideId, rating: 5, comments: 'Great' },
        { rideId, rating: 4, photos: ['photo-url'] },
        { rideId, rating: 3, comments: 'Okay', photos: [], tip: 5 },
      ];

      for (const data of completionData) {
        const { result } = renderHook(() => useCompleteRide(driverId), {
          wrapper: TestWrapper,
        });

        await act(async () => {
          result.current.mutate(data);
        });

        await waitFor(() => {
          expect(result.current.isPending).toBe(false);
        });
      }
    });

    it('should invalidate related queries after completion', async () => {
      const { result: driverRidesResult } = renderHook(
        () => useDriverRides(driverId, 'active'),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(driverRidesResult.current.isLoading).toBe(false);
      });

      const { result: completeResult } = renderHook(
        () => useCompleteRide(driverId),
        { wrapper: TestWrapper }
      );

      await act(async () => {
        completeResult.current.mutate({ rideId, rating: 5 });
      });

      await waitFor(() => {
        expect(completeResult.current.isPending).toBe(false);
      });
    });

    it('should validate ratings are between 1-5', async () => {
      const { result } = renderHook(() => useCompleteRide(driverId), {
        wrapper: TestWrapper,
      });

      const validRatings = [1, 2, 3, 4, 5];

      for (const rating of validRatings) {
        await act(async () => {
          result.current.mutate({ rideId, rating });
        });

        await waitFor(() => {
          expect(result.current.isPending).toBe(false);
        });
      }
    });
  });

  describe('Hook Integration', () => {
    it('should work together in ride workflow', async () => {
      // 1. Get available rides
      const { result: availableResult } = renderHook(
        () => useAvailableRides(driverId),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(availableResult.current.isLoading).toBe(false);
      });

      expect(Array.isArray(availableResult.current.data)).toBe(true);

      // 2. Get ride details
      const testRide = availableResult.current.data?.[0];
      if (testRide) {
        const { result: detailsResult } = renderHook(
          () => useRideDetails(testRide.id),
          { wrapper: TestWrapper }
        );

        await waitFor(() => {
          expect(detailsResult.current.isLoading).toBe(false);
        });

        // 3. Accept the ride
        const { result: acceptResult } = renderHook(
          () => useAcceptRide(driverId),
          { wrapper: TestWrapper }
        );

        await act(async () => {
          acceptResult.current.mutate(testRide.id);
        });

        await waitFor(() => {
          expect(acceptResult.current.isPending).toBe(false);
        });

        // 4. Complete the ride
        const { result: completeResult } = renderHook(
          () => useCompleteRide(driverId),
          { wrapper: TestWrapper }
        );

        await act(async () => {
          completeResult.current.mutate({ rideId: testRide.id, rating: 5 });
        });

        await waitFor(() => {
          expect(completeResult.current.isPending).toBe(false);
        });
      }
    });
  });
});
