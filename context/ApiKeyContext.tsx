import React, { createContext, useContext, useState } from 'react';
import { fetchUserApiKeys } from '../services/apiKeysService';

const ApiKeyContext = createContext(null);

export const useApiKeys = () => {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error('useApiKeys must be used within an ApiKeyProvider');
  }
  return context;
};

export const ApiKeyProvider = ({ children }) => {
  const [apiKeys, setApiKeys] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadApiKeys = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const keys = await fetchUserApiKeys();
      setApiKeys(keys);
    } catch (err) {
      setError(err.message);
      setApiKeys({});
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    apiKeys,
    isLoading,
    error,
    loadApiKeys,
  };

  return (
    <ApiKeyContext.Provider value={value}>
      {children}
    </ApiKeyContext.Provider>
  );
};
