import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Shield, 
  Heart, 
  Target, 
  Ban, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface IdentityItem {
  id: string;
  identity_element: string;
  title: string;
  description: string | null;
  priority: number;
}

const IDENTITY_ELEMENTS = [
  { key: 'core_values', label: 'Core Values', icon: Heart, color: 'from-pink-500 to-rose-500', description: 'What principles guide every decision' },
  { key: 'brand_voice', label: 'Brand Voice', icon: Target, color: 'from-blue-500 to-cyan-500', description: 'How you communicate and present yourself' },
  { key: 'red_lines', label: 'Red Lines', icon: Ban, color: 'from-red-500 to-orange-500', description: 'What you will never do, regardless of profit' },
  { key: 'aspirations', label: 'Aspirations', icon: Shield, color: 'from-purple-500 to-violet-500', description: 'Who you are becoming' },
];

export function BusinessIdentityView() {
  const { organization } = useOrganization();
  const [items, setItems] = useState<IdentityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<{ element: string; title: string; description: string } | null>(null);

  useEffect(() => {
    if (organization?.id) {
      loadIdentity();
    }
  }, [organization?.id]);

  const loadIdentity = async () => {
    if (!organization?.id) return;
    
    try {
      // Table doesn't exist yet - use empty state
      setItems([]);
    } catch (error) {
      console.error('Error loading identity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!organization?.id || !newItem?.element || !newItem.title.trim()) {
      toast.error("Please fill in the required fields");
      return;
    }

    try {
      // Table doesn't exist yet - simulate locally
      const newIdentityItem: IdentityItem = {
        id: crypto.randomUUID(),
        organization_id: organization.id,
        identity_element: newItem.element,
        title: newItem.title.trim(),
        description: newItem.description.trim() || null,
        priority: items.length + 1,
        created_at: new Date().toISOString()
      };
      setItems(prev => [...prev, newIdentityItem]);
      toast.success("Added to identity!");
      setNewItem(null);
    } catch (error) {
      console.error('Error adding identity item:', error);
      toast.error("Failed to add");
    }
  };

  const handleUpdate = async (item: IdentityItem, title: string, description: string) => {
    try {
      // Update locally
      setItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, title: title.trim(), description: description.trim() || null } : i
      ));
      setEditingId(null);
    } catch (error) {
      console.error('Error updating:', error);
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Delete locally
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-semibold gradient-text mb-2">Business Identity Mirror</h1>
        <p className="text-muted-foreground">
          Define who your business is becoming. Every recommendation is checked against this.
        </p>
      </div>

      {/* Identity Sections */}
      <div className="space-y-6">
        {IDENTITY_ELEMENTS.map((element) => {
          const elementItems = items.filter(i => i.identity_element === element.key);
          const Icon = element.icon;

          return (
            <motion.div
              key={element.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl overflow-hidden"
            >
              {/* Section Header */}
              <div className={cn(
                "p-4 flex items-center justify-between",
                `bg-gradient-to-r ${element.color} bg-opacity-10`
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", `bg-gradient-to-br ${element.color}`)}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{element.label}</h2>
                    <p className="text-sm text-muted-foreground">{element.description}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewItem({ element: element.key, title: '', description: '' })}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>

              {/* Items */}
              <div className="p-4">
                <AnimatePresence>
                  {/* Add New Form */}
                  {newItem?.element === element.key && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 p-4 rounded-lg bg-muted/30 border border-border space-y-3"
                    >
                      <Input
                        value={newItem.title}
                        onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                        placeholder="Title"
                        autoFocus
                      />
                      <Textarea
                        value={newItem.description}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        placeholder="Description (optional)"
                        rows={2}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setNewItem(null)}>
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleAdd}>
                          <Check className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Existing Items */}
                  {elementItems.length > 0 ? (
                    <div className="space-y-2">
                      {elementItems.map((item) => (
                        <IdentityItemCard
                          key={item.id}
                          item={item}
                          isEditing={editingId === item.id}
                          onEdit={() => setEditingId(item.id)}
                          onSave={(title, desc) => handleUpdate(item, title, desc)}
                          onCancel={() => setEditingId(null)}
                          onDelete={() => handleDelete(item.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    !newItem && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No {element.label.toLowerCase()} defined yet.
                      </p>
                    )
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function IdentityItemCard({ 
  item, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel, 
  onDelete 
}: {
  item: IdentityItem;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (title: string, description: string) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description || '');

  if (isEditing) {
    return (
      <motion.div
        layout
        className="p-3 rounded-lg bg-muted/50 space-y-2"
      >
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={2}
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={() => onSave(title, description)}>
            <Check className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      className="p-3 rounded-lg bg-muted/30 group hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium">{item.title}</h4>
          {item.description && (
            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={onEdit}>
            <Edit2 className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive" onClick={onDelete}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
