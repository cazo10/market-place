import { initializeApp } from 'firebase/app';
import { optimizeImage } from '@/utils/imageUtils';
import { 
   increment,
  serverTimestamp,
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  orderBy, 
  query, 
  doc, 
  getDoc, 
  updateDoc, 
  where,
  deleteDoc,
  onSnapshot,
  arrayUnion, arrayRemove,setDoc,
} from 'firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
export { 
  getDoc,
 setDoc
};

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCpQ46RUY0_GHV5KhZVaI-RWGOtDUr18DY",
  authDomain: "ppdata2-5e1d9.firebaseapp.com",
  projectId: "ppdata2-5e1d9",
  storageBucket: "ppdata2-5e1d9.firebasestorage.app",
  messagingSenderId: "1035730649043",
  appId: "1:1035730649043:web:b75c8d8d1a2e38c5807926",
  measurementId: "G-8EQM8BKQ43"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};
// Export Firebase functions for use in components
export { doc, updateDoc, where, orderBy };

// Utility function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

// Auth functions
export const registerUser = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document with default values
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      name: userData.name || '',
      phone: userData.phone || '',
      role: userData.role || 'customer',
      favorites: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...userData
    });
    
    return user;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const ensureUserDocument = async (user) => {
  if (!user) return null;
  
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    // Create basic user document if it doesn't exist
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      name: user.displayName || '',
      role: 'customer',
      favorites: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  
  return userRef;
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// User functions
export const getUserData = async (uid) => {
  try {
    const q = query(collection(db, 'users'), where('uid', '==', uid));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

// Product functions
export const addProduct = async (productData) => {
  try {
    const docRef = await addDoc(collection(db, 'products'), {
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Product added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId) => {
  try {
    await deleteDoc(doc(db, 'products', productId));
    console.log('Product deleted successfully');
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

export const getProducts = async () => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const products = [];
    
    for (const doc of querySnapshot.docs) {
      const productData = doc.data();
      // Ensure vendorId exists
      if (!productData.vendorId) {
        console.warn(`Product ${doc.id} is missing vendorId`);
        continue;
      }
      
      // Get vendor data
      const vendor = await getVendorById(productData.vendorId);
      
      products.push({
        id: doc.id,
        ...productData,
        vendorId: productData.vendorId,
        vendorName: vendor?.businessName || 'Vendor',
        vendorProfileImage: vendor?.profileImage || '/default-avatar.png',
        isVerified: vendor?.verified || false,
        createdAt: productData.createdAt?.toDate 
          ? productData.createdAt.toDate() 
          : productData.createdAt
      });
    }
    
    return products;
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
};
export const getProductsByVendor = async (vendorId) => {
  try {
    const q = query(
      collection(db, 'products'), 
      where('vendorId', '==', vendorId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting vendor products:', error);
    return [];
  }
};

export const updateProductStock = async (productId, newStock) => {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      stock: newStock,
      updatedAt: new Date()
    });
    console.log('Product stock updated successfully');
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw error;
  }
};

// Vendor functions
export const addVendor = async (vendorData) => {
  try {
    console.log('Adding vendor with data:', vendorData);
    const docRef = await addDoc(collection(db, 'vendors'), {
      ...vendorData,
      verified: false,
      status: 'active', // Add default status
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Vendor added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding vendor:', error);
    throw error;
  }
};


export const getVendorById = async (vendorId) => {
  try {
    const vendorRef = doc(db, 'vendors', vendorId);
    const vendorSnap = await getDoc(vendorRef);
    
    if (vendorSnap.exists()) {
      return { 
        id: vendorSnap.id, 
        ...vendorSnap.data(),
        // Ensure createdAt is a Date object
        createdAt: vendorSnap.data().createdAt?.toDate 
          ? vendorSnap.data().createdAt.toDate() 
          : vendorSnap.data().createdAt
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting vendor:', error);
    throw error;
  }
};

export const getProductsByVendorId = async (vendorId) => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('vendorId', '==', vendorId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Ensure proper date handling
      createdAt: doc.data().createdAt?.toDate 
        ? doc.data().createdAt.toDate() 
        : doc.data().createdAt
    }));
  } catch (error) {
    console.error('Error getting products by vendor:', error);
    throw error;
  }
};

export const getVendors = async () => {
  try {
    console.log('=== FETCHING ALL VENDORS ===');
    
    // Use a simple query without any filters to get ALL vendors
    const vendorsCollection = collection(db, 'vendors');
    const querySnapshot = await getDocs(vendorsCollection);
    
    console.log('Raw query snapshot size:', querySnapshot.size);
    console.log('Raw query snapshot empty:', querySnapshot.empty);
    
    const vendors = [];
    querySnapshot.forEach((doc) => {
      const vendorData = doc.data();
      console.log(`Processing vendor document ${doc.id}:`, vendorData);
      
      vendors.push({
        id: doc.id,
        ...vendorData
      });
    });
    
    console.log('Total vendors processed:', vendors.length);
    console.log('All vendors data:', vendors);
    
    // Additional debugging - check each vendor's key fields
    vendors.forEach((vendor, index) => {
      console.log(`Vendor ${index + 1} details:`, {
        id: vendor.id,
        email: vendor.email,
        businessName: vendor.businessName,
        verified: vendor.verified,
        status: vendor.status,
        createdAt: vendor.createdAt?.toDate ? vendor.createdAt.toDate() : vendor.createdAt
      });
    });
    
    console.log('=== END VENDOR FETCH ===');
    return vendors;
  } catch (error) {
    console.error('Error getting vendors:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    return [];
  }
};

export const getVerifiedVendors = async () => {
  try {
    console.log('Fetching verified vendors...');
    const allVendors = await getVendors();
    const verifiedVendors = allVendors.filter(vendor => vendor.verified === true);
    console.log('Verified vendors:', verifiedVendors);
    return verifiedVendors;
  } catch (error) {
    console.error('Error getting verified vendors:', error);
    return [];
  }
};

export const verifyVendor = async (vendorId) => {
  try {
    const vendorRef = doc(db, 'vendors', vendorId);
    await updateDoc(vendorRef, {
      verified: true,
      verifiedAt: new Date()
    });
    console.log('Vendor verified successfully');
  } catch (error) {
    console.error('Error verifying vendor:', error);
    throw error;
  }
};

// Order functions
export const addOrder = async (orderData) => {
  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Order added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding order:', error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId, newStatus, productId = null, quantity = null) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: newStatus,
      updatedAt: new Date(),
      ...(newStatus === 'processing' && { processingAt: new Date() }),
      ...(newStatus === 'delivered' && { deliveredAt: new Date() })
    });

    // If marking as delivered, update product stock
    if (newStatus === 'delivered' && productId && quantity) {
      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const currentStock = productSnap.data().stock || 0;
        const newStock = Math.max(0, currentStock - quantity);
        await updateProductStock(productId, newStock);
        console.log(`Product stock updated: ${currentStock} -> ${newStock}`);
      }
    }

    console.log('Order status updated successfully');
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

export const deleteOrder = async (orderId) => {
  try {
    await deleteDoc(doc(db, 'orders', orderId));
    console.log('Order deleted successfully');
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

// Enhanced order retrieval with better logging and case-insensitive email matching
export const getOrdersByCustomer = async (customerEmail) => {
  try {
    console.log('Fetching orders for customer email:', customerEmail);
    
    // Get all orders and filter in memory for case-insensitive matching
    const allOrdersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const allOrdersSnapshot = await getDocs(allOrdersQuery);
    const orders = allOrdersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(order => 
        order.customerEmail && 
        order.customerEmail.toLowerCase() === customerEmail.toLowerCase()
      );
    
    console.log('Found orders:', orders);
    console.log('Order count:', orders.length);
    
    // Log each order for debugging
    orders.forEach((order, index) => {
      console.log(`Order ${index + 1}:`, {
        id: order.id,
        customerEmail: order.customerEmail,
        productName: order.productName,
        status: order.status,
        total: order.total
      });
    });
    
    return orders;
  } catch (error) {
    console.error('Error getting customer orders:', error);
    return [];
  }
};

// Enhanced function to get vendor by email with better error handling
export const getVendorByEmail = async (email) => {
  try {
    console.log('Checking vendor by email:', email);
    
    // Get all vendors and filter in memory for case-insensitive matching
    const allVendorsQuery = query(collection(db, 'vendors'));
    const allVendorsSnapshot = await getDocs(allVendorsQuery);
    const vendors = allVendorsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(vendor => 
        vendor.email && 
        vendor.email.toLowerCase() === email.toLowerCase()
      );
    
    if (vendors.length > 0) {
      console.log('Found vendor with case-insensitive search:', vendors[0]);
      return vendors[0];
    }
    
    console.log('No vendor found with email:', email);
    return null;
  } catch (error) {
    console.error('Error getting vendor by email:', error);
    throw error;
  }
};

// Enhanced order retrieval for vendors
export const getOrdersByVendor = async (vendorId) => {
  try {
    console.log('Fetching orders for vendor ID:', vendorId);
    
    // Get all orders and filter by vendorId
    const allOrdersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const allOrdersSnapshot = await getDocs(allOrdersQuery);
    const orders = allOrdersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(order => order.vendorId === vendorId);
    
    console.log('Found vendor orders:', orders);
    return orders;
  } catch (error) {
    console.error('Error getting vendor orders:', error);
    return [];
  }
};

// Enhanced message retrieval
export const getMessagesByRecipient = async (recipientId) => {
  try {
    console.log('Fetching messages for recipient:', recipientId);
    
    // Get all messages and filter
    const allMessagesQuery = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const allMessagesSnapshot = await getDocs(allMessagesQuery);
    const messages = allMessagesSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(message => 
        message.recipientId === recipientId || 
        message.recipientEmail === recipientId
      );
    
    console.log('Found messages:', messages);
    return messages;
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
};

export const updateVendorStatus = async (vendorId, status) => {
  try {
    const vendorRef = doc(db, 'vendors', vendorId);
    await updateDoc(vendorRef, {
      status: status,
      updatedAt: new Date()
    });
    console.log('Vendor status updated successfully');
  } catch (error) {
    console.error('Error updating vendor status:', error);
    throw error;
  }
};

// Message functions
export const sendMessage = async (messageData) => {
  try {
    const docRef = await addDoc(collection(db, 'messages'), {
      ...messageData,
      read: false,
      createdAt: new Date()
    });
    console.log('Message sent with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const deleteMessage = async (messageId) => {
  try {
    await deleteDoc(doc(db, 'messages', messageId));
    console.log('Message deleted successfully');
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

// Base64 image upload function (replaces Firebase Storage)

export const uploadBase64Image = async (file) => {
  try {
    // Optimize before converting to base64
    const optimizedFile = await optimizeImage(file);
    
    const base64String = await fileToBase64(optimizedFile);
    console.log('Image optimized and converted to base64');
    return base64String;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};

// Real-time listeners
export const listenToCollection = (collectionName, callback, queryConstraints = []) => {
  try {
    const q = query(collection(db, collectionName), ...queryConstraints);
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(docs);
    });
  } catch (error) {
    console.error('Error setting up listener:', error);
    throw error;
  }
};

export { onAuthStateChanged };

// Check if user is a vendor by email
export const getUserByEmail = async (email) => {
  try {
    console.log('Checking user by email:', email);
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
      console.log('Found user:', userData);
      return userData;
    }
    console.log('No user found with email:', email);
    return null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

// Function to check vendor collection integrity
export const debugVendorCollection = async () => {
  try {
    console.log('=== DEBUGGING VENDOR COLLECTION ===');
    const querySnapshot = await getDocs(collection(db, 'vendors'));
    console.log('Total documents in vendors collection:', querySnapshot.size);
    
    querySnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Document ${index + 1}:`, {
        id: doc.id,
        email: data.email,
        businessName: data.businessName,
        verified: data.verified,
        createdAt: data.createdAt,
        hasAllFields: !!(data.email && data.businessName)
      });
    });
    console.log('=== END DEBUG ===');
    
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error debugging vendor collection:', error);
    return [];
  }
};


// Visitor counter functions
export const incrementVisitorCount = async () => {
  const countRef = doc(db, 'visitorCounts', 'totalVisitors'); // Moved outside try block
  try {
    await updateDoc(countRef, {
      count: increment(1),
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error incrementing count:', error);
    // Create document if it doesn't exist
    if (error.code === 'not-found' || error.code === 'permission-denied') {
      await setDoc(countRef, {
        count: 1,
        lastUpdated: serverTimestamp()
      });
    }
  }
};
export const getVisitorCount = async () => {
  try {
    const countRef = doc(db, 'visitorCounts', 'totalVisitors');
    const docSnap = await getDoc(countRef);
    
    if (!docSnap.exists()) {
      // Initialize if document doesn't exist
      await setDoc(countRef, {
        count: 0,
        lastUpdated: serverTimestamp()
      });
      return 0;
    }
    
    return docSnap.data().count || 0;
  } catch (error) {
    console.error('Error getting visitor count:', error);
    return 0; // Fallback value
  }
};
export const updateVendorLikes = async (vendorId, userId, like) => {
  const vendorRef = doc(db, 'vendors', vendorId);
  
  try {
    if (like) {
      await updateDoc(vendorRef, {
        likes: increment(1),
        likedBy: arrayUnion(userId)
      });
    } else {
      await updateDoc(vendorRef, {
        likes: increment(-1),
        likedBy: arrayRemove(userId)
      });
    }
  } catch (error) {
    console.error('Error updating vendor likes:', error);
    throw error;
  }
};
export const onVendorUpdate = (vendorId, callback) => {
  const vendorRef = doc(db, 'vendors', vendorId);
  return onSnapshot(vendorRef, (doc) => {
    callback(doc.exists() ? doc.data() : null);
  });
};
const loadSlideshow = async () => {
  try {
    const docRef = doc(db, 'slideshow', 'settings');
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      // Initialize with default values if document doesn't exist
      await setDoc(docRef, {
        enabled: true,
        items: []
      });
      console.log("Created new slideshow document");
    }
    setSlideshow(docSnap.data() || { enabled: true, items: [] });
  } catch (error) {
    console.error('Error loading slideshow:', error);
    toast.error('Failed to load slideshow settings');
  }
};

