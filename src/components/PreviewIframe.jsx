import { useEffect, useRef } from 'react';

export default function PreviewIframe({ generated }) {
  const iframeRef = useRef(null);
  const { html, css, js, framework = 'html', styling = 'css' } = generated;

  useEffect(() => {
    if (!iframeRef.current || (!html && !js)) return;
    
    let headInjects = '';
    let bodyInjects = '';

    // Tailwind
    if (styling === 'tailwind') {
      headInjects += '<script src="https://cdn.tailwindcss.com"></script>\n';
    } else {
      headInjects += `<style>\n${css}\n</style>\n`;
    }

    // Framework Setup
    if (framework === 'react') {
      headInjects += `
        <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
      `;
      // Convert standard export to ReactDOM render
      const componentCode = js.replace(/export default function (\w+)/, 'function $1');
      const componentNameMatch = js.match(/export default function (\w+)/);
      const componentName = componentNameMatch ? componentNameMatch[1] : 'App';
      
      bodyInjects = `
        <div id="react-root"></div>
        <script type="text/babel" data-type="module">
          ${componentCode}
          const root = ReactDOM.createRoot(document.getElementById('react-root'));
          root.render(<${componentName} />);
        </script>
      `;
    } else if (framework === 'vue') {
      headInjects += `<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>`;
      
      // Parse SFC slightly naively
      const templateMatch = html.match(/<template>([\s\S]*?)<\/template>/i);
      const scriptMatch = html.match(/<script.*?>([\s\S]*?)<\/script>/i);
      const styleMatch = html.match(/<style.*?>([\s\S]*?)<\/style>/i);
      
      const vueTemplate = templateMatch ? templateMatch[1] : '';
      let vueScript = scriptMatch ? scriptMatch[1] : 'export default {}';
      const vueStyle = styleMatch ? styleMatch[1] : '';

      // Transform generic vue code into mountable
      vueScript = vueScript.replace('export default {', 'const App = {');
      
      headInjects += `<style>\n${vueStyle}\n</style>\n`;
      bodyInjects = `
        <div id="vue-root">${vueTemplate}</div>
        <script>
          ${vueScript}
          Vue.createApp(App).mount('#vue-root');
        </script>
      `;
    } else {
      // Vanilla
      bodyInjects = `
        ${html}
        <script>${js}</script>
      `;
    }

    const doc = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;padding:20px;background:${styling==='tailwind' ? '#ffffff' : '#fafafa'};min-height:100vh;display:flex;align-items:flex-start;justify-content:center}
</style>
${headInjects}
</head>
<body>
${bodyInjects}
</body>
</html>`;

    iframeRef.current.srcdoc = doc;
  }, [html, css, js, framework, styling]);

  return (
    <iframe 
      id="preview-iframe" 
      ref={iframeRef}
      title="Preview do componente" 
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
