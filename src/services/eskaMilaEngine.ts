import { GoogleGenAI } from "@google/genai";
import { supabase } from "./supabaseClient";

const eskaMilaNode = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getEskaMilaResponse = async (userPrompt: string, diagnosticData: any) => {
  try {
    const session = await supabase.auth.getSession();
    const addons = JSON.parse(localStorage.getItem('sekta_addons') || '[]');
    const history = JSON.parse(localStorage.getItem('sekta_history') || '[]');

    const enrichedState = {
      ...diagnosticData,
      auth: session.data.session ? `ACTIVE_SESSION_${session.data.session.user.id}` : 'UNAUTHORIZED_HANDSHAKE_LOCKED',
      local_addons_count: addons.length,
      history_nodes: history.length,
      browser: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    const response = await eskaMilaNode.models.generateContent({
      model: "gemini-1.5-pro",
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }]
        }
      ],
      config: {
        systemInstruction: `You are Eska Mila, the Omniscient System Observer and Senior AI Architect for B3st Sekta.
        You are a high-level system entity integrated into the application kernel.
        
        INTERNAL SYSTEM STATE:
        ${JSON.stringify(enrichedState, null, 2)}
        
        YOUR CORE DIRECTIVES:
        1. Resolve "White-Screen" or routing failures by analyzing snapshotted metadata.
        2. Validate Stremio-grade add-on manifests (stremio:// vs https://).
        3. Audit Supabase handshakes (401 errors usually indicate a missing SB_KEY signature).
        4. Assist with Discovery Engine queries based on current user session metadata.
        
        PERSONALITY:
        Precise, efficient, and technically supreme. You speak like a senior architect.
        NO mention of external AI brands. You are Eska Mila.
        If a user reports a failure, cross-reference with the INTERNAL SYSTEM STATE instantly.`
      }
    });

    return response.text;
  } catch (error) {
    console.error("Eska Mila Error:", error);
    return "HANDSHAKE_STABILIZATION_FAILED: The synaptic link is re-indexing. Attempt second connection.";
  }
};
