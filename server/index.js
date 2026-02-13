require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { scrapeWebsite } = require('./services/scraperService');
const { analyzeAndGenerateLeads } = require('./services/groqService');
const { searchForPerson } = require('./services/tavilyService');
const { findEmail, enrichEmail } = require('./services/findymailService');
const { createSheet, appendRows } = require('./services/sheetService');

const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static files from the client/dist directory
app.use(express.static(path.join(__dirname, '../client/dist')));

// API Routes
app.get('/api/health', (req, res) => {
    res.send('Lead Magnet API is running');
});

/**
 * POST /api/generate-leads
 * Body: { companyName, companyUrl }
 */
app.post('/api/generate-leads', async (req, res) => {
    const { companyName, companyUrl } = req.body;
    if (!companyUrl) return res.status(400).json({ error: 'Company URL is required' });

    try {
        // 1. Scrape
        console.log(`Scraping ${companyUrl}...`);
        const scrapedData = await scrapeWebsite(companyUrl);

        // 2. Analyze & Generate Leads (Groq)
        console.log('Analyzing content and generating leads...');
        const analysisResult = await analyzeAndGenerateLeads(scrapedData);

        const companiesToProcess = (analysisResult.leads || []).slice(0, 2);

        // Process all companies in parallel
        const enrichedCompanies = await Promise.all(companiesToProcess.map(async (company) => {
            console.log(`Processing company: ${company.companyName}`);

            // For each company, search up to 2 roles in parallel
            const rolesToSearch = (company.targetRoles || []).slice(0, 2);

            const decisionMakers = await Promise.all(rolesToSearch.map(async (role) => {
                console.log(`Searching for ${role} at ${company.companyName}...`);
                const person = await searchForPerson(role, company.companyName);

                if (person) {
                    // Try to find email
                    let emailData = { email: null, status: 'skipped' };
                    if (company.companyDomain) {
                        emailData = await findEmail(person.name, company.companyDomain);
                    }

                    // Try to enrich title
                    let finalTitle = person.title;
                    if (emailData.email) {
                        const enrichment = await enrichEmail(emailData.email);
                        if (enrichment.title) finalTitle = enrichment.title;
                    }

                    return {
                        name: person.name,
                        title: finalTitle,
                        linkedin: person.linkedin,
                        email: emailData.email || 'Not Found',
                        emailStatus: emailData.status,
                        company: company.companyName,
                        domain: company.companyDomain
                    };
                }
                return null;
            }));

            // Filter out nulls (failed searches)
            const validDecisionMakers = decisionMakers.filter(dm => dm !== null);

            return {
                ...company,
                decisionMakers: validDecisionMakers
            };
        }));

        // Flatten all decision makers into a single list for the main results
        const allLeads = enrichedCompanies.flatMap(group => group.decisionMakers);

        res.json({
            companyAnalysis: analysisResult.companyAnalysis,
            leads: allLeads,
            groupedLeads: enrichedCompanies
        });

    } catch (error) {
        console.error('Error in generate-leads:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/export-sheet
 * Body: { accessToken, companyName, leads }
 */
app.post('/api/export-sheet', async (req, res) => {
    const { accessToken, companyName, leads } = req.body;
    if (!accessToken || !leads) return res.status(400).json({ error: 'Missing token or leads' });

    try {
        const sheetTitle = `Lead List for ${companyName}`;
        const { spreadsheetId, url } = await createSheet(accessToken, sheetTitle);

        // Prepare rows
        const header = ['Name', 'Job Title', 'LinkedIn', 'Email', 'Company', 'Domain'];
        const rows = [header];

        leads.forEach(lead => {
            rows.push([
                lead.name,
                lead.title,
                lead.linkedin,
                lead.email,
                lead.company,
                lead.domain
            ]);
        });

        await appendRows(accessToken, spreadsheetId, rows);

        res.json({ success: true, url });
    } catch (error) {
        console.error('Error exporting sheet:', error);
        res.status(500).json({ error: error.message });
    }
});

// Catch-all handler for any request that doesn't match an API route
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
