/**
 * Tool category definitions for classifying AI agent tools
 */

export enum ToolCategory {
  COMMUNICATION = 'communication',
  PAYMENT = 'payment',
  CRM = 'crm',
  CALENDAR = 'calendar',
  CAMPAIGN = 'campaign',
  ANALYTICS = 'analytics',
  AUTOMATION = 'automation',
  INTEGRATION = 'integration',
}

export const TOOL_CATEGORY_LABELS: Record<ToolCategory, string> = {
  [ToolCategory.COMMUNICATION]: 'Communication',
  [ToolCategory.PAYMENT]: 'Payment',
  [ToolCategory.CRM]: 'Customer Relationship Management',
  [ToolCategory.CALENDAR]: 'Calendar & Scheduling',
  [ToolCategory.CAMPAIGN]: 'Marketing Campaign',
  [ToolCategory.ANALYTICS]: 'Analytics & Reporting',
  [ToolCategory.AUTOMATION]: 'Workflow Automation',
  [ToolCategory.INTEGRATION]: 'System Integration',
};

export const TOOL_CATEGORY_DESCRIPTIONS: Record<ToolCategory, string> = {
  [ToolCategory.COMMUNICATION]: 'Tools for sending messages, emails, and notifications',
  [ToolCategory.PAYMENT]: 'Tools for processing payments and financial transactions',
  [ToolCategory.CRM]: 'Tools for managing customer data and relationships',
  [ToolCategory.CALENDAR]: 'Tools for scheduling events and managing calendars',
  [ToolCategory.CAMPAIGN]: 'Tools for creating and managing marketing campaigns',
  [ToolCategory.ANALYTICS]: 'Tools for analyzing data and generating reports',
  [ToolCategory.AUTOMATION]: 'Tools for automating workflows and processes',
  [ToolCategory.INTEGRATION]: 'Tools for integrating with external systems',
};
