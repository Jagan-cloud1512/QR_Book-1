import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  Firestore,
  Unsubscribe,
  getDocFromServer,
} from "firebase/firestore";
import bcrypt from "bcryptjs";
import {
  UserAccount,
  ShelfMatrixMetadata,
  BookRecord,
  BookStatus,
  FirebaseConfigParams,
} from "../types";

// Firebase config is provided at build time or can be updated by the user in the app.
const DEFAULT_FIREBASE_CONFIG: FirebaseConfigParams = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

const CONFIG_STORAGE_KEY = "librislink_firebase_config";
const LOCAL_USERS_KEY = "librislink_local_users";
const LOCAL_DATA_PREFIX = "librislink_user_data_";

export function getSavedFirebaseConfig(): FirebaseConfigParams {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Could not load stored Firebase config:", e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(config: FirebaseConfigParams) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}

let firebaseApp: FirebaseApp | null = null;
let db: Firestore | null = null;
let isConnectedToFirestore = false;

export function initFirebase(configParams?: FirebaseConfigParams): {
  db: Firestore | null;
  isReal: boolean;
} {
  const config = configParams || getSavedFirebaseConfig();
  const isDummy =
    !config.apiKey ||
    config.apiKey.includes("YOUR_FIREBASE") ||
    !config.projectId ||
    config.projectId.includes("YOUR_FIREBASE");

  if (isDummy) {
    db = null;
    isConnectedToFirestore = false;
    return { db: null, isReal: false };
  }

  try {
    if (!getApps().length) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApps()[0];
    }
    db = getFirestore(firebaseApp);
    testConnection();
    return { db, isReal: true };
  } catch (err) {
    console.error("Failed to initialize Firebase:", err);
    db = null;
    isConnectedToFirestore = false;
    return { db: null, isReal: false };
  }
}

async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, "_connection_test", "ping"));
    isConnectedToFirestore = true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.warn("Firestore is currently offline or unreachable");
    }
  }
}

export function isFirestoreActive(): boolean {
  return db !== null;
}

// Local Fallback Helpers
function getLocalUsers(): Record<string, UserAccount> {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalUsers(users: Record<string, UserAccount>) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

function getLocalUserData(username: string): {
  matrix: ShelfMatrixMetadata | null;
  books: Record<string, BookRecord>;
} {
  try {
    const raw = localStorage.getItem(`${LOCAL_DATA_PREFIX}${username}`);
    return raw ? JSON.parse(raw) : { matrix: null, books: {} };
  } catch {
    return { matrix: null, books: {} };
  }
}

function saveLocalUserData(
  username: string,
  data: {
    matrix: ShelfMatrixMetadata | null;
    books: Record<string, BookRecord>;
  },
) {
  localStorage.setItem(`${LOCAL_DATA_PREFIX}${username}`, JSON.stringify(data));
  // Dispatch local storage event for realtime updates across components in fallback mode
  window.dispatchEvent(
    new CustomEvent("librislink_data_updated", { detail: { username } }),
  );
}

// ---------------- USER AUTHENTICATION ----------------

export async function createAccount(
  username: string,
  passwordPlain: string,
): Promise<{ success: boolean; message: string }> {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername) {
    return { success: false, message: "Username is required." };
  }
  if (!passwordPlain || passwordPlain.length < 4) {
    return {
      success: false,
      message: "Password must be at least 4 characters.",
    };
  }

  // Hash password using bcryptjs (salt rounds = 10)
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(passwordPlain, salt);
  const createdAt = new Date().toISOString();

  const userObj: UserAccount = {
    username: cleanUsername,
    passwordHash,
    createdAt,
  };

  if (db) {
    try {
      const userRef = doc(db, "users", cleanUsername);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return { success: false, message: "Username already exists." };
      }
      await setDoc(userRef, userObj);
      return {
        success: true,
        message: "Account created successfully in Firestore!",
      };
    } catch (err: any) {
      console.warn(
        "Firestore error during signup, falling back to local storage:",
        err,
      );
    }
  }

  // Local storage fallback
  const localUsers = getLocalUsers();
  if (localUsers[cleanUsername]) {
    return { success: false, message: "Username already exists." };
  }
  localUsers[cleanUsername] = userObj;
  saveLocalUsers(localUsers);

  // Initialize sample data for demo experience if first user
  if (Object.keys(localUsers).length === 1 || cleanUsername === "admin_demo") {
    seedInitialSampleData(cleanUsername);
  }

  return { success: true, message: "Account created successfully!" };
}

export async function loginUser(
  username: string,
  passwordPlain: string,
): Promise<{ success: boolean; message: string; user?: UserAccount }> {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername) {
    return { success: false, message: "Username is required." };
  }

  if (db) {
    try {
      const userRef = doc(db, "users", cleanUsername);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data() as UserAccount;
        const isValid = bcrypt.compareSync(
          passwordPlain,
          userData.passwordHash,
        );
        if (isValid) {
          return {
            success: true,
            message: "Login successful via Firestore!",
            user: userData,
          };
        } else {
          return { success: false, message: "Invalid password." };
        }
      }
    } catch (err) {
      console.warn(
        "Firestore error during login, falling back to local storage:",
        err,
      );
    }
  }

  // Local storage fallback
  const localUsers = getLocalUsers();
  const user = localUsers[cleanUsername];
  if (!user) {
    // If logging in with 'admin_demo' for quick demo, auto-create it
    if (cleanUsername === "admin_demo" && passwordPlain === "password123") {
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync("password123", salt);
      const demoUser: UserAccount = {
        username: "admin_demo",
        passwordHash,
        createdAt: new Date().toISOString(),
      };
      localUsers["admin_demo"] = demoUser;
      saveLocalUsers(localUsers);
      seedInitialSampleData("admin_demo");
      return {
        success: true,
        message: "Welcome to LibrisLink Demo!",
        user: demoUser,
      };
    }
    return {
      success: false,
      message: "User not found. Please create an account.",
    };
  }

  const isValid = bcrypt.compareSync(passwordPlain, user.passwordHash);
  if (!isValid) {
    return { success: false, message: "Invalid password." };
  }

  return { success: true, message: "Login successful!", user };
}

// Seed sample books & shelf matrix for a rich initial experience
export function seedInitialSampleData(username: string) {
  const sampleMatrix: ShelfMatrixMetadata = {
    rows: 4,
    cols: 6,
    updatedAt: new Date().toISOString(),
  };

  const sampleBooks: Record<string, BookRecord> = {
    "LIB-1029": {
      bookId: "LIB-1029",
      title: "The Architecture of Systems",
      qty: 3,
      section: "Section A",
      row: 2,
      col: "1-4",
      reservedBy: null,
      queue: [],
      status: "Available",
      updatedAt: new Date().toISOString(),
    },
    "LIB-2204": {
      bookId: "LIB-2204",
      title: "Advanced Data Structures & Algorithms",
      qty: 1,
      section: "Section B",
      row: 1,
      col: 5,
      reservedBy: "UID_8492",
      queue: ["UID_9102"],
      status: "Reserved",
      updatedAt: new Date().toISOString(),
    },
    "LIB-0931": {
      bookId: "LIB-0931",
      title: "Introduction to Artificial Intelligence",
      qty: 0,
      section: "Section C",
      row: 4,
      col: 2,
      reservedBy: null,
      queue: ["UID_3310", "UID_4412"],
      status: "Out of Stock",
      updatedAt: new Date().toISOString(),
    },
    "LIB-3045": {
      bookId: "LIB-3045",
      title: "Modern Software Engineering Practices",
      qty: 5,
      section: "Section A",
      row: 3,
      col: "1-2",
      reservedBy: null,
      queue: [],
      status: "Available",
      updatedAt: new Date().toISOString(),
    },
  };

  saveLocalUserData(username, { matrix: sampleMatrix, books: sampleBooks });

  if (db) {
    const colName = `user_${username}`;
    setDoc(doc(db, colName, "_shelf_matrix"), sampleMatrix).catch(() => {});
    Object.values(sampleBooks).forEach((b) => {
      setDoc(doc(db, colName, b.bookId), b).catch(() => {});
    });
  }
}

// ---------------- SHELF MATRIX METADATA ----------------

export async function saveShelfMatrix(
  username: string,
  matrix: ShelfMatrixMetadata,
): Promise<void> {
  const colName = `user_${username}`;
  matrix.updatedAt = new Date().toISOString();

  if (db) {
    try {
      await setDoc(doc(db, colName, "_shelf_matrix"), matrix);
    } catch (err) {
      console.warn("Firestore saveShelfMatrix error:", err);
    }
  }

  // Always sync local
  const current = getLocalUserData(username);
  current.matrix = matrix;
  saveLocalUserData(username, current);
}

export async function getShelfMatrix(
  username: string,
): Promise<ShelfMatrixMetadata | null> {
  const colName = `user_${username}`;
  if (db) {
    try {
      const snap = await getDoc(doc(db, colName, "_shelf_matrix"));
      if (snap.exists()) {
        return snap.data() as ShelfMatrixMetadata;
      }
    } catch (err) {
      console.warn("Firestore getShelfMatrix error:", err);
    }
  }
  const local = getLocalUserData(username);
  return local.matrix;
}

// ---------------- INVENTORY RECORDS ----------------

export async function saveBooksBatch(
  username: string,
  books: BookRecord[],
): Promise<void> {
  const colName = `user_${username}`;
  const local = getLocalUserData(username);

  for (const book of books) {
    book.updatedAt = new Date().toISOString();

    // Compute initial status
    book.status = calculateStatus(book.qty, book.reservedBy);

    if (db) {
      try {
        await setDoc(doc(db, colName, book.bookId), book);
      } catch (err) {
        console.warn(`Firestore saveBook error for ${book.bookId}:`, err);
      }
    }
    local.books[book.bookId] = book;
  }

  saveLocalUserData(username, local);
}

export async function saveSingleBook(
  username: string,
  book: BookRecord,
): Promise<void> {
  await saveBooksBatch(username, [book]);
}

export async function deleteSingleBook(
  username: string,
  bookId: string,
): Promise<void> {
  const colName = `user_${username}`;
  if (db) {
    try {
      await deleteDoc(doc(db, colName, bookId));
    } catch (err) {
      console.warn("Firestore deleteBook error:", err);
    }
  }

  const local = getLocalUserData(username);
  delete local.books[bookId];
  saveLocalUserData(username, local);
}

export function calculateStatus(
  qty: number,
  reservedBy: string | null,
): BookStatus {
  if (qty <= 0) return "Out of Stock";
  if (reservedBy) return "Reserved";
  return "Available";
}

export async function decrementBookQty(
  username: string,
  bookId: string,
): Promise<void> {
  const colName = `user_${username}`;
  const local = getLocalUserData(username);
  const book = local.books[bookId];

  if (!book) return;

  const newQty = Math.max(0, book.qty - 1);
  const newStatus = calculateStatus(newQty, book.reservedBy);

  const updates: Partial<BookRecord> = {
    qty: newQty,
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };

  if (db) {
    try {
      await updateDoc(doc(db, colName, bookId), updates);
    } catch (err) {
      console.warn("Firestore decrement error:", err);
    }
  }

  local.books[bookId] = { ...book, ...updates };
  saveLocalUserData(username, local);
}

export async function zeroOutBookQty(
  username: string,
  bookId: string,
): Promise<void> {
  const colName = `user_${username}`;
  const local = getLocalUserData(username);
  const book = local.books[bookId];

  if (!book) return;

  const updates: Partial<BookRecord> = {
    qty: 0,
    status: "Out of Stock",
    updatedAt: new Date().toISOString(),
  };

  if (db) {
    try {
      await updateDoc(doc(db, colName, bookId), updates);
    } catch (err) {
      console.warn("Firestore zeroOut error:", err);
    }
  }

  local.books[bookId] = { ...book, ...updates };
  saveLocalUserData(username, local);
}

// Reserve or Queue a book for a mobile user ID
export async function reserveOrQueueBook(
  username: string,
  bookId: string,
  appUserId: string,
): Promise<{ success: boolean; actionTaken: string }> {
  const colName = `user_${username}`;
  const local = getLocalUserData(username);
  const book = local.books[bookId];

  if (!book) {
    return { success: false, actionTaken: "Book not found" };
  }

  let actionTaken = "";
  let updatedBook: BookRecord = { ...book };

  if (book.qty > 0 && !book.reservedBy) {
    // Reserve directly
    updatedBook.reservedBy = appUserId;
    updatedBook.status = "Reserved";
    actionTaken = `Reserved by ${appUserId}`;
  } else {
    // Add to queue if not already in queue
    if (!updatedBook.queue.includes(appUserId)) {
      updatedBook.queue = [...updatedBook.queue, appUserId];
      actionTaken = `Added ${appUserId} to reservation queue (Position #${updatedBook.queue.length})`;
    } else {
      actionTaken = `${appUserId} is already in queue`;
    }
  }

  updatedBook.updatedAt = new Date().toISOString();

  if (db) {
    try {
      await setDoc(doc(db, colName, bookId), updatedBook);
    } catch (err) {
      console.warn("Firestore reserveOrQueue error:", err);
    }
  }

  local.books[bookId] = updatedBook;
  saveLocalUserData(username, local);

  return { success: true, actionTaken };
}

// Clear reservation or pop next in queue
export async function releaseReservation(
  username: string,
  bookId: string,
): Promise<void> {
  const colName = `user_${username}`;
  const local = getLocalUserData(username);
  const book = local.books[bookId];

  if (!book) return;

  let nextReservedBy: string | null = null;
  let newQueue = [...book.queue];

  if (newQueue.length > 0) {
    nextReservedBy = newQueue.shift() || null;
  }

  const newStatus = calculateStatus(book.qty, nextReservedBy);

  const updatedBook: BookRecord = {
    ...book,
    reservedBy: nextReservedBy,
    queue: newQueue,
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };

  if (db) {
    try {
      await setDoc(doc(db, colName, bookId), updatedBook);
    } catch (err) {
      console.warn("Firestore releaseReservation error:", err);
    }
  }

  local.books[bookId] = updatedBook;
  saveLocalUserData(username, local);
}

// Real-time Firestore Listener or Local State Subscription
export function subscribeToInventory(
  username: string,
  onData: (data: {
    matrix: ShelfMatrixMetadata | null;
    books: BookRecord[];
  }) => void,
  onError?: (err: any) => void,
): Unsubscribe {
  const colName = `user_${username}`;

  // Function to load and emit local state
  const emitLocal = () => {
    const local = getLocalUserData(username);
    onData({
      matrix: local.matrix,
      books: Object.values(local.books),
    });
  };

  // Initial emit
  emitLocal();

  // Listen for local custom updates
  const handleLocalEvent = (e: Event) => {
    const customEv = e as CustomEvent;
    if (customEv.detail?.username === username) {
      emitLocal();
    }
  };
  window.addEventListener("librislink_data_updated", handleLocalEvent);

  if (db) {
    try {
      const colRef = collection(db, colName);
      const unsub = onSnapshot(
        colRef,
        (snapshot) => {
          let matrix: ShelfMatrixMetadata | null = null;
          const books: BookRecord[] = [];

          snapshot.forEach((docSnap) => {
            if (docSnap.id === "_shelf_matrix") {
              matrix = docSnap.data() as ShelfMatrixMetadata;
            } else {
              const bookData = docSnap.data() as BookRecord;
              books.push(bookData);
            }
          });

          // Sync local copy
          const booksMap: Record<string, BookRecord> = {};
          books.forEach((b) => (booksMap[b.bookId] = b));
          saveLocalUserData(username, { matrix, books: booksMap });

          onData({ matrix, books });
        },
        (error) => {
          console.warn("Firestore onSnapshot listener error:", error);
          if (onError) onError(error);
        },
      );

      return () => {
        unsub();
        window.removeEventListener("librislink_data_updated", handleLocalEvent);
      };
    } catch (err) {
      console.warn("Error setting up onSnapshot:", err);
    }
  }

  return () => {
    window.removeEventListener("librislink_data_updated", handleLocalEvent);
  };
}
