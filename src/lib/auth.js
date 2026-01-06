import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

/**
 * Sign up a new user
 * @param {string} email
 * @param {string} password
 * @returns {Promise<user>}
 */
export const signUp = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Sign in with role-based access
 * @param {string} email
 * @param {string} password
 * @returns {Promise<user with role>}
 */
export const signIn = async (email, password) => {
  // Define allowed users with roles
  const allowedUsers = {
    'vscangroup@gmail.com': { password: '@dmin1234', role: 'admin' },
    'security@hospital.com': { password: 'Secure@123', role: 'security' }
  };

  // Normalize email (lowercase)
  const normalizedEmail = email.toLowerCase().trim();

  // Check if credentials match an allowed user
  const userConfig = allowedUsers[normalizedEmail];
  if (!userConfig) {
    console.log('Email not found. Allowed emails:', Object.keys(allowedUsers));
    throw new Error('Access denied. Invalid credentials.');
  }

  if (userConfig.password !== password) {
    console.log('Password mismatch for', normalizedEmail);
    console.log('Expected password:', userConfig.password);
    console.log('Received password:', password);
    throw new Error('Access denied. Invalid credentials.');
  }

  // Create a local user object for authentication
  const mockUser = {
    uid: Math.random().toString(36).substr(2, 9),
    email: normalizedEmail,
    role: userConfig.role
  };
  
  // Store role in localStorage
  localStorage.setItem('userRole', userConfig.role);
  console.log('User authenticated locally as:', userConfig.role);
  
  return mockUser;
};

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    localStorage.removeItem('userRole');
    await signOut(auth);
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Subscribe to auth state changes
 * @param {function} callback - called with user object or null
 * @returns {function} unsubscribe function
 */
export const subscribeToAuthState = (callback) => {
  // Create a listener that checks localStorage for role changes
  const checkAuth = () => {
    const userRole = localStorage.getItem('userRole');
    if (userRole) {
      // User is locally authenticated, create mock user object
      const mockUser = {
        uid: 'local-user',
        email: userRole === 'admin' ? 'vscangroup@gmail.com' : 'security@hospital.com',
        role: userRole
      };
      callback(mockUser);
      return true;
    }
    return false;
  };

  // Check immediately
  if (checkAuth()) {
    // Poll localStorage for changes
    const interval = setInterval(() => {
      const userRole = localStorage.getItem('userRole');
      if (!userRole) {
        // User logged out
        clearInterval(interval);
        callback(null);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }

  // Otherwise use Firebase auth state
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      // Get role from localStorage
      const role = localStorage.getItem('userRole');
      user.role = role;
    }
    callback(user);
  });

  return unsubscribe;
};

/**
 * Get current user
 * @returns {user|null}
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Sign up a new user and save to Firebase Auth
 * @param {string} email
 * @param {string} password
 * @returns {Promise<user>}
 */
export const signUpAndSave = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // User is automatically saved in Firebase Auth
    return result.user;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Initialize security personnel account
 * Creates the security personnel account in Firebase Auth if it doesn't exist
 * Email: security@hospital.com
 * Password: security123
 * @returns {Promise<void>}
 */
export const initializeSecurityPersonnel = async () => {
  try {
    const securityEmail = 'security@hospital.com';
    const securityPassword = 'security123';
    
    // Try to create the security personnel account
    const result = await createUserWithEmailAndPassword(auth, securityEmail, securityPassword);
    console.log('Security personnel account created successfully:', result.user.email);
    return result.user;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Security personnel account already exists');
      return null;
    }
    throw new Error('Error creating security personnel account: ' + error.message);
  }
};

/**
 * Initialize admin account
 * Creates the admin account in Firebase Auth if it doesn't exist
 * Email: vscangroup@gmail.com
 * Password: @dmin1234
 * @returns {Promise<void>}
 */
export const initializeAdmin = async () => {
  try {
    const adminEmail = 'vscangroup@gmail.com';
    const adminPassword = '@dmin1234';
    
    // Try to create the admin account
    const result = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log('Admin account created successfully:', result.user.email);
    return result.user;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Admin account already exists');
      return null;
    }
    throw new Error('Error creating admin account: ' + error.message);
  }
};

export default auth;
