/**
 * Setup Accounts - Initialize Firebase Authentication accounts
 * 
 * This file contains helper functions to create the required user accounts in Firebase.
 * Run this setup when you first deploy the application or need to reset user accounts.
 */

import { initializeAdmin, initializeSecurityPersonnel } from './auth';

/**
 * Initialize all required accounts
 * This creates both Admin and Security Personnel accounts in Firebase
 */
export const initializeAllAccounts = async () => {
  console.log('Starting Firebase account initialization...');
  
  try {
    // Initialize Admin account
    console.log('Creating Admin account...');
    const adminResult = await initializeAdmin();
    if (adminResult) {
      console.log('✓ Admin account created: vscangroup@gmail.com');
    } else {
      console.log('✓ Admin account already exists: vscangroup@gmail.com');
    }
    
    // Initialize Security Personnel account
    console.log('Creating Security Personnel account...');
    const securityResult = await initializeSecurityPersonnel();
    if (securityResult) {
      console.log('✓ Security Personnel account created: security@hospital.com');
    } else {
      console.log('✓ Security Personnel account already exists: security@hospital.com');
    }
    
    console.log('✓ All accounts initialized successfully!');
    
    return {
      admin: {
        email: 'vscangroup@gmail.com',
        password: '@dmin1234',
        role: 'admin'
      },
      security: {
        email: 'security@hospital.com',
        password: 'security123',
        role: 'security'
      }
    };
  } catch (error) {
    console.error('Error initializing accounts:', error);
    throw error;
  }
};

/**
 * Account Credentials Reference
 * 
 * ADMINISTRATOR
 * Email: vscangroup@gmail.com
 * Password: @dmin1234
 * Role: admin
 * Access: Full admin dashboard with registration, monitoring, reporting, and security monitoring
 * 
 * SECURITY PERSONNEL
 * Email: security@hospital.com
 * Password: security123
 * Role: security
 * Access: Security monitor dashboard for QR code scanning and visitor check-out
 */

export default initializeAllAccounts;
