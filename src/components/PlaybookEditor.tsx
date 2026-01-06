import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, Save, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PlaybookStep {
  id: string;
  title: string;
  description: string;
  order: number;
}

interface PlaybookEditorProps {
  playbook?: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    steps: unknown;
    success_metrics: string[];
    tags: string[];
  };
  onClose: () => void;
  onSave: () => void;
}

export function PlaybookEditor({ playbook, onClose, onSave }: PlaybookEditorProps) {
  const { organization } = useOrganization();
  const [title, setTitle] = useState(playbook?.title || "");
  const [description, setDescription] = useState(playbook?.description || "");
  const [category, setCategory] = useState(playbook?.category || "general");
  const [steps, setSteps] = useState<PlaybookStep[]>(
    Array.isArray(playbook?.steps) 
      ? (playbook.steps as PlaybookStep[])
      : [{ id: crypto.randomUUID(), title: "", description: "", order: 0 }]
  );
  const [successMetrics, setSuccessMetrics] = useState<string[]>(playbook?.success_metrics || [""]);
  const [tags, setTags] = useState(playbook?.tags?.join(", ") || "");
  const [saving, setSaving] = useState(false);

  const addStep = () => {
    setSteps([...steps, { 
      id: crypto.randomUUID(), 
      title: "", 
      description: "", 
      order: steps.length 
    }]);
  };

  const removeStep = (id: string) => {
    if (steps.length > 1) {
      setSteps(steps.filter(s => s.id !== id));
    }
  };

  const updateStep = (id: string, field: 'title' | 'description', value: string) => {
    setSteps(steps.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addMetric = () => setSuccessMetrics([...successMetrics, ""]);
  const removeMetric = (index: number) => {
    if (successMetrics.length > 1) {
      setSuccessMetrics(successMetrics.filter((_, i) => i !== index));
    }
  };
  const updateMetric = (index: number, value: string) => {
    setSuccessMetrics(successMetrics.map((m, i) => i === index ? value : m));
  };

  const handleSave = async () => {
    if (!organization?.id || !title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setSaving(true);
    try {
      const playbookData = {
        organization_id: organization.id,
        title: title.trim(),
        description: description.trim() || null,
        category,
        steps: steps.filter(s => s.title.trim()).map((s, i) => ({ ...s, order: i })),
        success_metrics: successMetrics.filter(m => m.trim()),
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      };

      if (playbook?.id) {
        const { error } = await supabase
          .from('playbooks')
          .update(playbookData)
          .eq('id', playbook.id);
        
        if (error) throw error;
        toast.success("Playbook updated!");
      } else {
        const { error } = await supabase
          .from('playbooks')
          .insert(playbookData);
        
        if (error) throw error;
        toast.success("Playbook saved!");
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving playbook:', error);
      toast.error("Failed to save playbook");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-serif text-xl font-semibold">
            {playbook ? "Edit Playbook" : "Create Playbook"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Cold Outreach Sequence"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this playbook accomplish?"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tags</label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="outreach, cold, b2b"
                />
              </div>
            </div>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Steps</label>
              <Button variant="ghost" size="sm" onClick={addStep}>
                <Plus className="w-4 h-4 mr-1" />
                Add Step
              </Button>
            </div>
            <div className="space-y-3">
              <AnimatePresence>
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-2 items-start p-3 rounded-lg bg-muted/30 border border-border"
                  >
                    <div className="flex items-center gap-2 pt-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        {index + 1}.
                      </span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        value={step.title}
                        onChange={(e) => updateStep(step.id, 'title', e.target.value)}
                        placeholder="Step title"
                        className="bg-background"
                      />
                      <Textarea
                        value={step.description}
                        onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                        placeholder="Step details..."
                        rows={2}
                        className="bg-background"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStep(step.id)}
                      disabled={steps.length === 1}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Success Metrics */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Success Metrics</label>
              <Button variant="ghost" size="sm" onClick={addMetric}>
                <Plus className="w-4 h-4 mr-1" />
                Add Metric
              </Button>
            </div>
            <div className="space-y-2">
              {successMetrics.map((metric, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={metric}
                    onChange={(e) => updateMetric(index, e.target.value)}
                    placeholder="e.g., Reply rate > 12%"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMetric(index)}
                    disabled={successMetrics.length === 1}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Playbook"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
