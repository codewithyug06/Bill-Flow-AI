
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
  increment 
} from "firebase/firestore";
import { Invoice, Purchase, Product, Party, Transaction, Expense, User } from "../types";

// --- CONFIGURE YOUR FIREBASE PROJECT HERE ---
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
    
    if (userDoc.exists()) {
      return { id: uid, ...userDoc.data() } as User;
    } else {
      return { id: uid, name: 'User', businessName: 'My Business', phone: '' };
    }
  },

  registerUser: async (email: string, pass: string, profile: Omit<User, 'id'>): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = userCredential.user.uid;
    
    const newUser: User = { id: uid, ...profile };
    await setDoc(doc(db, "users", uid), newUser);
    return newUser;
  },

  logoutUser: async () => {
    await signOut(auth);
  },

  subscribe: (userId: string, collectionName: string, callback: (data: any[]) => void) => {
    const colRef = collection(db, "users", userId, collectionName);
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

  createSaleBatch: async (userId: string, invoice: Invoice, products: Product[], party: Party | undefined) => {
    const batch = writeBatch(db);

    // 1. Save Invoice
    const invRef = doc(db, "users", userId, "invoices", invoice.id);
    batch.set(invRef, invoice);

    // 2. Update Stock
    invoice.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const prodRef = doc(db, "users", userId, "products", product.id);
        const newStock = product.stock - item.quantity;
        batch.update(prodRef, { stock: newStock });
      }
    });

    // 3. Update Party Balance
    if ((invoice.status === 'Pending' || invoice.status === 'Overdue') && party) {
      const partyRef = doc(db, "users", userId, "parties", party.id);
      const newBalance = (party.balance || 0) + invoice.total;
      batch.update(partyRef, { balance: newBalance });
    }

    // 4. Log Transaction
    const txnRef = doc(db, "users", userId, "transactions", invoice.id);
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

  updateInvoiceStatus: async (userId: string, invoice: Invoice, newStatus: 'Paid' | 'Pending', parties: Party[]) => {
    const batch = writeBatch(db);
    
    // 1. Update Invoice Status
    const invRef = doc(db, "users", userId, "invoices", invoice.id);
    batch.update(invRef, { status: newStatus });

    // 2. Update Transaction Status
    const txnRef = doc(db, "users", userId, "transactions", invoice.id);
    batch.update(txnRef, { status: newStatus === 'Paid' ? 'Paid' : 'Unpaid' });

    // 3. Adjust Party Balance Logic
    const party = parties.find(p => p.name === invoice.customerName);
    if (party) {
       const partyRef = doc(db, "users", userId, "parties", party.id);
       if (invoice.status === 'Pending' && newStatus === 'Paid') {
          batch.update(partyRef, { balance: increment(-invoice.total) });
       } else if (invoice.status === 'Paid' && newStatus === 'Pending') {
          batch.update(partyRef, { balance: increment(invoice.total) });
       }
    }

    await batch.commit();
  },

  createPurchaseBatch: async (userId: string, purchase: Purchase, products: Product[], party: Party | undefined) => {
    const batch = writeBatch(db);

    // 1. Save Purchase
    const purRef = doc(db, "users", userId, "purchases", purchase.id);
    batch.set(purRef, purchase);

    // 2. Update Stock or Create New Products
    purchase.items.forEach(item => {
      if (item.productId) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const prodRef = doc(db, "users", userId, "products", product.id);
          batch.update(prodRef, { stock: product.stock + item.qty });
        }
      } else {
        const newId = Date.now().toString() + Math.random().toString().slice(2,5);
        const newProdRef = doc(db, "users", userId, "products", newId);
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
      const partyRef = doc(db, "users", userId, "parties", party.id);
      const newBalance = (party.balance || 0) - purchase.amount;
      batch.update(partyRef, { balance: newBalance });
    }

    // 4. Log Transaction
    const txnRef = doc(db, "users", userId, "transactions", purchase.id);
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

  updatePurchaseStatus: async (userId: string, purchase: Purchase, newStatus: 'Paid' | 'Unpaid', parties: Party[]) => {
    const batch = writeBatch(db);
    
    // 1. Update Purchase Status
    const purRef = doc(db, "users", userId, "purchases", purchase.id);
    batch.update(purRef, { status: newStatus, unpaidAmount: newStatus === 'Paid' ? 0 : purchase.amount });

    // 2. Update Transaction Status
    const txnRef = doc(db, "users", userId, "transactions", purchase.id);
    batch.update(txnRef, { status: newStatus === 'Paid' ? 'Paid' : 'Unpaid' });

    // 3. Adjust Party Balance Logic
    const party = parties.find(p => p.name === purchase.partyName);
    if (party) {
       const partyRef = doc(db, "users", userId, "parties", party.id);
       if (purchase.status === 'Unpaid' && newStatus === 'Paid') {
          batch.update(partyRef, { balance: increment(purchase.amount) });
       } else if (purchase.status === 'Paid' && newStatus === 'Unpaid') {
          batch.update(partyRef, { balance: increment(-purchase.amount) });
       }
    }

    await batch.commit();
  },

  addExpense: async (userId: string, expense: Expense) => {
    const batch = writeBatch(db);

    // 1. Save Expense
    const expRef = doc(db, "users", userId, "expenses", expense.id);
    batch.set(expRef, expense);

    // 2. Log Transaction
    const txnRef = doc(db, "users", userId, "transactions", expense.id);
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

  add: async (userId: string, collectionName: string, data: any) => {
    const ref = doc(db, "users", userId, collectionName, data.id);
    await setDoc(ref, data);
  },

  update: async (userId: string, collectionName: string, data: any) => {
    const ref = doc(db, "users", userId, collectionName, data.id);
    await setDoc(ref, data, { merge: true });
  }
};
