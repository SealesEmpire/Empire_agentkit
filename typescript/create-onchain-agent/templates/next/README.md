# Empire AgentKit on Vercel

This is a [Next.js](https://nextjs.org) project bootstrapped with `create-onchain-agent`.  

It integrates [AgentKit](https://github.com/coinbase/agentkit) to provide AI-driven interactions with on-chain capabilities.

## Getting Started

First, install dependencies:

```sh
npm install
```

Then, configure your environment variables:

```sh
mv .env.local .env
```

Run the development server:

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the project.

## Empire Knowledge Core

This template includes a lightweight **Empire Knowledge Core** retrieval layer at `app/lib/server/empire-knowledge-core.ts`.

Use it to keep a small, curated set of deployment, wallet, and operational knowledge close to the agent without adding a database or vector store. Only the top relevant snippets are injected into the prompt for each request.

## Vercel Deployment

### 1. Configure secrets

Add these environment variables in **Vercel → Project Settings → Environment Variables**:

- `OPENAI_API_KEY`
- wallet-provider-specific secrets such as `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET`, `CDP_WALLET_SECRET`
- optional production controls:
  - `AGENTKIT_OPENAI_MODEL`
  - `AGENTKIT_MAX_STEPS`
  - `AGENTKIT_TOOL_CACHE_TTL_MS`
  - `AGENTKIT_WALLET_DATA`
  - `EMPIRE_KNOWLEDGE_CORE_ENABLED`

### 2. Avoid local wallet file persistence in production

Vercel file storage is ephemeral. Prefer storing exported wallet state in `AGENTKIT_WALLET_DATA`. Local file persistence is automatically treated as a local-development fallback.

### 3. Health checks

Use `/api/health` to verify:

- required secrets are present
- runtime configuration is loaded
- Empire Knowledge Core is enabled

### 4. Deploy

```sh
vercel
```

or connect the repo in the Vercel dashboard and deploy normally.


## Configuring Your Agent

You can [modify your configuration](https://github.com/coinbase/agentkit/tree/main/typescript/agentkit#usage) of the agent. By default, your agentkit configuration occurs in the `/api/agent/prepare-agentkit.ts` file, and agent instantiation occurs in the `/api/agent/create-agent.ts` file.

### 1. Select Your LLM  
Modify the OpenAI model instantiation to use the model of your choice.

### 2. Select Your Wallet Provider  
AgentKit requires a **Wallet Provider** to interact with blockchain networks.

### 3. Select Your Action Providers  
Action Providers define what your agent can do. You can use built-in providers or create your own.

---

## Next Steps

- Explore the AgentKit README: [AgentKit Documentation](https://github.com/coinbase/agentkit)
- Learn more about available Wallet Providers & Action Providers.
- Experiment with custom Action Providers for your specific use case.
- Expand the Empire Knowledge Core with your own curated documents and deployment runbooks.

---

## Learn More

- [Learn more about CDP](https://docs.cdp.coinbase.com/)
- [Learn more about AgentKit](https://docs.cdp.coinbase.com/agentkit/docs/welcome)
- [Learn more about Next.js](https://nextjs.org/docs)
- [Learn more about Tailwind CSS](https://tailwindcss.com/docs)

---

## Contributing

Interested in contributing to AgentKit? Follow the contribution guide:

- [Contribution Guide](https://github.com/coinbase/agentkit/blob/main/CONTRIBUTING.md)
- Join the discussion on [Discord](https://discord.gg/CDP)
