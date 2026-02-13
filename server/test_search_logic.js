const { searchForPerson } = require('./services/tavilyService');

async function testSearchLogic() {
    console.log("Testing Search Logic...");

    // Scenario: Searching for a VP of Sales at HubSpot, but finding a Marketing Manager.
    // If we mock the search result to be "Katie Carter - Marketing Manager - HubSpot", what do we get?

    // Since I can't easily mock the internal axios call without a library or extensive refactor, 
    // I will run a REAL search for a known mismatch to see the log output.

    // Katie Carter is likely NOT VP of Sales. Let's see what Tavily returns and what we output.
    const role = "Vice President of Sales";
    const company = "HubSpot";

    console.log(`\nSearching for '${role}' at '${company}'...`);
    const result = await searchForPerson(role, company);

    console.log("\n--- RESULT ---");
    console.log(JSON.stringify(result, null, 2));

    if (result && result.title === role) {
        console.log("\n[FAIL] Result title matches requested role exactly. Likely fallback behavior.");
    } else {
        console.log("\n[SUCCESS] Result title is different (hopefully accurate).");
    }
}

testSearchLogic();
