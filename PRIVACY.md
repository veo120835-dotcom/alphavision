# Privacy Policy & Architecture

## Core Privacy Principles

1. **Data Minimization**: Collect only what's necessary
2. **Purpose Limitation**: Use data only for stated purpose
3. **Transparency**: Users know what data we collect and why
4. **User Control**: Users can access, export, and delete their data
5. **Privacy by Design**: Privacy built into architecture, not bolted on
6. **On-Device Processing**: Sensitive data never leaves user device when possible

## Data Collection & Usage

### What We Collect

#### Category 1: Account Data (Required)
- Email address
- Name
- Password (hashed with bcrypt)
- Account creation date

**Purpose**: Account creation, authentication, communication
**Storage**: Encrypted at rest (level 3)
**Retention**: Until account deletion
**User Control**: Can update, cannot delete (required for account)

#### Category 2: Usage Data (Automatic)
- Page views
- Feature usage
- Error logs (no PII)
- Performance metrics

**Purpose**: Product improvement, debugging
**Storage**: Pseudonymized (level 2)
**Retention**: 90 days
**User Control**: Can opt out of analytics

#### Category 3: Business Data (User-Provided)
- Customer lists
- Revenue data
- Campaign information
- Integrations (CRM, email platform credentials)

**Purpose**: Core product functionality
**Storage**: Encrypted at rest (level 3)
**Retention**: Until user deletes or account closed
**User Control**: Full control (create, read, update, delete)

#### Category 4: Financial Data (User-Provided)
- Bank account info
- Payment history
- Tax data

**Purpose**: Financial optimization features
**Storage**: Encrypted at rest + Tax Silo isolation (level 3)
**Retention**: 7 years (tax compliance requirement)
**User Control**: Can view, cannot delete (compliance)

#### Category 5: Cognitive Profile (User-Provided, Optional)
- Executive function level
- Working memory capacity
- Attention style (e.g., ADHD)
- Processing preferences (verbal vs visual)

**Purpose**: Neuro-adaptive UI customization
**Storage**: **DEVICE-ONLY**, encrypted at rest (level 4)
**Retention**: Until user deletes
**User Control**: Full control, can delete anytime

**CRITICAL**: Cognitive profiles NEVER sent to API. Only minimal adaptation tokens sent.

### What We DON'T Collect
- Biometric identifiers (fingerprints, facial scans) - stays on device
- Health data (unless user explicitly provides for integrations)
- Browsing history outside our app
- Contacts or photos
- Location (unless user enables for a specific feature)

## Data Storage & Security

### Encryption

| Data Type | At Rest | In Transit | Key Management |
|-----------|---------|------------|----------------|
| Account data | AES-256 | TLS 1.3 | Database-level |
| Business data | AES-256 | TLS 1.3 | Database-level |
| Financial data (Tax Silo) | AES-256 (double) | TLS 1.3 | Separate keyring |
| Cognitive profiles | AES-256 | N/A (never sent) | User device key |

### Access Controls

| Role | Account Data | Business Data | Financial Data | Cognitive Profile |
|------|--------------|---------------|----------------|-------------------|
| User | Full access | Full access | Full access | Full access |
| Admin | Pseudonymized view | No access | No access | No access |
| Support | Pseudonymized view (with user consent) | No access | No access | No access |
| Engineer | No access | No access | No access | No access |
| Auditor | Audit logs only | No access | Access logs only | No access |

### Data Isolation

#### Tax Silo
Financial data has enhanced isolation:
- Dedicated database schema
- Separate encryption keys
- All access logged
- Extra audit controls
- Defined in `configs/policy/tax-silo.policies.json`

#### Cognitive Data Silo
Cognitive profiles:
- NEVER stored on server
- Encrypted on user device
- Only adaptation tokens (minimal metadata) sent to API
- No raw cognitive data in logs

## User Rights

### Right to Access
Users can:
- View all data we have about them
- Download data export (JSON format)
- Access via Settings → Privacy → Download My Data

**Response time**: Immediate (automated)

### Right to Deletion
Users can:
- Delete their account (irreversible)
- Delete specific data types (e.g., cognitive profile)
- Request deletion via Settings → Privacy → Delete Account

**Process**:
1. User initiates deletion
2. 30-day grace period (can cancel)
3. After 30 days, permanent deletion:
   - Account data purged
   - Business data anonymized
   - Financial data retained 7 years (compliance, but dissociated from account)
   - Cognitive profile deleted immediately

**Exceptions**:
- Financial data retained for tax compliance (7 years, anonymized)
- Audit logs retained (no PII, only actions taken)

### Right to Portability
Users can:
- Export all data in JSON format
- Export compatible with other tools
- Access via Settings → Privacy → Export Data

**Format**: JSON with schema documentation

### Right to Correction
Users can:
- Update account information
- Correct business data
- Access via Settings → Account or directly in app

### Right to Restrict Processing
Users can:
- Opt out of analytics
- Disable autonomous features (reverts to manual mode)
- Pause specific integrations
- Access via Settings → Privacy → Preferences

### Right to Object
Users can:
- Object to automated decision-making (always allows manual override)
- Object to data processing for specific purposes
- Contact privacy@alphavision.com with objections

**Response time**: 30 days

## Consent Management

### Explicit Consent Required For:
1. **Cognitive Profiling** (Phase 1 of onboarding)
   - Clear explanation of what's collected
   - How it's used (UI adaptation)
   - Opt-in required (not default)
   - Can revoke anytime

2. **Marketing Communications**
   - Opt-in required
   - Unsubscribe link in every email
   - Separate from transactional emails

3. **Third-Party Data Sharing**
   - Explicit consent before sharing with integrations
   - List of what data is shared
   - Can revoke integration access

### Implicit Consent (Functional Necessity)
- Account creation data
- Usage data for core functionality
- Security monitoring

### Consent Revocation
- All consent is revocable via Settings → Privacy
- Takes effect immediately
- Logged in audit ledger

## Third-Party Data Sharing

### Service Providers
We share data with:

| Provider | Data Shared | Purpose | Location |
|----------|-------------|---------|----------|
| Supabase | Account + business data | Database hosting | US |
| Stripe | Payment info | Payment processing | US |
| SendGrid | Email, name | Email delivery | US |
| Twilio | Phone, messages | SMS delivery | US |

**Protections**:
- Data processing agreements (DPA) signed
- GDPR-compliant processors
- Encrypted in transit
- Limited to necessary data

### User-Configured Integrations
When user connects:
- CRM (e.g., HubSpot): Customer data shared
- Email platform (e.g., Mailchimp): Contact lists shared
- Accounting (e.g., QuickBooks): Financial data shared

**User Control**:
- Explicit consent required
- List of what data is shared
- Can disconnect anytime
- Located in Settings → Integrations

### No Third-Party Sharing For:
- Advertising networks (we don't sell data)
- Data brokers
- Analytics beyond our own purposes
- Cognitive profiles (NEVER shared)

## Cookies & Tracking

### Essential Cookies
- Session management (authentication)
- CSRF protection
- User preferences

**Required**: Yes (functional necessity)
**Can opt out**: No (app won't work)

### Analytics Cookies
- Page views
- Feature usage
- Performance monitoring

**Required**: No
**Can opt out**: Yes (Settings → Privacy → Analytics)

### No Third-Party Cookies
- We do NOT use advertising cookies
- We do NOT use tracking pixels from other companies
- We do NOT allow third-party scripts except for service providers (e.g., Stripe checkout)

## Data Retention

| Data Type | Retention Period | Reason |
|-----------|------------------|--------|
| Account data | Until account deletion | Functional |
| Usage analytics | 90 days | Product improvement |
| Business data | Until user deletes | User data |
| Financial data | 7 years | Tax compliance |
| Audit logs (anonymized) | 7 years | Security/compliance |
| Cognitive profiles | Until user deletes | User data (device-only) |
| Tool receipts | 3 years | Rollback capability |

## International Data Transfers

### Primary Location
- Data stored in: US (Supabase US region)
- Processed in: US

### EU Users (GDPR)
- Standard contractual clauses (SCC) in place
- Data processing agreement with Supabase
- Right to object to international transfer (contact privacy@alphavision.com)

## Children's Privacy

- AlphaVision is NOT intended for children under 13
- We do not knowingly collect data from children under 13
- If we discover child data, we delete immediately
- Parents: Contact privacy@alphavision.com if concerned

## Neuro-Adaptive Privacy (Special Section)

### What Makes This Different
Cognitive profile data is **extraordinarily sensitive**:
- Reveals neurodivergence (ADA protected)
- Can be used for discrimination
- Cannot be changed (unlike password)
- Potentially qualifies as health data (HIPAA)

### Our Approach: Device-Only Processing

1. **Cognitive Profile Creation** (Phase 1 onboarding)
   - User completes self-assessment
   - Profile stored on device, encrypted
   - Never sent to API

2. **Cognitive State Estimation** (runtime)
   - Inference runs on device
   - Uses local models (TensorFlow.js, etc.)
   - No network calls

3. **Adaptation Tokens** (minimal metadata sent to API)
   - NOT full cognitive profile
   - Just high-level hints: "reduce_complexity", "enable_focus_mode"
   - Cannot reconstruct profile from tokens

4. **UI Adaptation** (server-rendered)
   - Server receives tokens
   - Adjusts UI complexity
   - No logging of tokens

### User Control
- Can delete cognitive profile anytime (immediate)
- Can disable neuro-adaptive features (revert to standard UI)
- Can export profile (stays on device, for user's records)
- Can opt out during onboarding (skips Phase 1)

### Technical Safeguards
- Runtime assertions: Fail if cognitive data in API payload
- Network monitoring: Alert if cognitive data detected
- Code review: All neuro-adaptive code reviewed for privacy
- Tests: Verify no network calls with profile data

### Legal Protections
- Cognitive profiles NOT used for:
  - Hiring decisions (we're not a recruiting platform)
  - Insurance (we're not a health platform)
  - Credit decisions (we're a business tool)
  - Advertising targeting

## Breach Notification

### If Data Breach Occurs
1. **Internal notification**: Within 1 hour of discovery
2. **Investigation**: Within 24 hours
3. **User notification**: Within 72 hours (GDPR requirement)
4. **Regulatory notification**: Within 72 hours if required
5. **Public disclosure**: If large-scale breach

### What We'll Tell You
- What data was affected
- How breach occurred (if known)
- What we're doing to fix it
- What you should do (e.g., change password)
- Free credit monitoring if financial data affected

## Privacy Governance

### Data Protection Officer (DPO)
- Email: dpo@alphavision.com
- Responsible for privacy compliance
- Reports to CEO

### Privacy Reviews
- Quarterly privacy audits
- Annual third-party assessment
- ARCH_REVIEW_CHECKLIST includes privacy section

### Employee Training
- All employees trained on privacy
- Engineers trained on PII classification
- Annual refresher training

## Changes to Privacy Policy

- We may update this policy
- Material changes: Email notification + banner in app
- Minor changes: Update date at bottom
- Continued use = acceptance (or delete account)

## Contact Us

- **Privacy questions**: privacy@alphavision.com
- **Data deletion**: privacy@alphavision.com
- **Breach notification**: security@alphavision.com
- **DPO**: dpo@alphavision.com

---

**Last Updated**: [Current Date]
**Effective**: [Current Date]

This privacy policy is part of our Terms of Service.
