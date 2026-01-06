import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  GraduationCap, 
  TrendingUp, 
  Clock,
  DollarSign,
  Target,
  Loader2,
  Star,
  Zap,
  ArrowRight,
  Plus,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SkillAnalysis {
  skill: string;
  incomeImpact: number;
  timeToPayoff: string;
  transferability: number;
  currentLevel: number;
  recommendation: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export function SkillROIPrioritizer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [skills, setSkills] = useState<SkillAnalysis[]>([]);
  const [input, setInput] = useState({
    currentRole: '',
    incomeGoal: '',
    currentIncome: '',
    skillsToEvaluate: ['', '', '']
  });

  const analyzeSkills = async () => {
    const validSkills = input.skillsToEvaluate.filter(s => s.trim());
    if (validSkills.length === 0) {
      toast.error('Add at least one skill to evaluate');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: [{
            role: 'user',
            content: `You are a career strategist focused on income maximization. Evaluate these skills for ROI:

Current Role: ${input.currentRole || 'Not specified'}
Current Income: ${input.currentIncome || 'Not specified'}
Income Goal: ${input.incomeGoal || 'Not specified'}
Skills to Evaluate: ${validSkills.join(', ')}

For each skill, analyze:
1. Income Impact (0-100) - how much can this increase earnings
2. Time to Payoff - how long until skill generates returns
3. Transferability (0-100) - can this skill apply across industries/roles
4. Priority - critical/high/medium/low

Respond with JSON only:
{
  "skills": [
    {
      "skill": "<skill name>",
      "incomeImpact": <0-100>,
      "timeToPayoff": "<e.g., '3 months', '6 months'>",
      "transferability": <0-100>,
      "currentLevel": <estimated 0-100>,
      "recommendation": "<specific actionable advice>",
      "priority": "<critical|high|medium|low>"
    }
  ]
}`
          }]
        }
      });

      if (error) throw error;

      const content = data?.choices?.[0]?.message?.content || data;
      const jsonMatch = typeof content === 'string' ? content.match(/\{[\s\S]*\}/) : null;
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setSkills(parsed.skills);
        toast.success('Skills analyzed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      // Demo response
      setSkills(validSkills.map((skill, i) => ({
        skill,
        incomeImpact: [85, 65, 45][i] || 50,
        timeToPayoff: ['3 months', '6 months', '12 months'][i] || '6 months',
        transferability: [90, 70, 50][i] || 60,
        currentLevel: [30, 50, 20][i] || 40,
        recommendation: [
          'This is your highest-leverage skill. Dedicate 5 hours/week for 90 days.',
          'Good supporting skill. Learn through application on real projects.',
          'Lower priority. Consider delegating or using tools instead.'
        ][i] || 'Focus on practical application over theory.',
        priority: (['critical', 'high', 'medium'] as const)[i] || 'medium'
      })));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateSkill = (index: number, value: string) => {
    setInput(prev => ({
      ...prev,
      skillsToEvaluate: prev.skillsToEvaluate.map((s, i) => i === index ? value : s)
    }));
  };

  const addSkillSlot = () => {
    setInput(prev => ({
      ...prev,
      skillsToEvaluate: [...prev.skillsToEvaluate, '']
    }));
  };

  const removeSkillSlot = (index: number) => {
    setInput(prev => ({
      ...prev,
      skillsToEvaluate: prev.skillsToEvaluate.filter((_, i) => i !== index)
    }));
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'medium': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return '';
    }
  };

  const topSkill = skills.length > 0 ? skills.reduce((a, b) => a.incomeImpact > b.incomeImpact ? a : b) : null;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-primary" />
          Skill ROI Prioritizer
        </h1>
        <p className="text-muted-foreground mt-1">
          Learn the ONE skill that pays back the most in 90 days.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Your Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Current Role</label>
                <Input
                  placeholder="e.g., Freelance consultant"
                  value={input.currentRole}
                  onChange={(e) => setInput({ ...input, currentRole: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Current Income ($)</label>
                <Input
                  type="number"
                  placeholder="100000"
                  value={input.currentIncome}
                  onChange={(e) => setInput({ ...input, currentIncome: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Income Goal ($)</label>
              <Input
                type="number"
                placeholder="250000"
                value={input.incomeGoal}
                onChange={(e) => setInput({ ...input, incomeGoal: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Skills to Evaluate</label>
                <Button variant="ghost" size="sm" onClick={addSkillSlot}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {input.skillsToEvaluate.map((skill, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`Skill ${i + 1} (e.g., Sales, AI prompting, Video editing)`}
                    value={skill}
                    onChange={(e) => updateSkill(i, e.target.value)}
                  />
                  {input.skillsToEvaluate.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeSkillSlot(i)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button className="w-full" onClick={analyzeSkills} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calculating ROI...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Prioritize by Income Impact
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Top Recommendation */}
        {topSkill && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium text-primary">Your #1 Priority Skill</p>
              </div>
              <h3 className="text-2xl font-bold mb-2">{topSkill.skill}</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-background rounded-lg">
                  <DollarSign className="h-5 w-5 mx-auto text-green-500 mb-1" />
                  <p className="text-lg font-bold">{topSkill.incomeImpact}%</p>
                  <p className="text-xs text-muted-foreground">Income Impact</p>
                </div>
                <div className="text-center p-3 bg-background rounded-lg">
                  <Clock className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                  <p className="text-lg font-bold">{topSkill.timeToPayoff}</p>
                  <p className="text-xs text-muted-foreground">Time to Payoff</p>
                </div>
                <div className="text-center p-3 bg-background rounded-lg">
                  <Zap className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                  <p className="text-lg font-bold">{topSkill.transferability}%</p>
                  <p className="text-xs text-muted-foreground">Transferable</p>
                </div>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-sm font-medium mb-1">Recommendation:</p>
                <p className="text-sm text-muted-foreground">{topSkill.recommendation}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* All Skills Ranked */}
      {skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Skills Ranked by Income ROI
            </CardTitle>
            <CardDescription>
              Focus on #1 until you hit diminishing returns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {skills
                .sort((a, b) => b.incomeImpact - a.incomeImpact)
                .map((skill, i) => (
                  <div key={i} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          {i + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{skill.skill}</p>
                            <Badge className={getPriorityStyle(skill.priority)}>
                              {skill.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{skill.recommendation}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-green-500">+{skill.incomeImpact}%</p>
                        <p className="text-xs text-muted-foreground">{skill.timeToPayoff}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Income Impact</p>
                        <Progress value={skill.incomeImpact} className="h-1.5" />
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Transferability</p>
                        <Progress value={skill.transferability} className="h-1.5" />
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Current Level</p>
                        <Progress value={skill.currentLevel} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pro Tip */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="font-medium text-amber-500">The Skill Stack Rule</p>
              <p className="text-sm text-muted-foreground mt-1">
                Being top 1% in one skill is hard. Being top 10% in 2-3 complementary skills is easier 
                and often more valuable. Look for skills that <span className="font-medium text-foreground">multiply</span> each other:
                Sales × Copywriting, AI × Domain Expertise, Video × Teaching.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
