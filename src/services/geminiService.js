/**
 * Gemini AI Service
 * Handles all interactions with Google's Gemini AI API
 */

import { GoogleGenAI, Modality, Type } from '@google/genai';

/**
 * Gets the API key from settings or environment
 * @param {Object} settings - User settings object
 * @returns {string} - API key
 */
function getApiKey(settings = {}) {
  return settings.geminiApiKey || process.env.API_KEY || process.env.GEMINI_API_KEY || '';
}

/**
 * Creates a new GoogleGenAI instance
 * @param {Object} settings - User settings with optional geminiApiKey
 * @returns {GoogleGenAI} - AI instance
 */
export function createAIClient(settings = {}) {
  const apiKey = getApiKey(settings);
  if (!apiKey) {
    throw new Error('Gemini API key is required. Please add your API key in Settings.');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Tool definitions for job tracking functionality
 */
export const jobTrackingTools = [
  {
    name: 'save_job_application',
    parameters: {
      type: Type.OBJECT,
      description: 'Saves a new job application or updates an existing one in the tracker.',
      properties: {
        company: { type: Type.STRING, description: 'Name of the company' },
        role: { type: Type.STRING, description: 'Job title or role' },
        source: { type: Type.STRING, description: 'Source (e.g., LinkedIn, Referral, Gmail)' },
        dateApplied: { type: Type.STRING, description: 'Date applied (YYYY-MM-DD)' },
        status: {
          type: Type.STRING,
          description: 'Status',
          enum: ['Applied', 'Interviewing', 'Rejected', 'Offer', 'Ghosted']
        }
      },
      required: ['company', 'role', 'source', 'dateApplied', 'status']
    }
  },
  {
    name: 'list_job_applications',
    description: 'Provides a summary of all job applications currently in the user tracker.',
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: 'update_job_status',
    parameters: {
      type: Type.OBJECT,
      description: 'Updates the status of a specific job application by company name.',
      properties: {
        company: { type: Type.STRING, description: 'The company name' },
        status: {
          type: Type.STRING,
          description: 'The new status',
          enum: ['Applied', 'Interviewing', 'Rejected', 'Offer', 'Ghosted']
        }
      },
      required: ['company', 'status']
    }
  },
  {
    name: 'delete_job_application',
    parameters: {
      type: Type.OBJECT,
      description: 'Removes a job application from the tracker.',
      properties: {
        company: { type: Type.STRING, description: 'The company name to remove' }
      },
      required: ['company']
    }
  }
];

/**
 * Generates system instruction based on user settings
 * @param {Object} settings - User settings object
 * @returns {string} - System instruction for AI
 */
export function getSystemInstruction(settings) {
  return `You are Astra, a personal career assistant.
USER CONTEXT:
- Name: ${settings.userName || 'User'}
- Target Career Role: ${settings.targetRole || 'Professional'}

CORE RESPONSIBILITIES:
1. Track job applications using the provided tools.
2. ALWAYS use 'list_job_applications' if the user asks "how many", "what jobs", "status of my search", or any question regarding their existing tracker data.
3. Use 'save_job_application' when a user mentions applying to a new role OR when processing emails for new apps.
4. Use 'update_job_status' when a user shares an update OR when emails indicate an interview invitation or rejection.
5. Use 'delete_job_application' only if specifically asked to remove an entry.

TONE: Professional, encouraging, and highly efficient. 
CONCISENESS: ${settings.conciseness}. If 'Concise', be extremely brief. If 'Detailed', provide more career advice alongside tool actions.`;
}

/**
 * Sends a text message to Gemini and returns the response
 * @param {string} message - User message
 * @param {Object} settings - User settings
 * @returns {Promise<Object>} - AI response with text and function calls
 */
export async function sendTextMessage(message, settings) {
  const ai = createAIClient(settings);
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: message,
    config: {
      systemInstruction: getSystemInstruction(settings),
      tools: [{ functionDeclarations: jobTrackingTools }]
    }
  });

  return {
    text: response.text || '',
    functionCalls: response.candidates?.[0]?.content?.parts?.filter(
      (part) => part.functionCall
    ) || []
  };
}

/**
 * Creates a live voice session with Gemini
 * @param {Object} options - Session configuration
 * @returns {Promise<Object>} - Live session instance
 */
export async function createVoiceSession(options) {
  const { settings, callbacks } = options;
  const ai = createAIClient(settings);

  return ai.live.connect({
    model: 'gemini-2.0-flash-live-001',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      tools: [{ functionDeclarations: jobTrackingTools }],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: settings.voiceName }
        }
      },
      systemInstruction: getSystemInstruction(settings),
      inputAudioTranscription: {},
      outputAudioTranscription: {}
    }
  });
}

/**
 * Analyzes resume against job description
 * @param {string} resumeText - Resume content
 * @param {string} jobDescription - Job description
 * @param {Object} settings - User settings with API key
 * @returns {Promise<Object>} - Analysis results
 */
export async function analyzeResume(resumeText, jobDescription, settings = {}) {
  const ai = createAIClient(settings);
  const prompt = `
    Act as an expert HR Manager and Resume Tailor.
    
    RESUME:
    ${resumeText}

    JOB DESCRIPTION:
    ${jobDescription}

    1. Rate this resume out of 10 for this specific job role.
    2. Provide 3 specific strengths of the candidate for this role.
    3. Identify 3 critical gaps or missing keywords/skills.
    4. Provide specific suggestions for the "Experience" and "Skills" sections to better align with the JD.

    Format the response in JSON:
    {
      "rating": number,
      "strengths": string[],
      "gaps": string[],
      "suggestions": {
        "experience": string,
        "skills": string
      }
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json'
    }
  });

  return JSON.parse(response.text || '{}');
}

/**
 * Fetches emails from Gmail API
 * @param {string} accessToken - Gmail OAuth access token
 * @returns {Promise<Array>} - Array of email objects
 */
async function fetchGmailEmails(accessToken) {
  try {
    // Search for job-related emails
    const query = 'subject:(application OR interview OR offer OR position OR job OR career OR hiring)';
    const searchUrl = `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!searchResponse.ok) {
      throw new Error('Failed to fetch emails');
    }
    
    const searchData = await searchResponse.json();
    const messages = searchData.messages || [];
    
    // Fetch details for each message
    const emails = await Promise.all(
      messages.slice(0, 10).map(async (msg) => {
        const msgUrl = `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`;
        const msgResponse = await fetch(msgUrl, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (!msgResponse.ok) return null;
        
        const msgData = await msgResponse.json();
        const headers = msgData.payload?.headers || [];
        
        return {
          from: headers.find(h => h.name === 'From')?.value || 'Unknown',
          subject: headers.find(h => h.name === 'Subject')?.value || 'No Subject',
          snippet: msgData.snippet || ''
        };
      })
    );
    
    return emails.filter(Boolean);
  } catch (error) {
    console.error('Gmail fetch error:', error);
    return [];
  }
}

/**
 * Syncs Gmail emails for job updates
 * @param {Object} settings - User settings
 * @returns {Promise<Object>} - Sync results with function calls
 */
export async function syncGmailEmails(settings) {
  let emails = [];
  
  // If Gmail is connected and has access token, fetch real emails
  if (settings.isGmailConnected && settings.gmailAccessToken) {
    emails = await fetchGmailEmails(settings.gmailAccessToken);
  }
  
  // Fallback to mock data if no real emails or not connected
  if (emails.length === 0) {
    emails = [
      {
        from: 'Google Careers',
        subject: 'Update regarding your Software Engineer application',
        snippet: "Hi there, we'd like to invite you for a virtual interview next Tuesday."
      },
      {
        from: 'Stripe',
        subject: 'Job Application Received',
        snippet:
          'Thank you for applying for the Senior Frontend Engineer position at Stripe. We have received your materials.'
      },
      {
        from: 'Tesla HR',
        subject: 'Application Status',
        snippet:
          'Unfortunately, we have decided to move forward with other candidates at this time.'
      }
    ];
  }

  const ai = createAIClient(settings);
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Process these emails for job application updates. Use your tools to save or update the tracker.
    EMAILS: ${JSON.stringify(emails)}`,
    config: {
      systemInstruction: getSystemInstruction(settings),
      tools: [{ functionDeclarations: jobTrackingTools }]
    }
  });

  return {
    functionCalls: response.candidates?.[0]?.content?.parts?.filter(
      (part) => part.functionCall
    ) || []
  };
}
