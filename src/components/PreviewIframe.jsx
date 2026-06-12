import { useEffect, useRef } from 'react';

export default function PreviewIframe({ html, css, js }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!iframeRef.current) return;
    
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { margin: 0; padding: 2rem; font-family: system-ui, sans-serif; background: transparent; display: flex; justify-content: center; align-items: center; min-height: 100vh; box-sizing: border-box; }
            ${css}
          </style>
        </head>
        <body>
          ${html}
          <script>
            try {
              ${js}
            } catch (e) {
              console.error(e);
            }
          </script>
        </body>
      </html>
    `);
    doc.close();
  }, [html, css, js]);

  return (
    <iframe 
      ref={iframeRef}
      title="Preview"
      className="iframe-preview"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
