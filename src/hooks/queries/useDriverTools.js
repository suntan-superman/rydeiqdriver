import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryConfig } from './queryConfig';

// API service functions
const fetchToolsList = async (driverId) => {
  console.warn('fetchToolsList: Implement your API call');
  return [];
};

const fetchToolDetails = async (toolId) => {
  console.warn('fetchToolDetails: Implement your API call');
  return null;
};

const activateTool = async (driverId, toolId) => {
  console.warn('activateTool: Implement your API call');
  return { toolId, activated: true };
};

/**
 * Hook to fetch available driver tools
 * @param {string} driverId - Driver ID
 * @returns {Object} Query result with tools list
 */
export const useToolsList = (driverId) => {
  return useQuery({
    queryKey: ['tools', 'list', driverId],
    queryFn: () => fetchToolsList(driverId),
    enabled: !!driverId,
    ...queryConfig.driverTools,
  });
};

/**
 * Hook to fetch details of a specific tool
 * @param {string} toolId - Tool ID
 * @returns {Object} Query result with tool details
 */
export const useToolDetails = (toolId) => {
  return useQuery({
    queryKey: ['tools', 'details', toolId],
    queryFn: () => fetchToolDetails(toolId),
    enabled: !!toolId,
    ...queryConfig.driverTools,
  });
};

/**
 * Hook to activate a tool
 * @param {string} driverId - Driver ID
 * @returns {Object} Mutation result
 */
export const useActivateTool = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (toolId) => activateTool(driverId, toolId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tools', 'list', driverId],
      });
    },
    onError: (error) => {
      console.error('Failed to activate tool:', error);
    },
  });
};
