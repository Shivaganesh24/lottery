
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCcw, Sparkles, Trophy, Users } from 'lucide-react';
import { generatePrizeCharityDescription } from '@/ai/flows/admin-prize-charity-description-generator';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function AdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const usersQuery = useMemoFirebase(() => query(collection(db, 'users')), [db]);
  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);

  const drawsQuery = useMemoFirebase(() => query(collection(db, 'draws')), [db]);
  const { data: draws, isLoading: drawsLoading } = useCollection(drawsQuery);

  const [winningNumbers, setWinningNumbers] = useState<number[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecutingDraw, setIsExecutingDraw] = useState(false);
  const [aiOutput, setAiOutput] = useState<string>('');
  
  const [prizeForm, setPrizeForm] = useState({
    name: '',
    value: '',
    features: ''
  });

  const handleRunDraw = async () => {
    if (!users || users.length === 0) return;
    
    setIsExecutingDraw(true);
    const newWinningNumbers = Array.from({ length: 5 }, () => Math.floor(Math.random() * 45) + 1);
    setWinningNumbers(newWinningNumbers);

    try {
      const batch = writeBatch(db);
      const drawId = `draw-${Date.now()}`;
      
      // Record the draw
      const drawRef = doc(db, 'draws', drawId);
      batch.set(drawRef, {
        id: drawId,
        drawIdentifier: `Draw-${new Date().toISOString().split('T')[0]}`,
        drawMonth: new Date().getMonth() + 1,
        drawYear: new Date().getFullYear(),
        drawDate: serverTimestamp(),
        winningNumbers: newWinningNumbers,
        status: 'completed',
        prizeDescription: prizeForm.name || 'Monthly Prize Draw',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Process winners (mock logic for MVP)
      users.forEach(user => {
        if (user.last5Scores && user.last5Scores.length === 5) {
          const matches = user.last5Scores.filter((s: number) => newWinningNumbers.includes(s)).length;
          let prize = 0;
          if (matches === 3) prize = 50;
          if (matches === 4) prize = 500;
          if (matches === 5) prize = 5000;

          if (prize > 0) {
            const userRef = doc(db, 'users', user.id);
            batch.update(userRef, {
              totalWinnings: increment(prize),
              updatedAt: serverTimestamp(),
            });

            const winningRef = doc(collection(db, `users/${user.id}/winnings`));
            batch.set(winningRef, {
              id: winningRef.id,
              userId: user.id,
              drawId: drawId,
              prizeId: 'monthly-prize',
              matchCount: matches,
              winningScores: user.last5Scores.filter((s: number) => newWinningNumbers.includes(s)),
              claimStatus: 'pending',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        }
      });

      await batch.commit();
      toast({
        title: 'Draw Completed!',
        description: `Winning numbers: ${newWinningNumbers.join(', ')}`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Draw Failed',
        description: error.message,
      });
    } finally {
      setIsExecutingDraw(false);
    }
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
          <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>Return to Dashboard</Button>
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
                  <CardDescription>Generate new winning numbers and update winnings.</CardDescription>
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
                  <Button 
                    className="w-full bg-accent hover:bg-accent/90" 
                    onClick={handleRunDraw}
                    disabled={isExecutingDraw || usersLoading}
                  >
                    <RefreshCcw className={`mr-2 h-4 w-4 ${isExecutingDraw ? 'animate-spin' : ''}`} /> 
                    {isExecutingDraw ? 'Processing...' : 'Execute Draw'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Recent Draws</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {draws?.slice(0, 3).map((draw) => (
                      <div key={draw.id} className="flex justify-between items-center py-2 border-b last:border-0">
                        <span className="text-sm font-medium">{draw.drawIdentifier}</span>
                        <div className="flex gap-1">
                          {draw.winningNumbers.map((n: number, i: number) => (
                            <Badge key={i} variant="outline" className="text-[10px] px-1">{n}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                    {(!draws || draws.length === 0) && <p className="text-sm text-muted-foreground italic">No draws recorded yet.</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Platform Users</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Latest Scores</TableHead>
                      <TableHead>Winnings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-bold">{user.firstName} {user.lastName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {user.last5Scores?.map((s: number, i: number) => (
                              <Badge key={i} variant="secondary" className="text-[10px]">{s}</Badge>
                            ))}
                            {(!user.last5Scores || user.last5Scores.length === 0) && <span className="text-xs text-muted-foreground">No scores</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-primary font-bold">${user.totalWinnings || 0}</TableCell>
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
