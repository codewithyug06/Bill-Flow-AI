
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
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
  deleteDoc
} from "firebase/firestore";
import { Invoice, Purchase, Product, Party, Transaction, Expense, User, Estimate } from "../types";

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

console.log("Firebase Initialized Successfully (Modular SDK)");

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

  updateLastActive: async (uid: string) => {
    try {
      const userDocRef = doc(db, "users", uid);
      await updateDoc(userDocRef, { lastActive: new Date().toISOString() });
    } catch (e) {
      console.error("Failed to heartbeat", e);
    }
  },

  // Updated Register to handle Staff Joining
  registerUser: async (
    email: string, 
    pass: string, 
    profile: Omit<User, 'id' | 'role' | 'businessId'>, 
    role: 'owner' | 'staff' = 'owner',
    targetBusinessId?: string
  ): Promise<User> => {
    
    // If joining as staff, verify business exists first
    let finalBusinessId = '';
    let finalBusinessName = profile.businessName;

    if (role === 'staff') {
      if (!targetBusinessId) throw new Error("Business Code is required for staff.");
      
      const ownerDoc = await getDoc(doc(db, "users", targetBusinessId));
      if (!ownerDoc.exists()) {
        throw new Error("Invalid Business Code. Business not found.");
      }
      finalBusinessId = targetBusinessId;
      finalBusinessName = ownerDoc.data()?.businessName || profile.businessName;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = userCredential.user.uid;
    
    // If owner, businessId is their own UID
    if (role === 'owner') {
      finalBusinessId = uid;
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

  createSaleBatch: async (businessId: string, invoice: Invoice, products: Product[], party: Party | undefined) => {
    const batch = writeBatch(db);

    // 1. Save Invoice
    const invRef = doc(db, "users", businessId, "invoices", invoice.id);
    batch.set(invRef, invoice);

    // 2. Update Stock
    invoice.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const prodRef = doc(db, "users", businessId, "products", product.id);
        const newStock = product.stock - item.quantity;
        batch.update(prodRef, { stock: newStock });
      }
    });

    // 3. Update Party Balance
    if ((invoice.status === 'Pending' || invoice.status === 'Overdue') && party) {
      const partyRef = doc(db, "users", businessId, "parties", party.id);
      const newBalance = (party.balance || 0) + invoice.total;
      batch.update(partyRef, { balance: newBalance });
    }

    // 4. Log Transaction
    const txnRef = doc(db, "users", businessId, "transactions", invoice.id);
    const newTxn: Transaction = {
      id: invoice.id,
      date: invoice.date,
      type: 'Sales Invoice',
      txnNo: invoice.invoiceNo,
      partyName: invoice.customerName,
      amount: invoice.total,
      status: invoice.status === 'Paid' ? 'Paid' : 'Unpaid'
    };
    batch.set(txnRef, newTxn);

    await batch.commit();
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