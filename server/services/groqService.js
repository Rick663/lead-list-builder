const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Analyzes company content and generates leads.
 * @param {object} scrapedData - { title, description, content }
 * @returns {Promise<object>} - JSON with analysis and leads.
 */
async function analyzeAndGenerateLeads(scrapedData) {
  const { title, description, content } = scrapedData;

  // Truncate content to fit context window if necessary (approx 15k chars is safe for most)
  const truncatedContent = content.slice(0, 15000);

  const prompt = `
    You are a B2B Lead Generation Expert.
    
    Task:
    1. Analyze the following company website content.
    2. Identify their Ideal Customer Profile (ICP).
    3. Generate a list of 10 target companies that fit this ICP.
    // 4. For each target company, recommend 3 specific job titles to target (e.g., "VP of Sales", "CTO").
    
    Company Context:
    Title: ${title}
    Description: ${description}
    Body: ${truncatedContent}
    
    Output Format: JSON only.
    Structure:
    {
      "companyAnalysis": {
        "summary": "...",
        "icp": "..."
      },
      "leads": [
        {
          "companyName": "...",
          "companyDomain": "...",
          "targetRoles": ["Role 1", "Role 2", "Role 3"]
        }
      ]
    }
    
    Constraints:
    - Focus on decision makers with high buying power (CEO, CTO, VP, Director).
  `;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a B2B Sales Expert and Lead Generation Specialist.' },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return result;

  } catch (error) {
    console.error('Error calling Groq API:', error);
    throw new Error('Failed to analyze and generate leads');
  }
}


/**
 * Extracts a specific job title from a text using LLM.
 * @param {string} text - The input text (e.g., "Brent is the CEO of Salesforce").
 * @returns {Promise<string|null>} - The extracted title or null.
 */
/**
 * Extracts a specific job title from a text using LLM, validating it against the target company.
 * @param {string} text - The input text (e.g., "Brent is the CEO of Salesforce").
 * @param {string} targetCompany - The company we are looking for (e.g., "Salesforce").
 * @returns {Promise<string|null>} - The extracted title if it matches the company/context, or null.
 */
async function extractRoleAndCompany(text, targetCompany) {
  if (!text) return null;

  try {
    const prompt = `
      Analyze the text to extract the job title for a person specifically at "${targetCompany}".
      Text: "${text}"
      
      Rules:
      1. Extract the Job Title ONLY if the text implies the person holds this role at "${targetCompany}" (or is a Co-Founder/Board Member etc).
      2. If the text explicitly stating they are at a DIFFERENT company (e.g., "CTO at Fortex Solutions"), return null.
      3. If the text is generic (e.g. "Member"), return null.
      4. If the text contains "Former" or "Ex-" related to ${targetCompany}, return null (we want current roles).
      5. Standardize the title (e.g. "Senior Manager | Growth" -> "Senior Growth Manager").
      6. Remove headline fluff.

      Return JSON: { "title": "The Clean Title" }
      If no valid title for ${targetCompany} is found, return { "title": null }
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: `You are a precise data extraction assistant. You validate roles for ${targetCompany}.` },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return result.title;

  } catch (error) {
    console.error('Error calling Groq for title extraction:', error);
    return null;
  }
}

module.exports = { analyzeAndGenerateLeads, extractJobTitle: extractRoleAndCompany };
