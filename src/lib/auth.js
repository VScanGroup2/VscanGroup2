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
    'security@hospital.com': { password: 'security123', role: 'security' }
  };

  // Check if credentials match an allowed user
  const userConfig = allowedUsers[email];
  if (!userConfig || userConfig.password !== password) {
    throw new Error('Access denied. Invalid credentials.');
  }

  try {
    // First try to sign in
    const result = await signInWithEmailAndPassword(auth, email, password);
    // Store role in localStorage
    localStorage.setItem('userRole', userConfig.role);
    // Attach role to user object
    result.user.role = userConfig.role;
    return result.user;
  } catch (error) {
    // If user doesn't exist, create the account
    // Firebase returns 'auth/user-not-found' or 'auth/invalid-credential' when account doesn't exist
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      try {
        console.log('Creating new account for:', email);
        const result = await createUserWithEmailAndPassword(auth, email, password);
        // Store role in localStorage
        localStorage.setItem('userRole', userConfig.role);
        result.user.role = userConfig.role;
        console.log('Account created successfully for:', email);
        return result.user;
      } catch (createError) {
        console.error('Error creating account:', createError);
        throw new Error('Error creating account: ' + createError.message);
      }
    }
    throw new Error(error.message);
  }
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
  return onAuthStateChanged(auth, callback);
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
