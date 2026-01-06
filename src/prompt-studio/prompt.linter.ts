import type { PromptTemplate, PromptLintResult, LintError, LintWarning, PromptConstraint } from './types';

export interface LinterConfig {
  maxLength?: number;
  minLength?: number;
  requireCTA?: boolean;
  forbiddenPatterns?: RegExp[];
  requiredVariables?: string[];
  complianceRules?: ComplianceRule[];
}

export interface ComplianceRule {
  id: string;
  name: string;
  pattern: RegExp;
  message: string;
  severity: 'error' | 'warning';
}

const DEFAULT_CONFIG: LinterConfig = {
  maxLength: 4000,
  minLength: 50,
  requireCTA: true,
  forbiddenPatterns: [
    /guarantee[ds]?\s+(results?|success|outcome)/i,
    /100%\s+(guaranteed|success)/i,
    /no\s+risk/i,
    /get\s+rich\s+quick/i,
    /limited\s+time\s+only/i,
    /act\s+now\s+or\s+miss\s+out/i,
  ],
  complianceRules: [
    {
      id: 'no_false_urgency',
      name: 'No False Urgency',
      pattern: /(?:only|just)\s+\d+\s+(?:spots?|seats?|slots?)\s+left/i,
      message: 'Avoid false urgency claims about limited availability',
      severity: 'warning',
    },
    {
      id: 'no_income_claims',
      name: 'No Income Claims',
      pattern: /(?:earn|make)\s+\$[\d,]+\s+(?:per|a)\s+(?:day|week|month)/i,
      message: 'Avoid specific income claims without disclaimers',
      severity: 'error',
    },
    {
      id: 'no_miracle_claims',
      name: 'No Miracle Claims',
      pattern: /(?:miracle|magic|secret|weird\s+trick)/i,
      message: 'Avoid miracle or magic claims',
      severity: 'warning',
    },
  ],
};

export class PromptLinter {
  private config: LinterConfig;

  constructor(config: Partial<LinterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Lint a prompt template and return validation results
   */
  lint(template: PromptTemplate): PromptLintResult {
    const errors: LintError[] = [];
    const warnings: LintWarning[] = [];

    // Check length
    this.checkLength(template.template, errors, warnings);

    // Check for undefined variables
    this.checkVariables(template, errors, warnings);

    // Check for CTA
    this.checkCTA(template.template, warnings);

    // Check forbidden patterns
    this.checkForbiddenPatterns(template.template, errors);

    // Check compliance rules
    this.checkComplianceRules(template.template, errors, warnings);

    // Check template constraints
    this.checkConstraints(template, errors, warnings);

    // Check for common issues
    this.checkCommonIssues(template.template, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Quick validation - just returns true/false
   */
  isValid(template: PromptTemplate): boolean {
    return this.lint(template).valid;
  }

  /**
   * Get lint suggestions for improving a prompt
   */
  getSuggestions(template: PromptTemplate): string[] {
    const suggestions: string[] = [];
    const result = this.lint(template);

    for (const warning of result.warnings) {
      if (warning.suggestion) {
        suggestions.push(warning.suggestion);
      }
    }

    // Add general suggestions based on analysis
    if (template.template.length < 200) {
      suggestions.push('Consider adding more detail to your prompt for better context.');
    }

    if (!template.template.includes('{{')) {
      suggestions.push('Consider adding variables (e.g., {{lead_name}}) for personalization.');
    }

    if (!this.hasStructure(template.template)) {
      suggestions.push('Consider adding structure with headers, bullet points, or numbered lists.');
    }

    return suggestions;
  }

  private checkLength(content: string, errors: LintError[], warnings: LintWarning[]): void {
    if (this.config.maxLength && content.length > this.config.maxLength) {
      errors.push({
        code: 'MAX_LENGTH_EXCEEDED',
        message: `Prompt exceeds maximum length of ${this.config.maxLength} characters (current: ${content.length})`,
      });
    }

    if (this.config.minLength && content.length < this.config.minLength) {
      warnings.push({
        code: 'TOO_SHORT',
        message: `Prompt is shorter than recommended minimum of ${this.config.minLength} characters`,
        suggestion: 'Add more context or detail to improve prompt effectiveness',
      });
    }
  }

  private checkVariables(template: PromptTemplate, errors: LintError[], warnings: LintWarning[]): void {
    // Extract variables from template
    const usedVariables = new Set<string>();
    const variableRegex = /\{\{(\w+)\}\}/g;
    let match;

    while ((match = variableRegex.exec(template.template)) !== null) {
      usedVariables.add(match[1]);
    }

    // Check if all used variables are defined
    const definedVariables = new Set(template.variables.map(v => v.name));

    for (const variable of usedVariables) {
      if (!definedVariables.has(variable)) {
        warnings.push({
          code: 'UNDEFINED_VARIABLE',
          message: `Variable "{{${variable}}}" is used but not defined`,
          suggestion: `Add "${variable}" to the variables list with a description`,
        });
      }
    }

    // Check if required variables are defined
    if (this.config.requiredVariables) {
      for (const required of this.config.requiredVariables) {
        if (!usedVariables.has(required)) {
          errors.push({
            code: 'MISSING_REQUIRED_VARIABLE',
            message: `Required variable "{{${required}}}" is not used in the template`,
          });
        }
      }
    }
  }

  private checkCTA(content: string, warnings: LintWarning[]): void {
    if (!this.config.requireCTA) return;

    const ctaPatterns = [
      /\b(?:click|tap|reply|respond|schedule|book|call|contact|sign up|register|subscribe|download|learn more)\b/i,
      /\?$/m, // Ends with a question
      /\blet me know\b/i,
      /\bwhat do you think\b/i,
    ];

    const hasCTA = ctaPatterns.some(pattern => pattern.test(content));

    if (!hasCTA) {
      warnings.push({
        code: 'MISSING_CTA',
        message: 'Prompt does not contain an obvious call-to-action',
        suggestion: 'Add a clear next step or question for the recipient',
      });
    }
  }

  private checkForbiddenPatterns(content: string, errors: LintError[]): void {
    if (!this.config.forbiddenPatterns) return;

    for (const pattern of this.config.forbiddenPatterns) {
      if (pattern.test(content)) {
        errors.push({
          code: 'FORBIDDEN_PATTERN',
          message: `Prompt contains forbidden pattern: ${pattern.toString()}`,
        });
      }
    }
  }

  private checkComplianceRules(content: string, errors: LintError[], warnings: LintWarning[]): void {
    if (!this.config.complianceRules) return;

    for (const rule of this.config.complianceRules) {
      if (rule.pattern.test(content)) {
        if (rule.severity === 'error') {
          errors.push({
            code: `COMPLIANCE_${rule.id.toUpperCase()}`,
            message: rule.message,
          });
        } else {
          warnings.push({
            code: `COMPLIANCE_${rule.id.toUpperCase()}`,
            message: rule.message,
          });
        }
      }
    }
  }

  private checkConstraints(template: PromptTemplate, errors: LintError[], warnings: LintWarning[]): void {
    const constraints = template.constraints;
    if (!constraints) return;

    if (constraints.max_length && template.template.length > constraints.max_length) {
      errors.push({
        code: 'CONSTRAINT_MAX_LENGTH',
        message: `Template exceeds constraint max_length of ${constraints.max_length}`,
      });
    }

    if (constraints.min_length && template.template.length < constraints.min_length) {
      warnings.push({
        code: 'CONSTRAINT_MIN_LENGTH',
        message: `Template is shorter than constraint min_length of ${constraints.min_length}`,
      });
    }

    if (constraints.forbidden_words) {
      for (const word of constraints.forbidden_words) {
        if (template.template.toLowerCase().includes(word.toLowerCase())) {
          errors.push({
            code: 'CONSTRAINT_FORBIDDEN_WORD',
            message: `Template contains forbidden word: "${word}"`,
          });
        }
      }
    }

    if (constraints.required_elements) {
      for (const element of constraints.required_elements) {
        if (!template.template.toLowerCase().includes(element.toLowerCase())) {
          warnings.push({
            code: 'CONSTRAINT_MISSING_ELEMENT',
            message: `Template is missing required element: "${element}"`,
            suggestion: `Consider adding "${element}" to the template`,
          });
        }
      }
    }
  }

  private checkCommonIssues(content: string, warnings: LintWarning[]): void {
    // Check for excessive exclamation marks
    const exclamationCount = (content.match(/!/g) || []).length;
    if (exclamationCount > 3) {
      warnings.push({
        code: 'EXCESSIVE_EXCLAMATION',
        message: `Template has ${exclamationCount} exclamation marks, which may seem unprofessional`,
        suggestion: 'Reduce exclamation marks to 2-3 maximum',
      });
    }

    // Check for all caps sections
    const allCapsRegex = /\b[A-Z]{5,}\b/g;
    const allCapsMatches = content.match(allCapsRegex);
    if (allCapsMatches && allCapsMatches.length > 0) {
      warnings.push({
        code: 'ALL_CAPS_DETECTED',
        message: `Template contains ALL CAPS text: ${allCapsMatches.slice(0, 3).join(', ')}`,
        suggestion: 'Use normal capitalization for better readability',
      });
    }

    // Check for placeholder text that might be forgotten
    const placeholderPatterns = [
      /\[insert.*?\]/i,
      /\[add.*?\]/i,
      /\[your.*?\]/i,
      /TODO/i,
      /FIXME/i,
      /XXX/i,
    ];

    for (const pattern of placeholderPatterns) {
      if (pattern.test(content)) {
        warnings.push({
          code: 'PLACEHOLDER_DETECTED',
          message: `Template may contain placeholder text: ${pattern.toString()}`,
          suggestion: 'Replace placeholder text with actual content or proper variables',
        });
        break;
      }
    }
  }

  private hasStructure(content: string): boolean {
    const structurePatterns = [
      /^[-*•]\s/m, // Bullet points
      /^\d+\.\s/m, // Numbered lists
      /^#+\s/m, // Headers
      /\n\n/g, // Paragraph breaks
    ];

    return structurePatterns.some(pattern => pattern.test(content));
  }
}

export const promptLinter = new PromptLinter();
