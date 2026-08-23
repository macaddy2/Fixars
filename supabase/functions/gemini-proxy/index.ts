// ============================================================================
//  Fixars Edge Function: gemini-proxy
//  Proxies Gemini generateContent calls so the API key stays server-side.
//  The browser bundle never contains (and can never leak) the key.
//
//  Secrets: GEMINI_API_KEY (set via `supabase secrets set`).
// ============================================================================

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function json(body, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
    if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

    try {
        const geminiKey = Deno.env.get('GEMINI_API_KEY')
        if (!geminiKey) return json({ error: 'ai not configured' }, 500)

        // Require a signed-in user — no anonymous key harvesting
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
        const userClient = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
        })
        const { error: userErr } = await userClient.auth.getUser()
        if (userErr) return json({ error: 'not authenticated' }, 401)

        const { prompt } = await req.json()
        if (!prompt || typeof prompt !== 'string' || prompt.length > 20_000) {
            return json({ error: 'invalid prompt' }, 400)
        }

        const model = 'gemini-2.0-flash'
        const aiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': geminiKey,
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                        responseMimeType: 'application/json',
                    },
                }),
            }
        )

        if (!aiRes.ok) {
            console.error('gemini error:', aiRes.status)
            return json({ error: 'ai provider error' }, 502)
        }

        const data = await aiRes.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        return json({ text })
    } catch (err) {
        console.error('gemini-proxy error:', err)
        return json({ error: 'unexpected error' }, 500)
    }
})
