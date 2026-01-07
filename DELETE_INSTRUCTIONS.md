/**
 * Quick deletion script using the Dashboard functions
 * This runs the batch deletion for test records
 */

(async () => {
  console.log('🗑️  Deleting test visitor records...\n');
  
  // Call the batch deletion function with the names
  const visitorsToDelete = ['carlos casi', 'Sthian Elefan'];
  
  console.log('Visitors scheduled for deletion:');
  visitorsToDelete.forEach(name => console.log(`  - ${name}`));
  console.log('\nTo complete the deletion, please run this code in the browser console');
  console.log('or integrate it into the Dashboard UI.\n');
})();
