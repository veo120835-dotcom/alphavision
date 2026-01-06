import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Rocket, 
  Building2, 
  DollarSign, 
  Users, 
  Zap, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useAlphaVisionStore } from '@/store/alpha-vision-store';
import { toast } from 'sonner';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Alpha Vision',
    description: 'Your AI-powered autonomous business advisor',
    icon: <Rocket className="w-8 h-8" />
  },
  {
    id: 'business',
    title: 'Tell us about your business',
    description: 'Help the AI understand what you do',
    icon: <Building2 className="w-8 h-8" />
  },
  {
    id: 'pricing',
    title: 'Your offer & pricing',
    description: 'Configure your products and pricing',
    icon: <DollarSign className="w-8 h-8" />
  },
  {
    id: 'audience',
    title: 'Target audience',
    description: 'Who are your ideal clients?',
    icon: <Users className="w-8 h-8" />
  },
  {
    id: 'ready',
    title: 'You\'re all set!',
    description: 'Start chatting with your AI advisor',
    icon: <Sparkles className="w-8 h-8" />
  }
];

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    productName: '',
    productDescription: '',
    basePrice: '',
    targetNiche: '',
    brandVoice: '',
    bookingLink: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { organization } = useOrganization();
  const { setActiveView } = useAlphaVisionStore();

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      await saveConfig();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const saveConfig = async () => {
    if (!organization?.id) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('business_config')
        .upsert({
          organization_id: organization.id,
          product_name: formData.productName,
          product_description: formData.productDescription,
          base_price: parseFloat(formData.basePrice) || 0,
          target_niche: formData.targetNiche,
          brand_voice: formData.brandVoice,
          booking_link: formData.bookingLink
        });

      if (error) throw error;
      
      toast.success('Setup complete! Welcome to Alpha Vision.');
      onComplete();
      setActiveView('chat');
    } catch (error) {
      console.error('Failed to save config:', error);
      toast.error('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
              <Rocket className="w-10 h-10 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Welcome to Alpha Vision</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                I'm your AI business advisor. I'll help you make better decisions, 
                close more deals, and automate revenue-generating tasks.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <MessageSquare className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Ask anything</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <Zap className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Auto-execute</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <DollarSign className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Track ROI</p>
              </div>
            </div>
          </div>
        );

      case 'business':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productName">What do you sell?</Label>
              <Input
                id="productName"
                placeholder="e.g., Business coaching, SaaS product, Consulting"
                value={formData.productName}
                onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productDescription">Describe your offer in one sentence</Label>
              <Textarea
                id="productDescription"
                placeholder="e.g., I help B2B founders close $10k+ deals through async sales systems"
                value={formData.productDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, productDescription: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="basePrice">Base price (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="basePrice"
                  type="number"
                  placeholder="2500"
                  className="pl-9"
                  value={formData.basePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                />
              </div>
              <p className="text-xs text-muted-foreground">Your primary offer price</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bookingLink">Booking link (optional)</Label>
              <Input
                id="bookingLink"
                placeholder="https://calendly.com/you/discovery"
                value={formData.bookingLink}
                onChange={(e) => setFormData(prev => ({ ...prev, bookingLink: e.target.value }))}
              />
            </div>
          </div>
        );

      case 'audience':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetNiche">Who is your ideal client?</Label>
              <Textarea
                id="targetNiche"
                placeholder="e.g., B2B SaaS founders, $1M-10M ARR, struggling with sales hiring"
                value={formData.targetNiche}
                onChange={(e) => setFormData(prev => ({ ...prev, targetNiche: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandVoice">Your brand voice</Label>
              <div className="flex flex-wrap gap-2">
                {['Professional', 'Casual', 'Direct', 'Empathetic', 'Bold'].map(voice => (
                  <Badge
                    key={voice}
                    variant={formData.brandVoice === voice ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setFormData(prev => ({ ...prev, brandVoice: voice }))}
                  >
                    {voice}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 'ready':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Check className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">You're ready!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Alpha Vision is configured and ready to help you grow your business.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm font-medium mb-2">Try asking:</p>
              <p className="text-muted-foreground italic">
                "What should I focus on this week to increase revenue?"
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <Card className="border-2">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center gap-2 mb-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <CardDescription>Step {currentStep + 1} of {steps.length}</CardDescription>
          </CardHeader>
          
          <CardContent className="pt-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-8">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNext} disabled={isSubmitting}>
                {currentStep === steps.length - 1 ? (
                  isSubmitting ? 'Saving...' : 'Start Chatting'
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default OnboardingWizard;
