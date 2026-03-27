import React, { createContext, useContext, useEffect, useState } from 'react';
import { databaseService } from '../services/database.service';
import { networkService } from '../services/network.service';
import { syncService } from '../services/sync.service';
import { useToast } from '@/hooks/use-toast';
import { ONLINE_ONLY } from '../config';

interface ServiceStatus {
  database: 'initializing' | 'ready' | 'error';
  network: 'initializing' | 'ready' | 'error';
  sync: 'initializing' | 'ready' | 'error';
}

interface MobileServiceContextType {
  isReady: boolean;
  status: ServiceStatus;
  error: string | null;
  retryInitialization: () => void;
}

const MobileServiceContext = createContext<MobileServiceContextType | null>(null);

export const useMobileServices = () => {
  const context = useContext(MobileServiceContext);
  if (!context) {
    throw new Error('useMobileServices must be used within MobileServiceProvider');
  }
  return context;
};

interface MobileServiceProviderProps {
  children: React.ReactNode;
}

export const MobileServiceProvider: React.FC<MobileServiceProviderProps> = ({ children }) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<ServiceStatus>({
    database: 'initializing',
    network: 'initializing',
    sync: 'initializing'
  });
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const initializeServices = async () => {
    setError(null);
    setStatus({
      database: 'initializing',
      network: 'initializing',
      sync: 'initializing'
    });

    try {
      // Phase 1: Initialize Network first (required for online-only mode)
      console.log('Initializing network service...');
      await networkService.initialize();
      setStatus(prev => ({ ...prev, network: 'ready' }));
      console.log('Network service ready');

      if (ONLINE_ONLY) {
        console.log('ONLINE_ONLY is enabled. Skipping local DB and sync initialization.');
        setStatus({ database: 'ready', network: 'ready', sync: 'ready' });
        setIsReady(true);
        toast({
          title: 'App Ready (Online Only)',
          description: 'Using Supabase directly. Offline storage and sync are disabled.'
        });
        return;
      }

      // Phase 2: Initialize Database (offline mode)
      console.log('Initializing database service...');
      await databaseService.initialize();
      setStatus(prev => ({ ...prev, database: 'ready' }));
      console.log('Database service ready');

      // Phase 3: Initialize Sync
      console.log('Initializing sync service...');
      await syncService.initialize();
      setStatus(prev => ({ ...prev, sync: 'ready' }));
      console.log('Sync service ready');

      // Phase 4: Download initial data if online
      if (networkService.isOnline()) {
        console.log('Downloading initial data...');
        try {
          await syncService.downloadLatestData();
          console.log('Initial data download completed');
          toast({
            title: 'App Ready',
            description: 'Mobile app initialized and synced with server',
          });
        } catch (downloadError) {
          console.warn('Initial data download failed, continuing with offline mode:', downloadError);
          toast({
            title: 'App Ready (Offline)',
            description: 'Mobile app ready, sync will happen when online',
          });
        }
      } else {
        toast({
          title: 'App Ready (Offline)',
          description: 'Mobile app initialized in offline mode',
        });
      }

      setIsReady(true);
      
    } catch (initError) {
      console.error('Service initialization failed:', initError);
      setError(initError instanceof Error ? initError.message : 'Unknown initialization error');
      
      // Update failed service status
      if (status.database === 'initializing') {
        setStatus(prev => ({ ...prev, database: 'error' }));
      } else if (status.network === 'initializing') {
        setStatus(prev => ({ ...prev, network: 'error' }));
      } else if (status.sync === 'initializing') {
        setStatus(prev => ({ ...prev, sync: 'error' }));
      }

      toast({
        title: "Initialization Error",
        description: "Failed to initialize mobile services. Some features may not work.",
        variant: "destructive",
      });
    }
  };

  const retryInitialization = () => {
    setIsReady(false);
    initializeServices();
  };

  useEffect(() => {
    initializeServices();
  }, []);

  const contextValue: MobileServiceContextType = {
    isReady,
    status,
    error,
    retryInitialization
  };

  return (
    <MobileServiceContext.Provider value={contextValue}>
      {children}
    </MobileServiceContext.Provider>
  );
};