import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Database, FileText, Target, Briefcase, Plus, Play, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { PlaybookEditor } from "@/components/PlaybookEditor";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Playbook {
  id: string;
  title: string;
  description: string | null;
  category: string;
  steps: unknown;
  success_metrics: string[];
  tags: string[];
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
}

interface MemoryItem {
  id: string;
  type: string;
  title: string;
  content: unknown;
  tags: string[];
  updated_at: string;
}

const TYPE_CONFIG = {
  icp: { icon: Target, label: 'ICP Profile' },
  offer: { icon: Briefcase, label: 'Offer' },
  playbook: { icon: FileText, label: 'Playbook' },
  document: { icon: Database, label: 'Document' },
};

export function MemoryVaultView() {
  const { organization } = useOrganization();
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null);

  useEffect(() => {
    if (organization?.id) {
      loadData();
    }
  }, [organization?.id]);

  const loadData = async () => {
    if (!organization?.id) return;

    try {
      const [playbooksRes, memoryRes] = await Promise.all([
        supabase
          .from('playbooks')
          .select('*')
          .eq('organization_id', organization.id)
          .order('updated_at', { ascending: false }),
        supabase
          .from('memory_items')
          .select('*')
          .eq('organization_id', organization.id)
          .order('updated_at', { ascending: false })
      ]);

      if (playbooksRes.error) throw playbooksRes.error;
      if (memoryRes.error) throw memoryRes.error;

      setPlaybooks(playbooksRes.data || []);
      setMemoryItems(memoryRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUsePlaybook = async (playbook: Playbook) => {
    try {
      await supabase
        .from('playbooks')
        .update({ 
          usage_count: playbook.usage_count + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', playbook.id);
      
      toast.success(`Playbook "${playbook.title}" activated!`);
      loadData();
    } catch (error) {
      console.error('Error using playbook:', error);
    }
  };

  const handleDeletePlaybook = async (id: string) => {
    try {
      const { error } = await supabase
        .from('playbooks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Playbook deleted");
      loadData();
    } catch (error) {
      console.error('Error deleting playbook:', error);
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold gradient-text mb-2">Memory Vault</h1>
          <p className="text-muted-foreground">
            Your business DNA. ICP, offers, playbooks, and brand constitution—all in one place.
          </p>
        </div>
        <Button onClick={() => { setEditingPlaybook(null); setShowEditor(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          New Playbook
        </Button>
      </div>

      {/* Playbooks Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Playbooks
        </h2>
        
        {playbooks.length > 0 ? (
          <div className="grid gap-4">
            <AnimatePresence>
              {playbooks.map((playbook) => (
                <motion.div
                  key={playbook.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="glass rounded-xl p-5 hover:bg-muted/20 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          playbook.category === 'sales' ? 'bg-green-500/20 text-green-400' :
                          playbook.category === 'marketing' ? 'bg-blue-500/20 text-blue-400' :
                          playbook.category === 'growth' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-muted text-muted-foreground'
                        )}>
                          {playbook.category}
                        </span>
                        {playbook.usage_count > 0 && (
                          <span className="text-xs text-muted-foreground">
                            Used {playbook.usage_count}x
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {playbook.title}
                      </h3>
                      {playbook.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {playbook.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {Array.isArray(playbook.steps) ? playbook.steps.length : 0} steps
                        </span>
                        {playbook.success_metrics.length > 0 && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {playbook.success_metrics.length} metrics
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => handleUsePlaybook(playbook)}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => { setEditingPlaybook(playbook); setShowEditor(true); }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-destructive"
                        onClick={() => handleDeletePlaybook(playbook.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No playbooks yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create reusable playbooks for your recurring processes.
            </p>
            <Button variant="outline" onClick={() => setShowEditor(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Playbook
            </Button>
          </div>
        )}
      </div>

      {/* Memory Items Section */}
      {memoryItems.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Memory Items
          </h2>
          <div className="grid gap-4">
            {memoryItems.map((item) => {
              const config = TYPE_CONFIG[item.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.document;
              const Icon = config.icon;

              return (
                <div key={item.id} className="glass rounded-xl p-5 hover:bg-muted/20 transition-colors cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {config.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Updated {new Date(item.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      {item.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {item.tags.map((tag, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded bg-muted/50">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Playbook Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <PlaybookEditor
            playbook={editingPlaybook || undefined}
            onClose={() => { setShowEditor(false); setEditingPlaybook(null); }}
            onSave={loadData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
