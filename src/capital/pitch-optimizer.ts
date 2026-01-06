import type { CompanyProfile, PitchElement, PitchOptimization } from './types';

interface PitchInput {
  problem: string;
  solution: string;
  traction: string;
  market: string;
  businessModel: string;
  team: string;
  ask: string;
  competition?: string;
  vision?: string;
}

export class PitchOptimizer {
  optimize(profile: CompanyProfile, pitch: PitchInput): PitchOptimization {
    const elements = this.analyzeElements(pitch);
    const narrative = this.constructNarrative(profile, pitch);
    const objectionHandlers = this.generateObjectionHandlers(profile, pitch);
    const storyArc = this.designStoryArc(profile);
    const overallScore = this.calculateOverallScore(elements);

    return {
      overallScore,
      elements,
      narrative,
      objectionHandlers,
      storyArc,
    };
  }

  private analyzeElements(pitch: PitchInput): PitchElement[] {
    const elements: PitchElement[] = [];

    // Problem Analysis
    elements.push(this.analyzeProblem(pitch.problem));
    elements.push(this.analyzeSolution(pitch.solution));
    elements.push(this.analyzeTraction(pitch.traction));
    elements.push(this.analyzeMarket(pitch.market));
    elements.push(this.analyzeBusinessModel(pitch.businessModel));
    elements.push(this.analyzeTeam(pitch.team));
    elements.push(this.analyzeAsk(pitch.ask));

    return elements;
  }

  private analyzeProblem(problem: string): PitchElement {
    const improvements: string[] = [];
    let score = 70;

    if (problem.length < 100) {
      improvements.push('Expand with specific pain points and quantified impact');
      score -= 15;
    }

    if (!problem.includes('$') && !problem.match(/\d+%/)) {
      improvements.push('Add quantified data: "Companies lose $X annually" or "Y% of teams struggle with..."');
      score -= 10;
    }

    if (!problem.toLowerCase().includes('current') && !problem.toLowerCase().includes('today')) {
      improvements.push('Emphasize why this problem is urgent NOW');
      score -= 5;
    }

    return {
      section: 'Problem',
      content: problem,
      score: Math.max(0, score),
      improvements,
      examples: [
        '"Enterprise teams waste 12 hours per week on manual data reconciliation, costing the average company $340K annually in lost productivity."',
        '"78% of B2B buyers abandon purchases due to poor checkout experiences, representing $18B in lost revenue industry-wide."',
      ],
    };
  }

  private analyzeSolution(solution: string): PitchElement {
    const improvements: string[] = [];
    let score = 70;

    if (solution.length > 300) {
      improvements.push('Simplify to one clear sentence, then supporting details');
      score -= 10;
    }

    if (!solution.toLowerCase().includes('only') && !solution.toLowerCase().includes('first') && !solution.toLowerCase().includes('unique')) {
      improvements.push('Highlight what makes your approach uniquely effective');
      score -= 15;
    }

    if (solution.split(' ').length > 50 && !solution.includes('→') && !solution.includes('1.')) {
      improvements.push('Break into clear before/after or step-by-step format');
      score -= 5;
    }

    return {
      section: 'Solution',
      content: solution,
      score: Math.max(0, score),
      improvements,
      examples: [
        '"We\'re the only platform that combines X with Y, reducing Z by 80% in under 30 days."',
        '"Think [Known Company] but for [Your Market] - we deliver [Key Benefit] through [Unique Approach]."',
      ],
    };
  }

  private analyzeTraction(traction: string): PitchElement {
    const improvements: string[] = [];
    let score = 70;

    const hasNumbers = /\$[\d,]+|\d+%|\d+x/.test(traction);
    if (!hasNumbers) {
      improvements.push('Lead with specific metrics: revenue, growth rate, customer count');
      score -= 20;
    }

    if (!traction.toLowerCase().includes('growth') && !traction.toLowerCase().includes('growing')) {
      improvements.push('Emphasize trajectory, not just current state');
      score -= 10;
    }

    if (!traction.toLowerCase().includes('customer') && !traction.toLowerCase().includes('user')) {
      improvements.push('Include customer validation and notable logos if applicable');
      score -= 5;
    }

    return {
      section: 'Traction',
      content: traction,
      score: Math.max(0, score),
      improvements,
      examples: [
        '"$1.2M ARR, growing 25% MoM, with 47 enterprise customers including [Notable Logo]."',
        '"From $0 to $500K ARR in 8 months with zero paid marketing - 100% organic and referral."',
      ],
    };
  }

  private analyzeMarket(market: string): PitchElement {
    const improvements: string[] = [];
    let score = 70;

    if (!market.includes('TAM') && !market.includes('total') && !market.includes('billion')) {
      improvements.push('Include TAM/SAM/SOM with credible sources');
      score -= 15;
    }

    if (!market.toLowerCase().includes('grow') && !market.toLowerCase().includes('trend')) {
      improvements.push('Show market growth trajectory and tailwinds');
      score -= 10;
    }

    return {
      section: 'Market',
      content: market,
      score: Math.max(0, score),
      improvements,
      examples: [
        '"The [market] is $45B today, growing 18% annually. Our beachhead of [segment] is $2B with clear expansion paths."',
      ],
    };
  }

  private analyzeBusinessModel(model: string): PitchElement {
    const improvements: string[] = [];
    let score = 70;

    if (!model.toLowerCase().includes('margin') && !model.toLowerCase().includes('ltv') && !model.toLowerCase().includes('cac')) {
      improvements.push('Include unit economics: LTV/CAC, gross margins, payback period');
      score -= 15;
    }

    if (!model.toLowerCase().includes('subscription') && !model.toLowerCase().includes('recurring') && !model.toLowerCase().includes('contract')) {
      improvements.push('Clarify revenue model and predictability');
      score -= 10;
    }

    return {
      section: 'Business Model',
      content: model,
      score: Math.max(0, score),
      improvements,
      examples: [
        '"Annual SaaS subscriptions averaging $48K ACV with 85% gross margins. LTV/CAC of 5:1 with 8-month payback."',
      ],
    };
  }

  private analyzeTeam(team: string): PitchElement {
    const improvements: string[] = [];
    let score = 70;

    if (!team.toLowerCase().includes('experience') && !team.toLowerCase().includes('previously') && !team.toLowerCase().includes('founded')) {
      improvements.push('Highlight relevant domain expertise and past successes');
      score -= 15;
    }

    if (!team.toLowerCase().includes('why') && !team.toLowerCase().includes('passion')) {
      improvements.push('Explain why THIS team is uniquely positioned to win');
      score -= 10;
    }

    return {
      section: 'Team',
      content: team,
      score: Math.max(0, score),
      improvements,
      examples: [
        '"Our founding team built and sold [Previous Company] to [Acquirer]. We\'ve spent 15 combined years in [Industry] and know this problem firsthand."',
      ],
    };
  }

  private analyzeAsk(ask: string): PitchElement {
    const improvements: string[] = [];
    let score = 70;

    if (!/\$[\d,]+[MK]?/.test(ask)) {
      improvements.push('State specific amount you\'re raising');
      score -= 20;
    }

    if (!ask.toLowerCase().includes('use') && !ask.toLowerCase().includes('milestone')) {
      improvements.push('Connect raise to specific milestones: "This gets us to..."');
      score -= 15;
    }

    return {
      section: 'Ask',
      content: ask,
      score: Math.max(0, score),
      improvements,
      examples: [
        '"Raising $5M to reach $3M ARR in 18 months. Primary use: expanding sales team (60%) and product development (30%)."',
      ],
    };
  }

  private constructNarrative(profile: CompanyProfile, pitch: PitchInput): PitchOptimization['narrative'] {
    return {
      hook: this.generateHook(profile, pitch),
      problem: this.refineStatement(pitch.problem, 'problem'),
      solution: this.refineStatement(pitch.solution, 'solution'),
      traction: this.refineStatement(pitch.traction, 'traction'),
      ask: this.refineStatement(pitch.ask, 'ask'),
    };
  }

  private generateHook(profile: CompanyProfile, pitch: PitchInput): string {
    const hooks = [
      `"What if ${pitch.problem.split('.')[0].toLowerCase()}... didn't have to be that way?"`,
      `"${profile.name} is building the [category] that [key benefit] for [target market]."`,
      `"We've discovered that ${pitch.problem.split('.')[0].toLowerCase()}, and we've built the only solution that..."`,
    ];
    return hooks[0];
  }

  private refineStatement(content: string, type: string): string {
    // In production, this would use AI to refine
    return content.length > 200 ? content.substring(0, 200) + '...' : content;
  }

  private generateObjectionHandlers(profile: CompanyProfile, pitch: PitchInput): { objection: string; response: string }[] {
    const handlers: { objection: string; response: string }[] = [];

    // Competition objection
    handlers.push({
      objection: 'How do you compete with [incumbent]?',
      response: `Unlike incumbents who focus on [X], we're purpose-built for [Y]. Our ${profile.competitiveAdvantage} means we can deliver [specific benefit] that they can't match.`,
    });

    // Market size objection
    handlers.push({
      objection: 'Is this market big enough?',
      response: 'Our initial beachhead is [specific segment], but we have clear expansion paths to [adjacent markets] as we prove the model.',
    });

    // Team objection
    handlers.push({
      objection: 'What makes you the right team?',
      response: `We've spent [X years] in this industry and have direct experience with this problem. Our unique insight is [specific insight] that led us to this approach.`,
    });

    // Timing objection
    handlers.push({
      objection: 'Why now?',
      response: 'Three things have changed: [1] technology shift, [2] market behavior change, [3] regulatory/macro shift. This creates a window that didn\'t exist before.',
    });

    return handlers;
  }

  private designStoryArc(profile: CompanyProfile): string {
    return `
RECOMMENDED STORY ARC FOR ${profile.name.toUpperCase()}:

1. HOOK (30 seconds)
   - Open with surprising stat or provocative question
   - Establish credibility immediately

2. PROBLEM (2 minutes)
   - Paint vivid picture of pain
   - Quantify the cost
   - Show why existing solutions fail

3. SOLUTION (3 minutes)
   - One-sentence positioning
   - Demo or visual walkthrough
   - Key differentiators

4. TRACTION (2 minutes)
   - Lead with strongest metric
   - Show trajectory, not just current state
   - Customer quote or logo slide

5. MARKET (1 minute)
   - TAM with credible source
   - Your wedge into the market
   - Expansion path

6. TEAM (1 minute)
   - Why you (unique insight)
   - Relevant experience
   - Key hires made/planned

7. ASK (30 seconds)
   - Specific amount
   - What it enables
   - Timeline to next milestone
    `.trim();
  }

  private calculateOverallScore(elements: PitchElement[]): number {
    const totalScore = elements.reduce((sum, el) => sum + el.score, 0);
    return Math.round(totalScore / elements.length);
  }

  generateQuickFixes(optimization: PitchOptimization): string[] {
    const fixes: string[] = [];
    
    const weakestElements = [...optimization.elements]
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    for (const element of weakestElements) {
      if (element.improvements.length > 0) {
        fixes.push(`[${element.section}] ${element.improvements[0]}`);
      }
    }

    return fixes;
  }
}

export const pitchOptimizer = new PitchOptimizer();
