
/**
 * Firebase Cloud Function for Secure Invoice Creation
 * 
 * This function handles the "Sensitive Logic" of creating a sale.
 * It runs on the Google Cloud Server, meaning users cannot manipulate the code.
 * 
 * Logic:
 * 1. Checks Auth.
 * 2. Rate Limiting (Anti-Spam).
 * 3. Fetches REAL product prices from the database (ignores client sent prices).
 * 4. Checks if Stock is sufficient.
 * 5. Calculates the TRUE Total (Qty * Real Price + Tax).
 * 6. Performs an Atomic Transaction to update everything at once.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Admin SDK to access Firestore
admin.initializeApp();
const db = admin.firestore();

exports.createSale = functions.https.onCall(async (data, context) => {
  // 1. Authentication Check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated', 
      'User must be logged in to create a sale.'
    );
  }

  const userId = context.auth.uid;

  // 2. Rate Limiting (Max 10 requests per minute per user)
  const rateLimitRef = db.collection('rate_limits').doc(userId);
  const now = admin.firestore.Timestamp.now();
  const WINDOW_SECONDS = 60;
  const MAX_REQUESTS = 10;

  try {
    await db.runTransaction(async (t) => {
      const doc = await t.get(rateLimitRef);
      const limitData = doc.data();

      // Check if window has expired or doesn't exist
      if (!limitData || now.seconds > limitData.resetTime.seconds) {
        // Reset window
        t.set(rateLimitRef, {
          count: 1,
          resetTime: new admin.firestore.Timestamp(now.seconds + WINDOW_SECONDS, 0)
        });
      } else {
        // Window is active, check limit
        if (limitData.count >= MAX_REQUESTS) {
          throw new functions.https.HttpsError(
            'resource-exhausted', 
            'Rate limit exceeded. Please wait a moment.'
          );
        }
        // Increment count
        t.update(rateLimitRef, { count: limitData.count + 1 });
      }
    });
  } catch (err) {
    // If it's a rate limit error, rethrow it to the client
    if (err.code === 'resource-exhausted') {
       throw err;
    }
    console.error("Rate limit check failed", err);
    // If DB fails, we fail secure (deny access)
    throw new functions.https.HttpsError('internal', 'Rate limit validation failed');
  }

  const { businessId, invoiceData } = data;

  // 3. Authorization Check (Verify User belongs to Business - simplified for demo)
  // In prod, check if userId matches businessId or is verified staff.

  const businessRef = db.collection('users').doc(businessId);
  const invoiceRef = businessRef.collection('invoices').doc(invoiceData.id);
  const txnRef = businessRef.collection('transactions').doc(invoiceData.id);
  const auditRef = businessRef.collection('audit_logs').doc();

  // Run business logic inside a Transaction (All or Nothing)
  return db.runTransaction(async (t) => {
    
    // A. Fetch all products referenced in the invoice to get REAL prices/stock
    // We cannot trust `invoiceData.items[].price` from client.
    const itemRefs = [];
    const productDocs = [];

    for (const item of invoiceData.items) {
      if (!item.productId) continue; // Skip custom non-inventory items
      const ref = businessRef.collection('products').doc(item.productId);
      itemRefs.push(ref);
    }

    if (itemRefs.length > 0) {
       const docs = await t.getAll(...itemRefs);
       docs.forEach(d => productDocs.push(d));
    }

    // B. Recalculate Totals & Verify Stock
    let calculatedSubtotal = 0;
    const finalItems = [];

    for (const item of invoiceData.items) {
      let finalPrice = 0;
      let finalTotal = 0;

      if (item.productId) {
         // It's an inventory item
         const productDoc = productDocs.find(p => p.id === item.productId);
         
         if (!productDoc || !productDoc.exists) {
            throw new functions.https.HttpsError('invalid-argument', `Product ID ${item.productId} not found.`);
         }
         
         const product = productDoc.data();

         // Check Stock
         if (product.stock < item.quantity) {
            throw new functions.https.HttpsError(
               'failed-precondition', 
               `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
            );
         }

         // Use Master Price from DB
         finalPrice = product.price;
         
         // Update Stock in Transaction
         t.update(productDoc.ref, { stock: product.stock - item.quantity });
      } else {
         // Non-inventory item (Custom line item)
         // In strict mode, we might ban this, or allow client price. 
         // For now, assuming only scanned items allowed or we accept client price for custom items.
         finalPrice = 0; // Or validation logic
      }

      finalTotal = item.quantity * finalPrice;
      calculatedSubtotal += finalTotal;

      finalItems.push({
         ...item,
         price: finalPrice,
         total: finalTotal
      });
    }

    // Calculate Tax
    const taxRate = invoiceData.taxRate || 18;
    const taxAmount = calculatedSubtotal * (taxRate / 100);
    const grandTotal = calculatedSubtotal + taxAmount;

    // C. Handle Party Balance (if not paid immediately)
    // We assume the client passed the name. Logic omitted for brevity.
    let partyName = invoiceData.customerName;

    // D. Write Invoice
    const finalInvoice = {
       ...invoiceData,
       items: finalItems,
       subtotal: calculatedSubtotal,
       tax: taxAmount,
       total: grandTotal,
       createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    t.set(invoiceRef, finalInvoice);

    // E. Write Transaction Log
    t.set(txnRef, {
      id: invoiceData.id,
      date: invoiceData.date,
      type: 'Sales Invoice',
      txnNo: invoiceData.invoiceNo,
      partyName: partyName,
      amount: grandTotal,
      status: invoiceData.status === 'Paid' ? 'Paid' : 'Unpaid'
    });

    // F. Write Audit Log
    t.set(auditRef, {
       id: auditRef.id,
       date: new Date().toISOString(),
       action: "CREATE_SALE_SECURE",
       details: `Created Secure Invoice ${invoiceData.invoiceNo} for ₹${grandTotal}`,
       userId: userId,
       userName: 'Staff/Owner'
    });

    return { success: true, invoiceId: invoiceData.id, total: grandTotal };
  });
});
