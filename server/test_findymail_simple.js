const { findEmail } = require('./services/findymailService');

async function testFindymail() {
    console.log("Testing Findymail API...");

    const name = "Dharmesh Shah";
    const domain = "hubspot.com";

    console.log(`Searching for ${name} at ${domain}...`);
    const result = await findEmail(name, domain);

    console.log("Result:", JSON.stringify(result, null, 2));

    if (result.error && result.error.includes('402')) {
        console.log("\n❌ DIAGNOSIS: API Key is valid but Billing is overdue/empty (402 Payment Required).");
    } else if (result.email) {
        console.log("\n✅ DIAGNOSIS: API is working correctly.");
    } else {
        console.log("\n⚠️ DIAGNOSIS: API works but email not found or other error.");
    }
}

testFindymail();
