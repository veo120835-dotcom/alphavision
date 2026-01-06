import type { BusinessIntake } from './types';

export interface IntakeQuestion {
  id: string;
  category: string;
  question: string;
  type: 'number' | 'text' | 'select' | 'multiselect';
  options?: string[];
  required: boolean;
  validation?: (value: unknown) => boolean;
}

export const INTAKE_QUESTIONS: IntakeQuestion[] = [
  {
    id: 'revenue_monthly',
    category: 'financials',
    question: 'What is your current monthly revenue?',
    type: 'number',
    required: true,
  },
  {
    id: 'revenue_trend',
    category: 'financials',
    question: 'How is your revenue trending over the past 3 months?',
    type: 'select',
    options: ['growing', 'stable', 'declining'],
    required: true,
  },
  {
    id: 'team_size',
    category: 'operations',
    question: 'How many people are on your team (including yourself)?',
    type: 'number',
    required: true,
  },
  {
    id: 'industry',
    category: 'market',
    question: 'What industry are you in?',
    type: 'text',
    required: true,
  },
  {
    id: 'business_model',
    category: 'market',
    question: 'What is your primary business model?',
    type: 'select',
    options: ['saas', 'services', 'marketplace', 'ecommerce', 'agency', 'consulting', 'other'],
    required: true,
  },
  {
    id: 'primary_channel',
    category: 'growth',
    question: 'What is your primary customer acquisition channel?',
    type: 'select',
    options: ['organic_search', 'paid_ads', 'referrals', 'outbound', 'content', 'partnerships', 'other'],
    required: true,
  },
  {
    id: 'customer_count',
    category: 'growth',
    question: 'How many active customers do you have?',
    type: 'number',
    required: true,
  },
  {
    id: 'churn_rate',
    category: 'retention',
    question: 'What is your monthly churn rate (%)? Leave blank if unknown.',
    type: 'number',
    required: false,
  },
  {
    id: 'cash_runway_months',
    category: 'financials',
    question: 'How many months of cash runway do you have?',
    type: 'number',
    required: false,
  },
  {
    id: 'main_challenges',
    category: 'strategy',
    question: 'What are your top 3 challenges right now?',
    type: 'multiselect',
    options: [
      'Not enough leads',
      'Low conversion rates',
      'High churn',
      'Hiring/team issues',
      'Cash flow',
      'Product issues',
      'Competition',
      'Scaling operations',
      'Time management',
    ],
    required: true,
  },
  {
    id: 'goals_90_day',
    category: 'strategy',
    question: 'What are your top 3 goals for the next 90 days?',
    type: 'multiselect',
    options: [
      'Increase revenue',
      'Get more leads',
      'Improve conversion',
      'Reduce churn',
      'Hire key roles',
      'Raise funding',
      'Launch new product',
      'Expand to new market',
      'Improve operations',
    ],
    required: true,
  },
];

export class BusinessIntakeService {
  validateIntake(data: Partial<BusinessIntake>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const question of INTAKE_QUESTIONS) {
      if (question.required) {
        const value = data[question.id as keyof BusinessIntake];
        if (value === undefined || value === null || value === '') {
          errors.push(`${question.question} is required`);
        }
      }
    }

    if (data.revenue_monthly !== undefined && data.revenue_monthly < 0) {
      errors.push('Revenue cannot be negative');
    }

    if (data.team_size !== undefined && data.team_size < 1) {
      errors.push('Team size must be at least 1');
    }

    if (data.churn_rate !== undefined && (data.churn_rate < 0 || data.churn_rate > 100)) {
      errors.push('Churn rate must be between 0 and 100');
    }

    return { valid: errors.length === 0, errors };
  }

  calculateHealthScore(intake: BusinessIntake): number {
    let score = 50; // Base score

    // Revenue trend impact
    if (intake.revenue_trend === 'growing') score += 15;
    else if (intake.revenue_trend === 'declining') score -= 20;

    // Revenue per employee efficiency
    const revenuePerEmployee = intake.revenue_monthly / intake.team_size;
    if (revenuePerEmployee > 20000) score += 10;
    else if (revenuePerEmployee < 5000) score -= 10;

    // Customer health
    if (intake.customer_count > 100) score += 10;
    else if (intake.customer_count < 10) score -= 10;

    // Churn impact
    if (intake.churn_rate !== undefined) {
      if (intake.churn_rate < 3) score += 10;
      else if (intake.churn_rate > 10) score -= 15;
    }

    // Runway impact
    if (intake.cash_runway_months !== undefined) {
      if (intake.cash_runway_months > 12) score += 10;
      else if (intake.cash_runway_months < 3) score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  getIntakeQuestions(): IntakeQuestion[] {
    return INTAKE_QUESTIONS;
  }

  getQuestionsByCategory(category: string): IntakeQuestion[] {
    return INTAKE_QUESTIONS.filter(q => q.category === category);
  }
}

export const businessIntakeService = new BusinessIntakeService();