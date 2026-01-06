import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessProfileWizard } from "@/components/onboarding/BusinessProfileWizard";
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
  Sparkles,
  Edit,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from "lucide-react";

interface BusinessProfile {
  id: string;
  business_name: string;
  tagline?: string;
  industry?: string;
  business_model?: string;
  founder_name?: string;
  founder_title?: string;
  founder_expertise?: string[];
  years_in_industry?: number;
  avatar_name?: string;
  avatar_description?: string;
  avatar_income_floor?: number;
  avatar_income_ceiling?: number;
  avatar_pain_points?: string[];
  avatar_desires?: string[];
  avatar_anti_desires?: string[];
  flagship_offer_name?: string;
  flagship_offer_description?: string;
  flagship_offer_duration?: string;
  flagship_offer_price?: number;
  flagship_offer_deliverables?: string[];
  price_floor?: number;
  price_anchor?: number;
  price_ceiling?: number;
  pricing_philosophy?: string;
  sales_style?: string;
  objection_handling?: string;
  discount_policy?: string;
  brand_voice_adjectives?: string[];
  brand_voice_avoid?: string[];
  content_style?: string;
  ai_agent_name?: string;
  ai_agent_role?: string;
  ai_agent_positioning?: string;
  methodology_name?: string;
  methodology_stages?: any[];
  non_negotiables?: string[];
  quality_standards?: string[];
  primary_kpi?: string;
  secondary_kpis?: string[];
}

export function BusinessProfileDashboard() {
  const { organization } = useOrganization();
  const organizationId = organization?.id;
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (organizationId) {
      loadProfile();
    }
  }, [organizationId]);

  const loadProfile = async () => {
    if (!organizationId) return;
    
    try {
      // Use business_config table instead
      const { data, error } = await (supabase as any)
        .from('business_config')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      // Map to expected format
      if (data) {
        setProfile({
          id: data.id,
          organization_id: data.organization_id,
          business_name: data.product_name || 'My Business',
          business_type: 'service',
          target_market: data.target_niche || '',
          revenue_model: 'subscription',
          current_mrr: 0,
          target_mrr: data.base_price ? data.base_price * 10 : 10000,
          unique_value_prop: data.product_description || '',
          main_problems_solved: [],
          competitive_advantages: [],
          pricing_tiers: [],
          created_at: data.created_at,
          updated_at: data.updated_at
        } as BusinessProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  };

  const getCompletionScore = () => {
    if (!profile) return 0;
    const fields = [
      profile.business_name,
      profile.avatar_name,
      profile.flagship_offer_name,
      profile.price_anchor,
      profile.sales_style,
      profile.brand_voice_adjectives?.length,
      profile.non_negotiables?.length,
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  if (showWizard) {
    return (
      <BusinessProfileWizard 
        existingProfile={profile} 
        onComplete={() => {
          setShowWizard(false);
          loadProfile();
        }} 
      />
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-lg text-center p-8">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Business Profile Yet</h2>
          <p className="text-muted-foreground mb-6">
            Set up your business profile so the AI can adapt to your standards, 
            voice, and methodology.
          </p>
          <Button onClick={() => setShowWizard(true)} size="lg">
            <Sparkles className="h-4 w-4 mr-2" />
            Create Business Profile
          </Button>
        </Card>
      </div>
    );
  }

  const completionScore = getCompletionScore();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            {profile.business_name}
          </h1>
          {profile.tagline && (
            <p className="text-lg text-muted-foreground mt-1">{profile.tagline}</p>
          )}
        </div>
        <Button onClick={() => setShowWizard(true)} variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Completion Score */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                completionScore >= 80 ? 'bg-green-500/20 text-green-500' :
                completionScore >= 50 ? 'bg-yellow-500/20 text-yellow-500' :
                'bg-red-500/20 text-red-500'
              }`}>
                {completionScore >= 80 ? <CheckCircle2 className="h-6 w-6" /> :
                 completionScore >= 50 ? <AlertTriangle className="h-6 w-6" /> :
                 <XCircle className="h-6 w-6" />}
              </div>
              <div>
                <p className="font-semibold">Profile Completion: {completionScore}%</p>
                <p className="text-sm text-muted-foreground">
                  {completionScore >= 80 ? 'Your AI is fully configured' :
                   completionScore >= 50 ? 'Add more details for better AI adaptation' :
                   'Complete your profile to unlock full AI capabilities'}
                </p>
              </div>
            </div>
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  completionScore >= 80 ? 'bg-green-500' :
                  completionScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${completionScore}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="avatar">Avatar</TabsTrigger>
          <TabsTrigger value="offer">Offer & Pricing</TabsTrigger>
          <TabsTrigger value="sales">Sales & Voice</TabsTrigger>
          <TabsTrigger value="ai">AI Configuration</TabsTrigger>
          <TabsTrigger value="standards">Standards</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Business Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Business
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Industry</span>
                    <p className="font-medium capitalize">{profile.industry || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Model</span>
                    <p className="font-medium capitalize">{profile.business_model?.replace(/_/g, ' ') || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Founder Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Founder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Name</span>
                    <p className="font-medium">{profile.founder_name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Title</span>
                    <p className="font-medium">{profile.founder_title || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Experience</span>
                    <p className="font-medium">{profile.years_in_industry ? `${profile.years_in_industry} years` : '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Floor</span>
                    <span className="font-medium">{formatCurrency(profile.price_floor)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Anchor</span>
                    <span className="font-medium text-primary">{formatCurrency(profile.price_anchor)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Ceiling</span>
                    <span className="font-medium">{formatCurrency(profile.price_ceiling)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Agent Card */}
          <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                {profile.ai_agent_name || 'AI Agent'}
              </CardTitle>
              <CardDescription>
                Role: {profile.ai_agent_role || 'Business Partner'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile.ai_agent_positioning && (
                <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground">
                  "{profile.ai_agent_positioning}"
                </blockquote>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="avatar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {profile.avatar_name || 'Target Avatar'}
              </CardTitle>
              <CardDescription>{profile.avatar_description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <Users className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Revenue Range</p>
                  <p className="font-semibold">
                    {formatCurrency(profile.avatar_income_floor)} - {formatCurrency(profile.avatar_income_ceiling)}/month
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2 text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Pain Points
                  </h4>
                  <div className="space-y-1">
                    {profile.avatar_pain_points?.map((pain, i) => (
                      <Badge key={i} variant="outline" className="block w-full justify-start text-red-600 border-red-200">
                        {pain}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-green-500 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Desires
                  </h4>
                  <div className="space-y-1">
                    {profile.avatar_desires?.map((desire, i) => (
                      <Badge key={i} variant="outline" className="block w-full justify-start text-green-600 border-green-200">
                        {desire}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-orange-500 flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    Anti-Desires
                  </h4>
                  <div className="space-y-1">
                    {profile.avatar_anti_desires?.map((anti, i) => (
                      <Badge key={i} variant="outline" className="block w-full justify-start text-orange-600 border-orange-200">
                        {anti}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                {profile.flagship_offer_name || 'Flagship Offer'}
              </CardTitle>
              <CardDescription>{profile.flagship_offer_description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">{formatCurrency(profile.flagship_offer_price)}</p>
                  <p className="text-sm text-muted-foreground">Price</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{profile.flagship_offer_duration || '-'}</p>
                  <p className="text-sm text-muted-foreground">Duration</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold capitalize">{profile.pricing_philosophy?.replace(/_/g, ' ') || '-'}</p>
                  <p className="text-sm text-muted-foreground">Pricing Philosophy</p>
                </div>
              </div>

              {profile.flagship_offer_deliverables && profile.flagship_offer_deliverables.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Deliverables</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {profile.flagship_offer_deliverables.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Sales Philosophy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Sales Style</span>
                  <Badge variant="secondary" className="capitalize">
                    {profile.sales_style?.replace(/_/g, ' ') || '-'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Objection Handling</span>
                  <Badge variant="secondary" className="capitalize">
                    {profile.objection_handling?.replace(/_/g, ' ') || '-'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Discount Policy</span>
                  <Badge variant={profile.discount_policy === 'never' ? 'destructive' : 'secondary'} className="capitalize">
                    {profile.discount_policy?.replace(/_/g, ' ') || '-'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Brand Voice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-xs text-muted-foreground">Content Style</span>
                  <p className="font-medium capitalize">{profile.content_style || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Voice Adjectives</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profile.brand_voice_adjectives?.map((adj, i) => (
                      <Badge key={i} variant="outline" className="text-green-600 border-green-200">
                        {adj}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Words to Avoid</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profile.brand_voice_avoid?.map((word, i) => (
                      <Badge key={i} variant="outline" className="text-red-600 border-red-200">
                        {word}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card className="bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI Agent Configuration
              </CardTitle>
              <CardDescription>
                How your AI assistant presents itself and adapts to your business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-background/50 rounded-lg">
                  <span className="text-xs text-muted-foreground">Agent Name</span>
                  <p className="text-xl font-bold">{profile.ai_agent_name || 'Business Intelligence'}</p>
                </div>
                <div className="p-4 bg-background/50 rounded-lg">
                  <span className="text-xs text-muted-foreground">Agent Role</span>
                  <p className="text-xl font-bold">{profile.ai_agent_role || 'Business Partner'}</p>
                </div>
              </div>
              
              {profile.ai_agent_positioning && (
                <div className="p-4 bg-background/50 rounded-lg">
                  <span className="text-xs text-muted-foreground">Positioning Statement</span>
                  <blockquote className="mt-2 border-l-2 border-primary pl-4 italic text-lg">
                    "{profile.ai_agent_positioning}"
                  </blockquote>
                </div>
              )}

              <div className="p-4 border border-dashed rounded-lg">
                <h4 className="font-medium mb-2">How Your AI Adapts:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Pre-qualifies leads against your avatar criteria
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Enforces your pricing policy (no unauthorized discounts)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Flags content that violates your brand voice
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Protects your non-negotiables
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="standards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Shield className="h-5 w-5" />
                  Non-Negotiables
                </CardTitle>
                <CardDescription>Your red lines - things you will NEVER do</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {profile.non_negotiables?.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-destructive/5 rounded border border-destructive/10">
                      <XCircle className="h-4 w-4 text-destructive mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                  {(!profile.non_negotiables || profile.non_negotiables.length === 0) && (
                    <p className="text-sm text-muted-foreground">No non-negotiables defined yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Quality Standards
                </CardTitle>
                <CardDescription>Minimum requirements for clients/work</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {profile.quality_standards?.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-green-500/5 rounded border border-green-500/10">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                  {(!profile.quality_standards || profile.quality_standards.length === 0) && (
                    <p className="text-sm text-muted-foreground">No quality standards defined yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {profile.methodology_name && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {profile.methodology_name}
                </CardTitle>
                <CardDescription>Your structured framework</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.methodology_stages?.map((stage, i) => (
                    <Badge key={i} variant="outline" className="text-base py-1 px-3">
                      {typeof stage === 'string' ? stage : stage.name || JSON.stringify(stage)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BusinessProfileDashboard;
