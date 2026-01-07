# Architecture Mapping: Current State → Reference Architecture

## Current State Analysis

### ✅ What We Have (Well Implemented)

#### 1. **Data Layer - COMPLETE**
- **PostgreSQL (Supabase)**: Full transactional database
  - Organizations, users, profiles
  - CRM: contacts, companies, deals, leads
  - Niche intelligence: niches, workflows, prompts, qualification rules, compliance rules
  - Agent packs, workflow templates, platform templates
  - Booking system
  - Revenue tracking, invoices
  - Decision credits, outcomes
  - AI conversation memory
  - Idempotency keys

#### 2. **Auth & Tenancy - COMPLETE**
- Supabase Auth (email/password)
- Multi-tenancy via organizations
- RLS policies on all tables
- User roles (admin, moderator, user, operator)
- Organization membership management

#### 3. **Niche Intelligence - COMPLETE**
- 5 production niches (Fitness, Med Spa, Real Estate, Consultant, Local Service)
- Niche-specific prompts (32 prompts)
- Niche-specific workflows (18 workflows)
- Niche-specific qualification rules (13 rules)
- Niche-specific compliance rules (12 rules)
- Niche-specific objection library (17 objections)
- Primary niche binding for organizations

#### 4. **Edge Functions (Async Processing) - EXTENSIVE**
- 60+ deployed edge functions
- Agent runners (autonomous-agent-runner, swarm-orchestrator)
- Decision engines (boardroom-council, reflexion-engine)
- Revenue intelligence (revenue-trinity, churn-guard, lazarus-resurrector)
- Lead processing (lead-scoring-engine, lead-enricher)
- Booking management (booking-create, booking-slots)
- CRM integration (crm-actions, crm-oauth)
- Compliance (tier-enforcer, pricing-enforcer)
- Communication (chat, sniper-outreach, cold-email-sender)
- Webhooks (webhook-handler, webhooks)

#### 5. **Frontend - EXTENSIVE**
- React + TypeScript + Vite
- 140+ UI components
- Shadcn/ui component library
- Agent dashboards, CRM views, analytics
- Real-time hooks (useRealtimeSync, useRealtimeEvents)

---

## ⚠️ What We're Missing (Critical Gaps)

### 1. **Event-Driven Architecture - MISSING**
**Need:**
- Event Bus system to emit events (MessageReceived, LeadCreated, BookingScheduled, etc.)
- Webhook endpoints for n8n to subscribe to
- Event payload standardization
- Event logging and tracing

**Current State:** Edge functions exist but no unified event emission system

### 2. **Automation Orchestrator Integration - MISSING**
**Need:**
- n8n webhook endpoints configured
- Event emission → n8n webhook system
- n8n calls Core App APIs (not direct DB access)
- Retry/backoff handling from n8n

**Current State:** No n8n integration points defined

### 3. **Core App Decision API - PARTIAL**
**Need:**
- Unified "Decision API" that n8n calls
- Agent Runtime orchestration
- Returns structured action list
- Context-aware (niche, org, contact)

**Current State:**
- Have: `chat` function, `boardroom-council`, `reflexion-engine`
- Missing: Unified API contract for n8n consumption

### 4. **Message Ingress API - MISSING**
**Need:**
- Unified webhook receiver for ALL channels
- Identity resolution (contact matching/creation)
- Message normalization
- Event emission after processing

**Current State:** Have `webhook-handler` but not channel-unified

### 5. **Queue Infrastructure - PARTIAL**
**Need:**
- Redis-backed queue (BullMQ or equivalent)
- Job workers for AI calls, message sending
- Dead letter queue
- Job status tracking

**Current State:** Edge functions handle async, but no formal queue system

### 6. **Observability - MINIMAL**
**Need:**
- Trace IDs end-to-end
- Error tracking (Sentry)
- Metrics (Prometheus)
- Log aggregation
- Performance monitoring

**Current State:** Basic function logging, no tracing

### 7. **Provider Integrations - PARTIAL**
**Need:**
- WhatsApp, SMS, ManyChat provider adapters
- Unified send interface
- Delivery status callbacks
- Rate limiting per provider

**Current State:** Some OAuth flows exist, but no unified provider layer

### 8. **Conversations/Inbox - MISSING**
**Need:**
- Unified conversation timeline
- Multi-channel message threading
- Read/unread status
- Conversation assignment

**Current State:** `ai_conversation_memory` table exists but no UI or API

---

## 🎯 Priority Implementation Roadmap

### Phase 1: Event-Driven Foundation (Critical)
1. **Create Event Bus System**
   - Define event types (MessageReceived, LeadCreated, etc.)
   - Event emission service
   - Webhook delivery to n8n
   - Event log table

2. **Build Message Ingress API**
   - Unified webhook endpoint
   - Channel normalization
   - Identity resolution
   - Event emission

3. **Create Core App Decision API**
   - Unified endpoint for n8n
   - Agent runtime orchestration
   - Niche context loading
   - Action list response

### Phase 2: n8n Integration (High Priority)
1. **n8n Webhook Configuration**
   - Subscribe to Core App events
   - Authentication setup
   - Retry policies

2. **Core App Internal APIs**
   - Send message API
   - Update contact API
   - Update deal stage API
   - Create task API
   - Book appointment API

3. **Status Callbacks**
   - Delivery status updates
   - Read receipts
   - Error handling

### Phase 3: Async Processing (Medium Priority)
1. **Queue System**
   - Implement job queue
   - AI processing workers
   - Message sending workers
   - Reconciliation jobs

2. **Provider Layer**
   - WhatsApp adapter
   - SMS adapter
   - ManyChat adapter
   - Email adapter

### Phase 4: Conversations & Inbox (Medium Priority)
1. **Conversation Engine**
   - Timeline aggregation
   - Multi-channel threading
   - Unified inbox UI

2. **Assignment & Routing**
   - Agent assignment
   - Round-robin logic
   - Escalation rules

### Phase 5: Observability (Medium Priority)
1. **Tracing System**
   - Trace ID generation
   - End-to-end tracking
   - Performance metrics

2. **Error Tracking**
   - Sentry integration
   - Error categorization
   - Alert rules

---

## 🏗️ Technology Stack Alignment

### Recommended → Current Mapping

| Component | Recommended | Current | Status |
|-----------|-------------|---------|--------|
| **Core App** | Node.js (NestJS) / Python (FastAPI) | Supabase Edge Functions (Deno/TypeScript) | ✅ Works |
| **DB** | PostgreSQL | Supabase PostgreSQL | ✅ Perfect |
| **Cache/Rate-limit** | Redis | Need to add | ⚠️ Missing |
| **Queue** | BullMQ / Celery | Need to add | ⚠️ Missing |
| **Automation** | n8n (self-hosted) | Ready to integrate | ⏳ Pending |
| **Search** | Meilisearch / Postgres FTS | Postgres available | ⏳ Future |
| **Object Storage** | S3 / R2 / MinIO | Supabase Storage available | ✅ Available |
| **Reverse Proxy** | Nginx / Traefik | Supabase handles | ✅ Handled |
| **Hosting** | Hetzner / DO / Lightsail | Supabase Cloud | ✅ Managed |
| **Observability** | Sentry + Prometheus + Grafana | Need to add | ⚠️ Missing |
| **Auth** | OAuth + JWT | Supabase Auth | ✅ Perfect |

---

## 📋 Immediate Next Steps

1. **Create Event Bus Infrastructure** (database tables + edge functions)
2. **Build Message Ingress API** (unified webhook receiver)
3. **Build Core App Decision API** (agent runtime orchestrator)
4. **Document n8n Integration Contracts** (API specs, event schemas)
5. **Implement Idempotency Layer** (already have table, need enforcement)
6. **Create Provider Abstraction Layer** (unified send interface)

---

## 💡 Key Design Principles

1. **Core App Owns State** - All data lives in Supabase, n8n never stores state
2. **Event-Driven** - All significant actions emit events
3. **Idempotent** - All external actions use idempotency keys
4. **Traceable** - Every request has a trace ID
5. **Niche-Aware** - All agent decisions load niche context
6. **Resilient** - Retries, backoff, DLQ for failures
7. **Fast UI** - Async processing keeps frontend responsive

---

## 🔥 Critical Decision Points

### Should we add Redis?
**Recommendation: YES** - Add Redis for:
- Rate limiting (per provider, per org)
- Session caching
- Job queue (if we use BullMQ pattern)
- Real-time presence

**Alternative:** Use Supabase Edge Functions + Postgres for queuing (simpler, fewer dependencies)

### Should we use formal job queue?
**Recommendation: START SIMPLE** - Use Supabase Edge Functions with:
- Scheduled functions for nightly jobs
- Webhook triggers for real-time jobs
- Database-backed retry logic

**Upgrade Later:** If we hit scale issues, migrate to BullMQ + Redis

### Where should n8n run?
**Recommendation: SEPARATE INFRASTRUCTURE**
- Self-hosted n8n on separate server/container
- Connects to Core App via API
- Keeps automation logic separate from data layer

---

## 📐 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│              React + TypeScript + Shadcn/ui                  │
│                    (140+ components)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP/REST + Realtime
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    SUPABASE PLATFORM                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Supabase Auth (JWT)                       │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         PostgreSQL (Transactional Store)               │ │
│  │   Organizations, CRM, Niches, Workflows, Agents        │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Edge Functions (60+)                        │ │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────┐            │ │
│  │  │ Ingress  │ │ Decision │ │  Async     │            │ │
│  │  │   API    │ │   API    │ │ Processing │            │ │
│  │  └──────────┘ └──────────┘ └────────────┘            │ │
│  │  ┌──────────────────────────────────────┐            │ │
│  │  │         Event Bus                    │            │ │
│  │  │  (emit events to n8n)                │            │ │
│  │  └──────────────────────────────────────┘            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Supabase Storage (S3-like)                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      │ Webhooks (Events)
                      │
┌─────────────────────▼──────────────────────────────────────┐
│                   n8n AUTOMATION ORCHESTRATOR               │
│  ┌────────────────────────────────────────────────────────┐│
│  │  Workflow 1: Lead → Qualify → Book                     ││
│  │  Workflow 2: Message Received → AI Reply → Send        ││
│  │  Workflow 3: No Show → Follow Up Sequence              ││
│  │  Workflow 4: Deal Won → Onboarding Automation          ││
│  └────────────────────────────────────────────────────────┘│
│                                                              │
│  Calls Core App APIs (never touches DB directly)            │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      │ Provider APIs
                      │
┌─────────────────────▼──────────────────────────────────────┐
│                  EXTERNAL PROVIDERS                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ WhatsApp │ │   SMS    │ │ ManyChat │ │  Email   │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└──────────────────────────────────────────────────────────────┘
```

---

## ✅ Summary

**Strong Foundation:** We have excellent data layer, auth, niche intelligence, and agent logic.

**Critical Gap:** We need event-driven architecture to connect everything together and integrate with n8n.

**Next Priority:** Build the Event Bus, Ingress API, and Decision API to enable n8n orchestration.
