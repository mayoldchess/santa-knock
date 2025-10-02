Cloudflare Worker proxy for Santa Knock.
Protects your OpenAI key and exposes /chat for the frontend.

Deploy:
  npm i -g wrangler
  wrangler login
  wrangler subdomain
  wrangler secret put OPENAI_API_KEY
  wrangler publish
