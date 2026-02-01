# Security Architecture

## Threat Model

### Assets to Protect

1. **User Data**
   - PII (names, emails, phone numbers)
   - Financial data (account numbers, transaction history)
   - Biometric data (cognitive profiles, health data)
   - Business data (customer lists, revenue data)

2. **System Integrity**
   - Audit ledger (immutable record of all actions)
   - Epistemic ledger (provenance of high-risk decisions)
   - Tool receipts (rollback capability)
   - Policy configurations

3. **Availability**
   - Core services (tool-executor, policy-engine)
   - User-facing apps (web, admin-console)
   - Database and backups

### Threat Actors

1. **External Attackers**: Steal data, disrupt service, financial fraud
2. **Malicious Insiders**: Data exfiltration, privilege escalation
3. **Compromised Accounts**: Credential theft, session hijacking
4. **AI Adversaries**: Prompt injection, model extraction, data poisoning
5. **Nation-State**: APT, supply chain attacks

## Security Controls

### 1. Authentication & Authorization

#### Multi-Factor Authentication (MFA)
- Required for all admin users
- Passkey support (WebAuthn)
- Biometric verification option (device-level, never sent to server)

#### Role-Based Access Control (RBAC)
- Defined in `configs/policy/rbac.matrix.json`
- Roles: Owner, Admin, Operator, Viewer, Auditor
- Principle of least privilege
- Just-in-time access for high-risk operations

#### Verified Human System
- Liveness detection (prevent replay attacks)
- Device trust verification
- Session binding to device
- Located in `apps/verified-human-console/`

### 2. Data Protection

#### Encryption at Rest
- AES-256 for all PII (level 3+)
- Database encryption enabled
- Cognitive profiles encrypted with user-specific key (device-only)
- Tax silo data double-encrypted

#### Encryption in Transit
- TLS 1.3 for all API calls
- Certificate pinning for mobile apps
- HSTS enabled

#### PII Classification
Defined in `configs/policy/pii-classification.json`:

| Level | Type | Storage | Access |
|-------|------|---------|--------|
| 0 | Public | Plaintext | Anyone |
| 1 | Aggregate | Plaintext | Internal |
| 2 | Pseudonymized | Pseudonymized IDs | Authorized |
| 3 | PII | Encrypted | Role-based + logged |
| 4 | Biometric/Health | Encrypted + device-only | User only + access log |

### 3. Network Security

#### API Gateway
- Rate limiting (per user, per IP, per endpoint)
- Request validation (schema enforcement)
- DDoS protection (Cloudflare/WAF)
- IP allowlisting for admin endpoints

#### Service Mesh
- mTLS between services
- Service-to-service auth (JWT)
- Network policies (Kubernetes NetworkPolicy)
- Zero-trust networking

### 4. Application Security

#### Input Validation
- Zod schemas for all inputs
- SQL injection prevention (parameterized queries)
- XSS prevention (CSP headers, React escaping)
- CSRF tokens for state-changing operations

#### Dependency Security
- Automated vulnerability scanning (Snyk, Dependabot)
- Lock files committed
- Advisory database check before adding dependencies
- Regular updates

#### Secrets Management
- No secrets in code (enforced by CI)
- Environment variables only
- Secrets rotation every 90 days
- Vault for production secrets

### 5. AI Safety & Security

#### Prompt Injection Defense
- Prompt templates with interpolation (no direct user input in prompts)
- Output validation (check for leaked system prompts)
- Separate user context from system context
- Red team testing in `configs/eval-gates/redteam-gate.json`

#### Model Extraction Prevention
- Rate limiting on LLM gateway
- No raw model access
- Monitoring for unusual query patterns

#### Data Poisoning Prevention
- Human review of training data sources
- Anomaly detection on input distributions
- Versioned datasets with provenance

#### Jailbreak Detection
- Pattern matching for known jailbreak attempts
- Semantic similarity to known attacks
- Automatic blocking + alerting

### 6. Audit & Monitoring

#### Immutable Audit Ledger
- Append-only database (no updates/deletes)
- Hash chain (blockchain-style integrity)
- Cryptographic signatures on receipts
- Located in `packages/audit-ledger/`

#### Epistemic Ledger
- Required for:
  - Money movement
  - Contract signatures
  - Campaign launches
  - Policy changes
- Provenance chain: Who decided? Based on what evidence?

#### Security Monitoring
- SIEM integration (Splunk, Datadog)
- Alerting on:
  - Failed auth attempts (> 5 in 10 min)
  - Privilege escalation attempts
  - Unusual data access patterns
  - PII access by unauthorized users
  - Tool execution failures
  - Policy violations

#### Access Logs
- All level 4 data access logged
- Includes: Who, What, When, Why
- Retention: 7 years (compliance requirement)

### 7. Incident Response

#### Kill Switches
Located in `apps/ops-console/src/pages/KillSwitches.tsx`:

1. **Global Kill Switch**: Halt ALL autonomous actions
2. **Domain Kill Switch**: Stop specific module (business-os, finance-os, concierge-os)
3. **Tool Kill Switch**: Disable specific tool type
4. **User Kill Switch**: Suspend specific user account

#### Runbooks
Located in `docs/runbooks/`:

- `INCIDENT_RESPONSE.md`: Steps for security incidents
- `DISASTER_RECOVERY.md`: Data restoration procedures
- `PITR_DRILLS.md`: Point-in-time recovery testing

#### Rollback Capability
All tool executions are reversible:
```typescript
const receipt = await toolExecutor.execute(tool, params);
// If something goes wrong:
await toolExecutor.rollback(receipt.id);
```

### 8. Privacy by Design

#### Neuro-Adaptive Privacy
- Cognitive profiles NEVER leave user device
- Only adaptation tokens (minimal metadata) sent to API
- User can delete profile at any time
- Explicit consent during onboarding (Phase 0)

#### Tax Silo Isolation
- Financial data in separate schema
- Additional access controls
- All access logged
- Defined in `configs/policy/tax-silo.policies.json`

#### Data Minimization
- Collect only what's needed
- Automated data expiration
- User data export available
- GDPR right to deletion supported

#### Consent Management
- Granular consent (per data type)
- Opt-in for sensitive features
- Consent logged in audit ledger
- Revocable at any time

### 9. Compliance

#### GDPR (General Data Protection Regulation)
- Right to access: User data export
- Right to deletion: Automated purge
- Right to portability: JSON export
- Breach notification: Within 72 hours

#### SOC 2
- Audit controls implemented
- Access logs retained
- Change management process
- Incident response plan

#### HIPAA (if health data)
- Encrypted PHI
- Access controls
- Audit trail
- Business associate agreements

### 10. Secure Development Lifecycle

#### Code Review
- All code reviewed by 2+ engineers
- Security-focused review for sensitive code
- Architecture review checklist (ARCH_REVIEW_CHECKLIST.md)

#### Static Analysis
- ESLint with security rules
- TypeScript strict mode
- CodeQL for vulnerability scanning

#### Dependency Scanning
- Before adding dependency: Check advisory database
- Tool: `gh-advisory-database`
- CI fails if vulnerable dependency

#### Penetration Testing
- Annual third-party pentest
- Continuous red team testing (internal)
- Bug bounty program

## Threat Scenarios & Mitigations

### Scenario 1: Credential Theft

**Attack**: Attacker steals user password via phishing

**Mitigation**:
1. MFA required (password alone insufficient)
2. Passkey recommended (phishing-resistant)
3. Session binding to device (stolen session won't work on attacker's device)
4. Anomaly detection (login from new location → require re-auth)

### Scenario 2: Insider Threat

**Attack**: Malicious employee exfiltrates customer data

**Mitigation**:
1. Least privilege access (employees cannot access customer data by default)
2. Just-in-time access (temporary access with approval)
3. All access logged (audit trail for investigations)
4. DLP tools (detect large data exports)

### Scenario 3: SQL Injection

**Attack**: Attacker injects SQL via input field

**Mitigation**:
1. Parameterized queries only (no string concatenation)
2. ORM layer (Supabase client)
3. Input validation (Zod schemas)
4. WAF rules (detect SQL injection patterns)

### Scenario 4: Prompt Injection

**Attack**: User crafts input to leak system prompt or execute unauthorized actions

**Mitigation**:
1. Prompt templates (user input interpolated, not concatenated)
2. Separate user context from system context
3. Output validation (check for leaked prompts)
4. Red team gate (tests run before deployment)
5. Rate limiting (prevent brute force)

### Scenario 5: Tool Executor Compromise

**Attack**: Attacker gains access to tool-executor service, can execute arbitrary actions

**Mitigation**:
1. Service-to-service auth (JWT required)
2. mTLS between services
3. Network isolation (tool-executor not publicly accessible)
4. Audit all executions (detect anomalous patterns)
5. Kill switch (immediate shutdown if compromise detected)

### Scenario 6: Audit Log Tampering

**Attack**: Attacker modifies audit logs to hide tracks

**Mitigation**:
1. Append-only database (no updates/deletes at DB level)
2. Hash chain (tampering breaks chain)
3. Cryptographic signatures (verify integrity)
4. Redundant storage (multiple backups)
5. Periodic integrity checks (automated validation)

### Scenario 7: Biometric Data Leak

**Attack**: Cognitive profile data exfiltrated

**Mitigation**:
1. Data never sent to API (device-only)
2. Encrypted at rest on device
3. Network monitoring (alert if cognitive data in payload)
4. Runtime assertions (fail if attempted to send)
5. Regular security audits

### Scenario 8: Supply Chain Attack

**Attack**: Compromised npm package injects malicious code

**Mitigation**:
1. Lock files committed (reproducible builds)
2. Advisory database check before adding dependency
3. Subresource integrity (SRI) for CDN assets
4. Automated vulnerability scanning
5. Minimal dependencies (reduce attack surface)

## Security Testing

### Regular Testing
- Unit tests with security assertions
- Integration tests for auth flows
- Chaos engineering (fault injection)
- Red team exercises (quarterly)
- Penetration testing (annual)

### CI/CD Security Gates
Located in `scripts/ci-gates.sh`:

1. Dependency vulnerability scan
2. Static code analysis (CodeQL)
3. Secrets detection (no API keys in code)
4. License compliance
5. Security test suite

### Red Team Gate
Defined in `configs/eval-gates/redteam-gate.json`:

- Prompt injection tests
- Jailbreak attempts
- Privilege escalation attempts
- Bypass attempts (skip execution pipeline)
- Rate limit bypass
- CSRF/XSS attempts

## Security Contacts

- **Security Issues**: security@alphavision.com
- **Bug Bounty**: hackerone.com/alphavision
- **Incident Response**: On-call engineer via PagerDuty

## Security Updates

- Patches released within 24 hours of critical vulnerability
- Users notified via email + in-app banner
- Security advisory published to status page

---

**Remember**: Security is everyone's responsibility. Report suspicious activity immediately.
