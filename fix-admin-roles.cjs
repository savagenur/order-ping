const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function fixAdminRoles() {
  try {
    // List all users to find the ones that should be admins
    const listUsers = await admin.auth().listUsers();
    console.log('📋 Checking all users...\n');
    
    const adminEmails = [
      'savagenurkg@gmail.com', // superadmin
      'burgerking@mail.com',   // admin
      // Add any other emails that should be admin
    ];
    
    for (const user of listUsers.users) {
      if (adminEmails.includes(user.email)) {
        const currentRole = user.customClaims?.role;
        console.log(`👤 User: ${user.email}`);
        console.log(`   Current role: ${currentRole || 'none'}`);
        
        // Update superadmin
        if (user.email === 'savagenurkg@gmail.com' && currentRole !== 'superadmin') {
          await admin.auth().setCustomUserClaims(user.uid, {
            role: 'superadmin'
          });
          console.log(`   ✅ Updated to: superadmin`);
        }
        // Update other admins if needed
        else if (user.email !== 'savagenurkg@gmail.com' && currentRole !== 'admin') {
          await admin.auth().setCustomUserClaims(user.uid, {
            role: 'admin',
            cartId: user.customClaims?.cartId,
            cartName: user.customClaims?.cartName
          });
          console.log(`   ✅ Updated to: admin`);
        } else {
          console.log(`   ✅ Already has correct role`);
        }
        console.log('');
      }
    }
    
    console.log('🎉 Role updates completed!');
    console.log('⚠️  Please wait 1-2 minutes for changes to propagate, then try logging in again.');
    
  } catch (error) {
    console.error('❌ Error updating roles:', error.message);
  }
  
  process.exit(0);
}

fixAdminRoles();
