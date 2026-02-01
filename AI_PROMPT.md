# AlphaVision AI Prompt

## System Context
AlphaVision is an autonomous operating system implementing a "God Tier" architecture with universal safety controls, evidence-based execution, and neuro-adaptive capabilities.

## Core Architecture Principles

### 1. Three Domain Modules Only
- **business-os**: Customer acquisition, retention, campaign optimization
- **finance-os**: Cashflow optimization, tax reserves, reinvestment
- **concierge-os**: Personalization, scheduling, preferences

**Deprecated modules** (read-only): advisory-os, health-os, wearable-os, va

### 2. Everything is a Tool
- All actions must be defined as tools with risk tiers (0-4)
- Tools have schemas, receipts, rate limits, and rollback capabilities
- NO direct connector calls - everything goes through `tool-executor` service

### 3. Universal Execution Pipeline
Every action follows this immutable flow:
```
Evidence → Simulation → Policy → Approval → Execute → Reconcile → Audit
```

### 4. Neuro-Adaptive as Platform Capability
- Cognitive state (focus, working memory, executive function) affects policy and autonomy
- Privacy-first: sensitive data never leaves user device
- Adaptation tokens control UI complexity and information density

## Monorepo Structure

```
alphavision/
├── apps/          # User-facing applications
├── packages/      # Shared libraries and SDKs
├── services/      # Backend microservices
├── modules/       # Domain-specific business logic
├── configs/       # Configuration as code
├── database/      # Schema and migrations
├── tests/         # All test types
├── scripts/       # Automation and validation
├── infra/         # Infrastructure as code
└── docs/          # Architecture and runbooks
```

## Critical Constraints

### Module Boundaries
- Modules CANNOT import from other modules
- Modules CANNOT execute tools directly
- All tool execution must go through `services/tool-executor`

### Service Boundaries
- Check `configs/runtime/services.registry.json` for canonical services
- NO duplicate service functionality
- Services communicate via events only

### Safety Gates
- All money movement requires epistemic ledger entry
- High-risk tools (tier 3-4) require human approval
- Exception queue captures edge cases with ROI scoring

## When Generating Code

### DO:
✅ Use TypeScript with strict mode
✅ Export types from `packages/contracts`
✅ Emit events to `packages/events`
✅ Use tool schemas from `packages/tool-definitions`
✅ Follow execution pipeline stages
✅ Include receipts for all tool executions
✅ Respect cognitive state from neuro-adaptive context

### DON'T:
❌ Call connectors directly (use tool-executor)
❌ Import from other modules
❌ Bypass approval gates
❌ Skip evidence or audit stages
❌ Create duplicate services
❌ Store PII without classification
❌ Execute without idempotency keys

## Testing Requirements

All code must have:
- Unit tests in `tests/unit/`
- Contract tests for service boundaries
- Safety tests for execution pipeline
- Chaos tests for failure modes

## Documentation Requirements

Every service needs:
- `service.manifest.json` with dependencies and capabilities
- Threat model in `APP_THREAT_MODEL.md`
- Runbook for incidents

Every module needs:
- `MODULE_MANIFEST.json` with loops and tools
- Domain invariants documented

## Validation Commands

Before committing:
```bash
make check-boundaries  # Validate module/service boundaries
make check-tools       # Ensure tools go through executor
make check-services    # Check for duplication
make validate          # Run all checks
```

## Emergency Procedures

### Kill Switches
Located in `apps/ops-console/src/pages/KillSwitches.tsx`
- Global pause: Halt all autonomous actions
- Domain pause: Stop specific module
- Tool pause: Disable specific tool type

### Rollback
All tool executions are reversible via receipts:
```typescript
await toolExecutor.rollback(receipt);
```

## Privacy & Security

### PII Classification
- Level 0: Public data
- Level 1: Aggregate metrics
- Level 2: Pseudonymized data
- Level 3: PII (encrypted at rest)
- Level 4: Biometric/health data (encrypted + access logs)

### Epistemic Ledger
Required for:
- Money movement
- Contract signatures
- Campaign launches
- Policy changes

### Tax Silo
Financial data has additional isolation:
- Dedicated schema
- Separate access controls
- Audit trail required

## Neuro-Adaptive Features

### Cognitive States
- **High Executive Function**: Full autonomy, dense information
- **Low Executive Function**: Guided flows, reduced choices
- **Attention Deficit**: Focus blinders, pictograms, timers
- **Working Memory Overload**: Chunking, progressive disclosure

### Adaptation Components
- `FocusBlinders.tsx`: Reduce visual noise
- `PictogramButton.tsx`: Icon-based actions
- `VisualTimer.tsx`: Time awareness
- `AdaptationOverlay.tsx`: Context-aware UI changes

## AI Agent Instructions

When working on AlphaVision:

1. **Read the boundaries first**: Check `configs/architecture/module-boundaries.json`
2. **Understand the tool model**: Review `packages/tool-definitions`
3. **Follow the pipeline**: Never bypass execution stages
4. **Respect privacy**: Check PII classification before storing
5. **Emit events**: Document state changes
6. **Generate receipts**: Make actions reversible
7. **Test safety**: Include invariant checks

## Common Patterns

### Adding a New Tool
1. Define schema in `packages/tool-definitions/src/schemas/`
2. Assign risk tier (0-4)
3. Implement executor in `services/tool-executor/`
4. Add to registry in `configs/tool-registry/tools.registry.json`
5. Write safety tests

### Adding a New Loop
1. Create in appropriate module (`modules/business-os/loops/`)
2. Define evidence requirements
3. Specify graduation criteria
4. Implement exception handlers
5. Add to module manifest

### Handling Exceptions
1. Capture in `services/exception-queue`
2. Assign ROI score
3. Route to human if score > threshold
4. Learn from resolution
5. Update policies

## Success Metrics

- **Safety**: Zero money movement without evidence
- **Autonomy**: Graduation rate from supervised → autonomous
- **Privacy**: Zero PII leaks
- **Reliability**: 99.9% idempotent execution success
- **Accessibility**: Neuro-adaptive feature adoption rate

---

**Remember**: This is a safety-critical system. When in doubt, ask for human approval.
