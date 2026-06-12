import { useEffect, useRef } from 'react';

export default function PreviewIframe({ html, css, js }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!iframeRef.current || !html) return;
    
    const doc = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;padding:20px;background:#fafafa;min-height:100vh;display:flex;align-items:flex-start;justify-content:center}
  ${css}
</style>
</head>
<body>
${html}
<script>${js}<\/script>
</body>
</html>`;

    iframeRef.current.srcdoc = doc;
  }, [html, css, js]);

  return (
    <iframe 
      id="preview-iframe" 
      ref={iframeRef}
      title="Preview do componente" 
      sandbox="allow-scripts"
    />
  );
}
