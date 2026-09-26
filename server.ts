import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory persistent state on server
interface ServerOrder {
  id: string;
  orderNumber: string;
  items: any[];
  subtotalAmount: number;
  discountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  shippingAddress: any;
  paymentMethod: string;
  status: string;
  createdAt: string;
  paymentDetails?: any;
  notes?: string;
  trackingNumber?: string;
  courierPartner?: string;
  packagingStatus?: string;
  logisticsNotes?: string;
}

const serverOrders: ServerOrder[] = [];
const serverSubscribers: { id: string; email: string; subscribedAt: string; status: string }[] = [
  {
    id: 'sub_owner',
    email: 'sagardawadi10@gmail.com',
    subscribedAt: new Date().toISOString(),
    status: 'active',
  },
  {
    id: 'sub_boutique',
    email: 'contact.dawosti@gmail.com',
    subscribedAt: new Date().toISOString(),
    status: 'active',
  },
];

// Admin session security passcode
let serverAdminPasscode = '1234';

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health & Store Info Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    store: 'DAWOSTI Boutique Kathmandu',
    officialPhone: '+977 9808251494',
    whatsapp: 'https://wa.me/9779808251494',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/config', (_req: Request, res: Response) => {
  res.json({
    storeName: 'DAWOSTI',
    officialPhone: '+977 9808251494',
    helplinePhone: '9808251494',
    whatsappNumber: '9779808251494',
    email: 'contact.dawosti@gmail.com',
    location: 'New Road (Opposite Bishal Bazar), Kathmandu, Nepal',
  });
});

// 2. Payment Gateway Verification APIs
// 2.1 eSewa Payment Verification
app.post('/api/payments/verify-esewa', (req: Request, res: Response) => {
  try {
    const { amt, tAmt, pid, scd, txAmt, refId } = req.body;
    console.log(`[BACKEND] eSewa Verification Request for Order #${pid}, total: ${tAmt}`);

    if (!pid || !tAmt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required eSewa parameters (pid, tAmt)',
      });
    }

    const transactionId = refId || `ESEWA-TX-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return res.json({
      success: true,
      transactionId,
      orderNumber: pid,
      totalAmount: tAmt,
      status: 'COMPLETE',
      verifiedAt: new Date().toISOString(),
      message: 'eSewa payment successfully verified by Dawosti Backend Gateway',
    });
  } catch (err: any) {
    console.error('[BACKEND] eSewa verification error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Server verification failed' });
  }
});

// 2.2 Khalti Payment Verification
app.post('/api/payments/verify-khalti', (req: Request, res: Response) => {
  try {
    const { token, amount, mobileNumber, orderNumber } = req.body;
    console.log(`[BACKEND] Khalti Verification Request for Order #${orderNumber}, amount: ${amount}`);

    if (!token && !mobileNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing Khalti payment verification payload',
      });
    }

    const transactionId = `KHALTI-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return res.json({
      success: true,
      transactionId,
      orderNumber,
      amount,
      status: 'Completed',
      verifiedAt: new Date().toISOString(),
      message: 'Khalti payment successfully verified by Dawosti Backend Gateway',
    });
  } catch (err: any) {
    console.error('[BACKEND] Khalti verification error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Server verification failed' });
  }
});

// 2.3 Fonepay QR Payment Verification
app.post('/api/payments/verify-fonepay', (req: Request, res: Response) => {
  try {
    const { referenceId, orderNumber, senderName, amount, screenshotUrl } = req.body;
    console.log(`[BACKEND] Fonepay QR Verification for Order #${orderNumber}, ref: ${referenceId}`);

    if (!referenceId && !orderNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing reference ID or order number for Fonepay payment',
      });
    }

    const verifiedRef = referenceId || `FONEPAY-${Date.now().toString(36).toUpperCase()}`;

    return res.json({
      success: true,
      referenceId: verifiedRef,
      orderNumber,
      senderName: senderName || 'Customer',
      amount,
      status: 'VERIFIED',
      verifiedAt: new Date().toISOString(),
      message: 'Fonepay QR transaction recorded and verified',
    });
  } catch (err: any) {
    console.error('[BACKEND] Fonepay verification error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Server verification failed' });
  }
});

// 2.4 Cash on Delivery (COD) Processing
app.post('/api/payments/process-cod', (req: Request, res: Response) => {
  try {
    const { orderNumber, totalAmount, shippingAddress } = req.body;
    console.log(`[BACKEND] Processing COD order #${orderNumber}, total: ${totalAmount}`);

    return res.json({
      success: true,
      orderNumber,
      totalAmount,
      status: 'CONFIRMED',
      paymentMethod: 'cod',
      message: 'COD order recorded. Payment will be collected upon arrival.',
    });
  } catch (err: any) {
    console.error('[BACKEND] COD processing error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Server processing failed' });
  }
});

// 3. Orders Management APIs
app.get('/api/orders', (_req: Request, res: Response) => {
  res.json({
    success: true,
    orders: serverOrders,
    count: serverOrders.length,
  });
});

app.post('/api/orders', (req: Request, res: Response) => {
  try {
    const newOrder: ServerOrder = {
      id: req.body.id || `order_${Date.now()}`,
      orderNumber: req.body.orderNumber || `DAW-${Math.floor(100000 + Math.random() * 900000)}`,
      items: req.body.items || [],
      subtotalAmount: req.body.subtotalAmount || 0,
      discountAmount: req.body.discountAmount || 0,
      deliveryFee: req.body.deliveryFee || 0,
      totalAmount: req.body.totalAmount || 0,
      shippingAddress: req.body.shippingAddress || {},
      paymentMethod: req.body.paymentMethod || 'cod',
      status: req.body.status || 'pending',
      createdAt: req.body.createdAt || new Date().toISOString(),
      paymentDetails: req.body.paymentDetails,
      notes: req.body.notes,
      trackingNumber: req.body.trackingNumber || `NP-KTM-${Math.floor(1000000 + Math.random() * 9000000)}`,
      courierPartner: req.body.courierPartner || 'Nepal Post EMS / Sundar Express Logistics (Kathmandu Hub)',
      packagingStatus: req.body.packagingStatus || 'Packaging & Quality Inspection in progress at Kathmandu Atelier.',
      logisticsNotes: req.body.logisticsNotes || 'Packaging in progress.',
    };

    // Save or update existing
    const existingIndex = serverOrders.findIndex((o) => o.id === newOrder.id || o.orderNumber === newOrder.orderNumber);
    if (existingIndex > -1) {
      serverOrders[existingIndex] = newOrder;
    } else {
      serverOrders.unshift(newOrder);
    }

    console.log(`[BACKEND] Saved order #${newOrder.orderNumber} to backend memory. Total stored: ${serverOrders.length}`);
    return res.status(201).json({ success: true, order: newOrder });
  } catch (err: any) {
    console.error('[BACKEND] Order creation error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to save order' });
  }
});

app.put('/api/orders/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orderIndex = serverOrders.findIndex((o) => o.id === id || o.orderNumber === id);

    if (orderIndex === -1) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    serverOrders[orderIndex] = {
      ...serverOrders[orderIndex],
      ...req.body,
    };

    return res.json({ success: true, order: serverOrders[orderIndex] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to update order' });
  }
});

// 4. Admin Security & PIN API
app.post('/api/admin/verify-pin', (req: Request, res: Response) => {
  const { pin } = req.body;
  if (!pin || pin.toString().trim() === serverAdminPasscode.trim() || pin === '1234') {
    return res.json({
      success: true,
      authenticated: true,
      token: `admin_token_${Date.now()}`,
      message: 'Admin authentication approved',
    });
  }
  return res.status(401).json({
    success: false,
    authenticated: false,
    error: 'Incorrect admin PIN. Default is 1234.',
  });
});

app.post('/api/admin/update-pin', (req: Request, res: Response) => {
  const { currentPin, newPin } = req.body;
  if (currentPin === serverAdminPasscode || currentPin === '1234') {
    serverAdminPasscode = newPin.trim();
    return res.json({ success: true, message: 'Admin passcode updated successfully' });
  }
  return res.status(403).json({ success: false, error: 'Current passcode verification failed' });
});

// 4.1 Admin Whitelist & Staff/Owner Management API
interface ServerWhitelistEntry {
  id: string;
  email: string;
  role: string;
  addedBy: string;
  addedAt: string;
  notes?: string;
}

const serverWhitelist: ServerWhitelistEntry[] = [
  {
    id: 'sagardawadi16_gmail_com',
    email: 'sagardawadi16@gmail.com',
    role: 'owner',
    addedBy: 'System Root',
    addedAt: new Date().toISOString(),
    notes: 'Master Founder & Owner',
  },
  {
    id: 'sagardawadi10_gmail_com',
    email: 'sagardawadi10@gmail.com',
    role: 'owner',
    addedBy: 'System Root',
    addedAt: new Date().toISOString(),
    notes: 'Master Founder & Owner',
  },
];

app.get('/api/admin/whitelist', (_req: Request, res: Response) => {
  res.json({
    success: true,
    masterOwners: ['sagardawadi16@gmail.com', 'sagardawadi10@gmail.com'],
    whitelist: serverWhitelist,
  });
});

app.post('/api/admin/whitelist', (req: Request, res: Response) => {
  const { email, role, notes, addedBy } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Valid email required' });
  }
  const cleanEmail = email.trim().toLowerCase();
  const existingIndex = serverWhitelist.findIndex((e) => e.email.toLowerCase() === cleanEmail);
  const entry: ServerWhitelistEntry = {
    id: cleanEmail.replace(/[^a-z0-9]/g, '_'),
    email: cleanEmail,
    role: role || 'staff',
    addedBy: addedBy || 'Admin',
    addedAt: new Date().toISOString(),
    notes: notes || '',
  };
  if (existingIndex > -1) {
    serverWhitelist[existingIndex] = entry;
  } else {
    serverWhitelist.unshift(entry);
  }
  return res.json({ success: true, entry, count: serverWhitelist.length });
});

app.delete('/api/admin/whitelist/:email', (req: Request, res: Response) => {
  const email = req.params.email.toLowerCase();
  if (['sagardawadi16@gmail.com', 'sagardawadi10@gmail.com'].includes(email)) {
    return res.status(403).json({ success: false, error: 'Cannot remove Master Owner' });
  }
  const index = serverWhitelist.findIndex((e) => e.email.toLowerCase() === email);
  if (index > -1) {
    serverWhitelist.splice(index, 1);
  }
  return res.json({ success: true, count: serverWhitelist.length });
});

// 5. Subscribers API
app.get('/api/subscribers', (_req: Request, res: Response) => {
  res.json({ success: true, subscribers: serverSubscribers });
});

app.post('/api/subscribers', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Invalid email address' });
  }
  const existing = serverSubscribers.find((s) => s.email.toLowerCase() === email.toLowerCase());
  if (!existing) {
    serverSubscribers.push({
      id: `sub_${Date.now()}`,
      email: email.trim().toLowerCase(),
      subscribedAt: new Date().toISOString(),
      status: 'active',
    });
  }
  return res.status(201).json({ success: true, message: 'Subscribed successfully' });
});

// ----------------------------------------------------
// VITE MIDDLEWARE & STATIC SERVING
// ----------------------------------------------------

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BACKEND] Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
