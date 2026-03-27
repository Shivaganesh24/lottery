'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCcw, Sparkles, AlertCircle, Loader2, UserPlus, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { generatePrizeCharityDescription } from '@/ai/flows/admin-prize-charity-description-generator';
import { useFirestore, useCollection, useDoc, useUser, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, writeBatch, increment, serverTimestamp, setDoc, collectionGroup } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function AdminPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const adminDocRef = useMemoFirebase(() => (user ? doc(db, 'admin_users', user.uid) : null), [db, user]);
  const { data: adminProfile, isLoading: isAdminChecking } = useDoc(adminDocRef);
  const isAdmin = !!adminProfile;

  const usersQuery = useMemoFirebase(() => (isAdmin ? query(collection(db, 'users')) : null), [db, isAdmin]);
  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);

  const drawsQuery = useMemoFirebase(() => (isAdmin ? query(collection(db, 'draws')) : null), [db, isAdmin]);
  const { data: draws, isLoading: drawsLoading } = useCollection(drawsQuery);

  const winningsQuery = useMemoFirebase(() => (isAdmin ? query(collectionGroup(db, 'winnings')) : null), [db, isAdmin]);
  const { data: allWinnings, isLoading: winningsLoading } = useCollection(winningsQuery);

  const [winningNumbers, setWinningNumbers] = useState<number[] | null>(null);
  const [isExecutingDraw, setIsExecutingDraw] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
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
      
      // Calculate prize pool based on active subscribers ($19/mo per user)
      const activeUsers = users.filter(u => u.status === 'active');
      const totalPool = activeUsers.length * 19;
      const charityPool = totalPool * 0.10;
      const prizePool = totalPool - charityPool;

      const drawRef = doc(db, 'draws', drawId);
      batch.set(drawRef, {
        id: drawId,
        drawIdentifier: `Draw-${new Date().toISOString().split('T')[0]}`,
        drawMonth: new Date().getMonth() + 1,
        drawYear: new Date().getFullYear(),
        drawDate: serverTimestamp(),
        winningNumbers: newWinningNumbers,
        status: 'completed',
        totalPrizePool: prizePool,
        totalCharityContribution: charityPool,
        prizeDescription: prizeForm.name || 'Monthly Prize Draw',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      activeUsers.forEach(u => {
        if (u.last5Scores && u.last5Scores.length === 5) {
          const matchedScores = u.last5Scores.filter((s: any) => newWinningNumbers.includes(typeof s === 'object' ? s.value : s));
          const matches = matchedScores.length;
          
          let prize = 0;
          // Logic based on PRD: 5 Match (40%), 4 Match (35%), 3 Match (25%)
          // For prototype, we use tiered values based on the pool or fixed if pool is small
          if (matches === 3) prize = Math.max(50, prizePool * 0.25 / 10); // Simulated split
          if (matches === 4) prize = Math.max(500, prizePool * 0.35 / 5);
          if (matches === 5) prize = Math.max(5000, prizePool * 0.40);

          if (prize > 0) {
            const userRef = doc(db, 'users', u.id);
            batch.update(userRef, {
              totalWinnings: increment(prize),
              updatedAt: serverTimestamp(),
            });

            const winningRef = doc(collection(db, `users/${u.id}/winnings`));
            batch.set(winningRef, {
              id: winningRef.id,
              userId: u.id,
              userName: `${u.firstName} ${u.lastName}`,
              drawId: drawId,
              matchCount: matches,
              winningScores: matchedScores,
              prizeAmount: Math.round(prize),
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
        description: `Winning numbers: ${newWinningNumbers.join(', ')}. Pool: $${Math.round(prizePool)}`,
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

  const handleVerifyWinning = (win: any, approved: boolean) => {
    const winningRef = doc(db, `users/${win.userId}/winnings`, win.id);
    updateDocumentNonBlocking(winningRef, {
      claimStatus: approved ? 'verified' : 'rejected',
      paymentStatus: approved ? 'paid' : 'none',
      verificationDate: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    toast({ title: approved ? 'Winner Verified & Paid' : 'Winner Rejected' });
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

  const handlePromoteToAdmin = async () => {
    if (!user) return;
    setIsPromoting(true);
    try {
      await setDoc(doc(db, 'admin_users', user.uid), {
        uid: user.uid,
        email: user.email,
        promotedAt: serverTimestamp(),
      });
      toast({ title: 'Admin Access Granted' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Promotion Failed', description: error.message });
    } finally {
      setIsPromoting(false);
    }
  };

  if (!mounted || isAdminChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Verifying credentials...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full shadow-lg border-destructive/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have administrative privileges to access this area.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 justify-center">
            <Button className="w-full bg-primary" onClick={handlePromoteToAdmin} disabled={isPromoting}>
              {isPromoting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Promote Myself to Admin (Dev Only)
            </Button>
            <Link href="/dashboard" className="w-full">
              <Button variant="outline" className="w-full">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Control Center</h1>
            <p className="text-muted-foreground">Manage FairwayFortune draws and platform content.</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Return to Dashboard</Button>
          </Link>
        </header>

        <Tabs defaultValue="draws" className="space-y-6">
          <TabsList className="bg-white border p-1 h-auto grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="draws" className="py-2">Draws</TabsTrigger>
            <TabsTrigger value="winners" className="py-2">Winners</TabsTrigger>
            <TabsTrigger value="users" className="py-2">Users</TabsTrigger>
            <TabsTrigger value="ai-tools" className="py-2">AI Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="draws" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Run Monthly Draw</CardTitle>
                  <CardDescription>Generate new winning numbers and calculate prize splits.</CardDescription>
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
                  <Button className="w-full bg-accent hover:bg-accent/90" onClick={handleRunDraw} disabled={isExecutingDraw || usersLoading}>
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
                    {drawsLoading ? (
                      <div className="flex justify-center py-4"><Loader2 className="animate-spin" /></div>
                    ) : draws?.slice(0, 5).map((draw) => (
                      <div key={draw.id} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div className="space-y-1">
                          <span className="text-sm font-medium block">{draw.drawIdentifier}</span>
                          <span className="text-xs text-muted-foreground">Pool: ${Math.round(draw.totalPrizePool || 0)}</span>
                        </div>
                        <div className="flex gap-1">
                          {draw.winningNumbers.map((n: number, i: number) => (
                            <Badge key={i} variant="outline" className="text-[10px] px-1">{n}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="winners">
            <Card>
              <CardHeader>
                <CardTitle>Prize Verification</CardTitle>
                <CardDescription>Verify proof and update payout status.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Proof</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {winningsLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                    ) : allWinnings?.filter(w => w.claimStatus !== 'verified' && w.claimStatus !== 'rejected').map((win) => (
                      <TableRow key={win.id}>
                        <TableCell className="font-medium">{win.userName || 'Unknown User'}</TableCell>
                        <TableCell className="font-bold text-primary">${win.prizeAmount || 0}</TableCell>
                        <TableCell className="text-xs truncate max-w-[150px] text-primary underline">{win.proofUrl || 'No proof yet'}</TableCell>
                        <TableCell><Badge>{win.claimStatus}</Badge></TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleVerifyWinning(win, true)} disabled={win.claimStatus === 'pending'}>
                            <CheckCircle className="h-4 w-4 text-accent" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleVerifyWinning(win, false)} disabled={win.claimStatus === 'pending'}>
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {allWinnings?.filter(w => w.claimStatus !== 'verified' && w.claimStatus !== 'rejected').length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No pending claims found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Platform Directory</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Latest Scores</TableHead>
                      <TableHead>Total Winnings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                    ) : users?.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-bold">{u.firstName} {u.lastName}</TableCell>
                        <TableCell>
                          <Badge variant={u.status === 'active' ? 'default' : 'secondary'}>{u.status || 'inactive'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {u.last5Scores?.map((s: any, i: number) => (
                              <Badge key={i} variant="outline" className="text-[10px]">{typeof s === 'object' ? s.value : s}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-primary font-bold">${u.totalWinnings || 0}</TableCell>
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
                    <Input id="prize-name" placeholder="e.g. Taylormade Stealth 2 Driver" value={prizeForm.name} onChange={(e) => setPrizeForm({...prizeForm, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prize-value">Estimated Value</Label>
                    <Input id="prize-value" placeholder="e.g. $599" value={prizeForm.value} onChange={(e) => setPrizeForm({...prizeForm, value: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prize-features">Key Features (comma separated)</Label>
                    <Input id="prize-features" placeholder="Carbon face, high MOI, fast ball speed" value={prizeForm.features} onChange={(e) => setPrizeForm({...prizeForm, features: e.target.value})} />
                  </div>
                  <Button className="w-full bg-primary" onClick={handleGenerateAiDescription} disabled={isGenerating}>
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
                      <div className="p-4 rounded-lg bg-secondary/30 text-sm leading-relaxed whitespace-pre-wrap">{aiOutput}</div>
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
