const { google } = require('googleapis');

/**
 * Creates a new Google Sheet.
 * @param {string} accessToken - User's OAuth access token.
 * @param {string} title - Title of the new sheet.
 * @returns {Promise<{spreadsheetId: string, url: string}>}
 */
async function createSheet(accessToken, title) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: 'v4', auth });

    try {
        const response = await sheets.spreadsheets.create({
            resource: {
                properties: {
                    title: title,
                },
            },
        });

        return {
            spreadsheetId: response.data.spreadsheetId,
            url: response.data.spreadsheetUrl,
        };
    } catch (error) {
        console.error('Error creating sheet:', error);
        throw new Error('Failed to create Google Sheet');
    }
}

/**
 * Appends data to a Google Sheet.
 * @param {string} accessToken - User's OAuth access token.
 * @param {string} spreadsheetId - ID of the sheet.
 * @param {Array<Array<string>>} values - 2D array of values to append.
 */
async function appendRows(accessToken, spreadsheetId, values) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: 'v4', auth });

    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Sheet1!A1',
            valueInputOption: 'RAW',
            resource: {
                values: values,
            },
        });
    } catch (error) {
        console.error('Error appending rows:', error);
        throw new Error('Failed to append rows to Google Sheet');
    }
}

module.exports = { createSheet, appendRows };
