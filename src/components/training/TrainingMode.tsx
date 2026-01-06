import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  GraduationCap, Play, Phone, MessageSquare, 
  Target, Brain, Trophy, BarChart3, Clock
} from 'lucide-react';

export function TrainingMode() {
  const [activeSimulation, setActiveSimulation] = useState<string | null>(null);

  const simulations = [
    {
      id: 'sales-call',
      title: 'Sales Call Roleplay',
      description: 'Practice handling objections and closing deals',
      icon: Phone,
      difficulty: 'intermediate',
      duration: '15 min',
    },
    {
      id: 'objection-handling',
      title: 'Objection Handling',
      description: 'Master responses to common objections',
      icon: MessageSquare,
      difficulty: 'beginner',
      duration: '10 min',
    },
    {
      id: 'negotiation',
      title: 'Negotiation Practice',
      description: 'Improve your pricing and terms negotiation',
      icon: Target,
      difficulty: 'advanced',
      duration: '20 min',
    },
    {
      id: 'discovery',
      title: 'Discovery Questions',
      description: 'Perfect your qualification questioning',
      icon: Brain,
      difficulty: 'beginner',
      duration: '10 min',
    },
  ];

  const skills = [
    { name: 'Objection Handling', score: 72, trend: 'up' },
    { name: 'Active Listening', score: 85, trend: 'stable' },
    { name: 'Value Articulation', score: 58, trend: 'up' },
    { name: 'Closing Techniques', score: 65, trend: 'down' },
    { name: 'Discovery Questions', score: 80, trend: 'up' },
  ];

  const DIFFICULTY_COLORS = {
    beginner: 'bg-green-500/10 text-green-600',
    intermediate: 'bg-yellow-500/10 text-yellow-600',
    advanced: 'bg-red-500/10 text-red-600',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Training Mode</h1>
          <p className="text-muted-foreground">Practice and improve your operator skills</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Trophy className="h-4 w-4 mr-2" />
          Level 3 Operator
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Target className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">73%</p>
                <p className="text-sm text-muted-foreground">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">4.5h</p>
                <p className="text-sm text-muted-foreground">Practice Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">+15%</p>
                <p className="text-sm text-muted-foreground">Improvement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="simulations">
        <TabsList>
          <TabsTrigger value="simulations">Simulations</TabsTrigger>
          <TabsTrigger value="diagnostics">Skill Diagnostics</TabsTrigger>
          <TabsTrigger value="drills">Practice Drills</TabsTrigger>
        </TabsList>

        <TabsContent value="simulations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {simulations.map((sim) => {
              const Icon = sim.icon;
              return (
                <Card key={sim.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant="outline" className={DIFFICULTY_COLORS[sim.difficulty as keyof typeof DIFFICULTY_COLORS]}>
                        {sim.difficulty}
                      </Badge>
                    </div>
                    <h3 className="font-semibold mb-1">{sim.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{sim.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {sim.duration}
                      </span>
                      <Button size="sm" onClick={() => setActiveSimulation(sim.id)}>
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {activeSimulation && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Simulation in Progress</CardTitle>
                <CardDescription>
                  {simulations.find(s => s.id === activeSimulation)?.title}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 text-center">
                  <Brain className="h-16 w-16 mx-auto mb-4 text-primary animate-pulse" />
                  <p className="text-lg mb-4">AI Training Partner Active</p>
                  <p className="text-muted-foreground mb-6">
                    The simulation would start a voice or chat-based roleplay scenario here
                  </p>
                  <Button variant="outline" onClick={() => setActiveSimulation(null)}>
                    End Simulation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Skill Assessment</CardTitle>
              <CardDescription>Your current operator skill levels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {skills.map((skill) => (
                <div key={skill.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{skill.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{skill.score}%</span>
                      {skill.trend === 'up' && <span className="text-green-500 text-xs">↑</span>}
                      {skill.trend === 'down' && <span className="text-red-500 text-xs">↓</span>}
                    </div>
                  </div>
                  <Progress value={skill.score} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommended Focus Areas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <h4 className="font-semibold text-yellow-700">Value Articulation (58%)</h4>
                <p className="text-sm text-muted-foreground">
                  Practice explaining your unique value proposition more clearly
                </p>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <h4 className="font-semibold text-orange-700">Closing Techniques (65%)</h4>
                <p className="text-sm text-muted-foreground">
                  Work on transition phrases and assumptive closing techniques
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drills" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Price Objection Response', reps: '10 reps', time: '5 min' },
              { title: 'Opening Hook Practice', reps: '8 reps', time: '4 min' },
              { title: 'Qualification Questions', reps: '12 reps', time: '6 min' },
              { title: 'Value Statement Drill', reps: '10 reps', time: '5 min' },
              { title: 'Closing Line Practice', reps: '8 reps', time: '4 min' },
              { title: 'Urgency Creation', reps: '6 reps', time: '3 min' },
            ].map((drill) => (
              <Card key={drill.title} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">{drill.title}</h4>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{drill.reps}</span>
                    <span>{drill.time}</span>
                  </div>
                  <Button size="sm" className="w-full mt-3">
                    <Play className="h-4 w-4 mr-1" />
                    Start Drill
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}