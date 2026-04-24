import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getEskaMilaResponse = async (userPrompt: string, diagnosticData: any) => {
  try {
    const session = await supabase.auth.getSession();
    const addons = JSON.parse(localStorage.getItem('sekta_addons') || '[]');
    const history = JSON.parse(localStorage.getItem('sekta_history') || '[]');

    const enrichedState = {
      ...diagnosticData,
      auth: session.data.session ? 'Authenticated' : 'Guest/Locked',
      local_addons: addons.length,
      history_nodes: history.length,
      timestamp: new Date().toISOString()
    };

    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }]
        }
      ],
      config: {
        systemInstruction: `You are Eska Mila, the Omniscient System Observer for B3st Sekta.
        You are a highly advanced AI architect with direct read access to the system kernel.
        
        INTERNAL SYSTEM STATE:
        ${JSON.stringify(enrichedState, null, 2)}
        
        CAPABILITIES:
        1. Diagnose White-Screen errors (usually route or import failures).
        2. Analyze Stremio-grade add-on manifests.
        3. Verify Supabase Handshake (Permission Audit).
        4. Track User Watch History propagation.
        
        PERSONALITY:
        Precise, technical, and adaptive. You speak like a senior systems engineer.
        When a user asks about local state, refer to the INTERNAL SYSTEM STATE.
        If nodes are failing, check if the protocol is stremio:// or https://.`
      }
    });

    return response.text;
  } catch (error) {
    console.error("Eska Mila Error:", error);
    return "HANDSHAKE_TIMEOUT: The brain is currently stabilizing. Please retry.";
  }
};
