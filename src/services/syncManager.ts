import { getDatabase } from '@/db/database';

export interface SyncStatus {
  isOnline: boolean;
  lastSync: string | null;
  pendingChanges: number;
  syncInProgress: boolean;
}

export interface SyncResult {
  success: boolean;
  syncedResources: string[];
  errors: string[];
}

export class SyncManager {
  private static instance: SyncManager;
  private statusListeners: ((status: SyncStatus) => void)[] = [];
  private syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    lastSync: null,
    pendingChanges: 0,
    syncInProgress: false,
  };

  private constructor() {
    // Only add event listeners in browser environment
    if (typeof window !== 'undefined') {
      // Listen for online/offline events
      window.addEventListener('online', () => {
        this.syncStatus.isOnline = true;
        this.notifyStatusChange();
        this.autoSync();
      });

      window.addEventListener('offline', () => {
        this.syncStatus.isOnline = false;
        this.notifyStatusChange();
      });
    }
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  public getStatus(): SyncStatus {
    return { 
      ...this.syncStatus,
      isOnline: typeof window !== 'undefined' ? navigator.onLine : true
    };
  }

  public subscribeToStatus(listener: (status: SyncStatus) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.getStatus()); // Immediately send current status
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  private notifyStatusChange(): void {
    const currentStatus = this.getStatus();
    this.statusListeners.forEach(listener => listener(currentStatus));
  }

  public async syncToServer(): Promise<SyncResult> {
    if (!this.syncStatus.isOnline) {
      return {
        success: false,
        syncedResources: [],
        errors: ['Device is offline'],
      };
    }

    if (this.syncStatus.syncInProgress) {
      return {
        success: false,
        syncedResources: [],
        errors: ['Sync already in progress'],
      };
    }

    this.syncStatus.syncInProgress = true;

    try {
      const db = getDatabase();
      if (!db) {
        throw new Error('Database not initialized');
      }

      const result: SyncResult = {
        success: true,
        syncedResources: [],
        errors: [],
      };

      // Mock sync to FHIR server
      // In a real implementation, this would:
      // 1. Get all resources that need syncing
      // 2. Send them to the FHIR server via REST API
      // 3. Handle conflicts and responses
      // 4. Update local resources with server IDs

      console.log('🔄 Syncing to FHIR server...');
      
      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock successful sync
      this.syncStatus.lastSync = new Date().toISOString();
      this.syncStatus.pendingChanges = 0;
      this.notifyStatusChange();

      result.syncedResources = [
        'Patient/123',
        'Encounter/456',
        'Immunization/789',
        'Medication/101',
        'MedicationAdministration/202',
      ];

      console.log('✅ Sync completed successfully');
      return result;

    } catch (error) {
      console.error('❌ Sync failed:', error);
      return {
        success: false,
        syncedResources: [],
        errors: [error instanceof Error ? error.message : 'Unknown sync error'],
      };
    } finally {
      this.syncStatus.syncInProgress = false;
      this.notifyStatusChange();
    }
  }

  public async autoSync(): Promise<void> {
    if (this.syncStatus.isOnline && !this.syncStatus.syncInProgress) {
      await this.syncToServer();
    }
  }

  public async getPendingChanges(): Promise<number> {
    // In a real implementation, this would count resources that need syncing
    // For now, return a mock count
    return Math.floor(Math.random() * 10);
  }

  public async markResourceAsSynced(resourceId: string): Promise<void> {
    // In a real implementation, this would mark a resource as synced
    console.log(`📝 Marking resource ${resourceId} as synced`);
  }

  public async handleSyncConflict(localResource: any, serverResource: any): Promise<any> {
    // In a real implementation, this would handle conflicts between local and server data
    // For now, use last-write-wins strategy
    const localTime = new Date(localResource.updatedAt || localResource.createdAt);
    const serverTime = new Date(serverResource.updatedAt || serverResource.createdAt);
    
    return localTime > serverTime ? localResource : serverResource;
  }
}

// Export singleton instance
export const syncManager = SyncManager.getInstance();
