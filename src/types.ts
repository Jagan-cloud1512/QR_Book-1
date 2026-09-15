export interface UserAccount {
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface ShelfMatrixMetadata {
  rows: number;
  cols: number;
  updatedAt: string;
}

export type BookStatus = 'Available' | 'Reserved' | 'Out of Stock';

export interface BookRecord {
  bookId: string;
  title: string;
  qty: number;
  section?: string;
  row: string | number;
  col: string | number; // e.g., "1-4" or 5
  reservedBy: string | null; // e.g., "UID_8492" or null
  queue: string[]; // List of waiting App User IDs
  status: BookStatus;
  updatedAt?: string;
}

export interface QRCodePayload {
  tableName: string;
  action: 'sync_inventory';
  generatedAt?: string;
}

export interface FirebaseConfigParams {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}
