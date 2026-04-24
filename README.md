# evidence-chain-demo

## What this is

A tamper-evident hash chain for compliance audit evidence. Five pre-populated quarterly access review records. Tamper with any record, verify the chain, see where the break is detected.

## Try it

- Open the live demo: [LINK]
- Click "Tamper" on any record, then click "Verify Chain." The break is detected at the exact record you touched.
- Source: [GITHUB LINK]

## How it works

Each evidence record carries a `prevHash` pointing at the previous record's `recordHash`. The `recordHash` is SHA-256 over the canonical JSON of every field except `recordHash` itself. Verification walks the chain from genesis, recomputes every hash, and reports the first mismatch. Real SHA-256 via the Web Crypto API. Canonical JSON is implemented inline (recursive key sort plus `JSON.stringify` with no whitespace), no library dependency.

The chain is self-verifying against itself. A database administrator with write access can rewrite every record and recompute every hash, which defeats the chain alone. The External Anchor panel demonstrates the second layer: the current tip hash is published to an external write-once store. In production this is S3 Object Lock in Compliance mode. An auditor verifies the chain against the most recent published tip, closing the insider-with-DBA gap.

## Stack

Vite, React 18, TypeScript strict, Tailwind 3, Web Crypto API for SHA-256. No backend.

## Deploy

```
npm install
npm run build
```

Drag `dist/` into Cloudflare Pages or Vercel, or run `npm run preview` locally.
