// ================================
// Sanovia Offline Storage System
// IndexedDB-based offline-first data storage for areas with poor connectivity
// ================================

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SanoviaDB extends DBSchema {
  medicalRecords: {
    key: string;
    value: {
      id: string;
      patientId: string;
      type: string;
      data: any;
      syncStatus: 'synced' | 'pending' | 'conflict';
      createdAt: string;
      updatedAt: string;
      serverUpdatedAt?: string;
    };
    indexes: {
      'by-patient': string;
      'by-sync-status': string;
      'by-type': string;
    };
  };
  medications: {
    key: string;
    value: {
      id: string;
      patientId: string;
      medicationName: string;
      dosage: string;
      frequency: string;
      isActive: boolean;
      syncStatus: 'synced' | 'pending' | 'conflict';
      createdAt: string;
      updatedAt: string;
    };
    indexes: {
      'by-patient': string;
      'by-sync-status': string;
    };
  };
  allergies: {
    key: string;
    value: {
      id: string;
      patientId: string;
      allergen: string;
      severity: string;
      reaction: string;
      syncStatus: 'synced' | 'pending' | 'conflict';
      createdAt: string;
    };
    indexes: {
      'by-patient': string;
      'by-sync-status': string;
    };
  };
  offlineQueue: {
    key: number;
    value: {
      id?: number;
      action: 'create' | 'update' | 'delete';
      table: string;
      recordId: string;
      data: any;
      attempts: number;
      createdAt: string;
      lastAttemptAt?: string;
      error?: string;
    };
  };
  syncMeta: {
    key: string;
    value: {
      table: string;
      lastSyncAt: string;
      recordCount: number;
    };
  };
  cachedPatients: {
    key: string;
    value: {
      id: string;
      fullName: string;
      phone?: string;
      dateOfBirth?: string;
      nationalId?: string;
      lastAccessed: string;
    };
  };
}

const DB_NAME = 'sanovia-offline';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<SanoviaDB> | null = null;

export async function getDatabase(): Promise<IDBPDatabase<SanoviaDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<SanoviaDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Medical Records store
      if (!db.objectStoreNames.contains('medicalRecords')) {
        const recordsStore = db.createObjectStore('medicalRecords', { keyPath: 'id' });
        recordsStore.createIndex('by-patient', 'patientId');
        recordsStore.createIndex('by-sync-status', 'syncStatus');
        recordsStore.createIndex('by-type', 'type');
      }

      // Medications store
      if (!db.objectStoreNames.contains('medications')) {
        const medsStore = db.createObjectStore('medications', { keyPath: 'id' });
        medsStore.createIndex('by-patient', 'patientId');
        medsStore.createIndex('by-sync-status', 'syncStatus');
      }

      // Allergies store
      if (!db.objectStoreNames.contains('allergies')) {
        const allergiesStore = db.createObjectStore('allergies', { keyPath: 'id' });
        allergiesStore.createIndex('by-patient', 'patientId');
        allergiesStore.createIndex('by-sync-status', 'syncStatus');
      }

      // Offline Queue store
      if (!db.objectStoreNames.contains('offlineQueue')) {
        db.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true });
      }

      // Sync Metadata store
      if (!db.objectStoreNames.contains('syncMeta')) {
        db.createObjectStore('syncMeta', { keyPath: 'table' });
      }

      // Cached Patients store
      if (!db.objectStoreNames.contains('cachedPatients')) {
        db.createObjectStore('cachedPatients', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
}

// ================================
// Offline Queue Management
// ================================

export async function addToOfflineQueue(
  action: 'create' | 'update' | 'delete',
  table: string,
  recordId: string,
  data: any
): Promise<void> {
  const db = await getDatabase();
  await db.add('offlineQueue', {
    action,
    table,
    recordId,
    data,
    attempts: 0,
    createdAt: new Date().toISOString(),
  });
}

export async function getOfflineQueue(): Promise<SanoviaDB['offlineQueue']['value'][]> {
  const db = await getDatabase();
  return db.getAll('offlineQueue');
}

export async function removeFromOfflineQueue(id: number): Promise<void> {
  const db = await getDatabase();
  await db.delete('offlineQueue', id);
}

export async function updateQueueItemAttempt(id: number, error?: string): Promise<void> {
  const db = await getDatabase();
  const item = await db.get('offlineQueue', id);
  if (item) {
    item.attempts += 1;
    item.lastAttemptAt = new Date().toISOString();
    item.error = error;
    await db.put('offlineQueue', item);
  }
}

// ================================
// Medical Records Offline Storage
// ================================

export async function saveMedicalRecordOffline(record: SanoviaDB['medicalRecords']['value']): Promise<void> {
  const db = await getDatabase();
  await db.put('medicalRecords', record);
}

export async function getMedicalRecordsOffline(patientId: string): Promise<SanoviaDB['medicalRecords']['value'][]> {
  const db = await getDatabase();
  return db.getAllFromIndex('medicalRecords', 'by-patient', patientId);
}

export async function getPendingMedicalRecords(): Promise<SanoviaDB['medicalRecords']['value'][]> {
  const db = await getDatabase();
  return db.getAllFromIndex('medicalRecords', 'by-sync-status', 'pending');
}

// ================================
// Medications Offline Storage
// ================================

export async function saveMedicationOffline(medication: SanoviaDB['medications']['value']): Promise<void> {
  const db = await getDatabase();
  await db.put('medications', medication);
}

export async function getMedicationsOffline(patientId: string): Promise<SanoviaDB['medications']['value'][]> {
  const db = await getDatabase();
  return db.getAllFromIndex('medications', 'by-patient', patientId);
}

// ================================
// Allergies Offline Storage
// ================================

export async function saveAllergyOffline(allergy: SanoviaDB['allergies']['value']): Promise<void> {
  const db = await getDatabase();
  await db.put('allergies', allergy);
}

export async function getAllergiesOffline(patientId: string): Promise<SanoviaDB['allergies']['value'][]> {
  const db = await getDatabase();
  return db.getAllFromIndex('allergies', 'by-patient', patientId);
}

// ================================
// Patient Cache
// ================================

export async function cachePatient(patient: SanoviaDB['cachedPatients']['value']): Promise<void> {
  const db = await getDatabase();
  await db.put('cachedPatients', {
    ...patient,
    lastAccessed: new Date().toISOString(),
  });
}

export async function getCachedPatient(id: string): Promise<SanoviaDB['cachedPatients']['value'] | undefined> {
  const db = await getDatabase();
  return db.get('cachedPatients', id);
}

export async function getAllCachedPatients(): Promise<SanoviaDB['cachedPatients']['value'][]> {
  const db = await getDatabase();
  return db.getAll('cachedPatients');
}

// ================================
// Sync Metadata
// ================================

export async function updateSyncMeta(table: string): Promise<void> {
  const db = await getDatabase();
  const count = await db.count(table as any);
  await db.put('syncMeta', {
    table,
    lastSyncAt: new Date().toISOString(),
    recordCount: count,
  });
}

export async function getSyncMeta(table: string): Promise<SanoviaDB['syncMeta']['value'] | undefined> {
  const db = await getDatabase();
  return db.get('syncMeta', table);
}

// ================================
// Clear All Offline Data
// ================================

export async function clearAllOfflineData(): Promise<void> {
  const db = await getDatabase();
  await db.clear('medicalRecords');
  await db.clear('medications');
  await db.clear('allergies');
  await db.clear('offlineQueue');
  await db.clear('syncMeta');
  await db.clear('cachedPatients');
}

// ================================
// Get Offline Status Summary
// ================================

export async function getOfflineStatus(): Promise<{
  pendingActions: number;
  cachedPatients: number;
  cachedRecords: number;
  lastSyncAt: string | null;
}> {
  const db = await getDatabase();
  const queue = await db.getAll('offlineQueue');
  const patients = await db.getAll('cachedPatients');
  const records = await db.getAll('medicalRecords');
  const syncMeta = await db.getAll('syncMeta');
  
  const lastSync = syncMeta.length > 0
    ? syncMeta.reduce((latest, meta) => 
        new Date(meta.lastSyncAt) > new Date(latest.lastSyncAt) ? meta : latest
      ).lastSyncAt
    : null;

  return {
    pendingActions: queue.length,
    cachedPatients: patients.length,
    cachedRecords: records.length,
    lastSyncAt: lastSync,
  };
}
