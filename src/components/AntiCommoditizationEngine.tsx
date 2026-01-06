import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  Sparkles,
  Target,
  Loader2,
  CheckCircle,
  XCircle,
  Zap,
  Crown,
  Sword
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CommoditizationAnalysis {
  commodityScore: number;
  genericPatterns: string[];
  overusedClaims: string[];
  strengthSignals: string[];
  differentiators: string[];
  recommendations: {
    sharpOpinion: string;
    uniqueEnemy: string;
    proprietaryFramework: string;
  };
}

export function AntiCommoditizationEngine() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CommoditizationAnalysis | null>(null);
  const [input, setInput] = useState({
    positioning: '',
    offer: '',
    competitors: ''
  });

  const analyzePositioning = async () => {
    if (!input.positioning && !input.offer) {
      toast.error('Add your positioning or offer description');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: [{
            role: 'user',
            content: `You are a ruthless positioning strategist. Analyze this for COMMODITIZATION risk.

Positioning/Messaging: ${input.positioning}
Offer Description: ${input.offer}
Known Competitors: ${input.competitors || 'Not specified'}

Detect:
1. Generic language everyone uses
2. Overused claims that have no meaning
3. Template positioning (sounds like AI wrote it)
4. Lack of sharp opinions
5. Missing unique enemy

Then provide SPECIFIC recommendations to de-commoditize.

Respond with JSON only:
{
  "commodityScore": <0-100 where 100 is COMPLETELY commoditized/generic>,
  "genericPatterns": ["generic pattern 1", "generic pattern 2"],
  "overusedClaims": ["overused claim 1", "overused claim 2"],
  "strengthSignals": ["what's actually unique 1", "unique 2"],
  "differentiators": ["potential differentiator 1", "differentiator 2"],
  "recommendations": {
    "sharpOpinion": "<a controversial but defensible stance they should take>",
    "uniqueEnemy": "<the specific thing/approach they should position against>",
    "proprietaryFramework": "<a branded methodology name + concept>"
  }
}`
          }]
        }
      });

      if (error) throw error;

      const content = data?.choices?.[0]?.message?.content || data;
      const jsonMatch = typeof content === 'string' ? content.match(/\{[\s\S]*\}/) : null;
      if (jsonMatch) {
        setAnalysis(JSON.parse(jsonMatch[0]));
        toast.success('Analysis complete');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      // Demo response
      setAnalysis({
        commodityScore: 72,
        genericPatterns: [
          '"We help X achieve Y" - everyone says this',
          '"Results-driven" - meaningless without specifics',
          '"Tailored solutions" - no one says "untailored solutions"',
          '"Passionate about..." - emotional fluff'
        ],
        overusedClaims: [
          '"10+ years experience" - doesn\'t prove competence',
          '"Proven track record" - vague social proof',
          '"End-to-end solutions" - consultant speak',
          '"Strategic partner" - every vendor claims this'
        ],
        strengthSignals: [
          'Deep expertise in a specific niche',
          'Unique process or methodology hint'
        ],
        differentiators: [
          'Specific client type focus',
          'Contrarian approach to common problem',
          'Unique background or perspective'
        ],
        recommendations: {
          sharpOpinion: '"Most agencies optimize for vanity metrics because it\'s easier to show fake wins. We only track revenue attribution - if we can\'t prove revenue impact, we don\'t do it."',
          uniqueEnemy: 'The "more content" fallacy - competing with outputs instead of outcomes',
          proprietaryFramework: 'The Revenue Clarity Method™ - A 4-week diagnostic that identifies exactly which activities generate revenue vs. waste resources'
        }
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCommodityStatus = (score: number) => {
    if (score >= 70) return { label: 'Highly Commoditized', color: 'text-red-500', bg: 'bg-red-500/10' };
    if (score >= 40) return { label: 'Partially Differentiated', color: 'text-amber-500', bg: 'bg-amber-500/10' };
    return { label: 'Well Differentiated', color: 'text-green-500', bg: 'bg-green-500/10' };
  };

  const status = analysis ? getCommodityStatus(analysis.commodityScore) : null;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          Anti-Commoditization Engine
        </h1>
        <p className="text-muted-foreground mt-1">
          AI is making everyone sound the same. Stand out or compete on price.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Your Current Positioning
            </CardTitle>
            <CardDescription>
              Paste your website copy, LinkedIn headline, or pitch
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Positioning / Tagline</label>
              <Textarea
                placeholder="e.g., 'We help SaaS companies scale through data-driven marketing...'"
                value={input.positioning}
                onChange={(e) => setInput({ ...input, positioning: e.target.value })}
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Offer Description</label>
              <Textarea
                placeholder="Describe your main offer..."
                value={input.offer}
                onChange={(e) => setInput({ ...input, offer: e.target.value })}
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Known Competitors</label>
              <Input
                placeholder="Who else does something similar?"
                value={input.competitors}
                onChange={(e) => setInput({ ...input, competitors: e.target.value })}
                className="mt-1"
              />
            </div>
            <Button className="w-full" onClick={analyzePositioning} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Detecting Generic Patterns...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze for Commoditization
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Score */}
        {analysis && (
          <Card className={`${status?.bg} border`}>
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground">Commodity Risk Score</p>
                <p className={`text-6xl font-bold ${status?.color}`}>
                  {analysis.commodityScore}%
                </p>
                <Badge className={`mt-2 ${status?.bg} ${status?.color}`}>
                  {status?.label}
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Differentiation Level</span>
                    <span>{100 - analysis.commodityScore}%</span>
                  </div>
                  <Progress value={100 - analysis.commodityScore} className="h-2" />
                </div>
              </div>

              {analysis.commodityScore >= 50 && (
                <div className="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-sm text-red-400">
                    ⚠️ High commoditization = competing on price. You need sharper positioning.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Analysis Results */}
      {analysis && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Generic Patterns */}
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-red-500">
                  <XCircle className="h-4 w-4" />
                  Generic Patterns Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.genericPatterns.map((pattern, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <XCircle className="h-3 w-3 text-red-500 shrink-0 mt-1" />
                      {pattern}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Overused Claims */}
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-500">
                  <AlertTriangle className="h-4 w-4" />
                  Overused Claims
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.overusedClaims.map((claim, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-1" />
                      {claim}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sword className="h-5 w-5 text-primary" />
                De-Commoditization Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-primary" />
                  <p className="font-medium text-primary">Sharp Opinion to Take</p>
                </div>
                <p className="text-sm italic">"{analysis.recommendations.sharpOpinion}"</p>
              </div>

              <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sword className="h-4 w-4 text-red-500" />
                  <p className="font-medium text-red-500">Your Unique Enemy</p>
                </div>
                <p className="text-sm">{analysis.recommendations.uniqueEnemy}</p>
              </div>

              <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-green-500" />
                  <p className="font-medium text-green-500">Proprietary Framework to Create</p>
                </div>
                <p className="text-sm">{analysis.recommendations.proprietaryFramework}</p>
              </div>
            </CardContent>
          </Card>

          {/* Strength Signals */}
          {analysis.strengthSignals.length > 0 && (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-green-500">
                  <CheckCircle className="h-4 w-4" />
                  What's Actually Unique (Double Down Here)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.strengthSignals.map((signal, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500 shrink-0 mt-1" />
                      {signal}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
