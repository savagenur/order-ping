const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function setUserCart(email, cartId, cartName) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    
    await admin.auth().setCustomUserClaims(user.uid, {
      cartId: cartId,
      cartName: cartName
    });
    
    console.log(`✓ Set cart for ${email}:`);
    console.log(`  Cart ID: ${cartId}`);
    console.log(`  Cart Name: ${cartName}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example usage:
setUserCart('nurba.kg2043@gmail.com', 'taco-bell', 'TacoBell')
  .then(() => process.exit(0));