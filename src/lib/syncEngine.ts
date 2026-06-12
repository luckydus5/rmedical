// ================================
// Sanovia Sync Engine
// Background synchronization for offline-first operation
// ================================

import { supabase } from '@/integrations/supabase/client';
import {
  getDatabase,
  getOfflineQueue,
  removeFromOfflineQueue,
  updateQueueItemAttempt,
  saveMedicalRecordOffline,
  saveMedicationOffline,
  saveAllergyOffline,
  updateSyncMeta,
  getPendingMedicalRecords,
} from './offlineStorage';

type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

interface SyncState {
  status: SyncStatus;
  lastSyncAt: Date | null;
  pendingCount: number;
  error: string | null;
}

let syncState: SyncState = {
  status: 'idle',
  lastSyncAt: null,
  pendingCount: 0,
  error: null,
};

const syncListeners: Set<(state: SyncState) => void> = new Set();

export function subscribeSyncState(listener: (state: SyncState) => void): () => void {
  syncListeners.add(listener);
  listener(syncState);
  return () => syncListeners.delete(listener);
}

function notifySyncListeners(): void {
  syncListeners.forEach(listener => listener(syncState));
}

function updateSyncState(updates: Partial<SyncState>): void {
  syncState = { ...syncState, ...updates };
  notifySyncListeners();
}

// ================================
// Online/Offline Detection
// ================================

export function isOnline(): boolean {
  return navigator.onLine;
}

export function setupNetworkListeners(): void {
  window.addEventListener('online', () => {
    console.log('🌐 Network: Online');
    updateSyncState({ status: 'idle' });
    // Trigger sync when coming back online
    syncNow();
  });

  window.addEventListener('offline', () => {
    console.log('📴 Network: Offline');
    updateSyncState({ status: 'offline' });
  });
}

// ================================
// Push Local Changes to Server
// ================================

async function pushChanges(): Promise<{ success: number; failed: number }> {
  const queue = await getOfflineQueue();
  let success = 0;
  let failed = 0;

  for (const item of queue) {
    if (item.attempts >= 5) {
      // Skip items that have failed too many times
      console.warn(`Skipping item ${item.id} after ${item.attempts} failed attempts`);
      failed++;
      continue;
    }

    try {
      let result;
      
      switch (item.action) {
        case 'create':
          result = await supabase
            .from(item.table as any)
            .insert(item.data)
            .select()
            .single();
          break;
          
        case 'update':
          result = await supabase
            .from(item.table as any)
            .update(item.data)
            .eq('id', item.recordId)
            .select()
            .single();
          break;
          
        case 'delete':
          result = await supabase
            .from(item.table as any)
            .delete()
            .eq('id', item.recordId);
          break;
      }

      if (result?.error) {
        throw result.error;
      }

      // Remove from queue on success
      if (item.id) {
        await removeFromOfflineQueue(item.id);
      }
      success++;
      
    } catch (error: any) {
      console.error(`Failed to sync item ${item.id}:`, error);
      if (item.id) {
        await updateQueueItemAttempt(item.id, error.message);
      }
      failed++;
    }
  }

  return { success, failed };
}

// ================================
// Pull Server Changes to Local
// ================================

async function pullChanges(userId: string): Promise<void> {
  // Pull medications
  const { data: medications } = await supabase
    .from('medications')
    .select('*')
    .eq('patient_id', userId);

  if (medications) {
    for (const med of medications) {
      await saveMedicationOffline({
        id: med.id,
        patientId: med.patient_id,
        medicationName: med.medication_name,
        dosage: med.dosage || '',
        frequency: med.frequency || '',
        isActive: med.is_active ?? true,
        syncStatus: 'synced',
        createdAt: med.created_at,
        updatedAt: med.updated_at || med.created_at,
      });
    }
    await updateSyncMeta('medications');
  }

  // Pull allergies
  const { data: allergies } = await supabase
    .from('allergies')
    .select('*')
    .eq('patient_id', userId);

  if (allergies) {
    for (const allergy of allergies) {
      await saveAllergyOffline({
        id: allergy.id,
        patientId: allergy.patient_id,
        allergen: allergy.allergen,
        severity: allergy.severity,
        reaction: allergy.reaction || '',
        syncStatus: 'synced',
        createdAt: allergy.created_at,
      });
    }
    await updateSyncMeta('allergies');
  }

  // Pull lab results, conditions, etc.
  // Add more tables as needed
}

// ================================
// Main Sync Function
// ================================

export async function syncNow(): Promise<boolean> {
  if (!isOnline()) {
    updateSyncState({ status: 'offline' });
    return false;
  }

  if (syncState.status === 'syncing') {
    console.log('Sync already in progress');
    return false;
  }

  updateSyncState({ status: 'syncing', error: null });

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Push local changes first
    console.log('📤 Pushing local changes...');
    const pushResult = await pushChanges();
    console.log(`✅ Pushed: ${pushResult.success} success, ${pushResult.failed} failed`);

    // Pull remote changes
    console.log('📥 Pulling remote changes...');
    await pullChanges(user.id);
    console.log('✅ Pull complete');

    // Update pending count
    const queue = await getOfflineQueue();
    
    updateSyncState({
      status: 'idle',
      lastSyncAt: new Date(),
      pendingCount: queue.length,
    });

    return true;
    
  } catch (error: any) {
    console.error('Sync failed:', error);
    updateSyncState({
      status: 'error',
      error: error.message,
    });
    return false;
  }
}

// ================================
// Periodic Background Sync
// ================================

let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startPeriodicSync(intervalMs: number = 5 * 60 * 1000): void {
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  syncInterval = setInterval(() => {
    if (isOnline()) {
      syncNow();
    }
  }, intervalMs);

  console.log(`⏰ Periodic sync started (every ${intervalMs / 1000}s)`);
}

export function stopPeriodicSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('⏰ Periodic sync stopped');
  }
}

// ================================
// Get Current Sync State
// ================================

export function getSyncState(): SyncState {
  return { ...syncState };
}
