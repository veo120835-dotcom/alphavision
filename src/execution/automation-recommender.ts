// Automation Recommender - Identify and prioritize automation opportunities

import { AutomationOpportunity, AutomationCategory, Process } from './types';

interface AutomationAssessment {
  opportunities: AutomationOpportunity[];
  total_hours_recoverable_monthly: number;
  total_implementation_effort: number;
  recommended_sequence: AutomationOpportunity[];
  quick_wins: AutomationOpportunity[];
  roi_summary: {
    investment_hours: number;
    monthly_savings_hours: number;
    payback_months: number;
  };
}

interface AutomationTool {
  name: string;
  category: AutomationCategory;
  use_cases: string[];
  complexity: 'low' | 'medium' | 'high';
  cost_tier: 'free' | 'low' | 'medium' | 'high';
  integration_ease: 'easy' | 'moderate' | 'complex';
}

class AutomationRecommenderService {
  private opportunities: AutomationOpportunity[] = [];
  
  private toolDatabase: AutomationTool[] = [
    { name: 'Zapier', category: 'workflow', use_cases: ['app integrations', 'data sync', 'notifications'], complexity: 'low', cost_tier: 'low', integration_ease: 'easy' },
    { name: 'Make (Integromat)', category: 'workflow', use_cases: ['complex workflows', 'data transformation', 'scheduling'], complexity: 'medium', cost_tier: 'low', integration_ease: 'moderate' },
    { name: 'n8n', category: 'workflow', use_cases: ['self-hosted automation', 'custom integrations'], complexity: 'high', cost_tier: 'free', integration_ease: 'complex' },
    { name: 'Mailchimp', category: 'communication', use_cases: ['email marketing', 'drip campaigns', 'newsletters'], complexity: 'low', cost_tier: 'low', integration_ease: 'easy' },
    { name: 'Intercom', category: 'communication', use_cases: ['chat support', 'onboarding', 'announcements'], complexity: 'medium', cost_tier: 'medium', integration_ease: 'moderate' },
    { name: 'Airtable', category: 'data', use_cases: ['database', 'project management', 'CRM'], complexity: 'low', cost_tier: 'low', integration_ease: 'easy' },
    { name: 'Retool', category: 'data', use_cases: ['internal tools', 'dashboards', 'admin panels'], complexity: 'medium', cost_tier: 'medium', integration_ease: 'moderate' },
    { name: 'Datadog', category: 'reporting', use_cases: ['monitoring', 'alerting', 'analytics'], complexity: 'medium', cost_tier: 'medium', integration_ease: 'moderate' },
    { name: 'Metabase', category: 'reporting', use_cases: ['BI dashboards', 'reports', 'analytics'], complexity: 'low', cost_tier: 'free', integration_ease: 'easy' },
    { name: 'Segment', category: 'integration', use_cases: ['customer data platform', 'data routing'], complexity: 'medium', cost_tier: 'high', integration_ease: 'moderate' },
  ];

  analyzeProcess(process: Process): AutomationOpportunity[] {
    const opportunities: AutomationOpportunity[] = [];

    process.steps.forEach(step => {
      if (step.time_estimate_minutes > 30) {
        const automationPotential = this.assessStepAutomation(step);
        
        if (automationPotential.score > 50) {
          opportunities.push({
            id: `auto-${process.id}-${step.id}`,
            category: automationPotential.category,
            process_id: process.id,
            title: `Automate: ${step.name}`,
            description: automationPotential.description,
            current_time_hours_monthly: (step.time_estimate_minutes / 60) * 20,
            potential_savings_hours: (step.time_estimate_minutes / 60) * 20 * (automationPotential.score / 100),
            implementation_effort: automationPotential.effort,
            recommended_tools: automationPotential.tools,
            roi_months: this.calculateROI(step.time_estimate_minutes, automationPotential),
            priority_score: automationPotential.score,
          });
        }
      }
    });

    opportunities.forEach(opp => this.registerOpportunity(opp));
    return opportunities;
  }

  private assessStepAutomation(step: { 
    name: string; 
    description: string; 
    inputs: string[];
    outputs: string[];
  }): {
    score: number;
    category: AutomationCategory;
    description: string;
    effort: 'low' | 'medium' | 'high';
    tools: string[];
  } {
    const nameLower = step.name.toLowerCase();
    const descLower = step.description.toLowerCase();
    
    let score = 30;
    let category: AutomationCategory = 'workflow';
    let effort: 'low' | 'medium' | 'high' = 'medium';
    const tools: string[] = [];

    if (nameLower.includes('send') || nameLower.includes('email') || nameLower.includes('notify')) {
      score += 40;
      category = 'communication';
      effort = 'low';
      tools.push('Mailchimp', 'Zapier');
    }

    if (nameLower.includes('report') || nameLower.includes('dashboard') || nameLower.includes('analytics')) {
      score += 35;
      category = 'reporting';
      effort = 'medium';
      tools.push('Metabase', 'Datadog');
    }

    if (nameLower.includes('sync') || nameLower.includes('update') || nameLower.includes('transfer')) {
      score += 45;
      category = 'integration';
      effort = 'low';
      tools.push('Zapier', 'Make');
    }

    if (nameLower.includes('collect') || nameLower.includes('gather') || nameLower.includes('compile')) {
      score += 30;
      category = 'data';
      effort = 'medium';
      tools.push('Airtable', 'Retool');
    }

    if (step.inputs.length <= 2 && step.outputs.length <= 2) {
      score += 15;
      // Simple inputs/outputs make automation easier
      if (effort !== 'low') effort = 'medium';
    }

    return {
      score: Math.min(100, score),
      category,
      description: `Automate ${step.name} to save time and reduce manual effort`,
      effort,
      tools: tools.length > 0 ? tools : ['Zapier', 'Make'],
    };
  }

  private calculateROI(timeMinutes: number, assessment: { score: number; effort: 'low' | 'medium' | 'high' }): number {
    const monthlyHours = (timeMinutes / 60) * 20;
    const savings = monthlyHours * (assessment.score / 100);
    const implementationHours = assessment.effort === 'low' ? 8 : assessment.effort === 'medium' ? 24 : 60;
    
    return savings > 0 ? Math.ceil(implementationHours / savings) : 12;
  }

  registerOpportunity(opportunity: AutomationOpportunity): void {
    const existing = this.opportunities.findIndex(o => o.id === opportunity.id);
    if (existing >= 0) {
      this.opportunities[existing] = opportunity;
    } else {
      this.opportunities.push(opportunity);
    }
  }

  generateAssessment(): AutomationAssessment {
    const sorted = [...this.opportunities].sort((a, b) => {
      const aValue = a.potential_savings_hours / (a.roi_months || 1);
      const bValue = b.potential_savings_hours / (b.roi_months || 1);
      return bValue - aValue;
    });

    const quickWins = sorted.filter(o => 
      o.implementation_effort === 'low' && o.roi_months <= 2
    );

    const totalSavings = this.opportunities.reduce((sum, o) => sum + o.potential_savings_hours, 0);
    const totalImplementation = this.opportunities.reduce((sum, o) => {
      const hours = o.implementation_effort === 'low' ? 8 : o.implementation_effort === 'medium' ? 24 : 60;
      return sum + hours;
    }, 0);

    return {
      opportunities: this.opportunities,
      total_hours_recoverable_monthly: totalSavings,
      total_implementation_effort: totalImplementation,
      recommended_sequence: sorted.slice(0, 5),
      quick_wins: quickWins,
      roi_summary: {
        investment_hours: totalImplementation,
        monthly_savings_hours: totalSavings,
        payback_months: totalSavings > 0 ? Math.ceil(totalImplementation / totalSavings) : 0,
      },
    };
  }

  recommendTools(category: AutomationCategory): AutomationTool[] {
    return this.toolDatabase.filter(t => t.category === category);
  }

  getOpportunitiesByCategory(category: AutomationCategory): AutomationOpportunity[] {
    return this.opportunities.filter(o => o.category === category);
  }

  getQuickWins(): AutomationOpportunity[] {
    return this.opportunities.filter(o => 
      o.implementation_effort === 'low' && o.roi_months <= 2
    );
  }
}

export const automationRecommenderService = new AutomationRecommenderService();
