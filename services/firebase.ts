
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, deleteUser } from "firebase/auth";
// Consolidated firestore imports into a single statement to resolve potential resolution issues where split imports were causing members to be missing.
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
  enableIndexedDbPersistence 
} from "firebase/firestore";
import { getPerformance } from "firebase/performance";
import { Invoice, Purchase, Product, Party, Transaction, Expense, User, Estimate, AuditLog } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyA5cDKcWc_sfWihsB4-HszYLDm-RMHylNY",
  authDomain: "bill-flow-ai.firebaseapp.com",
  databaseURL: "https://bill-flow-ai-default-rtdb.firebaseio.com",
  projectId: "bill-flow-ai",
  storageBucket: "bill-flow-ai.firebasestorage.app",
  messagingSenderId: "78387162300",
  appId: "1:78387162300:web:2a18d24f73617d49d5b4b9",
  measurementId: "G-J8Y11F0ZCN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const perf = getPerformance(app);

// Enable persistence for offline capability
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
      console.warn('Persistence failed: Multiple tabs open');
  } else if (err.code == 'unimplemented') {
      console.warn('Persistence failed: Browser not supported');
  }
});

export const FirebaseService = {
  auth,

  loginUser: async (email: string, pass: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const uid = userCredential.user.uid;
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    await updateDoc(userDocRef, { lastActive: new Date().toISOString() }).catch(() => {});

    if (userDoc.exists()) {
      return { id: uid, ...userDoc.data() } as User;
    } else {
      return { id: uid, name: 'User', businessName: 'My Business', phone: '', role: 'owner', businessId: uid };
    }
  },

  getUserProfile: async (uid: string): Promise<User | null> => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        return { id: uid, ...userDoc.data() } as User;
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  updateLastActive: async (uid: string) => {
    try {
      const userDocRef = doc(db, "users", uid);
      await updateDoc(userDocRef, { lastActive: new Date().toISOString() });
    } catch (e) {}
  },

  registerUser: async (
    email: string, 
    pass: string, 
    profile: Omit<User, 'id' | 'role' | 'businessId'>, 
    role: 'owner' | 'staff' = 'owner',
    targetBusinessId?: string
  ): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = userCredential.user.uid;
    let finalBusinessId = uid;
    let finalBusinessName = profile.businessName;

    if (role === 'staff') {
      if (!targetBusinessId) {
         await deleteUser(userCredential.user);
         throw new Error("Business Code is required for staff.");
      }
      finalBusinessId = targetBusinessId;
      const ownerDoc = await getDoc(doc(db, "users", targetBusinessId));
      if (!ownerDoc.exists()) {
         await deleteUser(userCredential.user);
         throw new Error("Business not found");
      }
      finalBusinessName = ownerDoc.data()?.businessName || profile.businessName;
    }

    const newUser: User = { 
      id: uid, 
      ...profile,
      businessName: finalBusinessName,
      role, 
      businessId: finalBusinessId,
      lastActive: new Date().toISOString()
    };

    await setDoc(doc(db, "users", uid), newUser);
    return newUser;
  },

  logoutUser: async () => {
    await signOut(auth);
  },

  getStaffMembers: async (businessId: string): Promise<User[]> => {
    try {
      const q = query(collection(db, "users"), where("businessId", "==", businessId), where("role", "==", "staff"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (error) {
      return [];
    }
  },

  subscribe: (businessId: string, collectionName: string, callback: (data: any[]) => void) => {
    const colRef = collection(db, "users", businessId, collectionName);
    return onSnapshot(colRef, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  },

  getAllCollectionData: async (businessId: string, collectionName: string) => {
    const q = collection(db, "users", businessId, collectionName);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  },

  createSaleBatch: async (businessId: string, invoice: Invoice, products: Product[], party: Party | undefined) => {
    const batch = writeBatch(db);

    // 1. Save Invoice
    const invRef = doc(db, "users", businessId, "invoices", invoice.id);
    batch.set(invRef, invoice);

    // 2. Update Stock
    invoice.items.forEach(item => {
      if (item.productId) {
        const prodRef = doc(db, "users", businessId, "products", item.productId);
        batch.update(prodRef, { stock: increment(-item.quantity) });
      }
    });

    // 3. Update Party Balance (If Pending)
    if (invoice.status === 'Pending' && party) {
      const partyRef = doc(db, "users", businessId, "parties", party.id);
      batch.update(partyRef, { balance: increment(invoice.total) });
    }

    // 4. Create Transaction Record
    const txnRef = doc(db, "users", businessId, "transactions", invoice.id);
    const transaction: Transaction = {
      id: invoice.id,
      date: invoice.date,
      type: 'Sales Invoice',
      txnNo: invoice.invoiceNo,
      partyName: invoice.customerName,
      amount: invoice.total,
      status: invoice.status === 'Paid' ? 'Paid' : 'Unpaid'
    };
    batch.set(txnRef, transaction);

    // 5. Audit Log
    const auditRef = doc(collection(db, "users", businessId, "audit_logs"));
    batch.set(auditRef, {
      id: auditRef.id,
      date: new Date().toISOString(),
      action: "CREATE_SALE",
      details: `Invoiced ${invoice.customerName} for ₹${invoice.total}`,
      userId: auth.currentUser?.uid,
      userName: auth.currentUser?.displayName || 'User'
    });

    await batch.commit();
  },

  updateInvoiceStatus: async (businessId: string, invoice: Invoice, newStatus: 'Paid' | 'Pending', parties: Party[]) => {
    const batch = writeBatch(db);
    const invRef = doc(db, "users", businessId, "invoices", invoice.id);
    batch.update(invRef, { status: newStatus });

    const txnRef = doc(db, "users", businessId, "transactions", invoice.id);
    batch.update(txnRef, { status: newStatus === 'Paid' ? 'Paid' : 'Unpaid' });

    const party = parties.find(p => p.name === invoice.customerName);
    if (party) {
       const partyRef = doc(db, "users", businessId, "parties", party.id);
       if (invoice.status === 'Pending' && newStatus === 'Paid') {
          batch.update(partyRef, { balance: increment(-invoice.total) });
       } else if (invoice.status === 'Paid' && newStatus === 'Pending') {
          batch.update(partyRef, { balance: increment(invoice.total) });
       }
    }
    await batch.commit();
  },

  deleteInvoice: async (businessId: string, invoiceId: string) => {
    const batch = writeBatch(db);
    const invRef = doc(db, "users", businessId, "invoices", invoiceId);
    const invSnap = await getDoc(invRef);

    if (invSnap.exists()) {
      const invoice = invSnap.data() as Invoice;
      invoice.items.forEach(item => {
        if (item.productId) {
          const prodRef = doc(db, "users", businessId, "products", item.productId);
          batch.update(prodRef, { stock: increment(item.quantity) });
        }
      });
      batch.delete(invRef);
      batch.delete(doc(db, "users", businessId, "transactions", invoiceId));
      await batch.commit();
    }
  },

  createPurchaseBatch: async (businessId: string, purchase: Purchase, products: Product[], party: Party | undefined) => {
    const batch = writeBatch(db);
    const purRef = doc(db, "users", businessId, "purchases", purchase.id);
    batch.set(purRef, purchase);

    purchase.items.forEach(item => {
      if (item.productId) {
        const prodRef = doc(db, "users", businessId, "products", item.productId);
        batch.update(prodRef, { stock: increment(item.qty) });
      }
    });

    if (purchase.status === 'Unpaid' && party) {
      const partyRef = doc(db, "users", businessId, "parties", party.id);
      batch.update(partyRef, { balance: increment(-purchase.amount) });
    }

    const txnRef = doc(db, "users", businessId, "transactions", purchase.id);
    batch.set(txnRef, {
      id: purchase.id,
      date: purchase.date,
      type: 'Purchase',
      txnNo: purchase.invoiceNo,
      partyName: purchase.partyName,
      amount: purchase.amount,
      status: purchase.status
    });

    await batch.commit();
  },

  updatePurchaseStatus: async (businessId: string, purchase: Purchase, newStatus: 'Paid' | 'Unpaid', parties: Party[]) => {
    const batch = writeBatch(db);
    const purRef = doc(db, "users", businessId, "purchases", purchase.id);
    batch.update(purRef, { status: newStatus, unpaidAmount: newStatus === 'Paid' ? 0 : purchase.amount });

    const party = parties.find(p => p.name === purchase.partyName);
    if (party) {
       const partyRef = doc(db, "users", businessId, "parties", party.id);
       if (purchase.status === 'Unpaid' && newStatus === 'Paid') {
          batch.update(partyRef, { balance: increment(purchase.amount) });
       } else if (purchase.status === 'Paid' && newStatus === 'Unpaid') {
          batch.update(partyRef, { balance: increment(-purchase.amount) });
       }
    }
    await batch.commit();
  },

  addExpense: async (businessId: string, expense: Expense) => {
    const batch = writeBatch(db);
    const expRef = doc(db, "users", businessId, "expenses", expense.id);
    batch.set(expRef, expense);
    const txnRef = doc(db, "users", businessId, "transactions", expense.id);
    batch.set(txnRef, { id: expense.id, date: expense.date, type: 'Expense', txnNo: `EXP-${expense.id.slice(-4)}`, partyName: expense.description, amount: expense.amount, status: 'Paid' });
    await batch.commit();
  },

  saveEstimate: async (businessId: string, estimate: Estimate) => {
    await setDoc(doc(db, "users", businessId, "estimates", estimate.id), estimate);
  },

  deleteEstimate: async (businessId: string, estimateId: string) => {
     await deleteDoc(doc(db, "users", businessId, "estimates", estimateId));
  },

  add: async (businessId: string, collectionName: string, data: any) => {
    await setDoc(doc(db, "users", businessId, collectionName, data.id), data);
  }
};
