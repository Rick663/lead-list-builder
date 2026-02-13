const { verifyRole } = require('./services/tavilyService');

async function testVerification() {
    console.log("Testing Role Verification (Prompt Refined)...");

    // Katie Carter URL might be stale or private, limiting access.
    // Dharmesh Shah is a public figure, good for testing.
    // Brent Hayward is also good.
    const cases = [
        { name: "Dharmesh Shah", url: "https://www.linkedin.com/in/dharmesh", company: "HubSpot" },
        { name: "Brent Hayward", url: "https://www.linkedin.com/in/brenthayward", company: "Salesforce" }
    ];

    for (const c of cases) {
        console.log(`\nVerifying ${c.name}...`);
        const answer = await verifyRole(c.name, c.url, c.company);
        console.log(`Result: ${answer}`);
    }
}

testVerification();
