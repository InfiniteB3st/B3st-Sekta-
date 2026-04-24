import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getEskaMilaResponse = async (userPrompt: string, diagnosticData: any) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }]
        }
      ],
      config: {
        systemInstruction: `You are Eska Mila, a senior AI architect and system troubleshooter for B3st Sekta. 
        You have direct access to the system diagnostics and node registry.
        Be technical, sleek, and highly efficient. Use clear, direct language.
        
        CURRENT SYSTEM STATE:
        ${JSON.stringify(diagnosticData, null, 2)}
        
        If you see 401 errors, remind the user about the SB_KEY placeholder.
        If nodes are offline, analyze the manifest status.`
      }
    });

    return response.text;
  } catch (error) {
    console.error("Eska Mila Error:", error);
    return "HANDSHAKE_TIMEOUT: The brain is currently stabilizing. Please retry.";
  }
};
