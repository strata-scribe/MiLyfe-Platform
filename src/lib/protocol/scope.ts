export type RelationshipType = 'household' | 'guardian' | 'care' | 'delegation';
export type Action = 'read' | 'write' | 'delete' | 'admin';
export type Resource = 'profile' | 'health' | 'finance' | 'settings';

export interface ScopeEdge {
  from: string;
  to: string;
  type: RelationshipType;
  metadata?: Record<string, any>;
}

export interface ScopeCheckRequest {
  actorId: string;
  targetId: string;
  action: Action;
  resource: Resource;
}

export interface ScopeCheckResult {
  allowed: boolean;
  reason: string;
}

export class ScopeGraph {
  private edges: ScopeEdge[] = [];

  addEdge(edge: ScopeEdge): void {
    this.edges.push(edge);
  }

  removeEdge(from: string, to: string, type: RelationshipType): void {
    this.edges = this.edges.filter(
      (e) => !(e.from === from && e.to === to && e.type === type)
    );
  }

  getEdges(): ScopeEdge[] {
    return this.edges;
  }

  getOutgoingEdges(nodeId: string): ScopeEdge[] {
    return this.edges.filter((e) => e.from === nodeId);
  }

  getIncomingEdges(nodeId: string): ScopeEdge[] {
    return this.edges.filter((e) => e.to === nodeId);
  }
}

export function resolvePermissions(
  graph: ScopeGraph,
  request: ScopeCheckRequest
): ScopeCheckResult {
  const { actorId, targetId, action, resource } = request;

  // 1. Direct access
  if (actorId === targetId) {
    return { allowed: true, reason: 'self-access' };
  }

  // 2. Traverse graph for relationships
  // Look for any incoming edges to the target node
  const targetIncoming = graph.getIncomingEdges(targetId);

  // Also look for outgoing edges from target if relationship is symmetric (household)
  const targetOutgoing = graph.getOutgoingEdges(targetId);

  const isHousehold = targetIncoming.some(e => e.from === actorId && e.type === 'household') ||
                      targetOutgoing.some(e => e.to === actorId && e.type === 'household');

  if (isHousehold) {
    if (action === 'read' && resource !== 'health' && resource !== 'finance') {
        return { allowed: true, reason: 'household-read' };
    }
  }

  const isGuardian = targetIncoming.some(e => e.from === actorId && e.type === 'guardian');
  if (isGuardian) {
    // Guardians usually have full access, or high access
    return { allowed: true, reason: 'guardian-access' };
  }

  const isCare = targetIncoming.some(e => e.from === actorId && e.type === 'care');
  if (isCare) {
    if (resource === 'health') {
        return { allowed: true, reason: 'care-health-access' };
    }
  }

  const delegationEdges = targetIncoming.filter(e => e.from === actorId && e.type === 'delegation');
  for (const edge of delegationEdges) {
      if (edge.metadata?.allowedActions?.includes(action) && edge.metadata?.allowedResources?.includes(resource)) {
          return { allowed: true, reason: 'delegated-access' };
      }
  }

  return { allowed: false, reason: 'no-relationship-or-permission' };
}
