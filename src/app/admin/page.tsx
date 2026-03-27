'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  RefreshCcw, Sparkles, AlertCircle, Loader2, UserPlus, 
  CheckCircle, XCircle, DollarSign, Users, Trophy, 
  Heart, BarChart3, Settings2, Trash2, Edit, Save, Play, Eye, Plus
} from 'lucide-react';
import { generatePrizeCharityDescription } from '@/ai/flows/admin-prize-charity-description-generator';
import { 
  useFirestore, useCollection, useDoc, useUser, 
  useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking 
} from '@/firebase';
import { 
  collection, doc, query, writeBatch, increment, 
  serverTimestamp, setDoc, collectionGroup, orderBy 
} from 'firebase/firestore';
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

  // Data Collections
  const usersQuery = useMemoFirebase(() => (isAdmin ? query(collection(db, 'users')) : null), [db, isAdmin]);
  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);

  const drawsQuery = useMemoFirebase(() => (isAdmin ? query(collection(db, 'draws'), orderBy('drawDate', 'desc')) : null), [db, isAdmin]);
  const { data: draws, isLoading: drawsLoading } = useCollection(drawsQuery);

  const charitiesQuery = useMemoFirebase(() => (isAdmin ? query(collection(db, 'charities')) : null), [db, isAdmin]);
  const { data: charities, isLoading: charitiesLoading } = useCollection(charitiesQuery);

  const winningsQuery = useMemoFirebase(() => (isAdmin ? query(collectionGroup(db, 'winnings')) : null), [db, isAdmin]);
  const { data: allWinnings, isLoading: winningsLoading } = useCollection(winningsQuery);

  // UI States
  const [isExecutingDraw, setIsExecutingDraw] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any[] | null>(null);
  const [drawLogic, setDrawLogic] = useState<'random' | 'algo'>('random');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiOutput, setAiOutput] = useState<string>('');
  
  // Form States
  const [prizeForm, setPrizeForm] = useState({ name: '', value: '', features: '' });
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editScores, setEditScores] = useState<string>('');
  const [selectedCharity, setSelectedCharity] = useState<any>(null);
  const [isCharityDialogOpen, setIsCharityDialogOpen] = useState(false);
  const [isUserEditDialogOpen, setIsUserEditDialogOpen] = useState(false);

  // Analytics Calculations
  const analytics = useMemo(() => {
    if (!users || !draws || !charities) return { totalUsers: 0, activePool: 0, charityTotal: 0, totalPrizes: 0 };
    const totalUsers = users.length;
    const activeSubscribers = users.filter(u => u.status === 'active').length;
    const activePool = activeSubscribers * 19;
    const totalPrizes = draws.reduce((acc, d) => acc + (d.totalPrizePool || 0), 0);
    const charityTotal = draws.reduce((acc, d) => acc + (d.totalCharityContribution || 0), 0);
    return { totalUsers, activePool, charityTotal, totalPrizes };
  }, [users, draws, charities]);

  const runDrawLogic = (isFinal: boolean) => {
    if (!users || users.length === 0) return;
    
    if (isFinal) setIsExecutingDraw(true);
    else setIsSimulating(true);

    const winningNumbers = Array.from({ length: 5 }, () => Math.floor(Math.random() * 45) + 1);
    const results: any[] = [];
    const activeUsers = users.filter(u => u.status === 'active');
    const totalPool = activeUsers.length * 19;
    const charityPool = totalPool * 0.10;
    const prizePool = totalPool - charityPool;

    activeUsers.forEach(u => {
      if (u.last5Scores && u.last5Scores.length > 0) {
        const matchedScores = u.last5Scores.filter((s: any) => winningNumbers.includes(typeof s === 'object' ? s.value : s));
        const matches = matchedScores.length;
        
        let prize = 0;
        if (matches === 3) prize = Math.max(50, prizePool * 0.25 / 10);
        if (matches === 4) prize = Math.max(500, prizePool * 0.35 / 5);
        if (matches === 5) prize = Math.max(5000, prizePool * 0.40);

        if (prize > 0) {
          results.push({ user: u, matches, prize: Math.round(prize), matchedScores });
        }
      }
    });

    if (isFinal) {
      const batch = writeBatch(db);
      const drawId = `draw-${Date.now()}`;
      const drawRef = doc(db, 'draws', drawId);

      batch.set(drawRef, {
        id: drawId,
        drawIdentifier: `Draw-${new Date().toISOString().split('T')[0]}`,
        drawMonth: new Date().getMonth() + 1,
        drawYear: new Date().getFullYear(),
        drawDate: serverTimestamp(),
        winningNumbers: winningNumbers,
        status: 'completed',
        totalPrizePool: prizePool,
        totalCharityContribution: charityPool,
        logic: drawLogic,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      results.forEach(res => {
        const winningRef = doc(collection(db, `users/${res.user.id}/winnings`));
        batch.set(winningRef, {
          id: winningRef.id,
          userId: res.user.id,
          userName: `${res.user.firstName} ${res.user.lastName}`,
          drawId: drawId,
          matchCount: res.matches,
          winningScores: res.matchedScores,
          prizeAmount: res.prize,
          claimStatus: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        batch.update(doc(db, 'users', res.user.id), {
          totalWinnings: increment(res.prize),
          updatedAt: serverTimestamp(),
        });
      });

      batch.commit().then(() => {
        toast({ title: 'Draw Published!', description: `Results are live. Pool: $${Math.round(prizePool)}` });
        setIsExecutingDraw(false);
      });
    } else {
      setSimulationResults(results);
      setIsSimulating(false);
    }
  };

  const handleCharityAction = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const charityData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      websiteUrl: formData.get('websiteUrl') as string,
      category: formData.get('category') as string,
      isActive: true,
      updatedAt: serverTimestamp(),
    };

    try {
      if (selectedCharity) {
        updateDocumentNonBlocking(doc(db, 'charities', selectedCharity.id), charityData);
        toast({ title: 'Charity Updated' });
      } else {
        const newRef = doc(collection(db, 'charities'));
        setDoc(newRef, { ...charityData, id: newRef.id, totalAmountReceived: 0, createdAt: serverTimestamp() });
        toast({ title: 'Charity Created' });
      }
      setIsCharityDialogOpen(false);
      setSelectedCharity(null);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Action Failed', description: err.message });
    }
  };

  const handleUpdateScores = () => {
    if (!selectedUser) return;
    const scoresArray = editScores.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s));
    const formattedScores = scoresArray.map(val => ({ value: val, date: new Date().toISOString() }));
    
    updateDocumentNonBlocking(doc(db, 'users', selectedUser.id), {
      last5Scores: formattedScores.slice(-5),
      updatedAt: serverTimestamp()
    });
    
    toast({ title: 'Scores Updated', description: `Modified scores for ${selectedUser.firstName}` });
    setIsUserEditDialogOpen(false);
  };

  if (!mounted || isAdminChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Verifying administrative access...</p>
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
            <CardTitle>Restricted Area</CardTitle>
            <CardDescription>Authentication verified, but administrative role missing.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button className="w-full bg-primary" onClick={() => {
              if (user) {
                setDoc(doc(db, 'admin_users', user.uid), { uid: user.uid, email: user.email, promotedAt: serverTimestamp() });
                toast({ title: 'Admin permissions granted. Reloading...' });
                setTimeout(() => window.location.reload(), 1500);
              }
            }}>Promote to Admin (Dev Only)</Button>
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
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">FairwayFortune Console</h1>
            <p className="text-muted-foreground">Comprehensive platform management and analytics.</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">User Dashboard</Button>
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2"><Users className="h-4 w-4" /> Total Users</CardDescription>
              <CardTitle className="text-2xl">{analytics.totalUsers}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Active Monthly Pool</CardDescription>
              <CardTitle className="text-2xl text-primary">${analytics.activePool}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2"><Heart className="h-4 w-4" /> Charity Contribution</CardDescription>
              <CardTitle className="text-2xl text-accent">${Math.round(analytics.charityTotal)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2"><Trophy className="h-4 w-4" /> Total Prizes Paid</CardDescription>
              <CardTitle className="text-2xl text-primary">${analytics.totalPrizes}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="draws" className="space-y-6">
          <TabsList className="bg-white border p-1 h-auto grid grid-cols-6 w-full max-w-2xl">
            <TabsTrigger value="draws">Draws</TabsTrigger>
            <TabsTrigger value="winners">Winners</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="charities">Charities</TabsTrigger>
            <TabsTrigger value="ai">AI Copilot</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="draws" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Execute Monthly Draw</CardTitle>
                  <CardDescription>Configure logic and run simulations before publishing results.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl">
                    <Settings2 className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-bold">Draw Logic</p>
                      <p className="text-xs text-muted-foreground">Select how numbers are generated.</p>
                    </div>
                    <select 
                      className="bg-transparent text-sm font-medium focus:outline-none"
                      value={drawLogic}
                      onChange={(e: any) => setDrawLogic(e.target.value)}
                    >
                      <option value="random">True Random</option>
                      <option value="algo">Weighted Algorithm</option>
                    </select>
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1" onClick={() => runDrawLogic(false)} disabled={isSimulating}>
                      {isSimulating ? <Loader2 className="animate-spin mr-2" /> : <Eye className="mr-2" />}
                      Run Simulation
                    </Button>
                    <Button className="flex-1 bg-accent hover:bg-accent/90" onClick={() => runDrawLogic(true)} disabled={isExecutingDraw}>
                      {isExecutingDraw ? <Loader2 className="animate-spin mr-2" /> : <Play className="mr-2" />}
                      Publish Final Draw
                    </Button>
                  </div>

                  {simulationResults && (
                    <div className="mt-4 p-4 border rounded-xl bg-background space-y-2 animate-in fade-in duration-300">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-bold">Simulation results</p>
                        <Badge variant="outline">{simulationResults.length} potential winners</Badge>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Matches</TableHead>
                            <TableHead className="text-right">Prize</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {simulationResults.slice(0, 3).map((res, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs">{res.user.firstName} {res.user.lastName}</TableCell>
                              <TableCell className="text-xs">{res.matches}</TableCell>
                              <TableCell className="text-xs text-right font-bold">${res.prize}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[400px] overflow-auto">
                    {draws?.map((draw) => (
                      <div key={draw.id} className="p-4 border-b last:border-0 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold">{draw.drawIdentifier}</span>
                          <Badge variant="secondary" className="text-[10px]">{draw.logic}</Badge>
                        </div>
                        <div className="flex gap-1">
                          {draw.winningNumbers.map((n: number, i: number) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                              {n}
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground">Pool: ${Math.round(draw.totalPrizePool)} | Charity: ${Math.round(draw.totalCharityContribution)}</p>
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
                <CardTitle>Verification Queue</CardTitle>
                <CardDescription>Verify performance evidence and manage payouts.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Proof Link</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Verification</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {winningsLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                    ) : allWinnings?.filter(w => w.claimStatus !== 'paid').map((win) => (
                      <TableRow key={win.id}>
                        <TableCell className="font-medium text-xs">{win.userName}</TableCell>
                        <TableCell className="font-bold text-primary">${win.prizeAmount}</TableCell>
                        <TableCell className="text-[10px] max-w-[120px] truncate text-primary hover:underline">
                          <a href={win.proofUrl} target="_blank" rel="noreferrer">{win.proofUrl || 'Awaiting...'}</a>
                        </TableCell>
                        <TableCell><Badge variant={win.claimStatus === 'pending' ? 'outline' : 'default'} className="text-[10px]">{win.claimStatus}</Badge></TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 px-2"
                            onClick={() => {
                              const ref = doc(db, `users/${win.userId}/winnings`, win.id);
                              updateDocumentNonBlocking(ref, { 
                                claimStatus: win.claimStatus === 'pending' ? 'verified' : 'paid',
                                updatedAt: serverTimestamp() 
                              });
                              toast({ title: 'Status Updated' });
                            }}
                          >
                            {win.claimStatus === 'pending' ? <CheckCircle className="h-4 w-4 text-accent" /> : <DollarSign className="h-4 w-4 text-primary" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => {
                            const ref = doc(db, `users/${win.userId}/winnings`, win.id);
                            updateDocumentNonBlocking(ref, { claimStatus: 'rejected', updatedAt: serverTimestamp() });
                            toast({ title: 'Claim Rejected' });
                          }}>
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Platform Directory</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last 5 Scores</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                    ) : users?.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="space-y-1">
                          <p className="text-sm font-bold leading-none">{u.firstName} {u.lastName}</p>
                          <p className="text-[10px] text-muted-foreground">{u.email}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                            {u.status || 'inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {u.last5Scores?.map((s: any, i: number) => (
                              <Badge key={i} variant="outline" className="text-[10px] px-1">{typeof s === 'object' ? s.value : s}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog open={isUserEditDialogOpen && selectedUser?.id === u.id} onOpenChange={(open) => {
                            setIsUserEditDialogOpen(open);
                            if (open) {
                              setSelectedUser(u);
                              setEditScores(u.last5Scores?.map((s: any) => typeof s === 'object' ? s.value : s).join(', ') || '');
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => {
                                setSelectedUser(u);
                                setEditScores(u.last5Scores?.map((s: any) => typeof s === 'object' ? s.value : s).join(', ') || '');
                                setIsUserEditDialogOpen(true);
                              }}><Edit className="h-4 w-4" /></Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Profile: {u.firstName}</DialogTitle>
                                <DialogDescription>Manage user subscription and override golf scores.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Subscription Status</Label>
                                  <select 
                                    className="w-full p-2 border rounded-md text-sm bg-background"
                                    defaultValue={u.status}
                                    onChange={(e) => updateDocumentNonBlocking(doc(db, 'users', u.id), { status: e.target.value })}
                                  >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Override Scores (Last 5)</Label>
                                  <p className="text-[10px] text-muted-foreground mb-2">Manual score adjustments for verification fixes. Enter comma-separated numbers (1-45).</p>
                                  <div className="flex gap-2">
                                    <Input 
                                      placeholder="e.g. 36, 34, 32" 
                                      className="text-xs" 
                                      value={editScores}
                                      onChange={(e) => setEditScores(e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsUserEditDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleUpdateScores}>Update User</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charities" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Foundation Registry</h2>
              <Dialog open={isCharityDialogOpen} onOpenChange={setIsCharityDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setSelectedCharity(null)} className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" /> Add Charity
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{selectedCharity ? 'Edit Foundation' : 'New Foundation'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCharityAction} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Charity Name</Label>
                      <Input id="name" name="name" defaultValue={selectedCharity?.name} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input id="category" name="category" defaultValue={selectedCharity?.category} placeholder="e.g. Youth, Environment" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Mission Description</Label>
                      <Textarea id="description" name="description" defaultValue={selectedCharity?.description} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="websiteUrl">Website URL</Label>
                      <Input id="websiteUrl" name="websiteUrl" defaultValue={selectedCharity?.websiteUrl} placeholder="https://..." />
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full bg-primary">{selectedCharity ? 'Update Foundation' : 'Create Foundation'}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {charities?.map((charity) => (
                <Card key={charity.id} className="bg-white shadow-sm border-none overflow-hidden group">
                  <div className="p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="secondary" className="mb-2 text-[10px]">{charity.category}</Badge>
                        <CardTitle className="text-lg">{charity.name}</CardTitle>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setSelectedCharity(charity);
                          setIsCharityDialogOpen(true);
                        }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => {
                          if (confirm('Delete this charity?')) {
                            deleteDocumentNonBlocking(doc(db, 'charities', charity.id));
                            toast({ title: 'Charity Removed' });
                          }
                        }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{charity.description}</p>
                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="text-[10px] font-bold text-primary">Total Recv: ${charity.totalAmountReceived || 0}</span>
                      <a href={charity.websiteUrl} target="_blank" rel="noreferrer" className="text-[10px] text-accent font-bold hover:underline">Official Site</a>
                    </div>
                  </div>
                </Card>
              ))}
              {charities?.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl text-muted-foreground">
                  No charities found. Add your first foundation to start donations.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> Marketing Copilot</CardTitle>
                  <CardDescription>Generate engaging descriptions for platform content.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Content Type</Label>
                    <select className="w-full p-2 border rounded-md text-sm bg-background">
                      <option value="prize">Monthly Prize</option>
                      <option value="charity">Charity Initiative</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Key Highlights</Label>
                    <Textarea 
                      placeholder="Enter key features or mission points..." 
                      value={prizeForm.features}
                      onChange={(e) => setPrizeForm({...prizeForm, features: e.target.value})}
                    />
                  </div>
                  <Button 
                    className="w-full bg-primary" 
                    onClick={async () => {
                      setIsGenerating(true);
                      try {
                        const res = await generatePrizeCharityDescription({
                          contentType: 'prize',
                          prizeName: 'Next Draw Prize',
                          value: '$1,000',
                          keyFeatures: prizeForm.features.split(',')
                        });
                        setAiOutput(res.description);
                      } finally {
                        setIsGenerating(false);
                      }
                    }} 
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Compose Copy'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/10">
                <CardHeader><CardTitle className="text-sm">Generated Content</CardTitle></CardHeader>
                <CardContent>
                  {aiOutput ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-white rounded-xl text-xs leading-relaxed italic">{aiOutput}</div>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setAiOutput('')}>Clear</Button>
                    </div>
                  ) : (
                    <div className="py-20 text-center text-muted-foreground opacity-30">
                      <Sparkles className="h-10 w-10 mx-auto mb-2" />
                      <p className="text-xs">Results appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Historical trends and contribution stats.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-sm font-bold">Contribution Efficiency</p>
                    <div className="h-4 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: '10%' }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Charity (10%)</span>
                      <span>Operational (90%)</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-bold">Payout Health</p>
                    <div className="h-4 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '85%' }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Paid (85%)</span>
                      <span>Pending Verification (15%)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <h4 className="text-sm font-bold mb-4">Latest Draw Stats</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Draw ID</TableHead>
                        <TableHead>Pool</TableHead>
                        <TableHead>Winners</TableHead>
                        <TableHead className="text-right">Impact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {draws?.slice(0, 5).map(d => (
                        <TableRow key={d.id}>
                          <TableCell className="text-xs">{d.drawIdentifier}</TableCell>
                          <TableCell className="text-xs font-bold text-primary">${Math.round(d.totalPrizePool)}</TableCell>
                          <TableCell className="text-xs">{(allWinnings?.filter(w => w.drawId === d.id).length) || 0}</TableCell>
                          <TableCell className="text-xs text-right text-accent font-bold">${Math.round(d.totalCharityContribution)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}