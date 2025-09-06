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

// Postprocessor for Study Mode responses
function postprocessStudyModeResponse(text: string): string {
  let cleaned = text;
  
  // Step 1: Fix double-escaped backslashes for LaTeX
  cleaned = cleaned
    .replace(/\\\\frac/g, '\\frac')
    .replace(/\\\\sqrt/g, '\\sqrt')
    .replace(/\\\\left/g, '\\left')
    .replace(/\\\\right/g, '\\right')
    .replace(/\\\\sum/g, '\\sum')
    .replace(/\\\\int/g, '\\int')
    .replace(/\\\\lim/g, '\\lim')
    .replace(/\\\\alpha/g, '\\alpha')
    .replace(/\\\\beta/g, '\\beta')
    .replace(/\\\\gamma/g, '\\gamma')
    .replace(/\\\\delta/g, '\\delta')
    .replace(/\\\\theta/g, '\\theta')
    .replace(/\\\\pi/g, '\\pi')
    .replace(/\\\\([\w]+)/g, '\\$1'); // General fix for other escaped commands
  
  // Step 2: Remove citation markers and source footers
  cleaned = cleaned
    .replace(/\[\d+\]/g, '') // Remove [1], [2], etc.
    .replace(/\[[\w\s,.-]+\]/g, '') // Remove [source name] etc.
    .replace(/Source[s]?:\s*.*$/gm, '') // Remove "Source:" lines
    .replace(/References?:\s*.*$/gm, '') // Remove "Reference:" lines
    .replace(/\*\*Sources?\*\*[\s\S]*$/gm, '') // Remove **Sources** sections
    .replace(/---[\s\S]*Sources?[\s\S]*$/gm, ''); // Remove footer sections
  
  // Step 3: Clean up markdown noise while preserving intentional formatting
  cleaned = cleaned
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // Convert **bold** to HTML
    .replace(/__([^_]+)__/g, '<strong>$1</strong>') // Convert __bold__ to HTML
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>') // Convert *italic* to HTML (single line only)
    .replace(/_([^_\n]+)_/g, '<em>$1</em>'); // Convert _italic_ to HTML (single line only)
  
  // Step 4: Auto-detect and wrap LaTeX expressions
  cleaned = cleaned
    .replace(/([^$\\]|^)(sqrt\(([^)]+)\))/g, '$1$\\sqrt{$3}$') // sqrt(x) -> $\sqrt{x}$
    .replace(/([^$\\]|^)(\w+\/\w+)(?!\w)/g, '$1$\\frac{$2}$') // a/b -> $\frac{a}{b}$ (basic cases)
    .replace(/([^$\\]|^)(\d+\s*\^\s*\d+)/g, '$1$$2$') // x^2 -> $x^2$
    .replace(/([^$\\]|^)(≤|≥|±|∞|∑|∫|∂|∇|π|θ|α|β|γ|δ|ε|σ|μ|λ)/g, '$1$$2$'); // Wrap math symbols
  
  // Step 5: Normalize whitespace and paragraphs
  cleaned = cleaned
    .replace(/\n\n+/g, '\n\n') // Normalize multiple newlines
    .replace(/\s+/g, ' ') // Normalize spaces (but keep newlines)
    .replace(/ \n/g, '\n') // Remove spaces before newlines
    .trim();
  
  // Step 6: If no clear steps detected, add paragraph breaks for readability
  if (!cleaned.match(/Step\s+\d+/i) && cleaned.length > 200) {
    // Add breaks after sentences that end periods/colons if the next sentence starts a new thought
    cleaned = cleaned.replace(/([.:])\s+([A-Z][a-z])/g, '$1\n\n$2');
  }
  
  return cleaned;
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

    const apiKey = Deno.env.get('MYSTERIOUS_API_1');
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
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: finalSystemPrompt },
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
    let reply = data.choices?.[0]?.message?.content || 'No response received';
    
    // Apply Study Mode postprocessing
    if (mode === 'Study Mode') {
      reply = postprocessStudyModeResponse(reply);
    }
    
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