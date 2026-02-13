const axios = require('axios');
require('dotenv').config();

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const TAVILY_API_URL = 'https://api.tavily.com/search';

async function debugSearch() {
    const role = "Vice President of Sales";
    const company = "HubSpot";

    console.log(`DEBUG: Searching for '${role}' at '${company}'...`);

    // 1. Run the Search
    const query = `site:linkedin.com/in/ "${role}" "${company}"`;
    try {
        const response = await axios.post(TAVILY_API_URL, {
            api_key: TAVILY_API_KEY,
            query: query,
            search_depth: "basic",
            include_domains: ["linkedin.com"],
            max_results: 5,
            include_answer: true // Let's see if the main search answer helps
        });

        console.log("\n--- SEARCH RESULTS ---");
        if (response.data.results) {
            response.data.results.forEach((r, i) => {
                console.log(`[${i}] Title: ${r.title}`);
                console.log(`    URL: ${r.url}`);
                console.log(`    Snippet: ${r.content}\n`);
            });
        }

        // 2. Pick the first result and run Verification
        if (response.data.results && response.data.results.length > 0) {
            const first = response.data.results[0];
            console.log(`\n--- VERIFYING FIRST RESULT: ${first.title} ---`);

            // Extract Name (mock logic)
            let name = "Katie Carter"; // Hardcoded for this debug based on user report

            const verifyQuery = `Extract the exact current job title of ${name} at ${company} from their LinkedIn profile: ${first.url}. Return ONLY the 2-3 word job title.`;

            const verifyRes = await axios.post(TAVILY_API_URL, {
                api_key: TAVILY_API_KEY,
                query: verifyQuery,
                search_depth: "basic",
                include_domains: ["linkedin.com"],
                include_answer: true,
                max_results: 3
            });

            console.log(`\n[Q&A Query]: ${verifyQuery}`);
            console.log(`[Q&A Answer]: ${verifyRes.data.answer}`);
        }

    } catch (e) {
        console.error(e);
    }
}

debugSearch();
