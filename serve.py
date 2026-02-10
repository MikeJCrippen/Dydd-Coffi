
import http.server
import socketserver

PORT = 8000

class BeanLogHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Allow cross-origin for PWA stability
        self.send_header('Access-Control-Allow-Origin', '*')
        # Disable caching during development so changes show up immediately
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

# Tell the server how to handle TypeScript files
BeanLogHandler.extensions_map.update({
    '.tsx': 'application/javascript',
    '.ts': 'application/javascript',
    '.js': 'application/javascript',
})

print(f"☕ BeanLog starting on http://localhost:{PORT}")
print(f"👉 To make it a PWA on your phone, run: tailscale serve --bg {PORT}")

with socketserver.TCPServer(("", PORT), BeanLogHandler) as httpd:
    httpd.serve_forever()
