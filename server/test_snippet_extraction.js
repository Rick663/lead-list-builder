const { extractJobTitle } = require('./services/groqService');

async function testSnippetExtraction() {
    console.log("Testing AI Extraction on Full Search Snippets...");

    const snippets = [
        "Katie Carter - Vice President of Sales at HubSpot | LinkedIn",
        "Parker Harris - Co-Founder and CTO - Salesforce",
        "Angela Kressler (Leffler) - Director, Demand Generation - Marketo",
        "Jason Yee - Senior Data Scientist - Marketo | LinkedIn",
        "Brendan Gilhuly - Vice President of Sales @ Webomates | Hubspot Certified"
    ];

    for (const snippet of snippets) {
        console.log(`\nInput Snippet: "${snippet}"`);
        const title = await extractJobTitle(snippet);
        console.log(`-> Extracted: "${title}"`);
    }
}

testSnippetExtraction();
