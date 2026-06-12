import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Wifi, 
  WifiOff, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { 
  subscribeSyncState, 
  syncNow, 
  isOnline,
  getSyncState 
} from '@/lib/syncEngine';
import { getOfflineStatus } from '@/lib/offlineStorage';
import { formatDistanceToNow } from 'date-fns';

export default function OfflineIndicator() {
  const [online, setOnline] = useState(isOnline());
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [offlineStats, setOfflineStats] = useState({
    cachedPatients: 0,
    cachedRecords: 0,
  });

  useEffect(() => {
    // Network status listeners
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Subscribe to sync state
    const unsubscribe = subscribeSyncState((state) => {
      setSyncing(state.status === 'syncing');
      setLastSync(state.lastSyncAt);
      setPendingCount(state.pendingCount);
    });

    // Load offline stats
    loadOfflineStats();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  async function loadOfflineStats() {
    try {
      const status = await getOfflineStatus();
      setOfflineStats({
        cachedPatients: status.cachedPatients,
        cachedRecords: status.cachedRecords,
      });
      setPendingCount(status.pendingActions);
    } catch (error) {
      console.error('Failed to load offline stats:', error);
    }
  }

  async function handleSync() {
    await syncNow();
    await loadOfflineStats();
  }

  const getStatusIcon = () => {
    if (!online) {
      return <WifiOff className="h-4 w-4 text-orange-500" />;
    }
    if (syncing) {
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    if (pendingCount > 0) {
      return <CloudOff className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!online) return 'Offline';
    if (syncing) return 'Syncing...';
    if (pendingCount > 0) return `${pendingCount} pending`;
    return 'Synced';
  };

  const getStatusColor = () => {
    if (!online) return 'bg-orange-100 text-orange-800 border-orange-300';
    if (syncing) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (pendingCount > 0) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          {getStatusIcon()}
          <Badge variant="outline" className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Sync Status</h4>
            {online ? (
              <Badge className="bg-green-100 text-green-800">
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </Badge>
            ) : (
              <Badge className="bg-orange-100 text-orange-800">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending changes</span>
              <span className="font-medium">{pendingCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cached records</span>
              <span className="font-medium">{offlineStats.cachedRecords}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cached patients</span>
              <span className="font-medium">{offlineStats.cachedPatients}</span>
            </div>
            {lastSync && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last sync</span>
                <span className="font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(lastSync, { addSuffix: true })}
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t">
            <Button 
              onClick={handleSync} 
              disabled={!online || syncing}
              className="w-full"
              size="sm"
            >
              {syncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Cloud className="h-4 w-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
          </div>

          {!online && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              You're offline. Changes will sync when you're back online.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
