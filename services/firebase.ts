import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, deleteUser } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  onSnapshot, 
  writeBatch, 
  increment,
  query,
  where,
  getDocs,
  deleteDoc,
  serverTimestamp,
  enableIndexedDbPersistence
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getPerformance } from "firebase/performance";
import { Invoice, Purchase, Product, Party, Transaction, Expense, User, Estimate, AuditLog } from "../types";

// --- CONFIGURE YOUR FIREBASE PROJECT HERE ---
const firebaseConfig = {
  apiKey: "AIzaSyA5cDKcWc_sfWB4-HszYLDm-RMHylNY",
  authDomain: "bill-flow-ai.firebaseapp.com",
  databaseURL: "https://bill-flow-ai-default-rtdb.firebaseio.com",
  projectId: "bill-flow-ai",
  storageBucket: "bill-flow-ai.firebasestorage.app",
  messagingSenderId: "78387300",
  appId: "1:78387162300:web:2a18d24f7d49d5b4b9",
  measurementId: "G-J8YF0ZCN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app);
// Initialize Performance Monitoring
const perf = getPerformance(app);

// Enable Offline Persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
      console.warn('Persistence failed: Multiple tabs open');
  } else if (err.code == 'unimplemented') {
      console.warn('Persistence failed: Browser not supported');
  }
});

console.log("Firebase Initialized Successfully (Modular SDK)");

// Helper for audit logs
const logAudit = async (businessId: string, action: string, details: string) => {
  const user = auth.currentUser;
  if (!user) return;

  const logRef = doc(collection(db, "users", businessId, "audit_logs"));
  const log: AuditLog = {
    id: logRef.id,
    date: new Date().toISOString(),
    action,
    details,
    userId: user.uid,
    userName: user.displayName || 'Unknown User'
  };
  // We use setDoc instead of add to control ID if needed, but here simple add is fine.
  // Using setDoc with generated ID for consistency.
  await setDoc(logRef, log);
};

export const FirebaseService = {
  auth,

  loginUser: async (email: string, pass: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const uid = userCredential.user.uid;
    
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    
    // Update Last Active
    await updateDoc(userDocRef, { lastActive: new Date().toISOString() }).catch(e => console.log("Update active fail", e));

    if (userDoc.exists()) {
      return { id: uid, ...userDoc.data() } as User;
    } else {
      // Fallback for legacy users
      return { 
        id: uid, 
        name: 'User', 
        businessName: 'My Business', 
        phone: '', 
        role: 'owner', 
        businessId: uid 
      };
    }
  },

  getUserProfile: async (uid: string): Promise<User | null> => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Ensure legacy local users have role/businessId
        return { 
          id: uid, 
          role: 'owner', 
          businessId: uid,
          ...userData 
        } as User;
      }
      return null;
    } catch (e) {
      console.error("Error fetching user profile:", e);
      return null;
    }
  },

  updateLastActive: async (uid: string) => {
    try {
      const userDocRef = doc(db, "users", uid);
      await updateDoc(userDocRef, { lastActive: new Date().toISOString() });
    } catch (e) {
      console.error("Failed to heartbeat", e);
    }
  },

  // Updated Register to handle Staff Joining securely
  registerUser: async (
    email: string, 
    pass: string, 
    profile: Omit<User, 'id' | 'role' | 'businessId'>, 
    role: 'owner' | 'staff' = 'owner',
    targetBusinessId?: string
  ): Promise<User> => {
    
    // 1. Create Auth User first (so we are logged in)
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = userCredential.user.uid;
    
    let finalBusinessId = uid;
    let finalBusinessName = profile.businessName;

    // 2. Handle Staff Verification
    if (role === 'staff') {
      if (!targetBusinessId) {
         await deleteUser(userCredential.user);
         throw new Error("Business Code is required for staff.");
      }
      finalBusinessId = targetBusinessId;

      // Write Temporary Profile (Required for Firestore Rules to allow reading Owner Doc)
      // The rule 'isStaffOf' checks `get(...auth.uid).data.businessId`
      const tempUser: User = { 
          id: uid, 
          ...profile,
          businessName: 'Verifying...',
          role, 
          businessId: finalBusinessId,
          lastActive: new Date().toISOString()
      };
      await setDoc(doc(db, "users", uid), tempUser);

      try {
        // Now try to read Owner Doc to verify existence & get name
        // This read will succeed ONLY if the profile above was written correctly
        const ownerDoc = await getDoc(doc(db, "users", targetBusinessId));
        if (!ownerDoc.exists()) {
             throw new Error("Business not found");
        }
        finalBusinessName = ownerDoc.data()?.businessName || profile.businessName;
      } catch (e) {
         // Cleanup on failure
         await deleteDoc(doc(db, "users", uid));
         await deleteUser(userCredential.user);
         throw new Error("Invalid Business Code or Access Denied.");
      }
    }

    const newUser: User = { 
      id: uid, 
      ...profile,
      businessName: finalBusinessName,
      role, 
      businessId: finalBusinessId,
      lastActive: new Date().toISOString()
    };

    // Final write (updates business name if staff)
    await setDoc(doc(db, "users", uid), newUser);
    return newUser;
  },

  logoutUser: async () => {
    await signOut(auth);
  },

  // Fetch all staff members for a specific business
  getStaffMembers: async (businessId: string): Promise<User[]> => {
    try {
      const q = query(
        collection(db, "users"), 
        where("businessId", "==", businessId),
        where("role", "==", "staff")
      );
      const querySnapshot = await getDocs(q);
      const staff: User[] = [];
      querySnapshot.forEach((doc) => {
        staff.push({ id: doc.id, ...doc.data() } as User);
      });
      return staff;
    } catch (error) {
      console.error("Error fetching staff:", error);
      return [];
    }
  },

  // Updated Subscribe to use businessId
  subscribe: (businessId: string, collectionName: string, callback: (data: any[]) => void) => {
    const colRef = collection(db, "users", businessId, collectionName);
    return onSnapshot(colRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(data);
    }, (error) => {
      console.error(`Error subscribing to ${collectionName}:`, error);
    });
  },

  // Method to get all data from a collection once (used for export)
  getAllCollectionData: async (businessId: string, collectionName: string) => {
    try {
       const q = collection(db, "users", businessId, collectionName);
       const snapshot = await getDocs(q);
       return snapshot.docs.map(doc => doc.data());
    } catch (e) {
       console.error(`Error fetching ${collectionName} for export`, e);
       return [];
    }
  },

  getAuditLogs: async (businessId: string): Promise<AuditLog[]> => {
     try {
       const q = collection(db, "users", businessId, "audit_logs");
       const snapshot = await getDocs(q);
       const logs = snapshot.docs.map(doc => doc.data() as AuditLog);
       return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
     } catch (e) {
       console.error("Error fetching audit logs", e);
       return [];
    }
  },

  createSaleBatch: async (businessId: string, invoice: Invoice, products: Product[], party: Party | undefined) => {
    // SECURE IMPLEMENTATION: Call Cloud Function
    // We send only the IDs and quantities. The server calculates totals based on Master Product List.
    const createSale = httpsCallable(functions, 'createSale');
    
    // Prepare minimal payload
    const payload = {
       businessId,
       invoiceData: {
          id: invoice.id,
          invoiceNo: invoice.invoiceNo,
          date: invoice.date,
          customerName: invoice.customerName,
          status: invoice.status,
          taxRate: invoice.taxRate,
          items: invoice.items.map(item => ({
             productId: item.productId,
             quantity: item.quantity,
             // We allow product name to be passed for non-inventory items if needed, 
             // but logic primarily relies on ID
             productName: item.productName 
          }))
       }
    };

    try {
       await createSale(payload);
    } catch (error: any) {
       console.error("Cloud Function call failed:", error);
       throw new Error(error.message || "Failed to create sale securely");
    }
  },

  updateInvoiceStatus: async (businessId: string, invoice: Invoice, newStatus: 'Paid' | 'Pending', parties: Party[]) => {
    const batch = writeBatch(db);
    
    // 1. Update Invoice Status
    const invRef = doc(db, "users", businessId, "invoices", invoice.id);
    batch.update(invRef, { status: newStatus });

    // 2. Update Transaction Status
    const txnRef = doc(db, "users", businessId, "transactions", invoice.id);
    batch.update(txnRef, { status: newStatus === 'Paid' ? 'Paid' : 'Unpaid' });

    // 3. Adjust Party Balance Logic
    const party = parties.find(p => p.name === invoice.customerName);
    if (party) {
       const partyRef = doc(db, "users", businessId, "parties", party.id);
       if (invoice.status === 'Pending' && newStatus === 'Paid') {
          batch.update(partyRef, { balance: increment(-invoice.total) });
       } else if (invoice.status === 'Paid' && newStatus === 'Pending') {
          batch.update(partyRef, { balance: increment(invoice.total) });
       }
    }

    // 4. Audit Log
    const user = auth.currentUser;
    if (user) {
       const logRef = doc(collection(db, "users", businessId, "audit_logs"));
       batch.set(logRef, {
          id: logRef.id,
          date: new Date().toISOString(),
          action: "INVOICE_STATUS_UPDATE",
          details: `Changed Invoice ${invoice.invoiceNo} status to ${newStatus}`,
          userId: user.uid,
          userName: user.displayName || user.email || 'Staff'
       });
    }

    await batch.commit();
  },

  deleteInvoice: async (businessId: string, invoiceId: string) => {
    const batch = writeBatch(db);
    const invRef = doc(db, "users", businessId, "invoices", invoiceId);
    const invSnap = await getDoc(invRef);

    if (!invSnap.exists()) {
        throw new Error("Invoice not found");
    }
    const invoice = invSnap.data() as Invoice;

    // 1. Restore Stock for inventory items
    for (const item of invoice.items) {
       if (item.productId) {
          const prodRef = doc(db, "users", businessId, "products", item.productId);
          batch.update(prodRef, { stock: increment(item.quantity) });
       }
    }

    // 2. Delete Invoice Document
    batch.delete(invRef);

    // 3. Delete Transaction Record
    const txnRef = doc(db, "users", businessId, "transactions", invoiceId);
    batch.delete(txnRef);

    // 4. Audit Log
    const user = auth.currentUser;
    if (user) {
        const logRef = doc(collection(db, "users", businessId, "audit_logs"));
        batch.set(logRef, {
           id: logRef.id,
           date: new Date().toISOString(),
           action: "DELETE_INVOICE",
           details: `Deleted Invoice ${invoice.invoiceNo} and restored stock`,
           userId: user.uid,
           userName: user.displayName || 'Staff'
        });
    }

    await batch.commit();
  },

  createPurchaseBatch: async (businessId: string, purchase: Purchase, products: Product[], party: Party | undefined) => {
    const batch = writeBatch(db);

    // 1. Save Purchase
    const purRef = doc(db, "users", businessId, "purchases", purchase.id);
    batch.set(purRef, purchase);

    // 2. Update Stock or Create New Products
    purchase.items.forEach(item => {
      if (item.productId) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const prodRef = doc(db, "users", businessId, "products", product.id);
          batch.update(prodRef, { stock: product.stock + item.qty });
        }
      } else {
        const newId = Date.now().toString() + Math.random().toString().slice(2,5);
        const newProdRef = doc(db, "users", businessId, "products", newId);
        batch.set(newProdRef, {
          id: newId,
          name: item.name,
          category: 'General',
          price: item.rate,
          stock: item.qty,
          unit: 'pcs',
          description: 'Auto-added from Purchase'
        });
      }
    });

    // 3. Update Party Balance
    if (purchase.status === 'Unpaid' && party) {
      const partyRef = doc(db, "users", businessId, "parties", party.id);
      const newBalance = (party.balance || 0) - purchase.amount;
      batch.update(partyRef, { balance: newBalance });
    }

    // 4. Log Transaction
    const txnRef = doc(db, "users", businessId, "transactions", purchase.id);
    const newTxn: Transaction = {
      id: purchase.id,
      date: purchase.date,
      type: 'Purchase',
      txnNo: purchase.invoiceNo,
      partyName: purchase.partyName,
      amount: purchase.amount,
      status: purchase.status
    };
    batch.set(txnRef, newTxn);

    // 5. Audit Log
    const user = auth.currentUser;
    if (user) {
        const logRef = doc(collection(db, "users", businessId, "audit_logs"));
        batch.set(logRef, {
           id: logRef.id,
           date: new Date().toISOString(),
           action: "CREATE_PURCHASE",
           details: `Created Purchase Bill ${purchase.invoiceNo} for ₹${purchase.amount}`,
           userId: user.uid,
           userName: user.displayName || 'Staff'
        });
    }

    await batch.commit();
  },

  updatePurchaseStatus: async (businessId: string, purchase: Purchase, newStatus: 'Paid' | 'Unpaid', parties: Party[]) => {
    const batch = writeBatch(db);
    
    // 1. Update Purchase Status
    const purRef = doc(db, "users", businessId, "purchases", purchase.id);
    batch.update(purRef, { status: newStatus, unpaidAmount: newStatus === 'Paid' ? 0 : purchase.amount });

    // 2. Update Transaction Status
    const txnRef = doc(db, "users", businessId, "transactions", purchase.id);
    batch.update(txnRef, { status: newStatus === 'Paid' ? 'Paid' : 'Unpaid' });

    // 3. Adjust Party Balance Logic
    const party = parties.find(p => p.name === purchase.partyName);
    if (party) {
       const partyRef = doc(db, "users", businessId, "parties", party.id);
       if (purchase.status === 'Unpaid' && newStatus === 'Paid') {
          batch.update(partyRef, { balance: increment(purchase.amount) });
       } else if (purchase.status === 'Paid' && newStatus === 'Unpaid') {
          batch.update(partyRef, { balance: increment(-purchase.amount) });
       }
    }

    await logAudit(businessId, "PURCHASE_STATUS_UPDATE", `Changed Purchase ${purchase.invoiceNo} status to ${newStatus}`);
    
    await batch.commit();
  },

  addExpense: async (businessId: string, expense: Expense) => {
    const batch = writeBatch(db);

    // 1. Save Expense
    const expRef = doc(db, "users", businessId, "expenses", expense.id);
    batch.set(expRef, expense);

    // 2. Log Transaction
    const txnRef = doc(db, "users", businessId, "transactions", expense.id);
    const newTxn: Transaction = {
      id: expense.id,
      date: expense.date,
      type: 'Expense',
      txnNo: `EXP-${expense.id.slice(-4)}`,
      partyName: expense.description,
      amount: expense.amount,
      status: 'Paid'
    };
    batch.set(txnRef, newTxn);

    await batch.commit();
  },

  // Estimates / Quotations
  saveEstimate: async (businessId: string, estimate: Estimate) => {
    const ref = doc(db, "users", businessId, "estimates", estimate.id);
    await setDoc(ref, estimate);
  },

  deleteEstimate: async (businessId: string, estimateId: string) => {
     const ref = doc(db, "users", businessId, "estimates", estimateId);
     await deleteDoc(ref);
     await logAudit(businessId, "DELETE_ESTIMATE", `Deleted estimate ${estimateId}`);
  },

  add: async (businessId: string, collectionName: string, data: any) => {
    const ref = doc(db, "users", businessId, collectionName, data.id);
    await setDoc(ref, data);
  },

  update: async (businessId: string, collectionName: string, data: any) => {
    const ref = doc(db, "users", businessId, collectionName, data.id);
    await setDoc(ref, data, { merge: true });
  }
};