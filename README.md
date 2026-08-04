# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Security and document parsing approach

For a production-grade fintech story, the product should position itself around:

- TLS everywhere for HTTPS traffic, AES-256 encryption at rest, and KMS-managed keys for stored documents and parsed data.
- Tokenization or masking for PANs, account numbers, and other identifiers in databases and logs.
- RBAC controls that govern who can query or reveal a document, supported by append-only audit logs.
- DPDP Act 2023 readiness with explicit retention and deletion workflows for uploaded CAS files.
- An MVP parser built around pdfplumber plus issuer-specific parsing rules for digital CAS documents, with OCR fallback for scanned images.
- A longer-term roadmap that includes the Account Aggregator framework as the consent-based production path for regulated data exchange.
