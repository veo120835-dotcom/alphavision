# Architecture Reorganization: From Flat Structure to God Tier Monorepo

## Executive Summary

This document outlines the complete reorganization of AlphaVision from a flat Vite/React application into a comprehensive monorepo implementing the "God Tier" autonomous operating system architecture.

**Timeline**: Phased migration over 13 phases
**Impact**: Structural transformation, no functionality loss
**Goal**: Production-ready autonomous OS with universal safety controls

## Current State Analysis

### Existing Structure
```
alphavision/
├── src/                    # 130+ components, 40+ domain folders
├── supabase/              # Database migrations and functions
├── scripts/               # Utility scripts
├── docs/                  # Documentation
├── public/                # Static assets
└── [config files]         # Vite, TypeScript, Tailwind configs
```

### Pain Points
1. **No module boundaries**: All code in flat src/ structure
2. **No safety gates**: Direct connector calls without validation
3. **No execution pipeline**: Actions bypass evidence/approval stages
4. **No tool abstraction**: Logic tightly coupled to connectors
5. **No service boundaries**: Monolithic structure
6. **No neuro-adaptive support**: Missing accessibility features
7. **No audit trail**: Limited traceability
8. **No exception handling**: No systematic edge case management

## Target State Architecture

### Monorepo Structure
```
alphavision/
├── apps/              # 13 applications (web, admin, ops, etc.)
├── packages/          # 15 shared libraries
├── services/          # 24 microservices
├── modules/           # 3 active domains + 4 deprecated
├── configs/           # Configuration as code
├── database/          # Migrations, functions, seeds
├── tests/             # All test types
├── scripts/           # Validation and enforcement
├── infra/             # Infrastructure as code
├── observability/     # Dashboards, alerts, runbooks
├── releases/          # Rollout and rollback plans
├── docs/              # Architecture and operational docs
└── FULLDOCS/          # Comprehensive documentation
```

### Core Architectural Pillars

#### 1. Module Isolation (3 Active Domains)
```
modules/
├── business-os/       # Customer acquisition, retention, campaigns
├── finance-os/        # Cashflow, tax reserves, reinvestment
├── concierge-os/      # Personalization, scheduling
├── advisory-os/       # DEPRECATED
├── health-os/         # DEPRECATED
├── wearable-os/       # DEPRECATED
└── va/                # DEPRECATED
```

**Rules**:
- Modules CANNOT import from other modules
- Modules communicate via events only
- Module manifest required

#### 2. Tool Execution Model
```
Everything is a tool → All tools go through tool-executor service
```

**Before**: `src/components/EmailCampaign.tsx` calls `sendgrid.send()` directly

**After**:
```typescript
// modules/business-os/tools/send-campaign.tool.ts
export const SendCampaignTool = {
  schema: SendCampaignSchema,
  riskTier: 2,
  rateLimits: { perHour: 100 }
};

// Execution via kernel
await kernel.executeTool('send-campaign', params, context);
  ↓
services/tool-executor validates, executes, generates receipt
  ↓
Rollback available via receipt.id
```

#### 3. Universal Execution Pipeline
```
Evidence → Simulation → Policy → Approval → Execute → Reconcile → Audit
```

Every action must traverse all stages:

1. **Evidence Gate**: Collect required evidence (past outcomes, user context)
2. **Simulation Gate**: Generate counterfactuals (what could go wrong?)
3. **Policy Gate**: Check PDP (is this allowed?)
4. **Approval Gate**: Human approval if high risk (tier 3-4)
5. **Execute Gate**: Idempotent execution with receipt
6. **Reconcile Gate**: Compare actual vs expected
7. **Audit Gate**: Write to immutable ledger

**Enforcement**: `scripts/check-tool-invocations.ts` fails build if bypass detected

#### 4. Neuro-Adaptive Platform Capability

Cognitive state affects policy and UI:

```typescript
const { executiveFunction, workingMemory, attention } = useCognitiveContext();

// Policy adapts
if (executiveFunction === 'low') {
  requireHumanApproval = true;
  showGuidedFlow = true;
}

// UI adapts
if (attention === 'deficit') {
  return <FocusBlinders><PictogramButton /></FocusBlinders>;
}
```

**Privacy**: Cognitive profiles never leave device, encrypted at rest

### Service Architecture

#### Critical Services

| Service | Purpose | Dependencies |
|---------|---------|--------------|
| **tool-executor** | The ONLY way tools execute | policy-engine, evidence-registry |
| **policy-engine** | Policy decision point (PDP) | kernel, contracts |
| **approval-service** | Human-in-the-loop gate | notification, auth |
| **evidence-registry** | Evidence capture & verification | audit-ledger |
| **exception-queue** | Edge case routing with ROI | brain-core, approval-service |
| **simulation-engine** | Counterfactual generation | memory-palace, brain-core |
| **audit-immutability** | Append-only hash chain | database |

**Canonical Service Registry**: `configs/runtime/services.registry.json`

**Enforcement**: `scripts/check-service-duplication.ts` prevents duplicates

### Package Architecture

#### Core Packages

| Package | Purpose | Consumers |
|---------|---------|-----------|
| **@alphavision/kernel** | Execution pipeline runtime | All services |
| **@alphavision/tool-definitions** | Tool schemas, risk tiers | tool-executor, modules |
| **@alphavision/contracts** | All typed schemas | All apps, services, modules |
| **@alphavision/events** | Typed event definitions | All services |
| **@alphavision/neuro-adaptive** | Cognitive state engine | web, admin, ops apps |
| **@alphavision/audit-ledger** | Append-only hash chain | audit-immutability service |
| **@alphavision/policy-engine** | Policy evaluation logic | policy-engine service |

### Configuration as Code

All configuration in version control:

```
configs/
├── architecture/
│   ├── module-boundaries.json      # Single source of truth
│   └── service-boundaries.json
├── policy/
│   ├── approval.policies.json
│   ├── epistemic.policies.json
│   ├── tax-silo.policies.json
│   └── rbac.matrix.json
├── tool-registry/
│   ├── tools.registry.json         # All tool definitions
│   └── risk-tiers.json
├── runtime/
│   ├── services.registry.json      # Canonical vs deprecated
│   ├── kill-switch.json
│   └── go-live-checklist.json
└── invariants/
    ├── money-movement.invariants.json
    └── campaign.invariants.json
```

## Migration Strategy

### Phased Approach

#### Phase 1-2: Foundation (Root Config + Docs)
- Create monorepo configs (pnpm, turbo, nx, biome)
- Create core documentation (AI_PROMPT, ARCH_REVIEW, etc.)
- Update package.json for workspaces

#### Phase 3-5: Infrastructure (Packages, Services, Modules)
- Create all packages with proper exports
- Create all services with manifests
- Create module structure with boundaries

#### Phase 6: Apps Migration
- Move `src/` → `apps/web/src/`
- Extract admin components → `apps/admin-console/`
- Extract ops components → `apps/ops-console/`
- Create new onboarding flows with neuro-adaptive components

#### Phase 7-9: Configuration, Database, Tests
- Populate all config files
- Migrate supabase/ → database/
- Set up test infrastructure

#### Phase 10-11: Enforcement & Infra
- Create boundary checking scripts
- Set up Terraform, K8s, monitoring

#### Phase 12-13: Documentation & Validation
- Complete architecture docs and runbooks
- Run all validation checks

### Backwards Compatibility

**Preserved**:
- All existing components stay functional in apps/web/
- Supabase connection maintained
- Environment variables unchanged
- Build output location compatible

**Breaking Changes**:
- Import paths change (use path aliases)
- Direct connector calls fail (use tool executor)
- Module cross-imports fail (emit events instead)

### Rollback Plan

Each phase is independently committable:
1. Phases 1-2: Additive only, zero risk
2. Phases 3-5: New directories, no file moves
3. Phase 6: Git move preserves history
4. Revert via `git revert <commit>`

## Validation Gates

### Pre-Commit Checks

```bash
make validate
```

Runs:
1. `check-boundaries.ts`: Module/service boundary violations
2. `check-tool-invocations.ts`: Direct connector calls
3. `check-service-duplication.ts`: Duplicate services

### CI Pipeline

```bash
./scripts/ci-gates.sh
```

Includes:
- Boundary validation
- Type checking
- Linting
- Unit tests
- Safety tests (execution pipeline, invariants)
- Build verification

### Go-Live Checklist

`configs/runtime/go-live-checklist.json` enforces:
- [ ] All services have manifests
- [ ] All modules have boundaries documented
- [ ] All tools in registry
- [ ] Epistemic ledger operational
- [ ] Exception queue routing working
- [ ] Kill switches accessible
- [ ] Rollback tested
- [ ] Monitoring configured
- [ ] Runbooks published

## Success Criteria

### Functional
- [ ] All existing features work in apps/web/
- [ ] Monorepo builds successfully
- [ ] Tests pass
- [ ] Development server starts

### Architectural
- [ ] Module boundaries enforced
- [ ] All tools go through executor
- [ ] Execution pipeline enforced
- [ ] Service registry canonical
- [ ] Configs are single source of truth

### Operational
- [ ] Boundary scripts pass
- [ ] CI gates pass
- [ ] Documentation complete
- [ ] Team trained

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Import path breaks | Path aliases in tsconfig.base.json |
| Build failures | Incremental migration, keep old build working |
| Test failures | Run tests per phase |
| Performance regression | Load testing before prod |
| Team confusion | Comprehensive docs + training |
| Data loss | No database changes until Phase 8, with rollback |

## Training Plan

### For Developers
1. Read AI_PROMPT.md
2. Review ARCH_REVIEW_CHECKLIST.md
3. Study execution pipeline
4. Practice adding a tool
5. Practice adding a loop

### For Operators
1. Review runbooks in docs/runbooks/
2. Test kill switches in ops-console
3. Practice incident response
4. Run disaster recovery drills

## Timeline Estimate

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| 1-2 | 1 day | None |
| 3-5 | 3 days | Phase 1-2 |
| 6 | 2 days | Phase 3-5 |
| 7-9 | 2 days | Phase 6 |
| 10-11 | 2 days | Phase 7-9 |
| 12-13 | 1 day | All previous |

**Total**: ~11 days for core migration + ongoing refinement

## Next Steps

1. Review and approve this document
2. Begin Phase 1-2 (foundation)
3. Validate monorepo builds
4. Proceed to Phase 3
5. Continuous validation at each phase

---

**Approval Required**: Architecture Review Board, Tech Lead, Engineering Manager
