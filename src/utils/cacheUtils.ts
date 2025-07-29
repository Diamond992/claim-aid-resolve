/**
 * Utility functions for clearing application caches and resetting state
 */

import { QueryClient } from '@tanstack/react-query';

export const clearAllCaches = async (queryClient?: QueryClient) => {
  console.log('🧹 Clearing all application caches...');
  
  // Clear localStorage
  try {
    localStorage.clear();
    console.log('✅ LocalStorage cleared');
  } catch (error) {
    console.warn('⚠️ Failed to clear localStorage:', error);
  }
  
  // Clear sessionStorage
  try {
    sessionStorage.clear();
    console.log('✅ SessionStorage cleared');
  } catch (error) {
    console.warn('⚠️ Failed to clear sessionStorage:', error);
  }
  
  // Clear React Query cache
  if (queryClient) {
    try {
      await queryClient.invalidateQueries();
      await queryClient.clear();
      console.log('✅ React Query cache cleared');
    } catch (error) {
      console.warn('⚠️ Failed to clear React Query cache:', error);
    }
  }
  
  console.log('🎉 All caches cleared successfully');
};

export const clearClaimFormData = () => {
  console.log('🧹 Clearing claim form data...');
  try {
    localStorage.removeItem('claimFormData');
    console.log('✅ Claim form data cleared');
  } catch (error) {
    console.warn('⚠️ Failed to clear claim form data:', error);
  }
};

export const refreshAllQueries = async (queryClient: QueryClient) => {
  console.log('🔄 Refreshing all queries...');
  try {
    await queryClient.invalidateQueries();
    console.log('✅ All queries refreshed');
  } catch (error) {
    console.warn('⚠️ Failed to refresh queries:', error);
  }
};

export const resetApplicationState = async (queryClient?: QueryClient) => {
  console.log('🔄 Resetting application state...');
  
  // Clear all caches
  await clearAllCaches(queryClient);
  
  // Force page reload to ensure clean state
  setTimeout(() => {
    window.location.reload();
  }, 100);
};