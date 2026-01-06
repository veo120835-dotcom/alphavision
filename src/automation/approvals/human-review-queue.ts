// Human Review Queue

import { ApprovalRequest, ApprovalStatus, RiskTier } from '../types';

interface QueuedItem {
  id: string;
  request: ApprovalRequest;
  priority: number;
  queued_at: Date;
  assigned_to?: string;
  viewed_at?: Date;
  sla_deadline: Date;
}

interface QueueStats {
  total_pending: number;
  by_risk_tier: Record<RiskTier, number>;
  average_wait_time_ms: number;
  overdue_count: number;
  assigned_count: number;
  unassigned_count: number;
}

interface ReviewerStats {
  reviewer_id: string;
  pending_assignments: number;
  completed_today: number;
  average_review_time_ms: number;
  approval_rate: number;
}

class HumanReviewQueue {
  private queue: Map<string, QueuedItem> = new Map();
  private reviewerAssignments: Map<string, Set<string>> = new Map();
  private completedReviews: Map<string, Array<{ completed_at: Date; duration_ms: number; approved: boolean }>> = new Map();
  
  private slaHours: Record<RiskTier, number> = {
    low: 48,
    medium: 24,
    high: 8,
    critical: 2,
  };

  enqueue(request: ApprovalRequest): QueuedItem {
    const priority = this.calculatePriority(request);
    const slaDeadline = new Date(
      request.requested_at.getTime() + this.slaHours[request.risk_tier] * 60 * 60 * 1000
    );

    const item: QueuedItem = {
      id: request.id,
      request,
      priority,
      queued_at: new Date(),
      sla_deadline: slaDeadline,
    };

    this.queue.set(request.id, item);
    this.sortQueue();

    return item;
  }

  dequeue(requestId: string): QueuedItem | undefined {
    const item = this.queue.get(requestId);
    if (item) {
      this.queue.delete(requestId);
      
      // Remove from reviewer assignments
      if (item.assigned_to) {
        const assignments = this.reviewerAssignments.get(item.assigned_to);
        assignments?.delete(requestId);
      }
    }
    return item;
  }

  assignToReviewer(requestId: string, reviewerId: string): boolean {
    const item = this.queue.get(requestId);
    if (!item) return false;

    // Remove from previous assignment
    if (item.assigned_to) {
      const prevAssignments = this.reviewerAssignments.get(item.assigned_to);
      prevAssignments?.delete(requestId);
    }

    // Assign to new reviewer
    item.assigned_to = reviewerId;
    item.viewed_at = new Date();

    let assignments = this.reviewerAssignments.get(reviewerId);
    if (!assignments) {
      assignments = new Set();
      this.reviewerAssignments.set(reviewerId, assignments);
    }
    assignments.add(requestId);

    return true;
  }

  markReviewed(requestId: string, approved: boolean): void {
    const item = this.queue.get(requestId);
    if (!item || !item.assigned_to) return;

    const reviewerId = item.assigned_to;
    const duration = item.viewed_at 
      ? new Date().getTime() - item.viewed_at.getTime()
      : 0;

    let reviews = this.completedReviews.get(reviewerId);
    if (!reviews) {
      reviews = [];
      this.completedReviews.set(reviewerId, reviews);
    }
    reviews.push({
      completed_at: new Date(),
      duration_ms: duration,
      approved,
    });

    this.dequeue(requestId);
  }

  private calculatePriority(request: ApprovalRequest): number {
    let priority = 0;

    // Risk tier priority
    const riskPriority: Record<RiskTier, number> = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25,
    };
    priority += riskPriority[request.risk_tier];

    // Time until expiry
    const hoursUntilExpiry = (request.expires_at.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilExpiry < 1) priority += 50;
    else if (hoursUntilExpiry < 4) priority += 30;
    else if (hoursUntilExpiry < 12) priority += 15;

    return priority;
  }

  private sortQueue(): void {
    const items = Array.from(this.queue.values());
    items.sort((a, b) => b.priority - a.priority);
    
    this.queue.clear();
    items.forEach(item => this.queue.set(item.id, item));
  }

  getNextForReviewer(reviewerId: string): QueuedItem | undefined {
    // First, check if there are unassigned items
    for (const item of this.queue.values()) {
      if (!item.assigned_to) {
        this.assignToReviewer(item.id, reviewerId);
        return item;
      }
    }
    return undefined;
  }

  getAssignedItems(reviewerId: string): QueuedItem[] {
    const assignedIds = this.reviewerAssignments.get(reviewerId);
    if (!assignedIds) return [];

    return Array.from(assignedIds)
      .map(id => this.queue.get(id))
      .filter((item): item is QueuedItem => item !== undefined)
      .sort((a, b) => b.priority - a.priority);
  }

  getOverdueItems(): QueuedItem[] {
    const now = new Date();
    return Array.from(this.queue.values())
      .filter(item => item.sla_deadline < now)
      .sort((a, b) => a.sla_deadline.getTime() - b.sla_deadline.getTime());
  }

  getQueueStats(): QueueStats {
    const items = Array.from(this.queue.values());
    const now = new Date();

    const byRiskTier: Record<RiskTier, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    let totalWaitTime = 0;
    let assignedCount = 0;
    let overdueCount = 0;

    items.forEach(item => {
      byRiskTier[item.request.risk_tier]++;
      totalWaitTime += now.getTime() - item.queued_at.getTime();
      if (item.assigned_to) assignedCount++;
      if (item.sla_deadline < now) overdueCount++;
    });

    return {
      total_pending: items.length,
      by_risk_tier: byRiskTier,
      average_wait_time_ms: items.length > 0 ? totalWaitTime / items.length : 0,
      overdue_count: overdueCount,
      assigned_count: assignedCount,
      unassigned_count: items.length - assignedCount,
    };
  }

  getReviewerStats(reviewerId: string): ReviewerStats {
    const assignments = this.reviewerAssignments.get(reviewerId);
    const reviews = this.completedReviews.get(reviewerId) || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayReviews = reviews.filter(r => r.completed_at >= today);
    const totalDuration = reviews.reduce((sum, r) => sum + r.duration_ms, 0);
    const approvedCount = reviews.filter(r => r.approved).length;

    return {
      reviewer_id: reviewerId,
      pending_assignments: assignments?.size || 0,
      completed_today: todayReviews.length,
      average_review_time_ms: reviews.length > 0 ? totalDuration / reviews.length : 0,
      approval_rate: reviews.length > 0 ? approvedCount / reviews.length : 0,
    };
  }

  setSLAHours(tier: RiskTier, hours: number): void {
    this.slaHours[tier] = hours;
  }

  getSLAHours(): Record<RiskTier, number> {
    return { ...this.slaHours };
  }

  getAllItems(): QueuedItem[] {
    return Array.from(this.queue.values());
  }

  getItemById(requestId: string): QueuedItem | undefined {
    return this.queue.get(requestId);
  }
}

export const humanReviewQueue = new HumanReviewQueue();
