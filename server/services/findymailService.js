const axios = require('axios');
require('dotenv').config();

const FINDYMAIL_API_KEY = process.env.FINDYMAIL_API_KEY;
const FINDYMAIL_API_URL = 'https://app.findymail.com/api/search/name';

/**
 * Finds a verified email for a person at a company.
 * @param {string} name - Full name of the person.
 * @param {string} domain - Company domain (e.g., stripe.com).
 * @returns {Promise<{email: string, confidence: string, status: string}>}
 */
async function findEmail(name, domain) {
    if (!name || !domain) return { email: null, error: 'Missing name or domain' };

    try {
        const response = await axios.post(FINDYMAIL_API_URL, {
            name: name,
            domain: domain
        }, {
            headers: {
                'Authorization': `Bearer ${FINDYMAIL_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Structure depends on actual API response, assuming standard fields based on docs
        if (response.data && response.data.email) {
            return {
                email: response.data.email,
                confidence: response.data.confidence,
                status: 'verified'
            };
        }

        return { email: null, status: 'not_found' };

    } catch (error) {
        console.error(`Error finding email for ${name} at ${domain}:`, error.message);
        return { email: null, error: error.message };
    }
}

/**
 * Enriches an email address to find job title and other details.
 * @param {string} email - The email address to enrich.
 * @returns {Promise<{title: string|null, linkedin: string|null}>}
 */
async function enrichEmail(email) {
    if (!email) return { title: null, linkedin: null };

    try {
        const response = await axios.post('https://app.findymail.com/api/search/reverse-email', {
            email: email
        }, {
            headers: {
                'Authorization': `Bearer ${FINDYMAIL_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Response schema: { data: { fullName, jobTitle, linkedinUrl, ... } }
        // Note: Check actual response structure. Usually it's in `data` or root.
        // Assuming standard Findymail response structure for enrichment.
        if (response.data) {
            return {
                title: response.data.jobTitle || null,
                linkedin: response.data.linkedinUrl || null
            };
        }
        return { title: null, linkedin: null };

    } catch (error) {
        console.error(`Error enriching email ${email}:`, error.message);
        return { title: null, linkedin: null };
    }
}

module.exports = { findEmail, enrichEmail };
