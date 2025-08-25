import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  userName: string;
}

interface APIConfig {
  url: string;
  apiKey: string;
  model: string;
  headers: Record<string, string>;
  body: (message: string) => object;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userName }: ChatRequest = await req.json();
    
    if (!message || !userName) {
      throw new Error('Message and userName are required');
    }

    // API configurations in priority order
    const apis: APIConfig[] = [
      // API 1: Perplexity Pro (Priority 1)
      {
        url: 'https://api.perplexity.ai/chat/completions',
        apiKey: Deno.env.get('PERPLEXITY_API_1_KEY') || '',
        model: 'llama-3.1-sonar-large-128k-online',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('PERPLEXITY_API_1_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: (msg: string) => ({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant. Be concise and informative.' },
            { role: 'user', content: msg }
          ],
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 1000,
        })
      },
      // API 2: Perplexity Pro (Fallback)
      {
        url: 'https://api.perplexity.ai/chat/completions',
        apiKey: Deno.env.get('PERPLEXITY_API_2_KEY') || '',
        model: 'llama-3.1-sonar-large-128k-online',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('PERPLEXITY_API_2_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: (msg: string) => ({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant. Be concise and informative.' },
            { role: 'user', content: msg }
          ],
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 1000,
        })
      },
      // API 3: Gemini (Final fallback)
      {
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`,
        apiKey: Deno.env.get('GEMINI_API_KEY') || '',
        model: 'gemini-1.5-flash-latest',
        headers: {
          'Content-Type': 'application/json',
        },
        body: (msg: string) => ({
          contents: [{
            parts: [{
              text: `You are a helpful AI assistant. Be concise and informative.\n\nUser: ${msg}`
            }]
          }]
        })
      }
    ];

    let response: string = '';
    let usedModel: string = '';
    let lastError: string = '';

    // Try each API in order
    for (let i = 0; i < apis.length; i++) {
      const api = apis[i];
      
      if (!api.apiKey) {
        console.log(`API ${i + 1} key not found, skipping...`);
        continue;
      }

      try {
        console.log(`Trying API ${i + 1}: ${api.model}`);
        
        const apiResponse = await fetch(api.url, {
          method: 'POST',
          headers: api.headers,
          body: JSON.stringify(api.body(message)),
        });

        if (!apiResponse.ok) {
          const errorText = await apiResponse.text();
          throw new Error(`API ${i + 1} failed: ${apiResponse.status} - ${errorText}`);
        }

        const data = await apiResponse.json();
        
        // Parse response based on API type
        if (i < 2) { // Perplexity APIs
          response = data.choices?.[0]?.message?.content || 'No response received';
        } else { // Gemini API
          response = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received';
        }
        
        usedModel = api.model;
        console.log(`Success with API ${i + 1}: ${api.model}`);
        break;
        
      } catch (error) {
        lastError = `API ${i + 1} (${api.model}): ${error.message}`;
        console.error(lastError);
        
        // Continue to next API
        if (i === apis.length - 1) {
          // This was the last API, throw error
          throw new Error(`All APIs failed. Last error: ${lastError}`);
        }
      }
    }

    if (!response) {
      throw new Error('No response generated from any API');
    }

    return new Response(JSON.stringify({ 
      response,
      model: usedModel 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-api function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      response: 'Sorry, I encountered an error processing your request. Please try again.',
      model: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});