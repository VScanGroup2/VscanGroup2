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
 * Sign in an existing user
 * @param {string} email
 * @param {string} password
 * @returns {Promise<user>}
 */
export const signIn = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
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

export default auth;
