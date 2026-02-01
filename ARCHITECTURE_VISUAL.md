# AlphaVision Architecture Visual Guide

## System Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        USERS & INTERFACES                        │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────────┐   │
│  │   Web    │  Admin   │   Ops    │ Holodeck │   Verified   │   │
│  │   App    │ Console  │ Console  │    UI    │    Human     │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                         API GATEWAY                              │
│         Routes, Auth, Rate Limiting, Request Validation          │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PLATFORM KERNEL                               │
│                                                                  │
│    ┌──────────────────────────────────────────────────────┐    │
│    │         UNIVERSAL EXECUTION PIPELINE                  │    │
│    │                                                        │    │
│    │  Evidence → Simulation → Policy → Approval →          │    │
│    │  Execute → Reconcile → Audit                          │    │
│    └──────────────────────────────────────────────────────┘    │
│                                                                  │
│    ┌─────────────┬──────────────┬─────────────────────┐        │
│    │ Evidence    │  Simulation  │  Policy Decision    │        │
│    │ Registry    │   Engine     │      Point          │        │
│    └─────────────┴──────────────┴─────────────────────┘        │
│                                                                  │
│    ┌─────────────┬──────────────┬─────────────────────┐        │
│    │  Approval   │    Tool      │  Exception Queue    │        │
│    │   Service   │  Executor    │   (ROI Routing)     │        │
│    └─────────────┴──────────────┴─────────────────────┘        │
│                                                                  │
│    ┌──────────────────────────────────────────────────────┐    │
│    │        NEURO-ADAPTIVE LAYER (Cognitive Context)       │    │
│    │  Adjusts autonomy & UI based on cognitive state      │    │
│    └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DOMAIN MODULES (3 Active)                     │
│                                                                  │
│  ┌──────────────┬──────────────┬────────────────────────┐      │
│  │ Business OS  │  Finance OS  │    Concierge OS        │      │
│  │              │              │                        │      │
│  │ • Loops      │ • Loops      │    • Loops             │      │
│  │ • Tools      │ • Tools      │    • Tools             │      │
│  │ • Adapters   │ • Adapters   │    • Adapters          │      │
│  │ • Invariants │ • Invariants │    • Invariants        │      │
│  └──────────────┴──────────────┴────────────────────────┘      │
│                                                                  │
│  Modules CANNOT import each other or execute tools directly     │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                       INTEGRATION LAYER                          │
│                                                                  │
│    ┌─────────┬─────────┬─────────┬─────────┬──────────┐        │
│    │ Sendgrid│  Stripe │   CRM   │Calendar │  SMS/MMS │        │
│    │Connector│Connector│Connector│Connector│ Connector│        │
│    └─────────┴─────────┴─────────┴─────────┴──────────┘        │
│                                                                  │
│    ALL connector calls go through Tool Executor Service         │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                    AUDIT & OBSERVABILITY                         │
│                                                                  │
│  ┌──────────────┬──────────────┬────────────────────────┐      │
│  │Audit Ledger  │  Epistemic   │   Product Analytics    │      │
│  │(Immutable)   │    Ledger    │      (Events)          │      │
│  └──────────────┴──────────────┴────────────────────────┘      │
│                                                                  │
│  ┌──────────────┬──────────────┬────────────────────────┐      │
│  │ Monitoring   │   Alerts     │      Runbooks          │      │
│  │ (Metrics)    │  (SLO-based) │   (Incident Response)  │      │
│  └──────────────┴──────────────┴────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

## Execution Flow: Tool Invocation

```
┌─────────────┐
│ User Action │
│  in Web App │
└──────┬──────┘
       │
       ↓
┌────────────────────────────────────────────────────────┐
│ 1. EVIDENCE GATE                                       │
│                                                        │
│  • Collect past outcomes from Memory Palace           │
│  • Gather user context (cognitive state, preferences) │
│  • Fetch relevant data from Evidence Registry         │
│                                                        │
│  Decision: Sufficient evidence? → YES/NO              │
│  If NO → Route to Exception Queue                     │
└────────────────┬───────────────────────────────────────┘
                 │ YES
                 ↓
┌────────────────────────────────────────────────────────┐
│ 2. SIMULATION GATE                                     │
│                                                        │
│  • Generate counterfactuals (what could go wrong?)    │
│  • Run Monte Carlo simulations                        │
│  • Calculate confidence intervals                     │
│  • Predict side effects                               │
│                                                        │
│  Decision: Risk acceptable? → YES/NO                  │
│  If NO → Escalate to human OR adjust parameters       │
└────────────────┬───────────────────────────────────────┘
                 │ YES
                 ↓
┌────────────────────────────────────────────────────────┐
│ 3. POLICY GATE                                         │
│                                                        │
│  • Check RBAC (role-based access control)             │
│  • Evaluate cognitive state (neuro-adaptive)          │
│  • Check rate limits                                  │
│  • Validate against invariants                        │
│                                                        │
│  Decision: Policy allows? → YES/NO                    │
│  If NO → Deny + Audit                                 │
└────────────────┬───────────────────────────────────────┘
                 │ YES
                 ↓
┌────────────────────────────────────────────────────────┐
│ 4. APPROVAL GATE                                       │
│                                                        │
│  IF Tool Risk Tier 0-2: Skip to Execute               │
│  IF Tool Risk Tier 3-4: Human approval required       │
│                                                        │
│  • Send notification to user                          │
│  • Display simulation results                         │
│  • Wait for explicit approval                         │
│                                                        │
│  Decision: Approved? → YES/NO                         │
│  If NO → Cancel + Audit                               │
└────────────────┬───────────────────────────────────────┘
                 │ YES
                 ↓
┌────────────────────────────────────────────────────────┐
│ 5. EXECUTE GATE                                        │
│                                                        │
│  Tool Executor Service (THE ONLY EXECUTOR):           │
│  • Validate tool schema                               │
│  • Generate idempotency key                           │
│  • Execute with retries                               │
│  • Handle concurrency (optimistic locking)            │
│  • Generate receipt with hash                         │
│                                                        │
│  Result: Success + Receipt OR Failure + Reason        │
└────────────────┬───────────────────────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────────────────────┐
│ 6. RECONCILE GATE                                      │
│                                                        │
│  • Compare actual outcome vs simulation prediction    │
│  • Calculate delta                                    │
│  • Update confidence models                           │
│  • Learn from discrepancies                           │
│                                                        │
│  If major deviation → Flag for review                 │
└────────────────┬───────────────────────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────────────────────┐
│ 7. AUDIT GATE                                          │
│                                                        │
│  • Write to immutable audit ledger (append-only)      │
│  • Record in epistemic ledger if money/contract       │
│  • Emit event for product analytics                   │
│  • Update graduation ladder metrics                   │
│  • Store receipt for rollback capability              │
│                                                        │
│  Hash chain: prev_hash → event_hash → next           │
└────────────────┬───────────────────────────────────────┘
                 │
                 ↓
┌─────────────────┐
│  User notified  │
│ (with receipt)  │
└─────────────────┘
```

## Neuro-Adaptive Context Flow

```
┌──────────────────────────────────────────────────────┐
│         User Device (Privacy-First)                  │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Cognitive Profile (Encrypted at Rest)     │    │
│  │  • Executive function level                │    │
│  │  • Working memory capacity                 │    │
│  │  • Attention style (ADHD, neurotypical)    │    │
│  │  • Processing preferences (verbal/visual)  │    │
│  │  • Time perception                         │    │
│  └────────────────────────────────────────────┘    │
│                       ↓                             │
│  ┌────────────────────────────────────────────┐    │
│  │  Cognitive State Estimation                │    │
│  │  (Real-time inference, never sent to API)  │    │
│  └────────────────────────────────────────────┘    │
└──────────────────┬───────────────────────────────────┘
                   │
                   ↓
         ┌─────────────────────┐
         │  Adaptation Tokens  │
         │  (Minimal metadata) │
         └─────────┬───────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────┐
│              Platform Kernel                         │
│                                                      │
│  Tokens affect:                                      │
│  • Policy decisions (autonomy level)                 │
│  • UI complexity (components rendered)               │
│  • Information density (chunks shown)                │
│  • Guidance level (tooltips, confirmations)          │
└──────────────────────────────────────────────────────┘
```

**Example**:
- High executive function → Full autonomy, dense dashboards
- Low executive function → Guided flows, simple choices
- ADHD → Focus blinders, pictograms, visual timers

## Module Boundaries

```
┌─────────────────────────────────────────────────────────┐
│                   Business OS Module                    │
│                                                         │
│  Owns:                                                  │
│  • Customer acquisition loops                          │
│  • Retention optimization loops                        │
│  • Campaign tools (email, SMS, ads)                    │
│  • CRM sync tools                                      │
│                                                         │
│  CANNOT:                                                │
│  ✗ Import from Finance OS or Concierge OS              │
│  ✗ Execute tools directly (must use kernel)            │
│  ✗ Access other modules' data                          │
│                                                         │
│  CAN:                                                   │
│  ✓ Import from packages/ (contracts, events, etc.)     │
│  ✓ Emit events for other modules to consume            │
│  ✓ Define adapters for connectors                      │
└─────────────────────────────────────────────────────────┘
                             ↕ Events Only
┌─────────────────────────────────────────────────────────┐
│                   Finance OS Module                     │
│                                                         │
│  Owns:                                                  │
│  • Cashflow optimization loops                         │
│  • Tax reserve management                              │
│  • Payment processing tools                            │
│  • Invoice generation tools                            │
│                                                         │
│  Special: Tax Silo Isolation                           │
│  • Dedicated schema                                    │
│  • Extra audit logging                                 │
│  • Epistemic ledger required                           │
└─────────────────────────────────────────────────────────┘
                             ↕ Events Only
┌─────────────────────────────────────────────────────────┐
│                 Concierge OS Module                     │
│                                                         │
│  Owns:                                                  │
│  • Personalization loops                               │
│  • Scheduling tools                                    │
│  • Preference learning                                 │
│  • Context management                                  │
│                                                         │
│  Integrates with: Neuro-Adaptive Package                │
│  (Uses cognitive state for personalization)             │
└─────────────────────────────────────────────────────────┘
```

**Enforcement**: `scripts/check-boundaries.ts` validates at build time

## Exception Queue Routing

```
                    ┌──────────────┐
                    │ Edge Case    │
                    │  Detected    │
                    └──────┬───────┘
                           │
                           ↓
        ┌──────────────────────────────────────┐
        │     Calculate ROI Score              │
        │                                      │
        │  Factors:                            │
        │  • Financial impact                  │
        │  • User frustration level            │
        │  • Learning opportunity value        │
        │  • Urgency (SLA risk)                │
        └──────┬───────────────────────────────┘
               │
               ↓
        ┌──────────────┐
        │ Score > 80?  │
        └──────┬───────┘
               │
       ┌───────┴────────┐
       │                │
      YES              NO
       │                │
       ↓                ↓
┌──────────────┐  ┌──────────────┐
│ Route to     │  │  Auto-learn  │
│ Human Queue  │  │  + Resolve   │
│ (Slack/Email)│  │  Heuristic   │
└──────┬───────┘  └──────┬───────┘
       │                 │
       ↓                 ↓
┌──────────────┐  ┌──────────────┐
│ Human        │  │  Update      │
│ Resolves +   │  │  Policies    │
│ Provides     │  │  Automatically│
│ Reasoning    │  └──────────────┘
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ Policy       │
│ Learning     │
│ (ML Update)  │
└──────────────┘
```

## Data Flow: Money Movement

```
User initiates payment
       ↓
Evidence Gate: Check account balance, past transactions
       ↓
Simulation: Project cashflow impact, tax implications
       ↓
Policy: Check daily limit, fraud rules, tax silo access
       ↓
Approval: IF > $1000 → Human approval required
       ↓
EPISTEMIC LEDGER ENTRY (Required for money movement)
       ↓
Execute: Stripe API call via Tool Executor
       ↓
Reconcile: Verify charge ID, amount matches
       ↓
Audit: Write to immutable ledger + tax silo
       ↓
Receipt generated (contains: rollback instructions, hash, timestamp)
```

**Special**: All financial data goes to Tax Silo (isolated schema + extra controls)

## Graduation Ladder

```
User/Feature starts here
       ↓
┌────────────────────────────────┐
│  SUPERVISED MODE               │
│  • All actions require approval│
│  • High evidence threshold     │
│  • Simulations always run      │
│  • Full audit trail            │
└────────┬───────────────────────┘
         │ After N successful actions
         │ With low prediction error
         ↓
┌────────────────────────────────┐
│  SEMI-AUTONOMOUS MODE          │
│  • Low-risk actions auto-run   │
│  • High-risk need approval     │
│  • Periodic human review       │
└────────┬───────────────────────┘
         │ After M successful actions
         │ With high confidence
         ↓
┌────────────────────────────────┐
│  AUTONOMOUS MODE               │
│  • All tier 0-2 tools auto-run │
│  • Tier 3-4 still need approval│
│  • Exception queue handles edge│
│  • Continuous monitoring       │
└────────────────────────────────┘
```

**Graduation Criteria**: Configurable per tool, per user, per domain

---

Use this visual guide to understand system flow and architectural boundaries.
