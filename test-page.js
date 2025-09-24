// Simple test to check if Next.js is working
import { createServer } from 'http'

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Page</title>
    </head>
    <body>
      <h1>Next.js Test</h1>
      <p>If you can see this, the basic server is working.</p>
    </body>
    </html>
  `)
})

server.listen(3001, () => {
  console.log('Test server running on http://localhost:3001')
})
