import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  Category,
  Template,
  DaySchedule,
  Checklist,
  Settings,
  ModeState,
  NotificationQueue,
  BackupData
} from '@/types';

// Database schema
interface TimeDietDB extends DBSchema {
  categories: {
    key: string;
    value: Category;
  };
  templates: {
    key: string;
    value: Template;
  };
  schedules: {
    key: string;
    value: DaySchedule;
    indexes: { 'by-date': string };
  };
  checklists: {
    key: string;
    value: Checklist;
    indexes: { 'by-date': string };
  };
  settings: {
    key: string;
    value: Settings;
  };
  modeState: {
    key: string;
    value: ModeState;
  };
  notifications: {
    key: string;
    value: NotificationQueue;
    indexes: { 'by-time': Date };
  };
}

const DB_NAME = 'TimeDietDB';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<TimeDietDB> | null = null;

/**
 * Initialize and get database instance
 */
export async function getDB(): Promise<IDBPDatabase<TimeDietDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<TimeDietDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Categories store
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }

      // Templates store
      if (!db.objectStoreNames.contains('templates')) {
        db.createObjectStore('templates', { keyPath: 'id' });
      }

      // Schedules store with date index
      if (!db.objectStoreNames.contains('schedules')) {
        const scheduleStore = db.createObjectStore('schedules', { keyPath: 'id' });
        scheduleStore.createIndex('by-date', 'date', { unique: true });
      }

      // Checklists store with date index
      if (!db.objectStoreNames.contains('checklists')) {
        const checklistStore = db.createObjectStore('checklists', { keyPath: 'date' });
        checklistStore.createIndex('by-date', 'date', { unique: true });
      }

      // Settings store (single record)
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }

      // Mode state store (single record)
      if (!db.objectStoreNames.contains('modeState')) {
        db.createObjectStore('modeState', { keyPath: 'id' });
      }

      // Notifications queue with time index
      if (!db.objectStoreNames.contains('notifications')) {
        const notificationStore = db.createObjectStore('notifications', { keyPath: 'id' });
        notificationStore.createIndex('by-time', 'scheduledTime');
      }
    },
  });

  return dbInstance;
}

// Categories
export async function getCategories(): Promise<Category[]> {
  const db = await getDB();
  return db.getAll('categories');
}

export async function saveCategory(category: Category): Promise<void> {
  const db = await getDB();
  await db.put('categories', category);
}

export async function saveCategories(categories: Category[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('categories', 'readwrite');
  await Promise.all(categories.map(category => tx.store.put(category)));
  await tx.done;
}

// Templates
export async function getTemplates(): Promise<Template[]> {
  const db = await getDB();
  return db.getAll('templates');
}

export async function saveTemplate(template: Template): Promise<void> {
  const db = await getDB();
  await db.put('templates', template);
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('templates', id);
}

// Schedules
export async function getSchedule(date: string): Promise<DaySchedule | undefined> {
  const db = await getDB();
  return db.getFromIndex('schedules', 'by-date', date);
}

export async function saveSchedule(schedule: DaySchedule): Promise<void> {
  const db = await getDB();
  await db.put('schedules', schedule);
}

export async function getSchedulesInRange(startDate: string, endDate: string): Promise<DaySchedule[]> {
  const db = await getDB();
  const tx = db.transaction('schedules', 'readonly');
  const index = tx.store.index('by-date');
  const range = IDBKeyRange.bound(startDate, endDate);
  return index.getAll(range);
}

export async function getAllSchedules(): Promise<DaySchedule[]> {
  const db = await getDB();
  return db.getAll('schedules');
}

// Checklists
export async function getChecklist(date: string): Promise<Checklist | undefined> {
  const db = await getDB();
  return db.get('checklists', date);
}

export async function saveChecklist(checklist: Checklist): Promise<void> {
  const db = await getDB();
  await db.put('checklists', checklist);
}

export async function getChecklistsInRange(startDate: string, endDate: string): Promise<Checklist[]> {
  const db = await getDB();
  const tx = db.transaction('checklists', 'readonly');
  const index = tx.store.index('by-date');
  const range = IDBKeyRange.bound(startDate, endDate);
  return index.getAll(range);
}

export async function getAllChecklists(): Promise<Checklist[]> {
  const db = await getDB();
  return db.getAll('checklists');
}

// Settings
export async function getSettings(): Promise<Settings | undefined> {
  const db = await getDB();
  return db.get('settings', 'main');
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await getDB();
  await db.put('settings', { ...settings, id: 'main' });
}

// Mode State
export async function getModeState(): Promise<ModeState | undefined> {
  const db = await getDB();
  return db.get('modeState', 'main');
}

export async function saveModeState(modeState: ModeState): Promise<void> {
  const db = await getDB();
  await db.put('modeState', { ...modeState, id: 'main' });
}

// Notifications
export async function getNotificationQueue(): Promise<NotificationQueue[]> {
  const db = await getDB();
  return db.getAll('notifications');
}

export async function saveNotification(notification: NotificationQueue): Promise<void> {
  const db = await getDB();
  await db.put('notifications', notification);
}

export async function clearNotificationQueue(): Promise<void> {
  const db = await getDB();
  await db.clear('notifications');
}

export async function removeExpiredNotifications(): Promise<void> {
  const db = await getDB();
  const now = new Date();
  const tx = db.transaction('notifications', 'readwrite');
  const index = tx.store.index('by-time');
  const range = IDBKeyRange.upperBound(now);
  
  for await (const cursor of index.iterate(range)) {
    await cursor.delete();
  }
  
  await tx.done;
}

// Backup and Export
export async function exportAllData(): Promise<BackupData> {
  const [categories, templates, schedules, checklists, settings, modeState] = await Promise.all([
    getCategories(),
    getTemplates(),
    getAllSchedules(),
    getAllChecklists(),
    getSettings(),
    getModeState()
  ]);

  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    categories,
    templates,
    schedules,
    checklists,
    settings: settings!,
    modeState: modeState!
  };
}

export async function importAllData(data: BackupData): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['categories', 'templates', 'schedules', 'checklists', 'settings', 'modeState'], 'readwrite');

  // Clear existing data
  await Promise.all([
    tx.objectStore('categories').clear(),
    tx.objectStore('templates').clear(),
    tx.objectStore('schedules').clear(),
    tx.objectStore('checklists').clear(),
    tx.objectStore('settings').clear(),
    tx.objectStore('modeState').clear()
  ]);

  // Import new data
  await Promise.all([
    ...data.categories.map(item => tx.objectStore('categories').put(item)),
    ...data.templates.map(item => tx.objectStore('templates').put(item)),
    ...data.schedules.map(item => tx.objectStore('schedules').put(item)),
    ...data.checklists.map(item => tx.objectStore('checklists').put(item)),
    tx.objectStore('settings').put({ ...data.settings, id: 'main' }),
    tx.objectStore('modeState').put({ ...data.modeState, id: 'main' })
  ]);

  await tx.done;
}

// Clear all data
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['categories', 'templates', 'schedules', 'checklists', 'settings', 'modeState', 'notifications'], 'readwrite');

  await Promise.all([
    tx.objectStore('categories').clear(),
    tx.objectStore('templates').clear(),
    tx.objectStore('schedules').clear(),
    tx.objectStore('checklists').clear(),
    tx.objectStore('settings').clear(),
    tx.objectStore('modeState').clear(),
    tx.objectStore('notifications').clear()
  ]);

  await tx.done;
}

