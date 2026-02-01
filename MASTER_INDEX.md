# AlphaVision Master Index

## Repository Structure

This is the master index for navigating the AlphaVision monorepo. Use this as your starting point.

## Quick Links

### For New Team Members
1. Start here: [AI_PROMPT.md](./AI_PROMPT.md) - Understand the system
2. Then read: [ARCHITECTURE_REORGANIZATION.md](./ARCHITECTURE_REORGANIZATION.md) - Learn the structure
3. Review: [ARCH_REVIEW_CHECKLIST.md](./ARCH_REVIEW_CHECKLIST.md) - Know the standards
4. Study: [ARCHITECTURE_VISUAL.md](./ARCHITECTURE_VISUAL.md) - See the flow

### For Developers
- Adding a feature? Read [AI_PROMPT.md](./AI_PROMPT.md) first
- Before committing? Check [ARCH_REVIEW_CHECKLIST.md](./ARCH_REVIEW_CHECKLIST.md)
- Understanding failures? See [FAILURE_MODES.md](./FAILURE_MODES.md)
- Security question? Check [SECURITY.md](./SECURITY.md)

### For Operators
- Incident response? [docs/runbooks/INCIDENT_RESPONSE.md](./docs/runbooks/INCIDENT_RESPONSE.md)
- Disaster recovery? [docs/runbooks/DISASTER_RECOVERY.md](./docs/runbooks/DISASTER_RECOVERY.md)
- System health? Open ops-console dashboard

### For Leadership
- Product status? [CHANGELOG.md](./CHANGELOG.md)
- Architecture decisions? [ARCHITECTURE_REORGANIZATION.md](./ARCHITECTURE_REORGANIZATION.md)
- Security posture? [SECURITY.md](./SECURITY.md)
- Privacy compliance? [PRIVACY.md](./PRIVACY.md)

## Directory Guide

### `/apps/` - User-Facing Applications

| App | Purpose | Port | Status |
|-----|---------|------|--------|
| `apps/web/` | Main user application | 5173 | Active |
| `apps/admin-console/` | Admin dashboard | 5174 | Planned |
| `apps/ops-console/` | Operations dashboard | 5175 | Planned |
| `apps/holodeck-ui/` | Simulation interface | 5176 | Planned |
| `apps/system-map-console/` | System visualization | 5177 | Planned |
| `apps/verified-human-console/` | Verification UI | 5178 | Planned |

### `/packages/` - Shared Libraries

| Package | Purpose | Consumers |
|---------|---------|-----------|
| `@alphavision/kernel` | Execution pipeline runtime | All services |
| `@alphavision/tool-definitions` | Tool schemas & risk tiers | tool-executor, modules |
| `@alphavision/contracts` | TypeScript type definitions | All workspaces |
| `@alphavision/events` | Event definitions | All services |
| `@alphavision/neuro-adaptive` | Cognitive state engine | web, admin apps |
| `@alphavision/audit-ledger` | Append-only hash chain | audit service |
| `@alphavision/ui` | Shared UI components | All apps |

### `/services/` - Backend Microservices

| Service | Purpose | Critical? |
|---------|---------|-----------|
| `tool-executor` | **The ONLY way tools execute** | YES |
| `policy-engine` | Policy decision point (PDP) | YES |
| `evidence-registry` | Evidence capture & verification | YES |
| `approval-service` | Human-in-the-loop gate | YES |
| `exception-queue` | Edge case routing | YES |
| `simulation-engine` | Counterfactual generation | YES |
| `audit-immutability` | Immutable audit ledger | YES |

### `/modules/` - Domain Logic

| Module | Status | Purpose |
|--------|--------|---------|
| `business-os` | **Active** | Customer acquisition, retention, campaigns |
| `finance-os` | **Active** | Cashflow optimization, tax, reinvestment |
| `concierge-os` | **Active** | Personalization, scheduling |
| `advisory-os` | Deprecated | See DEPRECATED.md |
| `health-os` | Deprecated | See DEPRECATED.md |
| `wearable-os` | Deprecated | See DEPRECATED.md |
| `va` | Deprecated | See DEPRECATED.md |

### `/configs/` - Configuration as Code

| Config | Purpose |
|--------|---------|
| `configs/architecture/` | Module & service boundaries |
| `configs/policy/` | Approval, RBAC, epistemic policies |
| `configs/tool-registry/` | Tool schemas & risk tiers |
| `configs/runtime/` | Service registry, kill switches |
| `configs/invariants/` | Domain invariants |

### `/database/` - Schema & Migrations

- `database/migrations/` - SQL migration files
- `database/functions/` - Stored procedures
- `database/seeds/` - Test data

### `/tests/` - All Test Types

- `tests/unit/` - Unit tests
- `tests/integration/` - Service integration tests
- `tests/e2e/` - End-to-end tests
- `tests/contract/` - API contract tests
- `tests/safety/` - Execution pipeline & invariant tests
- `tests/chaos/` - Chaos engineering tests
- `tests/redteam/` - Adversarial tests

### `/scripts/` - Automation & Validation

- `scripts/check-boundaries.ts` - Module/service boundary validation
- `scripts/check-tool-invocations.ts` - Tool execution validation
- `scripts/check-service-duplication.ts` - Service registry validation
- `scripts/ci-gates.sh` - CI/CD validation gates

### `/docs/` - Documentation

- `docs/architecture/` - Architecture deep dives
- `docs/runbooks/` - Operational procedures

## Architecture Layers (Top to Bottom)

```
1. User Interfaces (apps/)
   ↓
2. API Gateway (apps/api-gateway/)
   ↓
3. Platform Kernel (packages/kernel/)
   ↓
4. Domain Modules (modules/business-os, finance-os, concierge-os)
   ↓
5. Core Services (services/tool-executor, policy-engine, etc.)
   ↓
6. Integration Layer (services/connectors/)
   ↓
7. Audit & Observability (packages/audit-ledger, observability/)
```

## Key Concepts

### Universal Execution Pipeline
```
Evidence → Simulation → Policy → Approval → Execute → Reconcile → Audit
```
Every action must traverse all 7 stages. No exceptions.

### Tool Execution Model
- Everything is a tool
- Tools have risk tiers (0-4)
- ALL tools go through `services/tool-executor`
- NO direct connector calls

### Module Boundaries
- 3 active domains: business-os, finance-os, concierge-os
- Modules CANNOT import from each other
- Modules communicate via events only

### Neuro-Adaptive Platform
- Cognitive state affects policy & UI
- Privacy-first: profiles stay on device
- Adaptation tokens sent to API (minimal metadata)

## Development Workflow

### Adding a New Feature

1. **Understand boundaries**: Read module/service boundaries in configs/
2. **Choose location**: Which module owns this feature?
3. **Define tool** (if applicable): Add to packages/tool-definitions/
4. **Implement loop**: Add to modules/{module}/loops/
5. **Update manifests**: Update MODULE_MANIFEST.json
6. **Write tests**: Add to tests/safety/, tests/unit/
7. **Run validation**: `make validate`
8. **Code review**: Use ARCH_REVIEW_CHECKLIST.md
9. **Deploy**: Follow rollout plan

### Running the System

```bash
# Install dependencies
make install

# Start dev servers
make dev

# Run tests
make test

# Validate boundaries
make validate

# Build for production
make build
```

### Emergency Procedures

#### System is down
1. Check ops-console for health status
2. Review recent deployments
3. Check kill switches (are any active?)
4. Follow docs/runbooks/INCIDENT_RESPONSE.md

#### Security incident
1. Activate appropriate kill switch
2. Contact security@alphavision.com
3. Follow docs/runbooks/INCIDENT_RESPONSE.md
4. Review SECURITY.md for breach notification

#### Data loss
1. DO NOT panic
2. Activate read-only mode
3. Follow docs/runbooks/DISASTER_RECOVERY.md
4. Restore from backup (PITR)

## Configuration Files

### Root Configuration
- `package.json` - Monorepo root, workspace definitions
- `pnpm-workspace.yaml` - Workspace configuration
- `turbo.json` - Build pipeline orchestration
- `nx.json` - Affected commands
- `tsconfig.base.json` - Shared TypeScript config
- `biome.json` - Linting & formatting
- `docker-compose.yml` - Local development environment

### Build Tools
- `Makefile` - Common commands
- `vitest.workspace.ts` - Test workspace configuration

## Documentation Map

### Root Documentation
- [AI_PROMPT.md](./AI_PROMPT.md) - AI agent instructions
- [ARCH_REVIEW_CHECKLIST.md](./ARCH_REVIEW_CHECKLIST.md) - Review checklist
- [ARCHITECTURE_REORGANIZATION.md](./ARCHITECTURE_REORGANIZATION.md) - Migration plan
- [ARCHITECTURE_VISUAL.md](./ARCHITECTURE_VISUAL.md) - Visual architecture guide
- [FAILURE_MODES.md](./FAILURE_MODES.md) - Failure scenarios & mitigations
- [SECURITY.md](./SECURITY.md) - Security architecture
- [PRIVACY.md](./PRIVACY.md) - Privacy policy & architecture
- [CHANGELOG.md](./CHANGELOG.md) - Version history
- [MASTER_INDEX.md](./MASTER_INDEX.md) - This file
- [README.md](./README.md) - Quick start guide

### Architecture Documentation
- [docs/architecture/SERVICE_BOUNDARIES.md](./docs/architecture/SERVICE_BOUNDARIES.md)
- [docs/architecture/MODULE_BOUNDARIES.md](./docs/architecture/MODULE_BOUNDARIES.md)
- [docs/architecture/TOOL_EXECUTION_MODEL.md](./docs/architecture/TOOL_EXECUTION_MODEL.md)
- [docs/architecture/EVIDENCE_PIPELINE.md](./docs/architecture/EVIDENCE_PIPELINE.md)

### Operational Documentation
- [docs/runbooks/INCIDENT_RESPONSE.md](./docs/runbooks/INCIDENT_RESPONSE.md)
- [docs/runbooks/ON_CALL.md](./docs/runbooks/ON_CALL.md)
- [docs/runbooks/ROLLBACK.md](./docs/runbooks/ROLLBACK.md)
- [docs/runbooks/DISASTER_RECOVERY.md](./docs/runbooks/DISASTER_RECOVERY.md)
- [docs/runbooks/PITR_DRILLS.md](./docs/runbooks/PITR_DRILLS.md)

## Glossary

- **Execution Pipeline**: 7-stage flow all actions traverse
- **Tool**: Abstraction for external action (email, payment, etc.)
- **Tool Executor**: Service that executes all tools
- **Risk Tier**: 0-4 scale for tool risk (0=safe, 4=dangerous)
- **Receipt**: Record of tool execution with rollback info
- **Module**: Domain-specific business logic (business-os, finance-os, concierge-os)
- **Service**: Backend microservice
- **Package**: Shared library
- **App**: User-facing application
- **Kernel**: Platform runtime (execution pipeline)
- **Evidence Gate**: First pipeline stage, collects evidence
- **Simulation Gate**: Second stage, generates counterfactuals
- **Policy Gate**: Third stage, checks permissions
- **Approval Gate**: Fourth stage, human approval if needed
- **Execute Gate**: Fifth stage, idempotent execution
- **Reconcile Gate**: Sixth stage, actual vs expected
- **Audit Gate**: Seventh stage, immutable record
- **Epistemic Ledger**: Provenance chain for high-risk decisions
- **Exception Queue**: Routing for edge cases
- **Graduation Ladder**: Supervised → Semi-autonomous → Autonomous
- **Neuro-Adaptive**: UI/policy adapts to cognitive state
- **Cognitive Profile**: User's cognitive traits (ADHD, executive function, etc.)
- **Adaptation Tokens**: Minimal metadata sent to API (not full profile)
- **Tax Silo**: Isolated schema for financial data
- **Kill Switch**: Emergency stop for autonomous actions
- **PITR**: Point-in-time recovery
- **RBAC**: Role-based access control
- **PDP**: Policy decision point

## Support

- **Technical questions**: eng@alphavision.com
- **Security issues**: security@alphavision.com
- **Privacy questions**: privacy@alphavision.com
- **Incidents**: PagerDuty (on-call engineer)

## Contributing

1. Read [AI_PROMPT.md](./AI_PROMPT.md)
2. Choose an issue or feature
3. Follow development workflow above
4. Use [ARCH_REVIEW_CHECKLIST.md](./ARCH_REVIEW_CHECKLIST.md)
5. Submit PR with clear description
6. Pass CI gates (validation, tests, builds)
7. Code review by 2+ engineers
8. Merge after approval

---

**Welcome to AlphaVision!** This is a complex system. Take your time to understand it. Ask questions. We're here to help.
