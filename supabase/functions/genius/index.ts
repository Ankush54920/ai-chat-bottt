import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  prompt: string;
  systemPrompt?: string;
  mode?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, systemPrompt, mode }: RequestBody = await req.json();
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const defaultSystemPrompt = 'You are a helpful AI assistant. Be concise and informative.';
    const finalSystemPrompt = systemPrompt || defaultSystemPrompt;

    const apiKey = Deno.env.get('MYSTERIOUS_API_3');
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${finalSystemPrompt}\n\nUser: ${prompt}`
          }]
        }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received';
    
    // Extract token counts from usage metadata
    const usage = data.usageMetadata || {};
    const InputTokenCount = usage.promptTokenCount || 0;
    const OutputTokenCount = usage.candidatesTokenCount || 0;
    const totalTokenCount = usage.totalTokenCount || InputTokenCount + OutputTokenCount;

    return new Response(JSON.stringify({
      reply,
      InputTokenCount,
      OutputTokenCount,
      totalTokenCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in genius function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      reply: 'Sorry, I encountered an error processing your request.',
      InputTokenCount: 0,
      OutputTokenCount: 0,
      totalTokenCount: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});