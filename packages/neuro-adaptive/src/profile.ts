import { z } from 'zod';

/**
 * Cognitive profile schema
 * 
 * Represents a user's cognitive preferences and patterns for adaptive AI behavior.
 * The system learns and adapts to individual thinking styles, communication preferences,
 * and decision-making patterns.
 */

export const CognitiveProfileSchema = z.object({
  /** Profile ID */
  profileId: z.string().uuid(),
  
  /** User ID */
  userId: z.string(),
  
  /** Profile version */
  version: z.number().int().positive(),
  
  /** Last updated timestamp */
  updatedAt: z.string().datetime(),
  
  /** Communication style preferences */
  communicationStyle: z.object({
    /** Preferred verbosity level (0-1) */
    verbosity: z.number().min(0).max(1),
    
    /** Preferred formality level (0-1) */
    formality: z.number().min(0).max(1),
    
    /** Preference for technical language (0-1) */
    technicalLevel: z.number().min(0).max(1),
    
    /** Preferred response structure */
    responseStructure: z.enum(['concise', 'detailed', 'stepwise', 'conversational']),
    
    /** Preferred explanation depth */
    explanationDepth: z.enum(['minimal', 'moderate', 'comprehensive']),
  }),
  
  /** Decision-making patterns */
  decisionMaking: z.object({
    /** Speed vs accuracy preference (0=speed, 1=accuracy) */
    speedVsAccuracy: z.number().min(0).max(1),
    
    /** Risk tolerance (0=risk-averse, 1=risk-tolerant) */
    riskTolerance: z.number().min(0).max(1),
    
    /** Preference for automation (0=manual, 1=automated) */
    automationPreference: z.number().min(0).max(1),
    
    /** Preference for exploration vs exploitation */
    explorationVsExploitation: z.number().min(0).max(1),
  }),
  
  /** Learning and adaptation preferences */
  learning: z.object({
    /** Learning rate - how quickly to adapt (0-1) */
    adaptationRate: z.number().min(0).max(1),
    
    /** Preference for learning from mistakes */
    errorTolerance: z.number().min(0).max(1),
    
    /** Preference for proactive suggestions */
    proactiveSuggestions: z.boolean(),
    
    /** Preferred feedback frequency */
    feedbackFrequency: z.enum(['minimal', 'moderate', 'frequent']),
  }),
  
  /** Attention and focus patterns */
  attention: z.object({
    /** Typical session duration in minutes */
    sessionDuration: z.number().positive(),
    
    /** Preferred task switching frequency */
    taskSwitchingTolerance: z.enum(['low', 'medium', 'high']),
    
    /** Preferred notification frequency */
    notificationTolerance: z.enum(['minimal', 'moderate', 'frequent']),
    
    /** Peak productivity hours (24-hour format) */
    peakHours: z.array(z.number().min(0).max(23)).optional(),
  }),
  
  /** Emotional and affective preferences */
  affective: z.object({
    /** Preference for empathetic responses */
    empathyLevel: z.number().min(0).max(1),
    
    /** Preference for encouragement and positivity */
    encouragementLevel: z.number().min(0).max(1),
    
    /** Stress sensitivity - adjust behavior under stress */
    stressSensitivity: z.number().min(0).max(1),
  }),
  
  /** Domain expertise levels */
  expertise: z.record(z.string(), z.object({
    level: z.number().min(0).max(1),
    lastUpdated: z.string().datetime(),
  })).optional(),
  
  /** Interaction patterns */
  patterns: z.object({
    /** Common tasks performed */
    frequentTasks: z.array(z.string()).optional(),
    
    /** Preferred tools */
    preferredTools: z.array(z.string()).optional(),
    
    /** Common workflows */
    workflows: z.array(z.string()).optional(),
    
    /** Time of day activity distribution */
    activityDistribution: z.record(z.number()).optional(),
  }).optional(),
  
  /** Metadata */
  metadata: z.object({
    /** Total interactions */
    interactionCount: z.number().int().nonnegative(),
    
    /** Confidence in profile accuracy (0-1) */
    confidence: z.number().min(0).max(1),
    
    /** Source of profile data */
    source: z.enum(['explicit', 'learned', 'hybrid']),
    
    /** Additional custom metadata */
    custom: z.record(z.unknown()).optional(),
  }),
});

export type CognitiveProfile = z.infer<typeof CognitiveProfileSchema>;

/**
 * Default cognitive profile for new users
 */
export const DEFAULT_COGNITIVE_PROFILE: Omit<CognitiveProfile, 'profileId' | 'userId' | 'updatedAt'> = {
  version: 1,
  communicationStyle: {
    verbosity: 0.5,
    formality: 0.5,
    technicalLevel: 0.5,
    responseStructure: 'conversational',
    explanationDepth: 'moderate',
  },
  decisionMaking: {
    speedVsAccuracy: 0.5,
    riskTolerance: 0.5,
    automationPreference: 0.5,
    explorationVsExploitation: 0.5,
  },
  learning: {
    adaptationRate: 0.3,
    errorTolerance: 0.7,
    proactiveSuggestions: true,
    feedbackFrequency: 'moderate',
  },
  attention: {
    sessionDuration: 30,
    taskSwitchingTolerance: 'medium',
    notificationTolerance: 'moderate',
  },
  affective: {
    empathyLevel: 0.7,
    encouragementLevel: 0.6,
    stressSensitivity: 0.5,
  },
  metadata: {
    interactionCount: 0,
    confidence: 0.3,
    source: 'explicit',
  },
};

/**
 * Update cognitive profile based on user interactions
 */
export function updateCognitiveProfile(
  profile: CognitiveProfile,
  updates: Partial<CognitiveProfile>
): CognitiveProfile {
  return {
    ...profile,
    ...updates,
    version: profile.version + 1,
    updatedAt: new Date().toISOString(),
    metadata: {
      ...profile.metadata,
      ...updates.metadata,
      interactionCount: profile.metadata.interactionCount + 1,
    },
  };
}

/**
 * Calculate profile similarity score between two profiles
 */
export function calculateProfileSimilarity(
  profile1: CognitiveProfile,
  profile2: CognitiveProfile
): number {
  const weights = {
    communicationStyle: 0.3,
    decisionMaking: 0.25,
    learning: 0.2,
    attention: 0.15,
    affective: 0.1,
  };

  let totalSimilarity = 0;

  // Communication style similarity
  const commSim =
    1 -
    (Math.abs(profile1.communicationStyle.verbosity - profile2.communicationStyle.verbosity) +
      Math.abs(profile1.communicationStyle.formality - profile2.communicationStyle.formality) +
      Math.abs(profile1.communicationStyle.technicalLevel - profile2.communicationStyle.technicalLevel)) /
      3;
  totalSimilarity += commSim * weights.communicationStyle;

  // Decision making similarity
  const decisionSim =
    1 -
    (Math.abs(profile1.decisionMaking.speedVsAccuracy - profile2.decisionMaking.speedVsAccuracy) +
      Math.abs(profile1.decisionMaking.riskTolerance - profile2.decisionMaking.riskTolerance) +
      Math.abs(profile1.decisionMaking.automationPreference - profile2.decisionMaking.automationPreference) +
      Math.abs(
        profile1.decisionMaking.explorationVsExploitation - profile2.decisionMaking.explorationVsExploitation
      )) /
      4;
  totalSimilarity += decisionSim * weights.decisionMaking;

  // Learning similarity
  const learnSim =
    1 -
    (Math.abs(profile1.learning.adaptationRate - profile2.learning.adaptationRate) +
      Math.abs(profile1.learning.errorTolerance - profile2.learning.errorTolerance)) /
      2;
  totalSimilarity += learnSim * weights.learning;

  // Affective similarity
  const affectiveSim =
    1 -
    (Math.abs(profile1.affective.empathyLevel - profile2.affective.empathyLevel) +
      Math.abs(profile1.affective.encouragementLevel - profile2.affective.encouragementLevel) +
      Math.abs(profile1.affective.stressSensitivity - profile2.affective.stressSensitivity)) /
      3;
  totalSimilarity += affectiveSim * weights.affective;

  return totalSimilarity;
}
