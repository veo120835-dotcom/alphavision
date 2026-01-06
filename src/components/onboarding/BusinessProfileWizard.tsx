import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Building2, 
  User, 
  Target, 
  DollarSign, 
  MessageSquare, 
  Bot, 
  BookOpen,
  Shield,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check,
  X,
  Plus
} from "lucide-react";

interface BusinessProfileWizardProps {
  onComplete: () => void;
  existingProfile?: any;
}

type WizardStep = 'business' | 'founder' | 'avatar' | 'offer' | 'sales' | 'voice' | 'ai' | 'methodology' | 'standards';

const STEPS: { id: WizardStep; title: string; icon: any; description: string }[] = [
  { id: 'business', title: 'Business Basics', icon: Building2, description: 'Define your business identity' },
  { id: 'founder', title: 'Founder Profile', icon: User, description: 'Your expertise & experience' },
  { id: 'avatar', title: 'Target Avatar', icon: Target, description: 'Who you serve best' },
  { id: 'offer', title: 'Offer Architecture', icon: DollarSign, description: 'Your flagship offer' },
  { id: 'sales', title: 'Sales Philosophy', icon: MessageSquare, description: 'How you sell' },
  { id: 'voice', title: 'Brand Voice', icon: Sparkles, description: 'How you communicate' },
  { id: 'ai', title: 'AI Configuration', icon: Bot, description: 'Configure your AI agent' },
  { id: 'methodology', title: 'Methodology', icon: BookOpen, description: 'Your framework (optional)' },
  { id: 'standards', title: 'Standards', icon: Shield, description: 'Your non-negotiables' },
];

export function BusinessProfileWizard({ onComplete, existingProfile }: BusinessProfileWizardProps) {
  const { organization } = useOrganization();
  const organizationId = organization?.id;
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    // Business
    business_name: existingProfile?.business_name || '',
    tagline: existingProfile?.tagline || '',
    industry: existingProfile?.industry || 'coaching',
    business_model: existingProfile?.business_model || 'high_ticket_1on1',
    // Founder
    founder_name: existingProfile?.founder_name || '',
    founder_title: existingProfile?.founder_title || 'Consultant',
    founder_expertise: existingProfile?.founder_expertise || [],
    years_in_industry: existingProfile?.years_in_industry || 5,
    // Avatar
    avatar_name: existingProfile?.avatar_name || '',
    avatar_description: existingProfile?.avatar_description || '',
    avatar_income_floor: existingProfile?.avatar_income_floor || 8000,
    avatar_income_ceiling: existingProfile?.avatar_income_ceiling || 50000,
    avatar_pain_points: existingProfile?.avatar_pain_points || [],
    avatar_desires: existingProfile?.avatar_desires || [],
    avatar_anti_desires: existingProfile?.avatar_anti_desires || [],
    // Offer
    flagship_offer_name: existingProfile?.flagship_offer_name || '',
    flagship_offer_description: existingProfile?.flagship_offer_description || '',
    flagship_offer_duration: existingProfile?.flagship_offer_duration || '8 weeks',
    flagship_offer_price: existingProfile?.flagship_offer_price || 5000,
    flagship_offer_deliverables: existingProfile?.flagship_offer_deliverables || [],
    // Pricing
    price_floor: existingProfile?.price_floor || 3000,
    price_anchor: existingProfile?.price_anchor || 5000,
    price_ceiling: existingProfile?.price_ceiling || 15000,
    pricing_philosophy: existingProfile?.pricing_philosophy || 'value_based',
    // Sales
    sales_style: existingProfile?.sales_style || 'consultative',
    objection_handling: existingProfile?.objection_handling || 'acknowledge_redirect',
    discount_policy: existingProfile?.discount_policy || 'value_add_only',
    // Voice
    brand_voice_adjectives: existingProfile?.brand_voice_adjectives || [],
    brand_voice_avoid: existingProfile?.brand_voice_avoid || [],
    content_style: existingProfile?.content_style || 'educational',
    // AI
    ai_agent_name: existingProfile?.ai_agent_name || 'Business Intelligence',
    ai_agent_role: existingProfile?.ai_agent_role || 'Business Partner',
    ai_agent_positioning: existingProfile?.ai_agent_positioning || '',
    // Methodology
    methodology_name: existingProfile?.methodology_name || '',
    methodology_stages: existingProfile?.methodology_stages || [],
    // Standards
    non_negotiables: existingProfile?.non_negotiables || [],
    quality_standards: existingProfile?.quality_standards || [],
    primary_kpi: existingProfile?.primary_kpi || 'monthly_revenue',
    secondary_kpis: existingProfile?.secondary_kpis || [],
  });

  const [newItem, setNewItem] = useState('');

  const addToArray = (field: string, value: string) => {
    if (!value.trim()) return;
    setProfile(prev => ({
      ...prev,
      [field]: [...(prev as any)[field], value.trim()]
    }));
    setNewItem('');
  };

  const removeFromArray = (field: string, index: number) => {
    setProfile(prev => ({
      ...prev,
      [field]: (prev as any)[field].filter((_: any, i: number) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!organizationId) {
      toast.error('No organization found');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('business_profiles')
        .upsert({
          organization_id: organizationId,
          ...profile,
        });

      if (error) throw error;
      toast.success('Business profile saved!');
      onComplete();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const renderArrayInput = (field: string, placeholder: string, items: string[]) => (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addToArray(field, newItem);
            }
          }}
        />
        <Button type="button" size="icon" onClick={() => addToArray(field, newItem)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <Badge key={i} variant="secondary" className="flex items-center gap-1">
            {item}
            <button onClick={() => removeFromArray(field, i)} className="ml-1 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );

  const renderStep = () => {
    const step = STEPS[currentStep];
    
    switch (step.id) {
      case 'business':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Business Name *</Label>
                <Input
                  value={profile.business_name}
                  onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                  placeholder="Alpha Vision"
                />
              </div>
              <div>
                <Label>Tagline</Label>
                <Input
                  value={profile.tagline}
                  onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                  placeholder="Premium business transformation"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Industry</Label>
                <Select value={profile.industry} onValueChange={(v) => setProfile({ ...profile, industry: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coaching">Coaching</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="service">Service Business</SelectItem>
                    <SelectItem value="ecommerce">E-Commerce</SelectItem>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Business Model</Label>
                <Select value={profile.business_model} onValueChange={(v) => setProfile({ ...profile, business_model: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high_ticket_1on1">High-Ticket 1-on-1</SelectItem>
                    <SelectItem value="group_program">Group Program</SelectItem>
                    <SelectItem value="productized_service">Productized Service</SelectItem>
                    <SelectItem value="hybrid">Hybrid Model</SelectItem>
                    <SelectItem value="subscription">Subscription/Recurring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'founder':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Your Name</Label>
                <Input
                  value={profile.founder_name}
                  onChange={(e) => setProfile({ ...profile, founder_name: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label>Your Title</Label>
                <Select value={profile.founder_title} onValueChange={(v) => setProfile({ ...profile, founder_title: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Coach">Coach</SelectItem>
                    <SelectItem value="Consultant">Consultant</SelectItem>
                    <SelectItem value="Advisor">Advisor</SelectItem>
                    <SelectItem value="Founder">Founder</SelectItem>
                    <SelectItem value="CEO">CEO</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Years in Industry</Label>
              <Input
                type="number"
                value={profile.years_in_industry}
                onChange={(e) => setProfile({ ...profile, years_in_industry: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Areas of Expertise</Label>
              {renderArrayInput('founder_expertise', 'Add expertise (e.g., Sales Strategy)', profile.founder_expertise)}
            </div>
          </div>
        );

      case 'avatar':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Avatar Name</Label>
                <Input
                  value={profile.avatar_name}
                  onChange={(e) => setProfile({ ...profile, avatar_name: e.target.value })}
                  placeholder="Authority Operators"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Revenue Floor ($)</Label>
                  <Input
                    type="number"
                    value={profile.avatar_income_floor}
                    onChange={(e) => setProfile({ ...profile, avatar_income_floor: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Revenue Ceiling ($)</Label>
                  <Input
                    type="number"
                    value={profile.avatar_income_ceiling}
                    onChange={(e) => setProfile({ ...profile, avatar_income_ceiling: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>Avatar Description</Label>
              <Textarea
                value={profile.avatar_description}
                onChange={(e) => setProfile({ ...profile, avatar_description: e.target.value })}
                placeholder="Describe your ideal client in detail..."
                rows={3}
              />
            </div>
            <div>
              <Label>Pain Points (What they struggle with)</Label>
              {renderArrayInput('avatar_pain_points', 'Add pain point', profile.avatar_pain_points)}
            </div>
            <div>
              <Label>Desires (What they want)</Label>
              {renderArrayInput('avatar_desires', 'Add desire', profile.avatar_desires)}
            </div>
            <div>
              <Label>Anti-Desires (What they DON'T want)</Label>
              {renderArrayInput('avatar_anti_desires', 'Add anti-desire', profile.avatar_anti_desires)}
            </div>
          </div>
        );

      case 'offer':
        return (
          <div className="space-y-4">
            <div>
              <Label>Flagship Offer Name *</Label>
              <Input
                value={profile.flagship_offer_name}
                onChange={(e) => setProfile({ ...profile, flagship_offer_name: e.target.value })}
                placeholder="The 8-Week Transformation"
              />
            </div>
            <div>
              <Label>Offer Description</Label>
              <Textarea
                value={profile.flagship_offer_description}
                onChange={(e) => setProfile({ ...profile, flagship_offer_description: e.target.value })}
                placeholder="Describe what your offer delivers..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Duration</Label>
                <Input
                  value={profile.flagship_offer_duration}
                  onChange={(e) => setProfile({ ...profile, flagship_offer_duration: e.target.value })}
                  placeholder="8 weeks"
                />
              </div>
              <div>
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  value={profile.flagship_offer_price}
                  onChange={(e) => setProfile({ ...profile, flagship_offer_price: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Pricing Philosophy</Label>
                <Select value={profile.pricing_philosophy} onValueChange={(v) => setProfile({ ...profile, pricing_philosophy: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="truth_pricing">Truth Pricing (No Discounts)</SelectItem>
                    <SelectItem value="value_based">Value-Based</SelectItem>
                    <SelectItem value="premium_only">Premium Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Price Floor ($)</Label>
                <Input
                  type="number"
                  value={profile.price_floor}
                  onChange={(e) => setProfile({ ...profile, price_floor: parseInt(e.target.value) || 0 })}
                  placeholder="Minimum you'll accept"
                />
              </div>
              <div>
                <Label>Anchor Price ($)</Label>
                <Input
                  type="number"
                  value={profile.price_anchor}
                  onChange={(e) => setProfile({ ...profile, price_anchor: parseInt(e.target.value) || 0 })}
                  placeholder="Target price"
                />
              </div>
              <div>
                <Label>Price Ceiling ($)</Label>
                <Input
                  type="number"
                  value={profile.price_ceiling}
                  onChange={(e) => setProfile({ ...profile, price_ceiling: parseInt(e.target.value) || 0 })}
                  placeholder="Premium tier"
                />
              </div>
            </div>
            <div>
              <Label>Deliverables</Label>
              {renderArrayInput('flagship_offer_deliverables', 'Add deliverable', profile.flagship_offer_deliverables)}
            </div>
          </div>
        );

      case 'sales':
        return (
          <div className="space-y-4">
            <div>
              <Label>Sales Style</Label>
              <Select value={profile.sales_style} onValueChange={(v) => setProfile({ ...profile, sales_style: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="leadership_based">Leadership-Based (No Persuasion)</SelectItem>
                  <SelectItem value="consultative">Consultative</SelectItem>
                  <SelectItem value="diagnostic">Diagnostic</SelectItem>
                  <SelectItem value="challenge">Challenger Sale</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Leadership-based: Clean decisions, no chasing, fewer objections
              </p>
            </div>
            <div>
              <Label>Objection Handling Approach</Label>
              <Select value={profile.objection_handling} onValueChange={(v) => setProfile({ ...profile, objection_handling: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="acknowledge_redirect">Acknowledge & Redirect</SelectItem>
                  <SelectItem value="reframe">Reframe</SelectItem>
                  <SelectItem value="qualify_out">Qualify Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Discount Policy</Label>
              <Select value={profile.discount_policy} onValueChange={(v) => setProfile({ ...profile, discount_policy: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never Discount</SelectItem>
                  <SelectItem value="strategic_only">Strategic Only (Rare)</SelectItem>
                  <SelectItem value="value_add_only">Value-Add Only (No Price Cuts)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Your AI will flag if you're about to violate this policy
              </p>
            </div>
          </div>
        );

      case 'voice':
        return (
          <div className="space-y-4">
            <div>
              <Label>Content Style</Label>
              <Select value={profile.content_style} onValueChange={(v) => setProfile({ ...profile, content_style: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="educational">Educational</SelectItem>
                  <SelectItem value="provocative">Provocative</SelectItem>
                  <SelectItem value="story_driven">Story-Driven</SelectItem>
                  <SelectItem value="data_driven">Data-Driven</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Brand Voice Adjectives (How you want to sound)</Label>
              {renderArrayInput('brand_voice_adjectives', 'Add adjective (e.g., Direct, Calm, Authoritative)', profile.brand_voice_adjectives)}
            </div>
            <div>
              <Label>Words/Phrases to Avoid</Label>
              {renderArrayInput('brand_voice_avoid', 'Add word to avoid (e.g., Hustle, Grind, 6-figures)', profile.brand_voice_avoid)}
              <p className="text-xs text-muted-foreground mt-1">
                Your AI will flag content containing these words
              </p>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-medium flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Your AI Agent Configuration
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Configure how your AI assistant presents itself and behaves
              </p>
            </div>
            <div>
              <Label>AI Agent Name</Label>
              <Input
                value={profile.ai_agent_name}
                onChange={(e) => setProfile({ ...profile, ai_agent_name: e.target.value })}
                placeholder="Alpha Vision Intelligence"
              />
              <p className="text-xs text-muted-foreground mt-1">What the AI calls itself</p>
            </div>
            <div>
              <Label>AI Agent Role</Label>
              <Select value={profile.ai_agent_role} onValueChange={(v) => setProfile({ ...profile, ai_agent_role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standards Engine">Standards Engine</SelectItem>
                  <SelectItem value="Business Partner">Business Partner</SelectItem>
                  <SelectItem value="Clarity Partner">Clarity Partner</SelectItem>
                  <SelectItem value="Diagnostic Layer">Diagnostic Layer</SelectItem>
                  <SelectItem value="Revenue Advisor">Revenue Advisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>AI Positioning Statement</Label>
              <Textarea
                value={profile.ai_agent_positioning}
                onChange={(e) => setProfile({ ...profile, ai_agent_positioning: e.target.value })}
                placeholder="This AI doesn't tell you what to do. It protects how you decide."
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">How to describe the AI to your clients</p>
            </div>
          </div>
        );

      case 'methodology':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Optional: If you have a structured methodology or framework, define it here. 
                The AI will use this to guide clients through your process.
              </p>
            </div>
            <div>
              <Label>Methodology Name</Label>
              <Input
                value={profile.methodology_name}
                onChange={(e) => setProfile({ ...profile, methodology_name: e.target.value })}
                placeholder="The 8-Week Alpha Vision Method"
              />
            </div>
            <div>
              <Label>Stages/Phases</Label>
              <p className="text-xs text-muted-foreground mb-2">Add each stage of your methodology</p>
              {renderArrayInput('methodology_stages', 'Add stage (e.g., Week 1: Identity Extraction)', 
                profile.methodology_stages.map((s: any) => typeof s === 'string' ? s : s.name || JSON.stringify(s))
              )}
            </div>
          </div>
        );

      case 'standards':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-destructive" />
                Your Red Lines
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Things you will NEVER do. Your AI will protect these boundaries.
              </p>
            </div>
            <div>
              <Label>Non-Negotiables</Label>
              {renderArrayInput('non_negotiables', 'Add non-negotiable (e.g., Never discount based on pressure)', profile.non_negotiables)}
            </div>
            <div>
              <Label>Quality Standards (Minimum requirements for clients/work)</Label>
              {renderArrayInput('quality_standards', 'Add quality standard', profile.quality_standards)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Primary KPI</Label>
                <Select value={profile.primary_kpi} onValueChange={(v) => setProfile({ ...profile, primary_kpi: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly_revenue">Monthly Revenue</SelectItem>
                    <SelectItem value="client_results">Client Results</SelectItem>
                    <SelectItem value="referral_rate">Referral Rate</SelectItem>
                    <SelectItem value="close_rate">Close Rate</SelectItem>
                    <SelectItem value="client_ltv">Client LTV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Secondary KPIs</Label>
                {renderArrayInput('secondary_kpis', 'Add secondary KPI', profile.secondary_kpis)}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    const step = STEPS[currentStep];
    switch (step.id) {
      case 'business':
        return profile.business_name.trim().length > 0;
      case 'offer':
        return profile.flagship_offer_name.trim().length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        <Card className="border-primary/20">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Business Profile Setup
            </CardTitle>
            <CardDescription>
              Configure your business DNA so the AI can adapt to your standards
            </CardDescription>
          </CardHeader>
          
          {/* Progress Steps */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const isActive = i === currentStep;
                const isComplete = i < currentStep;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => i <= currentStep && setCurrentStep(i)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isComplete 
                          ? 'bg-primary text-primary-foreground' 
                          : isActive 
                            ? 'bg-primary/20 text-primary border-2 border-primary' 
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </button>
                    {i < STEPS.length - 1 && (
                      <div className={`w-6 h-0.5 mx-1 ${i < currentStep ? 'bg-primary' : 'bg-muted'}`} />
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="text-center mb-4">
              <h3 className="font-semibold">{STEPS[currentStep].title}</h3>
              <p className="text-sm text-muted-foreground">{STEPS[currentStep].description}</p>
            </div>
          </div>
          
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
            
            <div className="flex justify-between mt-8 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => prev - 1)}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              {currentStep < STEPS.length - 1 ? (
                <Button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!canProceed()}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Complete Setup'}
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default BusinessProfileWizard;
