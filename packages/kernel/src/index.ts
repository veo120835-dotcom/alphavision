/**
 * AlphaVision Platform Kernel
 * 
 * The kernel is the core runtime that enforces the Universal Execution Pipeline.
 * Every action in the system must traverse all 7 stages in strict order.
 */

export { UniversalExecutionPipeline, type ExecutionContext, type ExecutionResult } from './execution-pipeline';
