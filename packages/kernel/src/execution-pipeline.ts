import { z } from 'zod';

/**
 * Universal Execution Pipeline
 * 
 * All actions MUST traverse these 7 stages in strict order.
 * No exceptions. Bypassing any stage is a critical security violation.
 */

export const ExecutionContextSchema = z.object({
  userId: z.string(),
  toolId: z.string(),
  parameters: z.record(z.unknown()),
  cognitiveState: z.object({
    executiveFunction: z.enum(['high', 'medium', 'low']).optional(),
    workingMemory: z.enum(['high', 'medium', 'low']).optional(),
    attention: z.enum(['focused', 'divided', 'deficit']).optional(),
  }).optional(),
  timestamp: z.string(),
  idempotencyKey: z.string(),
});

export type ExecutionContext = z.infer<typeof ExecutionContextSchema>;

export const ExecutionResultSchema = z.object({
  success: z.boolean(),
  stage: z.enum([
    'evidence',
    'simulation',
    'policy',
    'approval',
    'execute',
    'reconcile',
    'audit'
  ]),
  data: z.unknown().optional(),
  error: z.string().optional(),
  receiptId: z.string().optional(),
  continueToNextStage: z.boolean(),
});

export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;

/**
 * Universal Execution Pipeline
 * 
 * This enforces the 7-stage flow for all actions.
 */
export class UniversalExecutionPipeline {
  static readonly STAGES = [
    'evidence',
    'simulation',
    'policy',
    'approval',
    'execute',
    'reconcile',
    'audit',
  ] as const;

  static readonly EPISTEMIC_REQUIRED = [
    'money-movement',
    'campaign-launch',
    'contract-sign',
    'policy-change',
  ];

  static async execute(context: ExecutionContext): Promise<ExecutionResult> {
    ExecutionContextSchema.parse(context);

    let currentStageData: unknown = null;

    for (const stage of this.STAGES) {
      const result = await this.executeStage(stage, context, currentStageData);

      if (!result.continueToNextStage) {
        return result;
      }

      currentStageData = result.data;
    }

    return {
      success: true,
      stage: 'audit',
      data: currentStageData,
      continueToNextStage: false,
    };
  }

  private static async executeStage(
    stage: typeof this.STAGES[number],
    context: ExecutionContext,
    previousData: unknown
  ): Promise<ExecutionResult> {
    // Stub - delegates to specialized services in production
    console.log(`Executing stage: ${stage}`, { context, previousData });

    return {
      success: true,
      stage,
      data: { stage, previousData },
      continueToNextStage: true,
    };
  }

  static requiresEpistemicEntry(toolId: string): boolean {
    return this.EPISTEMIC_REQUIRED.some((pattern) => toolId.includes(pattern));
  }
}
