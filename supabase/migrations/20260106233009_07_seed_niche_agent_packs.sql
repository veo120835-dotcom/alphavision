/*
  # Seed Niche Agent Packs

  ## Overview
  Seeds the database with 5 complete AI Agent Packs ready for deployment:
  1. Real Estate Agent Pack
  2. Marketing Agency Pack
  3. SaaS Business Pack
  4. Coaching/Consulting Pack
  5. Ecommerce Store Pack

  Each pack includes:
  - Pack definition
  - AI agent behaviors with goals, personality, rules
  - Channel-specific configurations
  - Website and funnel templates
  - AI-powered workflow templates
*/

-- ============================================================================
-- 1. REAL ESTATE AGENT PACK
-- ============================================================================

DO $$
DECLARE
  v_real_estate_pack_id uuid;
  v_sales_qualifier_id uuid;
  v_objection_handler_id uuid;
BEGIN
  -- Insert Real Estate Pack
  INSERT INTO niche_agent_packs (
    name, slug, niche, description, icon, popularity, is_featured,
    pricing_tiers, setup_time_minutes, tags
  ) VALUES (
    'Real Estate AI Agent Pack',
    'real-estate-agent-pack',
    'real_estate',
    'Complete AI-operated lead qualification and appointment booking system for real estate agents. Handles buyer/seller qualification, property matching, and schedules showings automatically.',
    'Home',
    250,
    true,
    '[
      {"name": "Buyer Leads", "price": 50, "description": "Per qualified buyer lead"},
      {"name": "Seller Leads", "price": 75, "description": "Per qualified seller lead"},
      {"name": "Showing Booked", "price": 100, "description": "Per confirmed showing"}
    ]'::jsonb,
    12,
    ARRAY['real-estate', 'lead-qualification', 'appointment-booking', 'property-matching']
  ) RETURNING id INTO v_real_estate_pack_id;

  -- Sales Qualifier Agent
  INSERT INTO agent_behaviors (
    pack_id, agent_name, agent_type, goal, personality, tone,
    rules, objection_handling, qualification_criteria, escalation_rules
  ) VALUES (
    v_real_estate_pack_id,
    'Buyer Qualifier',
    'qualification',
    'Qualify buyer leads and book property showings',
    'professional',
    'friendly',
    '{
      "price_range_required": true,
      "timeline_required": true,
      "preapproval_preferred": true,
      "min_score_for_booking": 70,
      "max_properties_to_show": 5
    }'::jsonb,
    '{
      "too_expensive": "I completely understand budget concerns. Let me show you some incredible properties in your range that offer amazing value. Many buyers are surprised by what they can get. What if I could find you something with all your must-haves within budget?",
      "not_ready_yet": "I appreciate your honesty. Most successful buyers start planning 3-6 months ahead. How about I send you our buyer preparation guide and check in next month? In the meantime, I can keep you updated on properties matching your criteria.",
      "working_with_another_agent": "That is great you are working with someone. Out of curiosity, have they shown you properties in [neighborhood]? I specialize in that area and have pocket listings that never hit the market. Would a second opinion hurt?"
    }'::jsonb,
    '{
      "must_have": ["price_range", "location", "timeline"],
      "scoring": {
        "preapproved": 30,
        "timeline_30_days": 25,
        "cash_buyer": 20,
        "specific_needs": 15,
        "responded_quickly": 10
      },
      "disqualifiers": ["outside_service_area", "timeline_over_1_year", "no_budget"]
    }'::jsonb,
    '{
      "conditions": ["score_below_40", "luxury_property_request", "commercial_inquiry"],
      "message": "This lead needs personal attention from an agent"
    }'::jsonb
  ) RETURNING id INTO v_sales_qualifier_id;

  -- Objection Handler Agent
  INSERT INTO agent_behaviors (
    pack_id, agent_name, agent_type, goal, personality, tone,
    objection_handling, escalation_rules
  ) VALUES (
    v_real_estate_pack_id,
    'Objection Handler & Closer',
    'sales',
    'Handle objections and close on booking appointments',
    'luxury',
    'consultative',
    '{
      "market_timing": "I understand timing the market feels important. Here is what most successful buyers do: they buy when they find the RIGHT property, not when they think the market is perfect. Properties in your range are getting multiple offers within 72 hours. Would you rather compete with 8 other buyers next month, or see the best options this week before they are gone?",
      "need_to_think": "Absolutely, this is a major decision. What specific concerns do you need to think through? Maybe I can help address those right now.",
      "too_busy": "I totally get it. That is exactly why I offer virtual tours and evening/weekend showings. Most of my buyers tour 3-4 properties in 90 minutes. Does Saturday morning or Tuesday evening work better?"
    }'::jsonb,
    '{
      "conditions": ["multiple_objections", "high_value_lead", "competitor_mentioned"],
      "message": "Agent should call this lead personally"
    }'::jsonb
  ) RETURNING id INTO v_objection_handler_id;

  -- Channel Configurations
  INSERT INTO channel_configurations (behavior_id, channel, message_style, max_message_length, use_emojis, response_delay_seconds) VALUES
  (v_sales_qualifier_id, 'sms', 'concise', 300, true, 3),
  (v_sales_qualifier_id, 'whatsapp', 'conversational', 500, true, 2),
  (v_sales_qualifier_id, 'email', 'structured', 2000, false, 0),
  (v_objection_handler_id, 'sms', 'direct', 350, true, 4),
  (v_objection_handler_id, 'whatsapp', 'consultative', 600, true, 3);

  -- Website Templates
  INSERT INTO platform_templates (pack_id, template_type, name, description, category, niche) VALUES
  (v_real_estate_pack_id, 'website', 'Modern Real Estate Agent Site', 'Clean, mobile-first website with property search and AI chat', 'website', 'real_estate'),
  (v_real_estate_pack_id, 'landing_page', 'Buyer Lead Magnet Page', 'Home buyer guide download with instant qualification', 'landing_page', 'real_estate'),
  (v_real_estate_pack_id, 'landing_page', 'Seller Valuation Page', 'Free home valuation funnel with AI follow-up', 'landing_page', 'real_estate'),
  (v_real_estate_pack_id, 'funnel', 'Property Showing Funnel', 'Multi-step funnel from property interest to booked showing', 'funnel', 'real_estate');

  -- Workflow Templates
  INSERT INTO workflow_templates (
    pack_id, template_id, name, description, category, trigger_event, actions, ai_decision_points, priority, is_core_template
  ) VALUES
  (
    v_real_estate_pack_id,
    'real-estate-buyer-qualification',
    'Buyer Lead Qualification Flow',
    'AI qualifies buyer leads via SMS/WhatsApp and books showings automatically',
    'lead_intelligence',
    'lead.created',
    '[
      {"type": "ai_qualify", "agent": "buyer_qualifier", "channel": "sms"},
      {"type": "ai_decide", "conditions": ["qualified", "not_qualified", "needs_nurture"]},
      {"type": "book_appointment", "if": "qualified"},
      {"type": "nurture_sequence", "if": "needs_nurture"},
      {"type": "disqualify", "if": "not_qualified"}
    ]'::jsonb,
    '[
      {"step": 2, "decision": "qualification_outcome", "options": ["qualified", "not_qualified", "needs_nurture"]}
    ]'::jsonb,
    10,
    true
  ),
  (
    v_real_estate_pack_id,
    'real-estate-no-show-recovery',
    'No-Show Recovery & Reschedule',
    'AI reaches out after missed appointments to reschedule',
    'conversion',
    'appointment.no_show',
    '[
      {"type": "wait", "minutes": 15},
      {"type": "ai_message", "agent": "objection_handler", "channel": "sms", "message": "reschedule_request"},
      {"type": "ai_decide", "conditions": ["reschedule", "lost", "follow_up_later"]},
      {"type": "book_appointment", "if": "reschedule"}
    ]'::jsonb,
    '[
      {"step": 3, "decision": "reschedule_intent", "options": ["reschedule", "lost", "follow_up_later"]}
    ]'::jsonb,
    8,
    true
  );
END $$;

-- ============================================================================
-- 2. MARKETING AGENCY PACK
-- ============================================================================

DO $$
DECLARE
  v_agency_pack_id uuid;
  v_agency_qualifier_id uuid;
BEGIN
  INSERT INTO niche_agent_packs (
    name, slug, niche, description, icon, popularity, is_featured,
    pricing_tiers, setup_time_minutes, tags
  ) VALUES (
    'Marketing Agency AI Pack',
    'marketing-agency-pack',
    'marketing_agency',
    'Complete client acquisition system for marketing agencies. Qualifies leads, books strategy calls, and handles discovery process automatically.',
    'Megaphone',
    180,
    true,
    '[
      {"name": "Discovery Call Booked", "price": 100, "description": "Per qualified discovery call"},
      {"name": "Proposal Sent", "price": 250, "description": "Per proposal delivered"},
      {"name": "Client Signed", "price": 500, "description": "Per new client onboarded"}
    ]'::jsonb,
    15,
    ARRAY['marketing', 'agency', 'b2b', 'lead-qualification']
  ) RETURNING id INTO v_agency_pack_id;

  INSERT INTO agent_behaviors (
    pack_id, agent_name, agent_type, goal, personality, tone,
    rules, objection_handling, qualification_criteria
  ) VALUES (
    v_agency_pack_id,
    'Agency Lead Qualifier',
    'qualification',
    'Qualify potential agency clients and book discovery calls',
    'authoritative',
    'professional',
    '{
      "min_budget": 5000,
      "ideal_industries": ["ecommerce", "saas", "professional_services"],
      "red_flags": ["no_budget", "wants_free_audit", "price_shopping"],
      "qualification_threshold": 65
    }'::jsonb,
    '{
      "too_expensive": "I appreciate you being upfront about budget. Our clients typically see 3-5x ROI within 90 days. Rather than thinking cost, think investment. What is your current revenue? If we could add 20% to that, what would that be worth?",
      "do_it_ourselves": "That is great you have an in-house team. Most of our clients do too. They bring us in because we specialize in [specific result]. Your team focuses on operations, we focus on growth. Think of us as an extension of your team. Does that make sense?",
      "need_references": "Absolutely. I will send you 3 case studies in your industry plus client contacts. While I pull those together, tell me: if you saw proven results in businesses like yours, what would make you ready to move forward?"
    }'::jsonb,
    '{
      "must_have": ["monthly_budget", "industry", "current_revenue", "timeline"],
      "scoring": {
        "budget_over_10k": 30,
        "ecommerce_saas": 25,
        "currently_running_ads": 20,
        "timeline_under_30_days": 15,
        "previous_agency_experience": 10
      },
      "disqualifiers": ["budget_under_2k", "diy_only", "no_decision_authority"]
    }'::jsonb
  ) RETURNING id INTO v_agency_qualifier_id;

  INSERT INTO channel_configurations (behavior_id, channel, message_style, max_message_length, use_emojis) VALUES
  (v_agency_qualifier_id, 'email', 'professional', 2500, false),
  (v_agency_qualifier_id, 'sms', 'concise', 300, false),
  (v_agency_qualifier_id, 'whatsapp', 'consultative', 800, false);

  INSERT INTO platform_templates (pack_id, template_type, name, description, category, niche) VALUES
  (v_agency_pack_id, 'website', 'Agency Portfolio Site', 'Modern agency website with case studies and instant booking', 'website', 'marketing_agency'),
  (v_agency_pack_id, 'landing_page', 'Free Marketing Audit Page', 'Lead magnet offering free audit with AI qualification', 'landing_page', 'marketing_agency'),
  (v_agency_pack_id, 'funnel', 'Discovery Call Funnel', 'Multi-step qualification to discovery call booking', 'funnel', 'marketing_agency');

  INSERT INTO workflow_templates (
    pack_id, template_id, name, description, category, trigger_event, actions, ai_decision_points, priority, is_core_template
  ) VALUES
  (
    v_agency_pack_id,
    'agency-lead-qualification',
    'Agency Client Qualification',
    'AI qualifies potential clients and books discovery calls',
    'lead_intelligence',
    'lead.created',
    '[
      {"type": "ai_qualify", "agent": "agency_qualifier", "channel": "email"},
      {"type": "ai_decide", "conditions": ["high_fit", "medium_fit", "low_fit"]},
      {"type": "book_discovery_call", "if": "high_fit"},
      {"type": "send_case_studies", "if": "medium_fit"},
      {"type": "nurture_sequence", "if": "low_fit"}
    ]'::jsonb,
    '[
      {"step": 2, "decision": "client_fit_level", "options": ["high_fit", "medium_fit", "low_fit"]}
    ]'::jsonb,
    9,
    true
  );
END $$;

-- ============================================================================
-- 3. SAAS BUSINESS PACK
-- ============================================================================

DO $$
DECLARE
  v_saas_pack_id uuid;
  v_trial_converter_id uuid;
  v_churn_preventer_id uuid;
BEGIN
  INSERT INTO niche_agent_packs (
    name, slug, niche, description, icon, popularity, is_featured,
    pricing_tiers, setup_time_minutes, tags
  ) VALUES (
    'SaaS Growth AI Pack',
    'saas-growth-pack',
    'saas',
    'Complete SaaS acquisition and retention system. Converts trials to paid, prevents churn, and drives expansion revenue.',
    'Zap',
    320,
    true,
    '[
      {"name": "Free Trial Signup", "price": 0, "description": "Unlimited trials"},
      {"name": "Trial to Paid", "price": 50, "description": "Per conversion"},
      {"name": "Churn Prevented", "price": 100, "description": "Per saved subscription"}
    ]'::jsonb,
    10,
    ARRAY['saas', 'subscription', 'onboarding', 'churn-prevention']
  ) RETURNING id INTO v_saas_pack_id;

  INSERT INTO agent_behaviors (
    pack_id, agent_name, agent_type, goal, personality, tone,
    rules, objection_handling, qualification_criteria
  ) VALUES (
    v_saas_pack_id,
    'Trial Converter',
    'conversion',
    'Convert free trial users to paid subscribers',
    'helpful',
    'conversational',
    '{
      "engagement_threshold": 3,
      "key_feature_usage_required": true,
      "contact_timing": ["day_3", "day_5", "day_13"],
      "discount_authority": "10_percent_max"
    }'::jsonb,
    '{
      "too_expensive": "I hear you on price. Let me ask - have you tried [key feature] yet? Most users realize the time savings alone pay for the subscription. Plus, you are currently on pace to [benefit]. Would saving [X hours/week] be worth [price]?",
      "still_evaluating": "Makes sense. What specific outcome are you trying to achieve? Let me show you exactly how to do that in the next 5 minutes. If I can prove it works for your use case right now, would you be ready to upgrade?",
      "need_approval": "Totally understand. Who else needs to be involved? I can send you a one-pager that shows ROI, or I can jump on a quick call with your team. What would make approval easier?"
    }'::jsonb,
    '{
      "must_have": ["activated_account", "used_key_feature"],
      "scoring": {
        "daily_active_user": 30,
        "invited_team_members": 25,
        "used_advanced_features": 20,
        "positive_support_interaction": 15,
        "email_opened": 10
      },
      "high_intent_signals": ["viewed_pricing_3_times", "contacted_support", "upgraded_before"]
    }'::jsonb
  ) RETURNING id INTO v_trial_converter_id;

  INSERT INTO agent_behaviors (
    pack_id, agent_name, agent_type, goal, personality, tone,
    rules, objection_handling
  ) VALUES (
    v_saas_pack_id,
    'Churn Preventer',
    'retention',
    'Identify at-risk customers and prevent cancellations',
    'empathetic',
    'supportive',
    '{
      "risk_signals": ["login_decreased", "feature_usage_dropped", "support_tickets_increased"],
      "intervention_timing": "before_renewal",
      "retention_offers": ["discount", "extended_trial", "feature_upgrade", "1on1_training"]
    }'::jsonb,
    '{
      "not_using_it": "I completely understand. It sounds like you have not found the workflow that fits your needs yet. What if I could personally show you how [successful customer] uses it to [achieve result] in under 10 minutes? Would that be worth trying before canceling?",
      "competitor_cheaper": "I appreciate you telling me. Price aside, is there something about [competitor] that works better for you? Because if it is just price, I can likely match or beat that. But if there is a feature or workflow issue, I want to know so we can fix it.",
      "no_longer_needed": "That makes sense. Before you go, two quick questions: 1) What changed? 2) If that situation changes again, would you come back? If yes, let me pause your account instead of canceling so you do not lose your data and setup."
    }'::jsonb
  ) RETURNING id INTO v_churn_preventer_id;

  INSERT INTO channel_configurations (behavior_id, channel, message_style, max_message_length, use_emojis) VALUES
  (v_trial_converter_id, 'email', 'helpful', 1500, true),
  (v_trial_converter_id, 'webchat', 'conversational', 800, true),
  (v_churn_preventer_id, 'email', 'empathetic', 1800, false),
  (v_churn_preventer_id, 'sms', 'supportive', 400, true);

  INSERT INTO platform_templates (pack_id, template_type, name, description, category, niche) VALUES
  (v_saas_pack_id, 'website', 'SaaS Product Site', 'Modern SaaS website with interactive demo and instant trial signup', 'website', 'saas'),
  (v_saas_pack_id, 'landing_page', 'Free Trial Landing Page', 'High-converting trial signup page with social proof', 'landing_page', 'saas'),
  (v_saas_pack_id, 'funnel', 'Onboarding Flow', 'Multi-step onboarding with AI assistance', 'funnel', 'saas');

  INSERT INTO workflow_templates (
    pack_id, template_id, name, description, category, trigger_event, actions, ai_decision_points, priority, is_core_template
  ) VALUES
  (
    v_saas_pack_id,
    'saas-trial-conversion',
    'Trial to Paid Conversion',
    'AI engages trial users and converts to paid based on usage patterns',
    'conversion',
    'trial.started',
    '[
      {"type": "onboarding_sequence", "days": [1, 2, 3]},
      {"type": "monitor_engagement", "signals": ["feature_usage", "login_frequency"]},
      {"type": "ai_decide", "conditions": ["high_engagement", "medium_engagement", "low_engagement"]},
      {"type": "conversion_push", "if": "high_engagement", "timing": "day_5"},
      {"type": "feature_education", "if": "medium_engagement"},
      {"type": "reactivation_attempt", "if": "low_engagement"}
    ]'::jsonb,
    '[
      {"step": 3, "decision": "engagement_level", "options": ["high_engagement", "medium_engagement", "low_engagement"]}
    ]'::jsonb,
    10,
    true
  ),
  (
    v_saas_pack_id,
    'saas-churn-prevention',
    'Churn Risk Prevention',
    'AI identifies at-risk customers and intervenes before cancellation',
    'nurture',
    'churn_risk.detected',
    '[
      {"type": "ai_analyze", "risk_factors": ["usage_drop", "support_issues", "competitor_research"]},
      {"type": "ai_decide", "conditions": ["high_risk", "medium_risk", "false_alarm"]},
      {"type": "immediate_intervention", "if": "high_risk", "agent": "churn_preventer"},
      {"type": "proactive_support", "if": "medium_risk"},
      {"type": "continue_monitoring", "if": "false_alarm"}
    ]'::jsonb,
    '[
      {"step": 2, "decision": "churn_risk_level", "options": ["high_risk", "medium_risk", "false_alarm"]}
    ]'::jsonb,
    10,
    true
  );
END $$;

-- ============================================================================
-- 4. COACHING/CONSULTING PACK
-- ============================================================================

DO $$
DECLARE
  v_coaching_pack_id uuid;
  v_coach_qualifier_id uuid;
BEGIN
  INSERT INTO niche_agent_packs (
    name, slug, niche, description, icon, popularity, is_featured,
    pricing_tiers, setup_time_minutes, tags
  ) VALUES (
    'Coaching & Consulting AI Pack',
    'coaching-consulting-pack',
    'coaching',
    'Complete client acquisition system for coaches and consultants. Qualifies leads, books strategy sessions, and handles objections automatically.',
    'Users',
    145,
    true,
    '[
      {"name": "Discovery Call", "price": 75, "description": "Per qualified discovery call"},
      {"name": "Strategy Session", "price": 150, "description": "Per strategy session booked"},
      {"name": "Client Enrolled", "price": 300, "description": "Per new client signed"}
    ]'::jsonb,
    12,
    ARRAY['coaching', 'consulting', 'high-ticket', 'appointment-booking']
  ) RETURNING id INTO v_coaching_pack_id;

  INSERT INTO agent_behaviors (
    pack_id, agent_name, agent_type, goal, personality, tone,
    rules, objection_handling, qualification_criteria
  ) VALUES (
    v_coaching_pack_id,
    'Coaching Lead Qualifier',
    'qualification',
    'Qualify coaching leads and book breakthrough strategy sessions',
    'inspiring',
    'consultative',
    '{
      "min_investment_capacity": 2000,
      "ideal_client_profile": ["committed_to_growth", "coachable", "results_focused"],
      "red_flags": ["tire_kickers", "refund_seekers", "not_coachable"],
      "booking_threshold": 70
    }'::jsonb,
    '{
      "too_expensive": "I completely understand. Let me ask you this: What is staying stuck costing you? Not just in money, but in time, stress, missed opportunities. If this program could solve [pain point] in 90 days, what would that be worth to you?",
      "need_to_think": "Absolutely, this is important. Let me ask - what specifically do you need to think about? Is it the investment, the time commitment, or something else? Because if I can address that right now, we could get you started this week.",
      "tried_before": "I hear you. You have invested before and did not get the results. That is frustrating. Let me ask: what was missing? Because most people fail not because the strategy was wrong, but because they did not have the support, accountability, and personalized guidance. That is exactly what we do differently."
    }'::jsonb,
    '{
      "must_have": ["clear_pain_point", "investment_capacity", "coachability_signals"],
      "scoring": {
        "urgent_need": 30,
        "previous_buyer": 25,
        "high_income": 20,
        "clear_goal": 15,
        "engaged_with_content": 10
      },
      "disqualifiers": ["no_investment_capacity", "not_coachable", "litigation_history"]
    }'::jsonb
  ) RETURNING id INTO v_coach_qualifier_id;

  INSERT INTO channel_configurations (behavior_id, channel, message_style, max_message_length, use_emojis) VALUES
  (v_coach_qualifier_id, 'email', 'inspiring', 2000, true),
  (v_coach_qualifier_id, 'sms', 'personal', 350, true),
  (v_coach_qualifier_id, 'whatsapp', 'consultative', 900, true);

  INSERT INTO platform_templates (pack_id, template_type, name, description, category, niche) VALUES
  (v_coaching_pack_id, 'website', 'Coach Personal Brand Site', 'High-converting coach website with video and testimonials', 'website', 'coaching'),
  (v_coaching_pack_id, 'landing_page', 'Free Training Webinar Page', 'Webinar registration with automated follow-up', 'landing_page', 'coaching'),
  (v_coaching_pack_id, 'funnel', 'Application Funnel', 'Multi-step application to strategy session', 'funnel', 'coaching');

  INSERT INTO workflow_templates (
    pack_id, template_id, name, description, category, trigger_event, actions, ai_decision_points, priority, is_core_template
  ) VALUES
  (
    v_coaching_pack_id,
    'coaching-application-qualification',
    'Coaching Application Flow',
    'AI reviews applications and books qualified leads for strategy sessions',
    'lead_intelligence',
    'application.submitted',
    '[
      {"type": "ai_analyze_application", "agent": "coach_qualifier"},
      {"type": "ai_decide", "conditions": ["ideal_client", "good_fit", "not_ready"]},
      {"type": "book_strategy_session", "if": "ideal_client"},
      {"type": "pre_call_questionnaire", "if": "good_fit"},
      {"type": "nurture_sequence", "if": "not_ready"}
    ]'::jsonb,
    '[
      {"step": 2, "decision": "client_fit_assessment", "options": ["ideal_client", "good_fit", "not_ready"]}
    ]'::jsonb,
    9,
    true
  );
END $$;

-- ============================================================================
-- 5. ECOMMERCE STORE PACK
-- ============================================================================

DO $$
DECLARE
  v_ecommerce_pack_id uuid;
  v_cart_recoverer_id uuid;
  v_upsell_agent_id uuid;
BEGIN
  INSERT INTO niche_agent_packs (
    name, slug, niche, description, icon, popularity, is_featured,
    pricing_tiers, setup_time_minutes, tags
  ) VALUES (
    'Ecommerce AI Store Pack',
    'ecommerce-store-pack',
    'ecommerce',
    'Complete ecommerce revenue optimization system. Recovers abandoned carts, drives upsells, and maximizes customer lifetime value.',
    'ShoppingCart',
    275,
    true,
    '[
      {"name": "Revenue Share", "price": 0, "description": "5% of recovered revenue"},
      {"name": "Per Order", "price": 2, "description": "Per AI-assisted order"},
      {"name": "Flat Monthly", "price": 297, "description": "Unlimited AI interactions"}
    ]'::jsonb,
    10,
    ARRAY['ecommerce', 'cart-recovery', 'upsell', 'customer-support']
  ) RETURNING id INTO v_ecommerce_pack_id;

  INSERT INTO agent_behaviors (
    pack_id, agent_name, agent_type, goal, personality, tone,
    rules, objection_handling
  ) VALUES (
    v_ecommerce_pack_id,
    'Cart Recovery Agent',
    'conversion',
    'Recover abandoned carts and close sales',
    'helpful',
    'friendly',
    '{
      "contact_timing": ["15_minutes", "3_hours", "24_hours"],
      "discount_authority": "15_percent_max",
      "free_shipping_threshold": 50,
      "urgency_tactics": ["limited_stock", "price_increase_soon"]
    }'::jsonb,
    '{
      "shipping_cost": "I totally get that shipping costs add up. Good news - I can offer you free shipping on your order right now if you complete checkout in the next 30 minutes. Does that work?",
      "found_cheaper": "Thanks for letting me know. Mind sharing where? I want to make sure you are comparing apples to apples on quality. Plus, we might be able to match or beat that price, and you would get our [unique benefit]. Worth checking out?",
      "not_sure": "No worries. What is holding you back? Is it the product itself, price, or something else? Let me help you figure out if this is right for you."
    }'::jsonb
  ) RETURNING id INTO v_cart_recoverer_id;

  INSERT INTO agent_behaviors (
    pack_id, agent_name, agent_type, goal, personality, tone,
    rules
  ) VALUES (
    v_ecommerce_pack_id,
    'Post-Purchase Upsell Agent',
    'sales',
    'Drive post-purchase upsells and increase average order value',
    'enthusiastic',
    'casual',
    '{
      "timing": "immediately_after_purchase",
      "max_upsell_attempts": 2,
      "upsell_logic": "complementary_products",
      "discount_for_add_on": "10_percent"
    }'::jsonb
  ) RETURNING id INTO v_upsell_agent_id;

  INSERT INTO channel_configurations (behavior_id, channel, message_style, max_message_length, use_emojis) VALUES
  (v_cart_recoverer_id, 'email', 'friendly', 1200, true),
  (v_cart_recoverer_id, 'sms', 'urgent', 300, true),
  (v_cart_recoverer_id, 'whatsapp', 'conversational', 500, true),
  (v_upsell_agent_id, 'email', 'enthusiastic', 1000, true);

  INSERT INTO platform_templates (pack_id, template_type, name, description, category, niche) VALUES
  (v_ecommerce_pack_id, 'website', 'Modern Ecommerce Store', 'Fast, mobile-optimized store with AI shopping assistant', 'website', 'ecommerce'),
  (v_ecommerce_pack_id, 'landing_page', 'Product Launch Page', 'High-converting product launch page with countdown', 'landing_page', 'ecommerce'),
  (v_ecommerce_pack_id, 'funnel', 'Flash Sale Funnel', 'Urgency-driven flash sale funnel with AI follow-up', 'funnel', 'ecommerce');

  INSERT INTO workflow_templates (
    pack_id, template_id, name, description, category, trigger_event, actions, ai_decision_points, priority, is_core_template
  ) VALUES
  (
    v_ecommerce_pack_id,
    'ecommerce-cart-recovery',
    'Abandoned Cart Recovery',
    'AI recovers abandoned carts with personalized messaging and offers',
    'conversion',
    'cart.abandoned',
    '[
      {"type": "wait", "minutes": 15},
      {"type": "ai_message", "agent": "cart_recoverer", "channel": "email", "message": "cart_reminder"},
      {"type": "wait", "hours": 3},
      {"type": "ai_message", "channel": "sms", "message": "urgency_push"},
      {"type": "ai_decide", "conditions": ["returning", "objection", "ghosted"]},
      {"type": "offer_discount", "if": "objection"},
      {"type": "final_attempt", "if": "ghosted", "wait": "24_hours"}
    ]'::jsonb,
    '[
      {"step": 5, "decision": "customer_behavior", "options": ["returning", "objection", "ghosted"]}
    ]'::jsonb,
    10,
    true
  ),
  (
    v_ecommerce_pack_id,
    'ecommerce-post-purchase-upsell',
    'Post-Purchase Upsell Flow',
    'AI suggests complementary products immediately after purchase',
    'sales',
    'order.completed',
    '[
      {"type": "ai_analyze_purchase", "identify": "complementary_products"},
      {"type": "immediate_upsell_offer", "agent": "upsell_agent", "discount": "10_percent"},
      {"type": "ai_decide", "conditions": ["accepted", "declined", "ignored"]},
      {"type": "process_add_on", "if": "accepted"},
      {"type": "follow_up_email", "if": "ignored", "wait": "3_hours"}
    ]'::jsonb,
    '[
      {"step": 3, "decision": "upsell_response", "options": ["accepted", "declined", "ignored"]}
    ]'::jsonb,
    8,
    true
  );
END $$;
