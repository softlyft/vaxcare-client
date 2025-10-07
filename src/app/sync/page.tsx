'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePatients } from '@/hooks/usePatients';
import { useImmunizations } from '@/hooks/useImmunizations';
import { RefreshCw, CheckCircle, XCircle, Clock, Wifi, WifiOff, Database, Server, AlertCircle } from 'lucide-react';
import { getDatabase } from '@/db/database';

interface SyncStatus {
  status: 'idle' | 'syncing' | 'success' | 'error' | 'connected' | 'disconnected';
  lastSync?: Date;
  error?: string;
  syncEnabled: boolean;
  couchDbUrl?: string;
  pendingChanges: number;
  conflicts: number;
}

export default function SyncPage() {
  const { patients } = usePatients();
  const { immunizations } = useImmunizations();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ 
    status: 'idle', 
    syncEnabled: false, 
    pendingChanges: 0, 
    conflicts: 0 
  });
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check PouchDB sync status
    const checkSyncStatus = async () => {
      try {
        const db = getDatabase();
        if (!db) {
          setSyncStatus(prev => ({ ...prev, status: 'disconnected', syncEnabled: false }));
          return;
        }

        const syncEnabled = process.env.NEXT_PUBLIC_SYNC_ENABLED === 'true';
        const couchDbUrl = process.env.NEXT_PUBLIC_COUCHDB_URL || 'http://localhost:5984';
        
        setSyncStatus(prev => ({
          ...prev,
          syncEnabled,
          couchDbUrl,
          status: syncEnabled ? 'connected' : 'idle'
        }));

        // Monitor sync events if enabled
        if (syncEnabled && db.sync) {
          Object.values(db.sync).forEach(sync => {
            sync.on('change', () => {
              setSyncStatus(prev => ({ ...prev, lastSync: new Date() }));
            });
            
            sync.on('error', (err: any) => {
              setSyncStatus(prev => ({ 
                ...prev, 
                status: 'error', 
                error: err.message || 'Sync error occurred' 
              }));
            });
          });
        }
      } catch (error) {
        console.error('Failed to check sync status:', error);
        setSyncStatus(prev => ({ 
          ...prev, 
          status: 'error', 
          error: 'Failed to initialize sync' 
        }));
      }
    };

    checkSyncStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const manualSync = async () => {
    setSyncStatus(prev => ({ ...prev, status: 'syncing' }));

    try {
      const db = getDatabase();
      if (!db) {
        throw new Error('Database not available');
      }

      if (!syncStatus.syncEnabled) {
        throw new Error('CouchDB sync is not enabled');
      }

      // Force sync all collections
      const syncPromises = Object.values(db.sync).map(sync => {
        return new Promise((resolve, reject) => {
          sync.on('complete', resolve);
          sync.on('error', reject);
        });
      });

      await Promise.all(syncPromises);
      
      setSyncStatus(prev => ({ 
        ...prev, 
        status: 'success', 
        lastSync: new Date() 
      }));
    } catch (error) {
      console.error('Manual sync failed:', error);
      setSyncStatus(prev => ({ 
        ...prev, 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Sync failed' 
      }));
    }
  };

  const mockSyncFromServer = async () => {
    setSyncStatus({ status: 'syncing' });

    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock fetching from server
      console.log('Fetching data from server...');
      await fetch('/api/sync', {
        method: 'GET',
      }).catch(() => {
        // Mock server response
        console.log('Mock: Data fetched from server');
      });

      setSyncStatus({ 
        status: 'success', 
        lastSync: new Date() 
      });
    } catch (error) {
      setSyncStatus({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Sync failed' 
      });
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <RefreshCw className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return 'Sync completed';
      case 'error':
        return 'Sync failed';
      case 'connected':
        return 'CouchDB sync active';
      case 'disconnected':
        return 'CouchDB sync disabled';
      default:
        return syncStatus.syncEnabled ? 'Ready to sync' : 'Sync disabled';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sync</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Synchronize data with the server
          </p>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isOnline ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <Badge variant={isOnline ? 'default' : 'destructive'}>
                {isOnline ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Local Data Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Local Data</CardTitle>
              <CardDescription>
                Data stored in your device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Patients</span>
                  <Badge variant="outline">{patients.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Immunizations</span>
                  <Badge variant="outline">{immunizations.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Storage</span>
                  <Badge variant="outline">IndexedDB</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CouchDB Server</CardTitle>
              <CardDescription>
                {syncStatus.syncEnabled ? 'Connected to CouchDB' : 'CouchDB sync disabled'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sync Status</span>
                  <Badge variant={syncStatus.syncEnabled ? "default" : "secondary"}>
                    {syncStatus.syncEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                {syncStatus.couchDbUrl && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Server URL</span>
                    <Badge variant="outline">{syncStatus.couchDbUrl}</Badge>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Database</span>
                  <Badge variant="outline">CouchDB</Badge>
                </div>
                {syncStatus.pendingChanges > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Changes</span>
                    <Badge variant="destructive">{syncStatus.pendingChanges}</Badge>
                  </div>
                )}
                {syncStatus.conflicts > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Conflicts</span>
                    <Badge variant="destructive">{syncStatus.conflicts}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sync Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="mr-2 h-5 w-5" />
              Synchronization
            </CardTitle>
            <CardDescription>
              Sync your local data with the server
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Sync Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon()}
                  <span className="text-sm font-medium">{getStatusText()}</span>
                </div>
                {syncStatus.lastSync && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Last sync: {syncStatus.lastSync.toLocaleString()}
                  </span>
                )}
              </div>

              {syncStatus.error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Error: {syncStatus.error}
                  </p>
                </div>
              )}

              {/* Sync Buttons */}
              <div className="flex items-center space-x-4">
                <Button
                  onClick={manualSync}
                  disabled={!isOnline || syncStatus.status === 'syncing' || !syncStatus.syncEnabled}
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {syncStatus.syncEnabled ? 'Force Sync Now' : 'Sync Disabled'}
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  disabled={syncStatus.status === 'syncing'}
                  variant="outline"
                  className="flex-1"
                >
                  <Database className="mr-2 h-4 w-4" />
                  Refresh Status
                </Button>
              </div>

              {!isOnline && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    You are currently offline. Sync will be available when you reconnect to the internet.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sync Log */}
        <Card>
          <CardHeader>
            <CardTitle>Sync Log</CardTitle>
            <CardDescription>
              Recent synchronization activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Mock sync completed</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date().toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Local data updated</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(Date.now() - 300000).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Database initialized</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(Date.now() - 600000).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
