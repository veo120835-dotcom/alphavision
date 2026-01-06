// Introduction Orchestration - Facilitate warm introductions

import { Introduction, Partner } from './types';

interface IntroductionRequest {
  requester_id: string;
  target_partner_id: string;
  context: string;
  mutual_benefit: string;
}

interface IntroductionOutcome {
  introduction_id: string;
  successful: boolean;
  outcome_notes: string;
  follow_up_actions: string[];
  relationship_status: 'connected' | 'pending' | 'declined' | 'no_response';
}

interface IntroductionScript {
  subject_line: string;
  opening: string;
  context_paragraph: string;
  mutual_benefit_paragraph: string;
  call_to_action: string;
  closing: string;
}

class IntroOrchestrationService {
  private introductions: Introduction[] = [];
  private introducers: Map<string, { id: string; connections: string[]; reputation: number }> = new Map();

  registerIntroducer(id: string, connections: string[], reputation: number = 50): void {
    this.introducers.set(id, { id, connections, reputation });
  }

  requestIntroduction(request: IntroductionRequest): Introduction {
    const introducer = this.findBestIntroducer(request.target_partner_id);

    const introduction: Introduction = {
      id: `intro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      requester_id: request.requester_id,
      target_partner_id: request.target_partner_id,
      introducer_id: introducer?.id,
      status: introducer ? 'pending_approval' : 'requested',
      context: request.context,
      mutual_benefit: request.mutual_benefit,
      created_at: new Date().toISOString(),
    };

    this.introductions.push(introduction);
    return introduction;
  }

  private findBestIntroducer(targetPartnerId: string): { id: string; connections: string[]; reputation: number } | null {
    let bestIntroducer: { id: string; connections: string[]; reputation: number } | null = null;
    let bestScore = 0;

    this.introducers.forEach(introducer => {
      if (introducer.connections.includes(targetPartnerId)) {
        const score = introducer.reputation;
        if (score > bestScore) {
          bestScore = score;
          bestIntroducer = introducer;
        }
      }
    });

    return bestIntroducer;
  }

  approveIntroduction(introductionId: string, introducerId: string): Introduction | null {
    const introduction = this.introductions.find(i => i.id === introductionId);
    if (!introduction) return null;

    if (introduction.introducer_id !== introducerId) return null;

    introduction.status = 'approved';
    return introduction;
  }

  makeIntroduction(introductionId: string, scheduledAt?: string): Introduction | null {
    const introduction = this.introductions.find(i => i.id === introductionId);
    if (!introduction || introduction.status !== 'approved') return null;

    introduction.status = 'made';
    introduction.scheduled_at = scheduledAt;
    return introduction;
  }

  recordOutcome(introductionId: string, outcome: IntroductionOutcome): Introduction | null {
    const introduction = this.introductions.find(i => i.id === introductionId);
    if (!introduction) return null;

    introduction.outcome = outcome.outcome_notes;

    if (outcome.successful && introduction.introducer_id) {
      const introducer = this.introducers.get(introduction.introducer_id);
      if (introducer) {
        introducer.reputation = Math.min(100, introducer.reputation + 5);
      }
    }

    return introduction;
  }

  generateIntroductionScript(
    requester: { name: string; company: string },
    target: Partner,
    context: string,
    mutualBenefit: string
  ): IntroductionScript {
    return {
      subject_line: `Introduction: ${requester.name} <> ${target.name} - Potential ${target.type} Partnership`,
      opening: `Hi ${target.name.split(' ')[0]},\n\nI hope this message finds you well. I wanted to introduce you to ${requester.name} from ${requester.company}.`,
      context_paragraph: `${requester.name} reached out because ${context}. After reviewing both of your profiles and focus areas, I believe there could be a meaningful opportunity for collaboration.`,
      mutual_benefit_paragraph: `Here's why I think this connection makes sense:\n\n${mutualBenefit}\n\nI see potential synergies in ${target.offerings.slice(0, 2).join(' and ')}.`,
      call_to_action: `Would you be open to a brief 15-minute call to explore this further? I'm happy to facilitate the initial conversation if that would be helpful.`,
      closing: `Let me know your thoughts, and I'll coordinate schedules.\n\nBest regards`,
    };
  }

  getIntroductionsByStatus(status: Introduction['status']): Introduction[] {
    return this.introductions.filter(i => i.status === status);
  }

  getIntroductionsForRequester(requesterId: string): Introduction[] {
    return this.introductions.filter(i => i.requester_id === requesterId);
  }

  getIntroductionStats(): {
    total: number;
    by_status: Record<Introduction['status'], number>;
    success_rate: number;
    average_time_to_connection_days: number;
  } {
    const byStatus: Record<Introduction['status'], number> = {
      requested: 0,
      pending_approval: 0,
      approved: 0,
      made: 0,
      declined: 0,
    };

    let successfulCount = 0;
    let totalDays = 0;
    let completedCount = 0;

    this.introductions.forEach(intro => {
      byStatus[intro.status]++;

      if (intro.status === 'made' && intro.outcome) {
        if (!intro.outcome.toLowerCase().includes('declined') && 
            !intro.outcome.toLowerCase().includes('no response')) {
          successfulCount++;
        }
        completedCount++;

        if (intro.scheduled_at) {
          const days = (new Date(intro.scheduled_at).getTime() - new Date(intro.created_at).getTime()) / (1000 * 60 * 60 * 24);
          totalDays += days;
        }
      }
    });

    return {
      total: this.introductions.length,
      by_status: byStatus,
      success_rate: completedCount > 0 ? (successfulCount / completedCount) * 100 : 0,
      average_time_to_connection_days: completedCount > 0 ? totalDays / completedCount : 0,
    };
  }

  suggestIntroductions(requesterId: string, targetCriteria: {
    partner_types?: string[];
    industries?: string[];
    seeking?: string[];
  }): { partner_id: string; introducer_id: string; match_reason: string }[] {
    const suggestions: { partner_id: string; introducer_id: string; match_reason: string }[] = [];

    this.introducers.forEach(introducer => {
      introducer.connections.forEach(connectionId => {
        const alreadyIntroduced = this.introductions.some(
          i => i.requester_id === requesterId && i.target_partner_id === connectionId
        );

        if (!alreadyIntroduced && introducer.reputation >= 50) {
          suggestions.push({
            partner_id: connectionId,
            introducer_id: introducer.id,
            match_reason: `Trusted introducer with ${introducer.reputation}% reputation score`,
          });
        }
      });
    });

    return suggestions.slice(0, 10);
  }
}

export const introOrchestrationService = new IntroOrchestrationService();
