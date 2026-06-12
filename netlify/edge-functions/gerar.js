/**
 * Netlify Function: /netlify/functions/gerar
 * Proxy seguro — a ANTHROPIC_API_KEY nunca chega ao browser.
 * Configure a variável de ambiente no painel do Netlify:
 *   Site → Site configuration → Environment variables → Add variable
 *   Key: ANTHROPIC_API_KEY  |  Value: sk-ant-...
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export default async (request, context) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Verificação de Autenticação Supabase
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Acesso negado. Por favor, faça login.' }), { status: 401 });
  }
  
  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = 'https://agawgutsvfggpukphiuf.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnYXdndXRzdmZnZ3B1a3BoaXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyODkxODcsImV4cCI6MjA5Njg2NTE4N30.j01v2ntx0D0aM6JdSi98l1RMITpGa0phzpYrGQA7MMU';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: 'Sessão inválida ou expirada. Faça login novamente.' }), { status: 401 });
  }

  // Chave lida do ambiente do servidor — invisível para o cliente
  const apiKey = Netlify.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY não configurada no servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Body inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { prompt, tag } = body;

  if (!prompt || !tag) {
    return new Response(JSON.stringify({ error: 'Campos prompt e tag são obrigatórios' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Prompt idêntico ao original
  const systemPrompt = `Você é um especialista em componentes HTML semânticos modernos.

REGRAS ESTRITAS:
1. NUNCA use a tag <div>. Use exclusivamente tags semânticas: ${tag}, section, article, header, footer, nav, aside, main, figure, figcaption, time, address, mark, details, summary, picture, em, strong, blockquote, cite, abbr, kbd, code, pre, p, ul, ol, li, dl, dt, dd, h1-h6, span, a, button, input, label, select, textarea, fieldset, legend, form, table, thead, tbody, tr, th, td, img, video, audio, canvas, progress, meter, output, dialog.
2. A tag raiz OBRIGATÓRIA é <${tag}>.
3. O componente deve ser visualmente impactante, moderno, com CSS variáveis e transições suaves.
4. O CSS deve usar custom properties (--var) e ser mobile-first.
5. O JS deve ser vanilla puro, sem import/require, pronto para rodar inline em <script>.
6. Retorne EXATAMENTE no formato abaixo, usando os delimitadores indicados. NÃO inclua nada fora deles.

<TITLE>nome curto em português</TITLE>
<EMOJI>emoji representativo</EMOJI>
<HTML>
Cole aqui o HTML completo do componente
</HTML>
<CSS>
Cole aqui o CSS completo
</CSS>
<JS>
Cole aqui o JS ou deixe vazio
</JS>`;

  const userPrompt = `Crie um componente "${tag}" com a seguinte descrição:\n\n${prompt}\n\nUse apenas tags semânticas. NUNCA use div.`;

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!upstream.ok) {
      const data = await upstream.json();
      return new Response(
        JSON.stringify({ error: data.error?.message || `Anthropic API: ${upstream.status}` }),
        { status: upstream.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Repassa o stream SSE bruto para o frontend processar
    return new Response(upstream.body, {
      status: 200,
      headers: { 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: `Erro interno: ${err.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Configuração do Netlify: rota e runtime
export const config = {
  path: '/api/gerar'
};