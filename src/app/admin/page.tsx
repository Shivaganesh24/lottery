'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCcw, Sparkles, Send, Users, Trophy, Heart } from 'lucide-react';
import { generatePrizeCharityDescription } from '@/ai/flows/admin-prize-charity-description-generator';
import { db } from '@/lib/mock-db';

export default function AdminPage() {
  const [winningNumbers, setWinningNumbers] = useState<number[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiOutput, setAiOutput] = useState<string>('');
  
  // Prize generator form state
  const [prizeForm, setPrizeForm] = useState({
    name: '',
    value: '',
    features: ''
  });

  const handleRunDraw = () => {
    const result = db.runDraw();
    setWinningNumbers(result);
  };

  const handleGenerateAiDescription = async () => {
    if (!prizeForm.name || !prizeForm.value) return;
    setIsGenerating(true);
    try {
      const result = await generatePrizeCharityDescription({
        contentType: 'prize',
        prizeName: prizeForm.name,
        value: prizeForm.value,
        keyFeatures: prizeForm.features.split(',').map(f => f.trim())
      });
      setAiOutput(result.description);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Control Center</h1>
            <p className="text-muted-foreground">Manage FairwayFortune draws and platform content.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>Return to Dashboard</Button>
            <Button className="bg-primary hover:bg-primary/90">System Health</Button>
          </div>
        </header>

        <Tabs defaultValue="draws" className="space-y-6">
          <TabsList className="bg-white border p-1 h-auto grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="draws" className="py-2">Draw Management</TabsTrigger>
            <TabsTrigger value="users" className="py-2">User Directory</TabsTrigger>
            <TabsTrigger value="ai-tools" className="py-2">Content AI</TabsTrigger>
          </TabsList>

          <TabsContent value="draws" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Run Monthly Draw</CardTitle>
                  <CardDescription>Generate new winning numbers and calculate prize matches.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-center gap-3">
                    {winningNumbers ? (
                      winningNumbers.map((n, i) => (
                        <div key={i} className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg animate-in zoom-in-50 duration-300">
                          {n}
                        </div>
                      ))
                    ) : (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="w-12 h-12 rounded-full bg-secondary border-2 border-dashed flex items-center justify-center text-muted-foreground font-bold text-lg">
                          ?
                        </div>
                      ))
                    )}
                  </div>
                  <Button className="w-full bg-accent hover:bg-accent/90" onClick={handleRunDraw}>
                    <RefreshCcw className="mr-2 h-4 w-4" /> Execute Draw
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Winner Statistics</CardTitle>
                  <CardDescription>Recent payout data and match frequency.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">Total Winners</span>
                      <span className="font-bold">{db.winners.length}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">Total Payouts</span>
                      <span className="font-bold text-primary">${db.winners.reduce((acc, w) => acc + w.prize, 0)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm">Active Subscriptions</span>
                      <span className="font-bold">1</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Recent Winners</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Matches</TableHead>
                      <TableHead>Prize</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {db.winners.length > 0 ? db.winners.map((winner, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{winner.userId}</TableCell>
                        <TableCell>{winner.matches} Matches</TableCell>
                        <TableCell className="text-accent font-bold">${winner.prize}</TableCell>
                        <TableCell><Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Verified</Badge></TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No recent winners found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Manage Platform Users</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.values(db.users).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-bold">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.isSubscribed ? "default" : "secondary"}>
                            {user.isSubscribed ? user.plan : 'None'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-tools" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    Prize Content Generator
                  </CardTitle>
                  <CardDescription>Use AI to create compelling marketing copy for monthly prizes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prize-name">Prize Name</Label>
                    <Input 
                      id="prize-name" 
                      placeholder="e.g. Taylormade Stealth 2 Driver" 
                      value={prizeForm.name}
                      onChange={(e) => setPrizeForm({...prizeForm, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prize-value">Estimated Value</Label>
                    <Input 
                      id="prize-value" 
                      placeholder="e.g. $599" 
                      value={prizeForm.value}
                      onChange={(e) => setPrizeForm({...prizeForm, value: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prize-features">Key Features (comma separated)</Label>
                    <Input 
                      id="prize-features" 
                      placeholder="Carbon face, high MOI, fast ball speed" 
                      value={prizeForm.features}
                      onChange={(e) => setPrizeForm({...prizeForm, features: e.target.value})}
                    />
                  </div>
                  <Button 
                    className="w-full bg-primary" 
                    onClick={handleGenerateAiDescription}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Description'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-accent/20">
                <CardHeader>
                  <CardTitle>AI Output</CardTitle>
                </CardHeader>
                <CardContent>
                  {aiOutput ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-secondary/30 text-sm leading-relaxed whitespace-pre-wrap">
                        {aiOutput}
                      </div>
                      <Button variant="outline" className="w-full" onClick={() => setAiOutput('')}>Clear</Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                      <Sparkles className="h-10 w-10 mb-4 opacity-20" />
                      <p className="text-sm">Generated content will appear here.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}