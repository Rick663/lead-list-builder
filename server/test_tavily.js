const { searchForPerson } = require('./services/tavilyService');
require('dotenv').config();

async function test() {
    console.log('Testing Tavily Search...');

    // Test case 1: Known person
    const result1 = await searchForPerson('CEO', 'Stripe');
    console.log('Result 1 (CEO Stripe):', JSON.stringify(result1, null, 2));

    // Test case 2: Another role
    const result2 = await searchForPerson('VP of Engineering', 'Vercel');
    console.log('Result 2 (VP Eng Vercel):', JSON.stringify(result2, null, 2));
}

test();
