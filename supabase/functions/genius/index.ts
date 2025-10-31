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

    // Retry logic with exponential backoff for rate limits
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
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

        if (response.ok) {
          // Success - process the response
          const data = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received';
          
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
        }
        
        // Handle rate limit errors (429)
        if (response.status === 429) {
          const errorText = await response.text();
          lastError = new Error(`Rate limit exceeded: ${errorText}`);
          
          // If not last attempt, wait before retrying
          if (attempt < maxRetries - 1) {
            const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
            console.log(`Rate limited. Retrying in ${waitTime}ms... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          // Last attempt failed - return user-friendly error
          return new Response(JSON.stringify({ 
            error: 'The AI service is currently experiencing high traffic. Please try again in a few moments.',
            reply: 'Sorry, the service is busy right now. Please wait a moment and try again.',
            InputTokenCount: 0,
            OutputTokenCount: 0,
            totalTokenCount: 0
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Other errors
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
        
      } catch (fetchError) {
        lastError = fetchError as Error;
        if (attempt < maxRetries - 1) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`Request failed. Retrying in ${waitTime}ms... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        throw fetchError;
      }
    }
    
    throw lastError || new Error('Request failed after all retries');


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