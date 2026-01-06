import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Award, 
  CheckCircle2, 
  Shield,
  Star,
  TrendingUp,
  Users,
  Clock,
  FileText,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';

interface Certification {
  id: string;
  type: 'consultant' | 'agency' | 'operator';
  level: 'certified' | 'advanced' | 'master';
  performanceScore: number;
  auditPassed: boolean;
  issuedAt: Date | null;
  expiresAt: Date | null;
  status: 'pending' | 'active' | 'expired';
  requirements: { name: string; completed: boolean; score?: number }[];
}

export function CertificationEngine() {
  const [certifications, setCertifications] = useState<Certification[]>([
    {
      id: '1',
      type: 'consultant',
      level: 'advanced',
      performanceScore: 87,
      auditPassed: true,
      issuedAt: new Date(Date.now() - 86400000 * 180),
      expiresAt: new Date(Date.now() + 86400000 * 185),
      status: 'active',
      requirements: [
        { name: 'Complete 10 client engagements', completed: true, score: 100 },
        { name: 'Maintain 80%+ close rate', completed: true, score: 87 },
        { name: 'Pass compliance audit', completed: true },
        { name: 'Client satisfaction 4.5+', completed: true, score: 4.8 }
      ]
    },
    {
      id: '2',
      type: 'agency',
      level: 'certified',
      performanceScore: 72,
      auditPassed: false,
      issuedAt: null,
      expiresAt: null,
      status: 'pending',
      requirements: [
        { name: 'Onboard 5 sub-clients', completed: true, score: 100 },
        { name: 'Maintain 70%+ retention', completed: true, score: 85 },
        { name: 'Pass compliance audit', completed: false },
        { name: 'Complete training modules', completed: true }
      ]
    }
  ]);

  const stats = {
    activeCertifications: 1,
    pendingAudits: 1,
    totalCertified: 847,
    avgPerformanceScore: 82,
    renewalFee: 199
  };

  const getLevelColor = (level: Certification['level']) => {
    switch (level) {
      case 'certified': return 'bg-blue-500/20 text-blue-400';
      case 'advanced': return 'bg-purple-500/20 text-purple-400';
      case 'master': return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  const getStatusColor = (status: Certification['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'expired': return 'bg-red-500/20 text-red-400';
    }
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Award className="w-6 h-6" />
            Certification & Verification Engine
          </h1>
          <p className="text-muted-foreground">Build trust through verified performance and compliance</p>
        </div>
        <Button className="bg-primary">
          <Award className="w-4 h-4 mr-2" />
          Start New Certification
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <Award className="w-5 h-5 mx-auto mb-1 text-green-400" />
            <div className="text-2xl font-bold text-green-400">{stats.activeCertifications}</div>
            <div className="text-xs text-muted-foreground">Active Certifications</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
            <div className="text-2xl font-bold">{stats.pendingAudits}</div>
            <div className="text-xs text-muted-foreground">Pending Audits</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-blue-400" />
            <div className="text-2xl font-bold">{stats.totalCertified}</div>
            <div className="text-xs text-muted-foreground">Total Certified</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{stats.avgPerformanceScore}%</div>
            <div className="text-xs text-muted-foreground">Avg Performance</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="certifications" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="certifications">My Certifications</TabsTrigger>
          <TabsTrigger value="available">Available Programs</TabsTrigger>
          <TabsTrigger value="verification">Public Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="certifications" className="space-y-4">
          {certifications.map((cert) => (
            <Card key={cert.id} className="bg-card/50 border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Award className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg capitalize">{cert.type} Certification</h3>
                        <div className="flex items-center gap-2">
                          <Badge className={getLevelColor(cert.level)}>{cert.level}</Badge>
                          <Badge className={getStatusColor(cert.status)}>{cert.status}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">{cert.performanceScore}%</div>
                    <div className="text-sm text-muted-foreground">Performance Score</div>
                  </div>
                </div>

                {/* Requirements */}
                <div className="space-y-3 mb-6">
                  <h4 className="font-medium text-sm text-muted-foreground">Requirements</h4>
                  {cert.requirements.map((req, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        {req.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        )}
                        <span className={req.completed ? '' : 'text-muted-foreground'}>{req.name}</span>
                      </div>
                      {req.score !== undefined && (
                        <Badge variant="outline">{req.score}%</Badge>
                      )}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="text-sm text-muted-foreground">
                    {cert.issuedAt && (
                      <span>Issued: {new Date(cert.issuedAt).toLocaleDateString()}</span>
                    )}
                    {cert.expiresAt && (
                      <span className="ml-4">Expires: {new Date(cert.expiresAt).toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {cert.status === 'active' && (
                      <>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-1" />
                          Download Badge
                        </Button>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Share Profile
                        </Button>
                      </>
                    )}
                    {cert.status === 'pending' && (
                      <Button size="sm" className="bg-primary">
                        <Shield className="w-4 h-4 mr-1" />
                        Schedule Audit
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                type: 'Consultant',
                description: 'For individual consultants and coaches',
                levels: ['Certified', 'Advanced', 'Master'],
                requirements: '10+ engagements, 80%+ satisfaction',
                fee: 199
              },
              {
                type: 'Agency',
                description: 'For agencies managing multiple clients',
                levels: ['Certified', 'Premier', 'Elite'],
                requirements: '5+ clients, 70%+ retention',
                fee: 499
              },
              {
                type: 'Operator',
                description: 'For in-house operators using the platform',
                levels: ['Certified', 'Expert'],
                requirements: '90 days usage, training complete',
                fee: 99
              }
            ].map((program, idx) => (
              <Card key={idx} className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    {program.type}
                  </CardTitle>
                  <CardDescription>{program.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Levels</div>
                    <div className="flex flex-wrap gap-1">
                      {program.levels.map((level, lidx) => (
                        <Badge key={lidx} variant="outline">{level}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Requirements</div>
                    <div className="text-sm">{program.requirements}</div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <span className="font-bold">${program.fee}/year</span>
                    <Button size="sm">Apply Now</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Public Verification Page
              </CardTitle>
              <CardDescription>
                Allow clients to verify your certifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium">Your Verification Link</span>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-background rounded text-sm">
                    https://verify.alphavision.ai/c/ABC123XYZ
                  </code>
                  <Button variant="outline" size="sm">Copy</Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Profile Views</div>
                  <div className="text-2xl font-bold">247</div>
                  <div className="text-xs text-green-400">+12% this month</div>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Trust Score</div>
                  <div className="text-2xl font-bold flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400" />
                    4.9/5.0
                  </div>
                  <div className="text-xs text-muted-foreground">Based on 23 reviews</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CertificationEngine;
