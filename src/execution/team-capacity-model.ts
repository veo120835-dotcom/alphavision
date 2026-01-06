// Team Capacity Model - Analyze team capacity and utilization

import { TeamMember, TeamCapacityAnalysis, TeamRole } from './types';

interface CapacityForecast {
  current_capacity_hours: number;
  projected_demand_hours: number;
  gap_hours: number;
  risk_level: 'healthy' | 'stretched' | 'critical';
  recommendations: string[];
}

interface WorkloadDistribution {
  role: TeamRole;
  members: TeamMember[];
  total_capacity: number;
  total_utilized: number;
  average_utilization: number;
  balance_score: number;
}

class TeamCapacityModelService {
  private teamMembers: TeamMember[] = [];

  addTeamMember(member: TeamMember): void {
    const existing = this.teamMembers.findIndex(m => m.id === member.id);
    if (existing >= 0) {
      this.teamMembers[existing] = member;
    } else {
      this.teamMembers.push(member);
    }
  }

  updateUtilization(memberId: string, utilization: number): void {
    const member = this.teamMembers.find(m => m.id === memberId);
    if (member) {
      member.current_utilization = Math.min(1.5, Math.max(0, utilization));
    }
  }

  analyzeCapacity(): TeamCapacityAnalysis {
    const totalCapacity = this.teamMembers.reduce(
      (sum, m) => sum + m.capacity_hours_weekly, 0
    );
    
    const totalUtilized = this.teamMembers.reduce(
      (sum, m) => sum + (m.capacity_hours_weekly * m.current_utilization), 0
    );

    const overallUtilization = totalCapacity > 0 ? totalUtilized / totalCapacity : 0;

    const bottleneckRoles = this.findBottleneckRoles();
    const underutilizedRoles = this.findUnderutilizedRoles();
    const hiringRecommendations = this.generateHiringRecommendations(bottleneckRoles);

    return {
      total_capacity_hours: totalCapacity,
      total_utilized_hours: totalUtilized,
      overall_utilization: overallUtilization,
      bottleneck_roles: bottleneckRoles,
      underutilized_roles: underutilizedRoles,
      hiring_recommendations: hiringRecommendations,
    };
  }

  private findBottleneckRoles(): TeamRole[] {
    const roleUtilization = this.calculateRoleUtilization();
    
    return Array.from(roleUtilization.entries())
      .filter(([_, util]) => util > 0.9)
      .map(([role]) => role);
  }

  private findUnderutilizedRoles(): TeamRole[] {
    const roleUtilization = this.calculateRoleUtilization();
    
    return Array.from(roleUtilization.entries())
      .filter(([_, util]) => util < 0.5)
      .map(([role]) => role);
  }

  private calculateRoleUtilization(): Map<TeamRole, number> {
    const roleData = new Map<TeamRole, { capacity: number; utilized: number }>();

    this.teamMembers.forEach(member => {
      const current = roleData.get(member.role) || { capacity: 0, utilized: 0 };
      current.capacity += member.capacity_hours_weekly;
      current.utilized += member.capacity_hours_weekly * member.current_utilization;
      roleData.set(member.role, current);
    });

    const utilization = new Map<TeamRole, number>();
    roleData.forEach((data, role) => {
      utilization.set(role, data.capacity > 0 ? data.utilized / data.capacity : 0);
    });

    return utilization;
  }

  private generateHiringRecommendations(bottleneckRoles: TeamRole[]): TeamCapacityAnalysis['hiring_recommendations'] {
    return bottleneckRoles.map(role => {
      const roleMembers = this.teamMembers.filter(m => m.role === role);
      const avgUtilization = roleMembers.reduce((sum, m) => sum + m.current_utilization, 0) / roleMembers.length;

      let urgency: 'low' | 'medium' | 'high';
      let reason: string;

      if (avgUtilization > 1.2) {
        urgency = 'high';
        reason = `${role} team is overloaded at ${Math.round(avgUtilization * 100)}% utilization. Burnout risk is high.`;
      } else if (avgUtilization > 1.0) {
        urgency = 'medium';
        reason = `${role} team is at capacity. Additional headcount needed for growth.`;
      } else {
        urgency = 'low';
        reason = `${role} team approaching capacity. Plan for future hiring.`;
      }

      return { role, urgency, reason };
    });
  }

  forecastCapacity(demandGrowthPercent: number, monthsAhead: number): CapacityForecast {
    const currentCapacity = this.teamMembers.reduce(
      (sum, m) => sum + m.capacity_hours_weekly, 0
    ) * 4;

    const currentDemand = this.teamMembers.reduce(
      (sum, m) => sum + (m.capacity_hours_weekly * m.current_utilization), 0
    ) * 4;

    const projectedDemand = currentDemand * Math.pow(1 + demandGrowthPercent / 100, monthsAhead);
    const gap = projectedDemand - currentCapacity;

    let riskLevel: 'healthy' | 'stretched' | 'critical';
    const utilizationProjected = projectedDemand / currentCapacity;

    if (utilizationProjected <= 0.8) {
      riskLevel = 'healthy';
    } else if (utilizationProjected <= 1.0) {
      riskLevel = 'stretched';
    } else {
      riskLevel = 'critical';
    }

    const recommendations = this.generateForecastRecommendations(riskLevel, gap, monthsAhead);

    return {
      current_capacity_hours: currentCapacity,
      projected_demand_hours: projectedDemand,
      gap_hours: gap,
      risk_level: riskLevel,
      recommendations,
    };
  }

  private generateForecastRecommendations(
    riskLevel: string,
    gap: number,
    monthsAhead: number
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'critical') {
      recommendations.push(`Urgent: Need to add ~${Math.ceil(gap / 160)} FTEs in next ${monthsAhead} months`);
      recommendations.push('Consider contractors for immediate relief');
      recommendations.push('Review project prioritization to manage demand');
    } else if (riskLevel === 'stretched') {
      recommendations.push('Begin hiring process now to stay ahead of demand');
      recommendations.push('Identify automation opportunities to reduce demand');
      recommendations.push('Cross-train team for flexibility');
    } else {
      recommendations.push('Capacity is healthy - focus on efficiency improvements');
      recommendations.push('Consider strategic hires for growth initiatives');
    }

    return recommendations;
  }

  getWorkloadDistribution(): WorkloadDistribution[] {
    const roleGroups = new Map<TeamRole, TeamMember[]>();

    this.teamMembers.forEach(member => {
      const group = roleGroups.get(member.role) || [];
      group.push(member);
      roleGroups.set(member.role, group);
    });

    const distributions: WorkloadDistribution[] = [];

    roleGroups.forEach((members, role) => {
      const totalCapacity = members.reduce((sum, m) => sum + m.capacity_hours_weekly, 0);
      const totalUtilized = members.reduce(
        (sum, m) => sum + (m.capacity_hours_weekly * m.current_utilization), 0
      );
      const avgUtilization = totalCapacity > 0 ? totalUtilized / totalCapacity : 0;

      const utilizationVariance = members.reduce((sum, m) => {
        return sum + Math.pow(m.current_utilization - avgUtilization, 2);
      }, 0) / members.length;

      const balanceScore = Math.max(0, 100 - utilizationVariance * 100);

      distributions.push({
        role,
        members,
        total_capacity: totalCapacity,
        total_utilized: totalUtilized,
        average_utilization: avgUtilization,
        balance_score: balanceScore,
      });
    });

    return distributions;
  }

  identifySkillGaps(): { skill: string; current_coverage: number; importance: 'low' | 'medium' | 'high' }[] {
    const allSkills = new Map<string, number>();
    
    this.teamMembers.forEach(member => {
      member.skills.forEach(skill => {
        allSkills.set(skill, (allSkills.get(skill) || 0) + 1);
      });
    });

    const gaps: { skill: string; current_coverage: number; importance: 'low' | 'medium' | 'high' }[] = [];
    
    allSkills.forEach((count, skill) => {
      const coverage = count / this.teamMembers.length;
      if (coverage < 0.3) {
        gaps.push({
          skill,
          current_coverage: coverage,
          importance: coverage < 0.1 ? 'high' : coverage < 0.2 ? 'medium' : 'low',
        });
      }
    });

    return gaps.sort((a, b) => a.current_coverage - b.current_coverage);
  }

  getTeamMembers(): TeamMember[] {
    return this.teamMembers;
  }
}

export const teamCapacityModelService = new TeamCapacityModelService();
