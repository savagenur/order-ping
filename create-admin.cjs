const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function createAdmin() {
  const email = 'admin@orderpingx.com'; // Change this if needed
  const password = 'Admin123!'; // Change this if needed
  
  try {
    // Check if admin already exists
    try {
      const existingUser = await admin.auth().getUserByEmail(email);
      console.log('✅ Admin account already exists:', existingUser.email);
      console.log('Custom claims:', existingUser.customClaims);
      return;
    } catch (error) {
      // User doesn't exist, continue with creation
    }

    // Create user
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: true,
    });

    // Set admin custom claim
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'admin'
    });

    console.log('✅ Admin account created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('UID:', userRecord.uid);
    console.log('\n⚠️  Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

async function listAllUsers() {
  try {
    const listUsers = await admin.auth().listUsers();
    console.log('📋 All users in the system:');
    listUsers.users.forEach(user => {
      console.log(`- ${user.email} (Role: ${user.customClaims?.role || 'none'})`);
    });
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
  }
}

async function main() {
  console.log('🔍 Checking existing users...\n');
  await listAllUsers();
  console.log('\n👤 Creating admin account...\n');
  await createAdmin();
}

main();
