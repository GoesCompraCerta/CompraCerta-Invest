import React, { useEffect } from 'react';

export default function ProtectedRoute({ isAuthenticated, isLoading, onRedirect, children }) {
  useEffect(() => {
    if (!isLoading && !isAuthenticated) onRedirect();
  }, [isAuthenticated, isLoading, onRedirect]);

  if (isLoading || !isAuthenticated) return null;
  return children;
}
