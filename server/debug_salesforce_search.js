const { searchForPerson } = require('./services/tavilyService');

async function debugSalesforce() {
    console.log("DEBUG: Investigating Salesforce Leads with Real Service...");

    // We expect "Muhammad Adil" to be rejected and "Parker Harris" (or similar) to be found.
    const leadsToFind = [
        { role: "Chief Technology Officer", company: "Salesforce" },
        { role: "Co-CEO", company: "Salesforce" }
    ];

    for (const lead of leadsToFind) {
        const { role, company } = lead;
        console.log(`\n\n--- Searching for '${role}' at '${company}' ---`);
        const result = await searchForPerson(role, company);
        console.log("RESULT:", JSON.stringify(result, null, 2));

        if (result && result.title) {
            console.log("✅ FOUND: " + result.name + " - " + result.title);
        } else {
            console.log("❌ NOT FOUND");
        }
    }
}

debugSalesforce();
