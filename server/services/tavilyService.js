const axios = require('axios');
const { extractJobTitle } = require('./groqService');
require('dotenv').config();

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const TAVILY_API_URL = 'https://api.tavily.com/search';

// Helper to validate LinkedIn Profile URL
function isProfileUrl(url) {
    return url && url.includes('linkedin.com/in/');
}

/**
 * Helper to process a list of search results and find a valid match.
 * @param {Array} results - Tavily search results.
 * @param {string} company - Target company.
 * @returns {Promise<object|null>} - { name, title, linkedin, source } or null.
 */
async function processResults(results, company) {
    for (const result of results) {
        if (!isProfileUrl(result.url)) continue;

        let rawTitle = result.title;
        console.log(`Analyzing candidate: ${rawTitle}`);

        // VALIDATION: Use AI to check if this person is ACTUALLY at the target company
        const validatedTitle = await extractJobTitle(rawTitle, company);

        if (validatedTitle) {
            console.log(`✅ Valid match found: ${validatedTitle} at ${company}`);

            let name = 'Unknown';
            // Extract Name from Title
            let cleanRaw = rawTitle.replace(/ \| LinkedIn.*$/i, '').trim();
            const parts = cleanRaw.split(' - ');
            if (parts.length >= 2) {
                name = parts[0].trim();
            } else {
                const colonParts = cleanRaw.split(':');
                if (colonParts.length > 1) {
                    name = colonParts[0].trim();
                } else {
                    const urlNameMatch = result.url.match(/linkedin\.com\/in\/([^\/]+)/);
                    if (urlNameMatch) {
                        let urlName = urlNameMatch[1].split('-').filter(p => !p.match(/\d/)).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
                        if (urlName) name = urlName;
                    }
                }
            }

            // Clean Name
            name = name.replace(/ \| LinkedIn/g, '')
                .replace(/\b(?:on|at) LinkedIn\b/i, '')
                .replace(/\([^\)]+\)/g, '')
                .trim();

            // Sanity check name
            if (name.length > 40 || name.includes('...')) {
                const urlNameMatch = result.url.match(/linkedin\.com\/in\/([^\/]+)/);
                if (urlNameMatch) {
                    let urlName = urlNameMatch[1].split('-').filter(p => !p.match(/\d/)).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
                    if (urlName) name = urlName;
                }
            }

            // Secondary Verification (Q&A) - ONLY if title seems generic/ambiguous
            let finalTitle = validatedTitle;
            if (finalTitle.toLowerCase() === 'member' || finalTitle.length < 4) {
                console.log(`Title '${finalTitle}' is generic. attempting Q&A verification...`);
                const qaTitle = await verifyRole(name, result.url, company);
                if (qaTitle) finalTitle = qaTitle;
            }

            return {
                name: name,
                title: finalTitle,
                linkedin: result.url,
                source: 'tavily'
            };
        } else {
            console.log(`❌ Mismatch: "${rawTitle}" does not appear to be currently at ${company}. Skipping.`);
        }
    }
    return null;
}

/**
 * Searches for a person with a specific role at a company.
 * @param {string} role - Job title (e.g., "CTO", "VP of Sales").
 * @param {string} company - Company name (e.g., "Stripe").
 * @returns {Promise<object|null>} - { name, title, linkedin, source } or null.
 */
async function searchForPerson(role, company) {
    if (!TAVILY_API_KEY) {
        console.error('TAVILY_API_KEY is missing');
        return null;
    }

    // 1. Strict Search
    let query = `site:linkedin.com/in/ "${role}" "${company}"`;
    console.log(`Deep searching for: ${query}...`);

    try {
        let response = await axios.post(TAVILY_API_URL, {
            api_key: TAVILY_API_KEY,
            query: query,
            search_depth: "basic",
            include_domains: ["linkedin.com"],
            max_results: 5
        });

        if (response.data.results) {
            const strictMatch = await processResults(response.data.results, company);
            if (strictMatch) return strictMatch;
        }

        // 2. Fallback: Broader Search
        console.log("Strict search failed to find a valid match. Trying broader query...");
        query = `${role} ${company} LinkedIn`;

        response = await axios.post(TAVILY_API_URL, {
            api_key: TAVILY_API_KEY,
            query: query,
            search_depth: "basic",
            include_domains: ["linkedin.com"],
            max_results: 5
        });

        if (response.data.results) {
            const broadMatch = await processResults(response.data.results, company);
            if (broadMatch) return broadMatch;
        }

        console.log(`No valid profiles found for ${role} at ${company} after checking all strict and broad results.`);
        return null;

    } catch (error) {
        console.error('Error searching with Tavily:', error.message);
        return null;
    }
}

/**
 * Verifies the person's role using Tavily's Q&A feature on their profile.
 * @param {string} name - Person's name.
 * @param {string} linkedinUrl - LinkedIn profile URL.
 * @param {string} company - Target company.
 * @returns {Promise<string|null>} - Verified job title or null.
 */
async function verifyRole(name, linkedinUrl, company) {
    if (!TAVILY_API_KEY) return null;

    const query = `Extract the exact current job title of ${name} at ${company} from their LinkedIn profile: ${linkedinUrl}. Return ONLY the 2-3 word job title.`;

    try {
        const response = await axios.post(TAVILY_API_URL, {
            api_key: TAVILY_API_KEY,
            query: query,
            search_depth: "basic",
            include_domains: ["linkedin.com"],
            include_answer: true,
            max_results: 3
        });

        if (response.data.answer) {
            let answer = response.data.answer;
            let textToAnalyze = answer;
            const quoteMatch = answer.match(/(["'“])([^"'”]+)\1/);
            if (quoteMatch) {
                textToAnalyze = quoteMatch[2];
            }

            // Call Groq to extract/clean canonical title AND validate company match
            const aiTitle = await extractJobTitle(textToAnalyze, company);
            if (aiTitle) {
                return aiTitle;
            }

            return answer;
        }
        return null;
    } catch (error) {
        console.error('Error verifying role:', error.message);
        return null;
    }
}

module.exports = { searchForPerson, verifyRole };
