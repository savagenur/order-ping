const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Define all your carts
const carts = [
  {
    email: 'worker-downtown@yourbusiness.com',
    cartId: 'downtown-tacos',
    cartName: 'Downtown Tacos'
  },
  {
    email: 'worker-westside@yourbusiness.com',
    cartId: 'west-side-burgers',
    cartName: 'West Side Burgers'
  },
  {
    email: 'worker-coffee@yourbusiness.com',
    cartId: 'portland-coffee',
    cartName: 'Portland Coffee Cart'
  }
];

async function setupAllCarts() {
  for (const cart of carts) {
    try {
      const user = await admin.auth().getUserByEmail(cart.email);
      await admin.auth().setCustomUserClaims(user.uid, {
        cartId: cart.cartId,
        cartName: cart.cartName
      });
      console.log(`✓ ${cart.cartName} configured for ${cart.email}`);
    } catch (error) {
      console.error(`✗ Error with ${cart.email}:`, error.message);
    }
  }
}

setupAllCarts().then(() => {
  console.log('\nDone! Workers should logout and login again.');
  process.exit(0);
});