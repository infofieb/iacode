/**
 * Netlify Function: /netlify/functions/gerar
 * Proxy seguro — a ANTHROPIC_API_KEY nunca chega ao browser.
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

  // Chave lida do ambiente do servidor
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

  const { prompt, tag, framework = 'html', styling = 'css' } = body;

  if (!prompt || !tag) {
    return new Response(JSON.stringify({ error: 'Campos prompt e tag são obrigatórios' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Build System Prompt dynamically
  let systemPrompt = `Você é um especialista em desenvolvimento Frontend avançado.\n\nREGRAS ESTRITAS:\n`;
  systemPrompt += `1. O componente deve ser altamente moderno, visualmente impactante, com design premium, e acessível.\n`;
  systemPrompt += `2. NUNCA use bibliotecas externas (como lucide-react, heroicons, fontawesome, etc). Se precisar de ícones, desenhe os SVGs inline diretamente no código.\n`;
  systemPrompt += `3. NUNCA use instruções de \`import\`. Assuma que as dependências (React, Vue) estão disponíveis no escopo global (ex: React.useState, Vue.ref).\n`;

  // Framework logic
  if (framework === 'react') {
    systemPrompt += `4. Gere um componente Funcional do React (export default function NomeComponente). Use apenas hooks padrões pelo objeto global React (ex: const [state, setState] = React.useState()).\n`;
    systemPrompt += `5. A tag raiz OBRIGATÓRIA do JSX retornado deve ser <${tag}> (não use div como raiz principal).\n`;
    systemPrompt += `6. Retorne o código React/JSX na tag <JS>. Deixe a tag <HTML> vazia.\n`;
  } else if (framework === 'vue') {
    systemPrompt += `4. Gere um componente Vue 3 usando a Options API clássica (export default { data() { return {} } }). NÃO use <script setup>, pois não é suportado no nosso ambiente de preview. Use o objeto global Vue se precisar acessar propriedades da Composition API.\n`;
    systemPrompt += `5. A tag raiz OBRIGATÓRIA do template deve ser <${tag}>.\n`;
    systemPrompt += `6. Retorne TODO o código SFC (.vue), ou seja, <template>, <script> e <style>, dentro da tag <HTML>. Deixe a tag <JS> e <CSS> vazias.\n`;
  } else {
    // Vanilla
    systemPrompt += `4. NUNCA use a tag <div>. Use exclusivamente tags semânticas: ${tag}, section, article, header, nav, etc.\n`;
    systemPrompt += `5. A tag raiz OBRIGATÓRIA é <${tag}>.\n`;
    systemPrompt += `6. Retorne o HTML na tag <HTML> e o JS vanilla puro (se houver interatividade) na tag <JS>.\n`;
  }

  // Styling logic
  if (styling === 'tailwind') {
    systemPrompt += `7. OBRIGATÓRIO: Estilize o componente **apenas com classes do TailwindCSS v3**. NÃO use CSS puro. Deixe a tag <CSS> completamente vazia.\n`;
    if (framework === 'react') {
      systemPrompt += `8. Use className=".." para aplicar as classes do Tailwind no React.\n`;
    }
  } else {
    // Vanilla CSS
    if (framework !== 'vue') {
      systemPrompt += `7. OBRIGATÓRIO: Estilize o componente usando Vanilla CSS puro com CSS variables. O design deve ser mobile-first. Retorne esse código na tag <CSS>.\n`;
    }
  }

  systemPrompt += `\nRetorne EXATAMENTE no formato abaixo, usando os delimitadores indicados. NÃO inclua nada fora deles.

<TITLE>nome curto em português</TITLE>
<EMOJI>emoji representativo</EMOJI>
<HTML>
HTML ou Vue SFC (deixe vazio se for React)
</HTML>
<CSS>
CSS puro (deixe vazio se usar Tailwind ou Vue)
</CSS>
<JS>
React JSX ou Vanilla JS (deixe vazio se for Vue)
</JS>`;

  const userPrompt = `Stack: ${framework.toUpperCase()} + ${styling.toUpperCase()}\n\nCrie um componente cuja raiz seja "${tag}" com a seguinte descrição:\n\n${prompt}`;

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

export const config = {
  path: '/api/gerar'
};