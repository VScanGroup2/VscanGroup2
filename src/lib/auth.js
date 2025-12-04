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
 * Sign in with restricted access - only vscangroup@gmail.com with @dmin1234 allowed
 * @param {string} email
 * @param {string} password
 * @returns {Promise<user>}
 */
export const signIn = async (email, password) => {
  // Check if credentials match the allowed user
  if (email !== 'vscangroup@gmail.com' || password !== '@dmin1234') {
    throw new Error('Access denied. Invalid credentials.');
  }

  try {
    // First try to sign in
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    // If user doesn't exist, create the account
    if (error.code === 'auth/user-not-found') {
      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return result.user;
      } catch (createError) {
        throw new Error(createError.message);
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

export default auth;
