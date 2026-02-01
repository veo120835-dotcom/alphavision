# Failure Modes & Mitigation Strategies

## Critical Failure Scenarios

### 1. Tool Execution Bypass

**Failure**: Code directly calls connector instead of going through tool-executor service

**Impact**: 
- No audit trail
- No rollback capability
- No rate limiting
- No policy enforcement
- Potential security breach

**Detection**:
```bash
npm run check-tools
# Scans for direct imports of connector libraries outside tool-executor
```

**Prevention**:
- CI gate fails build if bypass detected
- Code review checklist item
- ESLint rule forbidding direct connector imports

**Mitigation if occurs**:
1. Identify all affected executions (no receipts generated)
2. Manual audit of actions taken
3. Rollback if possible (manual)
4. Hotfix to route through tool-executor
5. Post-mortem: Update detection scripts

---

### 2. Module Boundary Violation

**Failure**: Module A imports code from Module B

**Impact**:
- Tight coupling
- Circular dependencies
- Impossible to reason about domain boundaries
- Module cannot be deprecated/replaced independently

**Detection**:
```bash
npm run check-boundaries
# Parses import statements, fails if cross-module import found
```

**Prevention**:
- CI gate enforcement
- Module manifest validation
- Code review

**Mitigation if occurs**:
1. Extract shared logic to packages/
2. Communicate via events instead
3. Refactor to use kernel for coordination
4. Update module manifests

---

### 3. Execution Pipeline Stage Skip

**Failure**: Action bypasses one or more pipeline stages (e.g., no simulation, no approval)

**Impact**:
- Unapproved actions execute
- No counterfactual analysis
- Missing audit trail
- Policy violations undetected

**Detection**:
- Pipeline enforces strict ordering
- Each stage logs to audit ledger
- Missing stage = missing log entry = alarm

**Prevention**:
- Kernel enforces all stages
- Cannot skip stages programmatically
- Tests verify pipeline integrity

**Mitigation if occurs**:
1. Immediate kill switch activation
2. Audit all recent actions for missing stages
3. Rollback high-risk actions
4. Root cause analysis
5. Fix kernel logic
6. Re-run affected actions through full pipeline

---

### 4. Epistemic Ledger Not Updated

**Failure**: Money movement or contract signature occurs without epistemic ledger entry

**Impact**:
- No provenance chain
- Cannot verify intent
- Regulatory compliance failure
- Impossible to detect tampering

**Detection**:
- Policy engine checks for epistemic entry before allowing high-risk tools
- Audit: Cross-reference tool receipts with epistemic ledger

**Prevention**:
- Hard requirement in policy config
- Kernel blocks execution if epistemic entry missing
- Tests verify epistemic ledger updates

**Mitigation if occurs**:
1. Immediate halt of all financial tools
2. Backfill epistemic entries from audit ledger
3. Verify data integrity
4. Re-enable tools only after verification
5. Add redundant checks

---

### 5. Exception Queue Overflow

**Failure**: Too many edge cases routed to human, humans cannot keep up

**Impact**:
- SLA breaches
- User frustration
- Bottleneck in autonomous operations
- Human burnout

**Detection**:
- Monitor queue depth
- Alert if > 100 items or wait time > 4 hours

**Prevention**:
- ROI scoring prioritizes high-value items
- Auto-resolution heuristics for common patterns
- Policy learning reduces future exceptions
- Capacity planning for human reviewers

**Mitigation if occurs**:
1. Increase ROI threshold temporarily (only route critical items)
2. Add temporary human reviewers
3. Identify patterns in exceptions
4. Update policies to auto-handle common cases
5. Improve simulation accuracy to reduce surprises

---

### 6. Neuro-Adaptive Privacy Leak

**Failure**: Cognitive profile data sent to API or logged

**Impact**:
- Privacy violation (HIPAA/ADA concerns)
- User trust destroyed
- Legal liability
- Cannot be undone (data already leaked)

**Detection**:
- Network monitoring: Alert on cognitive profile payloads
- Log scrubbing: Check for PII classification level 4
- Runtime checks: Assert cognitive data stays on device

**Prevention**:
- Cognitive profiles encrypted at rest on device only
- Only adaptation tokens (minimal metadata) sent to API
- Code review for any neuro-adaptive code
- Tests verify no network calls with profile data

**Mitigation if occurs**:
1. Immediate disclosure to affected users
2. Purge any logged cognitive data
3. Revoke API keys that received data
4. Legal review
5. Enhanced runtime checks
6. Third-party security audit

---

### 7. Tool Receipt Corruption

**Failure**: Receipt hash does not match stored receipt, indicating tampering

**Impact**:
- Cannot trust audit trail
- Rollback may fail
- Integrity of system questioned
- Potential fraud

**Detection**:
- Hash chain validation on every read
- Periodic integrity checks
- Receipts signed with private key

**Prevention**:
- Append-only database (no updates/deletes)
- Receipts include previous hash (blockchain-style)
- Cryptographic signatures
- Redundant storage (multiple backups)

**Mitigation if occurs**:
1. Immediate read-only mode
2. Identify extent of corruption (which receipts affected)
3. Restore from last known good backup
4. Forensic analysis (how did tampering occur?)
5. Security incident response
6. Notify regulators if financial data affected

---

### 8. Service Duplication

**Failure**: Two services implement same functionality (e.g., two policy engines)

**Impact**:
- Inconsistent behavior
- Wasted resources
- Confusion about canonical service
- Duplicate maintenance burden

**Detection**:
```bash
npm run check-services
# Compares service manifests, flags duplicate capabilities
```

**Prevention**:
- Service registry as single source of truth
- Architecture review before new service
- CI gate enforcement

**Mitigation if occurs**:
1. Identify canonical service (usually older, more battle-tested)
2. Mark duplicate as deprecated
3. Migrate all callers to canonical service
4. Decommission duplicate
5. Update service registry

---

### 9. Kill Switch Inaccessible

**Failure**: During incident, ops team cannot access kill switch dashboard

**Impact**:
- Cannot halt runaway autonomous actions
- Damage continues to accumulate
- Loss of control

**Detection**:
- Regular drills (quarterly)
- Synthetic monitoring of kill switch endpoint

**Prevention**:
- Multiple access paths (UI, API, CLI)
- Offline mode (local kill switch on device)
- Kill switch has separate auth system
- Hosted on different infrastructure than main app

**Mitigation if occurs**:
1. Database-level kill switch (update config table directly)
2. Kill process manually (infrastructure level)
3. Restore kill switch access ASAP
4. Post-incident review
5. Redundancy improvements

---

### 10. Idempotency Key Collision

**Failure**: Two different actions generate same idempotency key

**Impact**:
- Second action does not execute (thinks it's a retry)
- User confusion
- Missing operations

**Detection**:
- Monitor idempotency key uniqueness
- Alert on collisions

**Prevention**:
- Use UUID v4 (collision probability ~0)
- Include timestamp + user ID + action type in key generation
- Database unique constraint on idempotency key

**Mitigation if occurs**:
1. Identify affected users
2. Re-execute second action with new key
3. Audit all recent actions for collisions
4. Fix key generation logic
5. Add tests for uniqueness

---

### 11. Simulation Inaccuracy

**Failure**: Simulation predicts low risk, but actual execution causes major damage

**Impact**:
- Trust in simulation eroded
- Autonomous mode becomes unsafe
- Revert to supervised mode

**Detection**:
- Reconcile gate detects large delta between prediction and reality
- Alerting on repeated large deltas

**Prevention**:
- Continuous model training
- Red team testing of simulations
- Conservative bias (overestimate risk)
- Human review of simulation logic

**Mitigation if occurs**:
1. Increase approval threshold (more human review)
2. Investigate why simulation was wrong
3. Retrain models with new data
4. Improve feature engineering
5. A/B test new simulation model
6. Gradual re-graduation (supervised → semi-autonomous → autonomous)

---

### 12. Graduation Ladder Regression

**Failure**: User/tool regresses from autonomous → supervised mode incorrectly

**Impact**:
- User frustration
- Reduced autonomy without cause
- Manual work increases

**Detection**:
- Monitor graduation transitions
- Alert on unexpected regressions

**Prevention**:
- Graduation criteria must be data-driven
- Hysteresis (harder to regress than to graduate)
- Human review of regressions

**Mitigation if occurs**:
1. Review regression reason
2. If false positive, override and restore autonomy
3. If legitimate, explain to user with remediation path
4. Tune graduation criteria
5. Add grace period before regression

---

### 13. Database Migration Failure

**Failure**: Migration script fails mid-execution, leaving schema in inconsistent state

**Impact**:
- Application cannot start
- Data corruption possible
- Downtime

**Detection**:
- Migration test in CI
- Canary deployment
- Rollback plan

**Prevention**:
- Migrations are idempotent
- Rollback scripts exist for every migration
- Test on staging first
- Point-in-time recovery (PITR) drills

**Mitigation if occurs**:
1. DO NOT attempt second migration
2. Restore from backup (PITR)
3. Test migration on restored backup
4. Fix migration script
5. Re-attempt with fixed script
6. Post-mortem: Improve migration testing

---

### 14. Event Ordering Violation

**Failure**: Events consumed out of order, causing inconsistent state

**Impact**:
- Read models out of sync
- Business logic failures
- Incorrect UI state

**Detection**:
- Event sequence numbers
- Out-of-order detection in consumers

**Prevention**:
- Event sequence numbers required
- Consumers check sequence
- Message broker guarantees ordering (Kafka partitions)

**Mitigation if occurs**:
1. Pause affected consumers
2. Rebuild read models from event store
3. Resume consumers
4. Validate consistency
5. Identify ordering violation cause
6. Fix producer/consumer logic

---

### 15. Cognitive State Misclassification

**Failure**: Neuro-adaptive system incorrectly infers user's cognitive state

**Impact**:
- Wrong UI adaptation (too simple or too complex)
- Wrong autonomy level (too much or too little control)
- User frustration

**Detection**:
- User feedback ("This UI is too busy/too simple")
- Explicit cognitive state overrides by user
- A/B testing of adaptations

**Prevention**:
- User control: Always allow manual override
- Conservative defaults
- Gradual adaptation (don't change too fast)
- Multi-modal signals (not just one indicator)

**Mitigation if occurs**:
1. Immediate manual override honored
2. Log misclassification for training data
3. Retrain classification model
4. Improve signal collection
5. Add calibration step during onboarding

---

## Cascading Failure Scenarios

### Scenario A: Tool Executor Outage → Entire System Halts

**Mitigation**:
- Tool executor is highly available (multiple replicas)
- Circuit breaker: Degrade gracefully (read-only mode)
- Fallback: Queue tool requests, execute when service returns

### Scenario B: Database Outage → Cannot Write Audit Logs

**Mitigation**:
- Local caching of receipts
- Write-ahead log
- Multiple database replicas
- Automatic failover

### Scenario C: Policy Engine Outage → Cannot Approve Actions

**Mitigation**:
- Cached policies (eventually consistent)
- Default-deny if cannot reach policy engine
- Manual override for ops team

---

## Runbook: System in Bad State

If multiple failures occur simultaneously:

1. **Activate Kill Switch** (ops-console or CLI)
2. **Assess scope**: What is failing? How many users affected?
3. **Notify stakeholders**: Status page, Slack, email
4. **Rollback recent changes**: Last known good state
5. **Restore from backup if needed**: PITR to 1 hour ago
6. **Fix root cause**: Coordinate eng team
7. **Gradual re-enable**: Canary → 10% → 50% → 100%
8. **Post-mortem**: Document lessons, update runbooks

---

## Testing Failure Modes

All failure modes above have corresponding tests in `tests/safety/` and `tests/chaos/`:

- Chaos engineering: Randomly kill services
- Fault injection: Simulate database errors, network partitions
- Adversarial testing: Try to bypass gates
- Load testing: Overflow exception queue
- Idempotency testing: Retry actions 100x
- Hash chain corruption: Tamper with receipts

**Run before every release**:
```bash
make test-chaos
make test-safety
```

---

**Critical**: Assume every failure mode WILL occur. Prepare accordingly.
