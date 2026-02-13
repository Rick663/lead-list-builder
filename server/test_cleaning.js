const { extractJobTitle } = require('./services/groqService');

async function testCleaning() {
    console.log("Testing Title Cleaning Logic...");

    const inputs = [
        "Founder and CTO. Helping",
        "Marketing Manager",
        "Co-Founder & CTO",
        "Director, Demand Generation at Marketo",
        "Senior Manager | Growth | B2B", // Target: "Senior Growth Manager"
        "VP - Sales", // Target: "VP of Sales"
        "Head of Product",
        "Strategic Account Executive | Enterprise" // Target: "Strategic Enterprise Account Executive" or keep full?
    ];

    console.log("\n--- Current AI Extraction (Simulation) ---");
    // Currently `extractJobTitle` is designed to extract FROM a sentence, but let's see how it handles these "dirty" titles if passed as "answer".

    for (const input of inputs) {
        // We'll mimic the service logic:
        // If regex matches, we currently just return it.
        // If we force it through an LLM cleaner, what do we get?

        // I'll create a new "normalize" function concept here to test.
        // But for now let's just see if `extractJobTitle` can handle it if we treat the input as the "text to extract from".
        const cleaned = await extractJobTitle(`The job title is ${input}`);
        console.log(`Input: "${input}" \n -> Output: "${cleaned}"`);
    }
}

testCleaning();
