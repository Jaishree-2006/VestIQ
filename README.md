# VestIQ
## Portfolio Intelligence for Retail Investors and Brokers in the Indian Securities Market

Built for the Securities Market TechSprint @ GFF 2026

VestIQ is an intelligent portfolio intelligence platform that turns a customer’s CAS statement into actionable insights for risk, suitability, explainability, and compliance. The platform helps retail investors, brokers, and compliance teams understand whether a portfolio is healthy, risky, mis-sold, or unsuitable — using structured analysis, explainable scoring, and operational controls designed for the Indian securities ecosystem.

---

## Why this matters

Retail investors often receive fragmented portfolio information across statements, product disclosures, and advisor recommendations. In many cases, it is difficult to identify:

- concentrated risk exposure
- hidden or avoidable product risks
- mis-selling or suitability concerns
- overexposure to illiquid or high-volatility instruments
- weak diversification posture relative to peer cohorts
- macro shocks that can materially affect portfolio stability

VestIQ addresses this by turning raw CAS data into transparent, explainable, risk-aware portfolio intelligence.

---

## Problem statement

In the Indian securities market, investors and intermediaries often lack a unified view of portfolio health across:
- mutual funds
- equities
- bonds
- REITs / InvITs
- cash and liquid allocations

This creates challenges in:
- evaluating portfolio suitability
- detecting concentration and risk drag
- explaining portfolio score changes
- supporting compliance and audit readiness
- improving broker advisory quality

VestIQ provides a modern, explainable layer on top of CAS-driven portfolio analysis to support better decision-making and compliance confidence.

---

## Core product capabilities

### 1. CAS statement ingestion and parsing
- Upload NSDL / CDSL CAS PDF statements
- Extract portfolio holdings and allocation data
- Parse key investor and holding information
- Support sample/demo uploads for product walkthroughs and evaluation

### 2. Portfolio health scoring
- Compute a portfolio health score based on allocation quality, concentration, liquidity, and risk profile
- Highlight score drivers and deterioration factors
- Generate explainable reasons behind score movement
- Show trends over time for portfolio improvement or decline

### 3. Red flags and risk detection
- Detect concentrated holdings
- Identify risky or unsuitable allocations
- Highlight illiquidity and volatility concerns
- Surface hidden fee, lock-in, and product-risk patterns
- Prioritize alerts by severity and business impact

### 4. Explainability center
- Show why a portfolio received a certain score
- Link risk drivers to specific holdings and market factors
- Turn technical portfolio data into investor-friendly explanations
- Make recommendations easier to trust and act upon

### 5. Peer benchmarking
- Compare portfolio allocation against peer cohorts
- Show how the user performs against similar investors
- Highlight deviations in asset mix, concentration, and stability

### 6. Shock sandbox
- Simulate adverse market conditions
- Stress-test portfolio resilience under rate hikes, equity drawdowns, or macro shocks
- Model portfolio impact in a simple, interactive scenario format

### 7. Retrospective simulator
- Explore how historical market environments would have affected the portfolio
- Compare current allocation against scenario outcomes
- Support advisor-grade narrative explanations

### 8. Broker and advisor workflows
- Provide broker-facing views for investor review
- Show case summaries, risk posture, and compliance flags
- Support more informed advisory conversations

### 9. Compliance and audit visibility
- Aggregate monitoring for risk trends and red-flag patterns
- Role-based review workflows
- Audit logs for sensitive document access and case review actions
- Support governance and internal control standards

### 10. Admin and operational controls
- Threshold monitoring
- Risk and compliance administration
- System-level controls for business rules and document handling
- Operational visibility for policy enforcement

---

## Product experience

VestIQ is designed for multiple user personas:

- Retail investors who want clear, personal portfolio understanding
- Brokers / advisors who need better suitability and risk conversations
- Risk and compliance teams who need structured oversight and auditability
- Product teams evaluating future-ready portfolio intelligence tooling for regulated markets

---

## Technical architecture

### Frontend
- React
- TypeScript
- Vite
- Tailwind-style utility design patterns
- Modular page-based dashboard experience

### Backend / services
- Node.js / server-side APIs
- Document parsing and validation workflows
- Portfolio scoring and risk computation services
- Role-aware access and admin logic

### Data and document intelligence
- CAS statement parsing
- Portfolio extraction and normalization
- Rule-based risk and suitability analysis
- Explainability and scenario generation

---

## Security and compliance posture

The platform is designed with fintech-grade thinking for regulated workflows and investor trust.

### Security fundamentals
- TLS protection for secure data transfer
- encryption at rest for sensitive portfolio and document data
- secure handling of client identifiers and uploaded statements
- masked or tokenized storage for sensitive fields where appropriate
- restricted access for regulated workflows

### Governance and compliance
- role-based access control (RBAC)
- append-only audit logs for document and review events
- policy-based visibility for compliance-sensitive data
- retention and deletion workflows aligned with privacy and regulatory expectations
- explicit controls for who can query or reveal client-level case details

### Regulatory alignment
VestIQ is positioned for the evolving financial data and compliance landscape, including:
- DPDP Act readiness for personal data handling
- document lifecycle governance for uploaded statements
- consent-aware and governed portfolio data workflows
- future compatibility with Account Aggregator-based information exchange models

---

## Demo and use cases

The application supports:
- uploading a sample CAS statement
- viewing a summarized health score
- exploring holdings and risk categories
- understanding red flags and portfolio causes
- testing market scenarios
- reviewing compliance-aware dashboards
- benchmarking portfolio behavior against peers

This makes it suitable for hackathon demonstration, investor-facing product storytelling, and real-world use-case validation in a securities-tech context.

---

## Value proposition

VestIQ helps convert raw financial documents into:
- better portfolio understanding
- more transparent investor advice
- faster compliance oversight
- risk-aware product discovery
- clearer and more trustworthy decision support

---

## Status

This project is currently a working product prototype / demo experience focused on:
- CAS-driven financial insight
- portfolio explainability
- risk and suitability detection
- compliance-aware investor workflows

---
