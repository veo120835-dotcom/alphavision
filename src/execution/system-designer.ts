// System Designer - Design and document business systems

import { BusinessSystem, SystemType } from './types';

interface SystemBlueprint {
  system: BusinessSystem;
  implementation_steps: string[];
  success_metrics: string[];
  common_pitfalls: string[];
  recommended_tools: string[];
}

interface SystemGapAnalysis {
  existing_systems: BusinessSystem[];
  missing_systems: { type: SystemType; importance: 'critical' | 'important' | 'nice_to_have' }[];
  integration_gaps: string[];
  documentation_gaps: string[];
  maturity_assessment: { type: SystemType; current: string; target: string }[];
}

class SystemDesignerService {
  private systems: BusinessSystem[] = [];

  private systemTemplates: Map<SystemType, Partial<BusinessSystem>> = new Map([
    ['sales', {
      name: 'Sales System',
      description: 'End-to-end sales process from lead to close',
      inputs: ['Qualified leads', 'Pricing', 'Product info'],
      outputs: ['Closed deals', 'Pipeline data', 'Forecasts'],
      frequency: 'continuous',
    }],
    ['marketing', {
      name: 'Marketing System',
      description: 'Lead generation and brand awareness',
      inputs: ['Target audience data', 'Content', 'Budget'],
      outputs: ['Leads', 'Brand awareness metrics', 'Content'],
      frequency: 'continuous',
    }],
    ['operations', {
      name: 'Operations System',
      description: 'Day-to-day business operations and delivery',
      inputs: ['Customer orders', 'Resources', 'Processes'],
      outputs: ['Delivered products/services', 'Operational data'],
      frequency: 'continuous',
    }],
    ['finance', {
      name: 'Finance System',
      description: 'Financial management and reporting',
      inputs: ['Transactions', 'Invoices', 'Expenses'],
      outputs: ['Financial reports', 'Cash flow data', 'Budgets'],
      frequency: 'daily',
    }],
    ['hr', {
      name: 'HR System',
      description: 'People management and development',
      inputs: ['Job requirements', 'Employee data', 'Performance data'],
      outputs: ['Hired employees', 'Training', 'Performance reviews'],
      frequency: 'weekly',
    }],
    ['product', {
      name: 'Product System',
      description: 'Product development and improvement',
      inputs: ['Customer feedback', 'Market data', 'Technical specs'],
      outputs: ['Product updates', 'Roadmap', 'Documentation'],
      frequency: 'weekly',
    }],
    ['customer_success', {
      name: 'Customer Success System',
      description: 'Customer retention and satisfaction',
      inputs: ['Customer data', 'Usage data', 'Support tickets'],
      outputs: ['Satisfied customers', 'Renewals', 'Upsells'],
      frequency: 'continuous',
    }],
  ]);

  registerSystem(system: BusinessSystem): void {
    const existing = this.systems.findIndex(s => s.id === system.id);
    if (existing >= 0) {
      this.systems[existing] = system;
    } else {
      this.systems.push(system);
    }
  }

  designSystem(type: SystemType, customization?: Partial<BusinessSystem>): SystemBlueprint {
    const template = this.systemTemplates.get(type);
    
    const system: BusinessSystem = {
      id: `system-${type}-${Date.now()}`,
      type,
      name: template?.name || `${type} System`,
      description: template?.description || '',
      inputs: template?.inputs || [],
      outputs: template?.outputs || [],
      frequency: template?.frequency || 'weekly',
      dependencies: [],
      tools_used: [],
      documented: false,
      maturity: 'ad_hoc',
      ...customization,
    };

    const blueprint: SystemBlueprint = {
      system,
      implementation_steps: this.generateImplementationSteps(type),
      success_metrics: this.generateSuccessMetrics(type),
      common_pitfalls: this.generateCommonPitfalls(type),
      recommended_tools: this.getRecommendedTools(type),
    };

    return blueprint;
  }

  private generateImplementationSteps(type: SystemType): string[] {
    const commonSteps = [
      'Document current state and pain points',
      'Define desired outcomes and success metrics',
      'Map out core process flow',
      'Identify required tools and resources',
      'Create standard operating procedures',
      'Train team members',
      'Implement tracking and reporting',
      'Schedule regular review cycles',
    ];

    const typeSpecificSteps: Record<SystemType, string[]> = {
      sales: ['Set up CRM', 'Define sales stages', 'Create sales scripts'],
      marketing: ['Define target personas', 'Set up marketing automation', 'Create content calendar'],
      operations: ['Map delivery workflow', 'Define quality standards', 'Set up inventory/resource tracking'],
      finance: ['Set up accounting system', 'Define approval workflows', 'Create reporting templates'],
      hr: ['Define hiring process', 'Create onboarding checklist', 'Set up performance review cycle'],
      product: ['Set up product backlog', 'Define release process', 'Create feedback collection system'],
      customer_success: ['Define customer journey', 'Set up health scoring', 'Create escalation procedures'],
    };

    return [...commonSteps, ...typeSpecificSteps[type]];
  }

  private generateSuccessMetrics(type: SystemType): string[] {
    const metrics: Record<SystemType, string[]> = {
      sales: ['Close rate', 'Sales cycle length', 'Average deal size', 'Pipeline velocity'],
      marketing: ['Cost per lead', 'Lead quality score', 'Marketing ROI', 'Brand awareness'],
      operations: ['Delivery time', 'Error rate', 'Customer satisfaction', 'Cost per delivery'],
      finance: ['Days to close books', 'Cash flow accuracy', 'Budget variance', 'Collection days'],
      hr: ['Time to hire', 'Employee retention', 'Training completion', 'eNPS score'],
      product: ['Release frequency', 'Bug rate', 'Feature adoption', 'Customer feedback score'],
      customer_success: ['Churn rate', 'NPS score', 'Expansion revenue', 'Time to value'],
    };

    return metrics[type];
  }

  private generateCommonPitfalls(type: SystemType): string[] {
    const pitfalls: Record<SystemType, string[]> = {
      sales: ['Over-complicated CRM', 'No clear sales process', 'Poor lead qualification'],
      marketing: ['No tracking', 'Inconsistent messaging', 'Spray and pray approach'],
      operations: ['Undocumented processes', 'Single points of failure', 'No quality control'],
      finance: ['Manual data entry', 'Delayed reporting', 'Poor cash flow visibility'],
      hr: ['Rushed hiring', 'No onboarding', 'Infrequent feedback'],
      product: ['Feature creep', 'No user validation', 'Technical debt accumulation'],
      customer_success: ['Reactive only', 'No health monitoring', 'Poor handoff from sales'],
    };

    return pitfalls[type];
  }

  private getRecommendedTools(type: SystemType): string[] {
    const tools: Record<SystemType, string[]> = {
      sales: ['HubSpot', 'Salesforce', 'Pipedrive', 'Close'],
      marketing: ['HubSpot', 'Mailchimp', 'Google Analytics', 'Semrush'],
      operations: ['Monday.com', 'Asana', 'Notion', 'Zapier'],
      finance: ['QuickBooks', 'Xero', 'Stripe', 'Bill.com'],
      hr: ['BambooHR', 'Gusto', 'Lever', 'Lattice'],
      product: ['Jira', 'Linear', 'Productboard', 'Amplitude'],
      customer_success: ['Intercom', 'Gainsight', 'ChurnZero', 'Zendesk'],
    };

    return tools[type];
  }

  analyzeGaps(): SystemGapAnalysis {
    const existingTypes = new Set(this.systems.map(s => s.type));
    const allTypes: SystemType[] = ['sales', 'marketing', 'operations', 'finance', 'hr', 'product', 'customer_success'];

    const missingSystems = allTypes
      .filter(type => !existingTypes.has(type))
      .map(type => ({
        type,
        importance: this.getSystemImportance(type),
      }));

    const integrationGaps = this.findIntegrationGaps();
    const documentationGaps = this.systems
      .filter(s => !s.documented)
      .map(s => `${s.name} is not documented`);

    const maturityAssessment = this.systems.map(s => ({
      type: s.type,
      current: s.maturity,
      target: this.getTargetMaturity(s.type),
    }));

    return {
      existing_systems: this.systems,
      missing_systems: missingSystems,
      integration_gaps: integrationGaps,
      documentation_gaps: documentationGaps,
      maturity_assessment: maturityAssessment,
    };
  }

  private getSystemImportance(type: SystemType): 'critical' | 'important' | 'nice_to_have' {
    const critical: SystemType[] = ['sales', 'operations'];
    const important: SystemType[] = ['marketing', 'finance', 'customer_success'];
    
    if (critical.includes(type)) return 'critical';
    if (important.includes(type)) return 'important';
    return 'nice_to_have';
  }

  private findIntegrationGaps(): string[] {
    const gaps: string[] = [];
    
    const hasSales = this.systems.some(s => s.type === 'sales');
    const hasMarketing = this.systems.some(s => s.type === 'marketing');
    const hasCustomerSuccess = this.systems.some(s => s.type === 'customer_success');

    if (hasSales && hasMarketing) {
      const salesSystem = this.systems.find(s => s.type === 'sales');
      const marketingSystem = this.systems.find(s => s.type === 'marketing');
      
      if (salesSystem && marketingSystem && !salesSystem.dependencies.includes(marketingSystem.id)) {
        gaps.push('Sales and Marketing systems are not integrated');
      }
    }

    if (hasSales && hasCustomerSuccess) {
      gaps.push('Ensure smooth handoff process between Sales and Customer Success');
    }

    return gaps;
  }

  private getTargetMaturity(type: SystemType): string {
    if (['sales', 'operations'].includes(type)) return 'optimized';
    if (['marketing', 'customer_success'].includes(type)) return 'managed';
    return 'defined';
  }

  getSystems(): BusinessSystem[] {
    return this.systems;
  }

  getSystemsByType(type: SystemType): BusinessSystem[] {
    return this.systems.filter(s => s.type === type);
  }
}

export const systemDesignerService = new SystemDesignerService();
