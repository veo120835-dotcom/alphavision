import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus,
  Save,
  Play,
  Trash2,
  Settings2,
  Zap,
  Clock,
  GitBranch,
  ArrowRight,
  Webhook,
  Mail,
  MessageCircle,
  DollarSign,
  Users,
  CheckCircle2,
  AlertTriangle,
  Pause,
  RefreshCw,
  Move,
  Link2,
  Unlink,
  Copy,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

interface WorkflowNode {
  id: string;
  workflow_id: string;
  node_type: 'trigger' | 'action' | 'condition' | 'delay' | 'loop' | 'parallel';
  node_name: string;
  config: Record<string, any>;
  position_x: number;
  position_y: number;
}

interface WorkflowEdge {
  id: string;
  workflow_id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: string;
  condition: Record<string, any> | null;
}

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  cron_expression: string | null;
}

const NODE_TYPES = [
  { type: 'trigger', label: 'Trigger', icon: Zap, color: 'bg-green-500', description: 'Start the workflow' },
  { type: 'action', label: 'Action', icon: Play, color: 'bg-blue-500', description: 'Execute an action' },
  { type: 'condition', label: 'Condition', icon: GitBranch, color: 'bg-yellow-500', description: 'Branch based on condition' },
  { type: 'delay', label: 'Delay', icon: Clock, color: 'bg-purple-500', description: 'Wait before continuing' },
  { type: 'loop', label: 'Loop', icon: RefreshCw, color: 'bg-orange-500', description: 'Repeat actions' },
  { type: 'parallel', label: 'Parallel', icon: GitBranch, color: 'bg-pink-500', description: 'Run actions in parallel' }
];

const TRIGGER_OPTIONS = [
  { id: 'webhook', label: 'Webhook', description: 'Triggered by HTTP request' },
  { id: 'lead.created', label: 'New Lead', description: 'When a new lead is created' },
  { id: 'payment.received', label: 'Payment Received', description: 'When payment is received' },
  { id: 'dm.received', label: 'DM Received', description: 'When a DM is received' },
  { id: 'schedule', label: 'Schedule (Cron)', description: 'Run on a schedule' }
];

const ACTION_OPTIONS = [
  { id: 'send_dm', label: 'Send DM', description: 'Send a direct message' },
  { id: 'send_email', label: 'Send Email', description: 'Send an email' },
  { id: 'create_lead', label: 'Create Lead', description: 'Add to lead pipeline' },
  { id: 'update_lead', label: 'Update Lead', description: 'Update lead status' },
  { id: 'trigger_agent', label: 'Trigger Agent', description: 'Activate an agent' },
  { id: 'webhook_call', label: 'Call Webhook', description: 'POST to external URL' },
  { id: 'create_task', label: 'Create Task', description: 'Queue execution task' },
  { id: 'generate_content', label: 'Generate Content', description: 'AI content generation' },
  { id: 'downsell', label: 'Apply Downsell', description: 'Trigger downsell offer' }
];

export function VisualWorkflowEditor() {
  const { organization } = useOrganization();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (organization?.id) {
      fetchWorkflows();
    }
  }, [organization?.id]);

  const fetchWorkflows = async () => {
    if (!organization?.id) return;
    setLoading(true);
    
    try {
      const { data } = await supabase
        .from('automation_workflows')
        .select('id, name, description, is_active, cron_expression')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (data) setWorkflows(data);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflow = async (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    
    const [nodesRes, edgesRes] = await Promise.all([
      supabase
        .from('workflow_nodes')
        .select('*')
        .eq('workflow_id', workflow.id),
      supabase
        .from('workflow_edges')
        .select('*')
        .eq('workflow_id', workflow.id)
    ]);

    if (nodesRes.data) setNodes(nodesRes.data as WorkflowNode[]);
    if (edgesRes.data) setEdges(edgesRes.data as WorkflowEdge[]);
  };

  const createWorkflow = async () => {
    if (!organization?.id) return;

    const { data, error } = await supabase
      .from('automation_workflows')
      .insert({
        organization_id: organization.id,
        name: 'New Workflow',
        trigger_type: 'webhook',
        stage: 'draft'
      })
      .select()
      .single();

    if (data) {
      setWorkflows(prev => [data, ...prev]);
      loadWorkflow(data);
      toast.success('Workflow created');
    }
  };

  const addNode = async (type: WorkflowNode['node_type']) => {
    if (!selectedWorkflow || !organization?.id) return;

    const newNode = {
      workflow_id: selectedWorkflow.id,
      organization_id: organization.id,
      node_type: type,
      node_name: `New ${type}`,
      config: {},
      position_x: 100 + nodes.length * 50,
      position_y: 100 + nodes.length * 50
    };

    const { data, error } = await supabase
      .from('workflow_nodes')
      .insert(newNode)
      .select()
      .single();

    if (data) {
      setNodes(prev => [...prev, data as WorkflowNode]);
      toast.success(`${type} node added`);
    }
  };

  const updateNode = async (nodeId: string, updates: Partial<WorkflowNode>) => {
    await supabase
      .from('workflow_nodes')
      .update(updates)
      .eq('id', nodeId);

    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, ...updates } : n));
  };

  const deleteNode = async (nodeId: string) => {
    await supabase.from('workflow_nodes').delete().eq('id', nodeId);
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.source_node_id !== nodeId && e.target_node_id !== nodeId));
    toast.success('Node deleted');
  };

  const connectNodes = async (sourceId: string, targetId: string) => {
    if (!selectedWorkflow || !organization?.id || sourceId === targetId) return;

    // Check if edge already exists
    const exists = edges.some(e => e.source_node_id === sourceId && e.target_node_id === targetId);
    if (exists) return;

    const { data } = await supabase
      .from('workflow_edges')
      .insert({
        workflow_id: selectedWorkflow.id,
        organization_id: organization.id,
        source_node_id: sourceId,
        target_node_id: targetId,
        edge_type: 'default'
      })
      .select()
      .single();

    if (data) {
      setEdges(prev => [...prev, data as WorkflowEdge]);
      toast.success('Nodes connected');
    }
  };

  const deleteEdge = async (edgeId: string) => {
    await supabase.from('workflow_edges').delete().eq('id', edgeId);
    setEdges(prev => prev.filter(e => e.id !== edgeId));
  };

  const handleNodeDrag = (nodeId: string, e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const startX = e.clientX;
    const startY = e.clientY;
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const startPosX = node.position_x;
    const startPosY = node.position_y;

    const handleMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      setNodes(prev => prev.map(n => 
        n.id === nodeId 
          ? { ...n, position_x: startPosX + deltaX, position_y: startPosY + deltaY }
          : n
      ));
    };

    const handleUp = async () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      
      const updatedNode = nodes.find(n => n.id === nodeId);
      if (updatedNode) {
        await updateNode(nodeId, { 
          position_x: updatedNode.position_x, 
          position_y: updatedNode.position_y 
        });
      }
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const getNodeIcon = (type: string) => {
    const nodeType = NODE_TYPES.find(t => t.type === type);
    return nodeType?.icon || Zap;
  };

  const getNodeColor = (type: string) => {
    const nodeType = NODE_TYPES.find(t => t.type === type);
    return nodeType?.color || 'bg-gray-500';
  };

  const renderEdge = (edge: WorkflowEdge) => {
    const source = nodes.find(n => n.id === edge.source_node_id);
    const target = nodes.find(n => n.id === edge.target_node_id);
    if (!source || !target) return null;

    const x1 = source.position_x + 80;
    const y1 = source.position_y + 30;
    const x2 = target.position_x;
    const y2 = target.position_y + 30;

    const midX = (x1 + x2) / 2;

    return (
      <g key={edge.id}>
        <path
          d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          fill="none"
          className="cursor-pointer hover:stroke-destructive transition-colors"
          onClick={() => deleteEdge(edge.id)}
        />
        <circle cx={x2} cy={y2} r="4" fill="hsl(var(--primary))" />
      </g>
    );
  };

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold gradient-text">Visual Workflow Editor</h1>
          <p className="text-sm text-muted-foreground">Drag-and-drop workflow builder</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={createWorkflow}>
            <Plus className="w-4 h-4 mr-2" />
            New Workflow
          </Button>
          {selectedWorkflow && (
            <Button onClick={() => toast.success('Workflow saved')}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Workflows List */}
        <div className="w-64 border-r border-border p-4 overflow-y-auto">
          <h3 className="font-semibold mb-3">Workflows</h3>
          <div className="space-y-2">
            {workflows.map(workflow => (
              <div
                key={workflow.id}
                onClick={() => loadWorkflow(workflow)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedWorkflow?.id === workflow.id 
                    ? 'bg-primary/20 border border-primary' 
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{workflow.name}</span>
                  <Badge variant={workflow.is_active ? 'default' : 'secondary'} className="text-xs">
                    {workflow.is_active ? 'Active' : 'Draft'}
                  </Badge>
                </div>
                {workflow.cron_expression && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {workflow.cron_expression}
                  </p>
                )}
              </div>
            ))}
            {workflows.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No workflows yet
              </p>
            )}
          </div>

          {/* Node Palette */}
          {selectedWorkflow && (
            <>
              <h3 className="font-semibold mt-6 mb-3">Add Nodes</h3>
              <div className="space-y-2">
                {NODE_TYPES.map(nodeType => {
                  const Icon = nodeType.icon;
                  return (
                    <button
                      key={nodeType.type}
                      onClick={() => addNode(nodeType.type as WorkflowNode['node_type'])}
                      className="w-full p-2 rounded-lg bg-muted/50 hover:bg-muted flex items-center gap-2 text-sm transition-all"
                    >
                      <div className={`p-1.5 rounded ${nodeType.color}`}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      <span>{nodeType.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden bg-muted/20">
          {selectedWorkflow ? (
            <div 
              ref={canvasRef}
              className="absolute inset-0 overflow-auto"
              style={{ 
                backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground) / 0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            >
              {/* SVG for edges */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '2000px', minHeight: '2000px' }}>
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" />
                  </marker>
                </defs>
                <g className="pointer-events-auto">
                  {edges.map(renderEdge)}
                </g>
              </svg>

              {/* Nodes */}
              {nodes.map(node => {
                const Icon = getNodeIcon(node.node_type);
                const color = getNodeColor(node.node_type);
                
                return (
                  <motion.div
                    key={node.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute cursor-move"
                    style={{ left: node.position_x, top: node.position_y }}
                    onMouseDown={(e) => handleNodeDrag(node.id, e)}
                  >
                    <div className={`
                      p-3 rounded-lg border-2 bg-background shadow-lg min-w-[160px]
                      ${connectingFrom === node.id ? 'border-primary ring-2 ring-primary/50' : 'border-border'}
                      hover:border-primary/50 transition-all
                    `}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded ${color}`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-sm">{node.node_name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {node.config.action || node.config.trigger || node.node_type}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNode(node);
                            setNodeDialogOpen(true);
                          }}
                        >
                          <Settings2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (connectingFrom) {
                              connectNodes(connectingFrom, node.id);
                              setConnectingFrom(null);
                            } else {
                              setConnectingFrom(node.id);
                            }
                          }}
                        >
                          {connectingFrom === node.id ? <Unlink className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNode(node.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Add nodes from the sidebar</p>
                    <p className="text-sm">Start with a Trigger node</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <GitBranch className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="font-medium text-lg">Select or create a workflow</p>
                <p className="text-sm">Build automated workflows with drag-and-drop</p>
                <Button className="mt-4" onClick={createWorkflow}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Workflow
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Node Config Dialog */}
      <Dialog open={nodeDialogOpen} onOpenChange={setNodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Node</DialogTitle>
            <DialogDescription>Set up this {selectedNode?.node_type} node</DialogDescription>
          </DialogHeader>
          
          {selectedNode && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Node Name</Label>
                <Input
                  value={selectedNode.node_name}
                  onChange={(e) => setSelectedNode({ ...selectedNode, node_name: e.target.value })}
                />
              </div>

              {selectedNode.node_type === 'trigger' && (
                <div className="space-y-2">
                  <Label>Trigger Type</Label>
                  <Select
                    value={selectedNode.config.trigger || ''}
                    onValueChange={(value) => setSelectedNode({
                      ...selectedNode,
                      config: { ...selectedNode.config, trigger: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_OPTIONS.map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedNode.config.trigger === 'schedule' && (
                    <div className="space-y-2 mt-4">
                      <Label>Cron Expression</Label>
                      <Input
                        value={selectedNode.config.cron || ''}
                        onChange={(e) => setSelectedNode({
                          ...selectedNode,
                          config: { ...selectedNode.config, cron: e.target.value }
                        })}
                        placeholder="*/5 * * * * (every 5 minutes)"
                      />
                      <p className="text-xs text-muted-foreground">
                        Format: minute hour day month weekday
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedNode.node_type === 'action' && (
                <div className="space-y-2">
                  <Label>Action Type</Label>
                  <Select
                    value={selectedNode.config.action || ''}
                    onValueChange={(value) => setSelectedNode({
                      ...selectedNode,
                      config: { ...selectedNode.config, action: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_OPTIONS.map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedNode.node_type === 'delay' && (
                <div className="space-y-2">
                  <Label>Delay Duration (seconds)</Label>
                  <Input
                    type="number"
                    value={selectedNode.config.delay_seconds || 60}
                    onChange={(e) => setSelectedNode({
                      ...selectedNode,
                      config: { ...selectedNode.config, delay_seconds: parseInt(e.target.value) }
                    })}
                  />
                </div>
              )}

              {selectedNode.node_type === 'condition' && (
                <div className="space-y-2">
                  <Label>Condition Expression</Label>
                  <Input
                    value={selectedNode.config.condition || ''}
                    onChange={(e) => setSelectedNode({
                      ...selectedNode,
                      config: { ...selectedNode.config, condition: e.target.value }
                    })}
                    placeholder="e.g., lead.intent_score > 70"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setNodeDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (selectedNode) {
                updateNode(selectedNode.id, {
                  node_name: selectedNode.node_name,
                  config: selectedNode.config
                });
                setNodeDialogOpen(false);
                toast.success('Node updated');
              }
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
