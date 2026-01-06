import { useState } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Target, 
  Lightbulb, 
  ArrowRight, 
  Plus, 
  X,
  Zap,
  Shield,
  Crown,
  Brain
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CategoryFrame {
  id: string;
  oldCategory: string;
  newCategory: string;
  differentiator: string;
  positioning: string;
}

export function CategoryDesignEngine() {
  const { organization } = useOrganization();
  const [frames, setFrames] = useState<CategoryFrame[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [businessContext, setBusinessContext] = useState("");
  const [currentCompetitors, setCurrentCompetitors] = useState("");
  const [uniqueStrengths, setUniqueStrengths] = useState("");

  const generateCategoryFrames = async () => {
    if (!organization?.id) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: [
            {
              role: 'user',
              content: `As a category design expert, analyze this business and generate 3 unique category frames that would help them escape competition:

Business Context: ${businessContext}
Current Competitors: ${currentCompetitors}
Unique Strengths: ${uniqueStrengths}

For each category frame, provide:
1. The OLD category they're currently competing in
2. The NEW category they should create/own
3. The KEY differentiator that makes this category theirs
4. A positioning statement (under 20 words)

Format your response as JSON array with objects containing: oldCategory, newCategory, differentiator, positioning`
            }
          ]
        }
      });

      if (error) throw error;

      // Parse the response
      const content = typeof data === 'string' ? data : data.content || '';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setFrames(parsed.map((p: any, i: number) => ({ id: `frame-${i}`, ...p })));
      } else {
        // Fallback frames if parsing fails
        setFrames([
          {
            id: 'frame-1',
            oldCategory: 'Generic market category',
            newCategory: 'Your unique category',
            differentiator: 'Your key differentiator',
            positioning: 'Define your unique position'
          }
        ]);
      }
      
      toast.success("Category frames generated!");
    } catch (error) {
      console.error('Error generating category frames:', error);
      toast.error("Failed to generate category frames");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveFrame = async (frame: CategoryFrame) => {
    if (!organization?.id) return;
    
    try {
      await supabase.from('memory_items').insert({
        organization_id: organization.id,
        title: `Category Frame: ${frame.newCategory}`,
        type: 'category_frame',
        content: {
          oldCategory: frame.oldCategory,
          newCategory: frame.newCategory,
          differentiator: frame.differentiator,
          positioning: frame.positioning
        },
        tags: ['category-design', 'positioning']
      });
      
      toast.success("Category frame saved to Memory Vault!");
    } catch (error) {
      console.error('Error saving frame:', error);
      toast.error("Failed to save category frame");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 mb-4">
          <Crown className="w-5 h-5 text-purple-400" />
          <span className="font-medium">Category Design Engine</span>
        </div>
        <h1 className="font-serif text-3xl font-semibold gradient-text mb-2">
          Escape Competition. Create Your Category.
        </h1>
        <p className="text-muted-foreground">
          Stop competing on features. Start defining new markets where you're the only choice.
        </p>
      </div>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6 space-y-4"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Describe Your Business</h2>
            <p className="text-sm text-muted-foreground">Help the AI understand your context</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">What does your business do?</label>
            <Textarea
              value={businessContext}
              onChange={(e) => setBusinessContext(e.target.value)}
              placeholder="We help small businesses automate their customer support using AI..."
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Who are your current competitors?</label>
            <Input
              value={currentCompetitors}
              onChange={(e) => setCurrentCompetitors(e.target.value)}
              placeholder="Zendesk, Intercom, Freshdesk..."
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">What makes you uniquely different?</label>
            <Textarea
              value={uniqueStrengths}
              onChange={(e) => setUniqueStrengths(e.target.value)}
              placeholder="We focus specifically on local service businesses and integrate with their existing tools..."
              rows={2}
            />
          </div>

          <Button
            className="w-full"
            onClick={generateCategoryFrames}
            disabled={isGenerating || !businessContext || !uniqueStrengths}
          >
            {isGenerating ? (
              <>
                <span className="animate-spin mr-2">✨</span>
                Designing Categories...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Category Frames
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Generated Frames */}
      <AnimatePresence>
        {frames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h2 className="font-semibold text-lg">Your Category Frames</h2>
            
            <div className="grid gap-4">
              {frames.map((frame, i) => (
                <CategoryFrameCard
                  key={frame.id}
                  frame={frame}
                  index={i}
                  onSave={() => saveFrame(frame)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Educational Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <EducationCard
          icon={Target}
          title="Define the Problem Differently"
          description="Reframe the problem so only your solution makes sense."
        />
        <EducationCard
          icon={Shield}
          title="Own the Language"
          description="Create terms and frameworks that others must reference."
        />
        <EducationCard
          icon={Zap}
          title="Make Comparison Impossible"
          description="When you're in your own category, there's no competition."
        />
      </motion.div>
    </div>
  );
}

function CategoryFrameCard({ 
  frame, 
  index,
  onSave 
}: { 
  frame: CategoryFrame; 
  index: number;
  onSave: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass rounded-xl p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
            {index + 1}
          </div>
          <span className="font-medium">Category Frame #{index + 1}</span>
        </div>
        <Button variant="outline" size="sm" onClick={onSave}>
          <Plus className="w-4 h-4 mr-1" />
          Save
        </Button>
      </div>

      {/* Old vs New Category */}
      <div className="flex items-center gap-4 mb-6 p-4 rounded-lg bg-muted/30">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">OLD CATEGORY</p>
          <p className="font-medium text-red-400 line-through">{frame.oldCategory}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-primary" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">NEW CATEGORY</p>
          <p className="font-medium text-green-400">{frame.newCategory}</p>
        </div>
      </div>

      {/* Differentiator */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium">Key Differentiator</span>
        </div>
        <p className="text-muted-foreground">{frame.differentiator}</p>
      </div>

      {/* Positioning */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
        <p className="text-sm font-medium italic">"{frame.positioning}"</p>
      </div>
    </motion.div>
  );
}

function EducationCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: typeof Target;
  title: string;
  description: string;
}) {
  return (
    <div className="glass rounded-xl p-5">
      <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 w-fit mb-3">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="font-medium mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}