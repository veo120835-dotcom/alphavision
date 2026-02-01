# Architecture Review Checklist

Use this checklist before merging any changes to ensure architectural compliance.

## Module Boundaries ✓

- [ ] No module imports from other modules (only from packages/)
- [ ] Module manifest exists with complete metadata
- [ ] Loops are properly defined with evidence requirements
- [ ] Tools are wrappers only (no direct execution)
- [ ] Invariants are documented and enforced
- [ ] Domain logic is isolated within module
- [ ] No shared state between modules

## Service Boundaries ✓

- [ ] Service is in canonical registry (configs/runtime/services.registry.json)
- [ ] No duplicate service functionality
- [ ] Service manifest exists and is complete
- [ ] Threat model documented (APP_THREAT_MODEL.md)
- [ ] Services communicate via events only
- [ ] No direct service-to-service calls
- [ ] Service dependencies are declared

## Tool Execution Model ✓

- [ ] All tool calls go through services/tool-executor
- [ ] No direct connector calls
- [ ] Tool schema defined in packages/tool-definitions
- [ ] Risk tier assigned (0-4)
- [ ] Rate limits configured
- [ ] Idempotency key required
- [ ] Receipts generated for all executions
- [ ] Rollback mechanism implemented

## Universal Execution Pipeline ✓

- [ ] Evidence gate: Required evidence collected
- [ ] Simulation gate: Counterfactuals generated
- [ ] Policy gate: PDP decision obtained
- [ ] Approval gate: Human approval if required (tier 3-4)
- [ ] Execute gate: Idempotent execution with receipt
- [ ] Reconcile gate: Actual vs expected compared
- [ ] Audit gate: Immutable record written

## Epistemic Ledger ✓

- [ ] Money movement has epistemic entry
- [ ] Contract signatures recorded
- [ ] Campaign launches tracked
- [ ] Policy changes logged
- [ ] Provenance chain maintained
- [ ] Hash chain integrity verified

## Exception Queue ✓

- [ ] Edge cases routed to exception queue
- [ ] ROI scoring implemented
- [ ] Human escalation threshold set
- [ ] Resolution feedback loop established
- [ ] Policy learning enabled

## Neuro-Adaptive Compliance ✓

- [ ] Cognitive state context accessed via hooks
- [ ] Privacy classification applied (no PHI leak)
- [ ] Adaptation tokens respected
- [ ] UI complexity scales with executive function
- [ ] Focus blinders available for ADHD
- [ ] Pictograms available for verbal processing
- [ ] Visual timers for time blindness
- [ ] Consent captured for cognitive profiling

## Privacy & Security ✓

- [ ] PII classification assigned (0-4)
- [ ] Encryption at rest for level 3+
- [ ] Access logs for level 4 (biometric/health)
- [ ] Tax silo isolation for financial data
- [ ] Biometric data never leaves device
- [ ] Cognitive profiles are privacy-first
- [ ] Data retention policies enforced

## Testing Coverage ✓

- [ ] Unit tests for business logic
- [ ] Integration tests for service interactions
- [ ] Contract tests for API boundaries
- [ ] Safety tests for execution pipeline
- [ ] Chaos tests for failure modes
- [ ] Red team tests for adversarial scenarios
- [ ] Simulator tests for graduation criteria

## Configuration as Code ✓

- [ ] Policies defined in configs/policy/
- [ ] Tool registry updated
- [ ] Service registry updated
- [ ] Runtime configs validated
- [ ] Feature flags configured
- [ ] Autonomy levels set
- [ ] Kill switches accessible

## Documentation ✓

- [ ] Architecture diagrams updated
- [ ] Service manifest complete
- [ ] Module manifest complete
- [ ] Runbooks written for ops
- [ ] Threat model documented
- [ ] API contracts published
- [ ] Migration guide if breaking change

## Operational Readiness ✓

- [ ] Monitoring dashboards exist
- [ ] Alerts configured
- [ ] Runbooks accessible
- [ ] Rollback plan documented
- [ ] Disaster recovery tested
- [ ] PITR drills scheduled
- [ ] Kill switches tested
- [ ] On-call rotation defined

## Data Integrity ✓

- [ ] Audit ledger append-only enforced
- [ ] Hash chain validated
- [ ] Immutability verified
- [ ] Receipts generated
- [ ] Idempotency guaranteed
- [ ] Concurrency handled
- [ ] Retries with backoff

## Graduation Ladder ✓

- [ ] Supervised mode exists
- [ ] Semi-autonomous mode exists
- [ ] Autonomous mode exists
- [ ] Graduation criteria defined
- [ ] Evidence thresholds set
- [ ] Confidence scoring implemented
- [ ] Fallback to human defined

## Red Team Gate ✓

- [ ] Adversarial scenarios tested
- [ ] Prompt injection defended
- [ ] Data poisoning prevented
- [ ] Model extraction blocked
- [ ] Jailbreak attempts logged
- [ ] Safety boundaries enforced

## Performance ✓

- [ ] Latency SLOs defined
- [ ] Throughput SLOs defined
- [ ] Availability SLOs defined (99.9%+)
- [ ] Cost governance in place
- [ ] Rate limiting configured
- [ ] Circuit breakers implemented
- [ ] Bulkhead pattern used

## Compliance ✓

- [ ] GDPR right to deletion supported
- [ ] SOC 2 controls implemented
- [ ] HIPAA compliance if health data
- [ ] Tax compliance for financial data
- [ ] Audit trail complete
- [ ] Consent management working

## Go-Live Checklist ✓

Before deploying to production:

- [ ] All above sections verified
- [ ] Load testing passed
- [ ] Chaos engineering completed
- [ ] Red team assessment passed
- [ ] Runbooks reviewed
- [ ] Rollback tested
- [ ] Monitoring confirmed
- [ ] Alerts firing correctly
- [ ] Kill switches accessible
- [ ] On-call briefed

## Sign-Off

- [ ] Tech Lead approval
- [ ] Security review passed
- [ ] Privacy review passed
- [ ] Architecture review passed
- [ ] Product owner approval
- [ ] Engineering manager approval

---

**Critical**: If ANY item is unchecked, DO NOT MERGE until addressed.

**Exception Process**: If blocking item cannot be addressed, escalate to architecture review board with written justification and mitigation plan.
