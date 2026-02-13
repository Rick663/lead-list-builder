const { findEmail } = require('./services/findymailService');
require('dotenv').config();

async function test() {
    console.log('Testing Findymail API...');
    const result = await findEmail('Patrick Collison', 'stripe.com');
    console.log('Result:', JSON.stringify(result, null, 2));
}

test();
