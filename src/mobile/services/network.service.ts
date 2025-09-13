import { Network } from '@capacitor/network';

export interface NetworkStatus {
  connected: boolean;
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
}

export class NetworkService {
  private listeners: ((status: NetworkStatus) => void)[] = [];
  private currentStatus: NetworkStatus = {
    connected: false,
    connectionType: 'none'
  };

  async initialize(): Promise<void> {
    // Get current network status
    const status = await Network.getStatus();
    this.currentStatus = {
      connected: status.connected,
      connectionType: status.connectionType as any
    };

    // Listen for network changes
    Network.addListener('networkStatusChange', (status) => {
      this.currentStatus = {
        connected: status.connected,
        connectionType: status.connectionType as any
      };
      
      // Notify all listeners
      this.listeners.forEach(listener => listener(this.currentStatus));
    });

    console.log('Network service initialized, current status:', this.currentStatus);
  }

  getStatus(): NetworkStatus {
    return this.currentStatus;
  }

  isOnline(): boolean {
    return this.currentStatus.connected;
  }

  isOffline(): boolean {
    return !this.currentStatus.connected;
  }

  onStatusChange(callback: (status: NetworkStatus) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Wait for network to come online
  waitForOnline(timeout: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isOnline()) {
        resolve(true);
        return;
      }

      const timer = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeout);

      const unsubscribe = this.onStatusChange((status) => {
        if (status.connected) {
          clearTimeout(timer);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }
}

export const networkService = new NetworkService();