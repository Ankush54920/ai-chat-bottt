import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  prompt: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt }: RequestBody = await req.json();
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const apiKey = Deno.env.get('PERPLEXITY_API_1_KEY');
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant. Be concise and informative.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'No response received';
    
    // Extract token counts from usage data
    const usage = data.usage || {};
    const InputTokenCount = usage.prompt_tokens || 0;
    const OutputTokenCount = usage.completion_tokens || 0;
    const totalTokenCount = usage.total_tokens || InputTokenCount + OutputTokenCount;

    return new Response(JSON.stringify({
      reply,
      InputTokenCount,
      OutputTokenCount,
      totalTokenCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in mysterious1 function:', error);
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