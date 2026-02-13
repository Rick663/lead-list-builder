const { enrichEmail } = require('./services/findymailService');

async function testEnrichment() {
    console.log("Testing Findymail Enrichment...");

    // Test case 1: Null email
    console.log("\n1. Testing null email:");
    const result1 = await enrichEmail(null);
    console.log("Result:", result1);

    // Test case 2: Real email (using a dummy one that might exist or just to trigger API)
    // Note: If API key is invalid (402), this should catch error.
    const testEmail = "dharmesh@hubspot.com";
    console.log(`\n2. Testing email: ${testEmail}`);
    const result2 = await enrichEmail(testEmail);
    console.log("Result:", result2);
}

testEnrichment();
