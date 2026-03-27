'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Trophy, Calendar, CreditCard, ChevronRight, Heart, Plus, LogOut, ShieldCheck, Lock, Upload, CheckCircle2, Clock } from 'lucide-react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp, collection, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userRef = useMemoFirebase(() => (user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userRef);

  const winningsQuery = useMemoFirebase(() => (user ? query(collection(db, `users/${user.uid}/winnings`)) : null), [db, user]);
  const { data: userWinnings } = useCollection(winningsQuery);

  const charityRef = useMemoFirebase(() => (userProfile?.preferredCharityId ? doc(db, 'charities', userProfile.preferredCharityId) : null), [db, userProfile?.preferredCharityId]);
  const { data: selectedCharity } = useDoc(charityRef);

  const adminDocRef = useMemoFirebase(() => (user ? doc(db, 'admin_users', user.uid) : null), [db, user]);
  const { data: adminProfile } = useDoc(adminDocRef);
  const isAdmin = !!adminProfile;

  const [newScore, setNewScore] = useState<string>('');
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);
  const [claimProof, setClaimProof] = useState<string>('');
  const [activeWinningId, setActiveWinningId] = useState<string | null>(null);

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router, mounted]);

  const handleLogScore = () => {
    const scoreVal = parseInt(newScore);
    if (isNaN(scoreVal) || scoreVal < 1 || scoreVal > 45 || !userRef || !userProfile) return;

    if (userProfile.role !== 'admin' && userProfile.status !== 'active') {
      toast({
        variant: 'destructive',
        title: 'Subscription Required',
        description: 'Please activate your subscription to log scores.',
      });
      return;
    }

    const currentScores = userProfile.last5Scores || [];
    const updatedScores = [...currentScores, scoreVal];
    if (updatedScores.length > 5) {
      updatedScores.shift();
    }

    updateDocumentNonBlocking(userRef, {
      last5Scores: updatedScores,
      updatedAt: serverTimestamp(),
    });

    setNewScore('');
    setIsScoreDialogOpen(false);
    toast({ title: 'Score Logged', description: `Score ${scoreVal} added to your round history.` });
  };

  const handleClaimWinning = (winningId: string) => {
    if (!user || !winningId || !claimProof) return;
    
    const winningRef = doc(db, `users/${user.uid}/winnings`, winningId);
    updateDocumentNonBlocking(winningRef, {
      claimStatus: 'claimed',
      claimDate: serverTimestamp(),
      proofUrl: claimProof,
      updatedAt: serverTimestamp(),
    });

    setClaimProof('');
    setActiveWinningId(null);
    toast({ title: 'Claim Submitted', description: 'Your claim is now pending administrator verification.' });
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const handleSubscribe = () => {
    if (!userRef) return;
    updateDocumentNonBlocking(userRef, {
      status: 'active',
      role: 'user',
      updatedAt: serverTimestamp(),
    });
    toast({ title: 'Subscription Active', description: 'Welcome to the Monthly Pro plan!' });
  };

  if (!mounted || isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-bold">Loading your fairway...</div>
      </div>
    );
  }

  if (!userProfile) return null;

  const latestScores = userProfile.last5Scores || [];
  const isSubscribed = userProfile.status === 'active';

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-white border-b px-6 h-16 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">FF</div>
          <span className="text-xl font-bold tracking-tight text-primary">FairwayFortune</span>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Link href="/admin">
              <Button variant="outline" size="sm" className="hidden sm:flex border-accent text-accent hover:bg-accent/10">
                <ShieldCheck className="mr-2 h-4 w-4" /> Admin Portal
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary font-bold">
            {userProfile.firstName?.[0]}{userProfile.lastName?.[0]}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {userProfile.firstName}</h1>
            <p className="text-muted-foreground">
              {isSubscribed ? 'You are currently entered in the Monthly Draw.' : 'Activate your subscription to enter the next draw.'}
            </p>
          </div>
          <div className="flex gap-3">
            <Dialog open={isScoreDialogOpen} onOpenChange={setIsScoreDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90" disabled={!isSubscribed}>
                  <Plus className="mr-2 h-4 w-4" /> Log New Score
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log Stableford Score</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="score">Score Received (1-45)</Label>
                    <Input 
                      id="score" 
                      type="number" 
                      min="1"
                      max="45"
                      placeholder="e.g. 36" 
                      value={newScore}
                      onChange={(e) => setNewScore(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Stableford points from your latest round. Newest replaces oldest (max 5).</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsScoreDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleLogScore}>Submit Score</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {!isSubscribed && (
          <Card className="bg-primary/5 border-primary/20 shadow-none">
            <CardContent className="flex flex-col md:flex-row items-center justify-between p-6 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Features Locked</h3>
                  <p className="text-muted-foreground text-sm">Join the FairwayFortune community to turn your scores into rewards.</p>
                </div>
              </div>
              <Button onClick={handleSubscribe} className="bg-primary hover:bg-primary/90 px-8">Activate Pro Membership</Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 shadow-sm border-none bg-white relative overflow-hidden">
            {!isSubscribed && <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex items-center justify-center" />}
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Last 5 Scores</CardTitle>
                <CardDescription>Your qualifying scores for the next monthly draw.</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-accent/10 text-accent hover:bg-accent/20">
                Stableford Format
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-40">
                {latestScores.map((score: number, i: number) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div 
                      className="w-full bg-primary/10 rounded-t-md transition-all group-hover:bg-primary/20 relative" 
                      style={{ height: `${(score / 45) * 100}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-white text-xs px-2 py-1 rounded">
                        {score}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">Rd {i + 1}</span>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 5 - latestScores.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-secondary/30 h-8 rounded-t-md border-2 border-dashed border-muted" />
                    <span className="text-xs text-muted-foreground font-medium italic">Pending</span>
                  </div>
                ))}
              </div>
              {latestScores.length < 5 && isSubscribed && (
                <div className="mt-6 p-4 rounded-lg bg-secondary/50 border border-dashed text-center">
                  <p className="text-sm text-muted-foreground">You need {5 - latestScores.length} more scores to qualify for the next draw.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className={`shadow-sm border-none ${isSubscribed ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground opacity-70'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  Subscription
                  <CreditCard className="h-5 w-5 opacity-70" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-90">Plan Status</span>
                  <Badge className={isSubscribed ? "bg-white text-primary" : "bg-muted text-muted-foreground"}>
                    {isSubscribed ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-90">Current Plan</span>
                  <span className="font-semibold capitalize">{isSubscribed ? 'Monthly Pro' : 'None'}</span>
                </div>
                {isSubscribed && (
                  <div className="pt-2">
                    <div className="flex justify-between text-xs mb-1 opacity-80">
                      <span>Renewal Date</span>
                      <span>Next Month</span>
                    </div>
                    <Progress value={80} className="h-1 bg-white/20" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-none bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between text-primary">
                  Total Winnings
                  <Trophy className="h-5 w-5 text-accent" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${userProfile.totalWinnings || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Total platform earnings</p>
                <Button variant="ghost" size="sm" className="w-full mt-4 text-primary hover:text-primary/80">
                  View History <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm border-none bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-destructive" />
                Impact Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div>
                    <p className="text-sm font-semibold">{selectedCharity?.name || 'Junior Golf Foundation'}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{selectedCharity?.description || 'Empowering youth through sports and education.'}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/charities">Change</Link>
                  </Button>
                </div>
                <div className="text-center py-4">
                  <span className="text-4xl font-bold text-primary">${((userProfile.totalWinnings || 0) * 0.1).toFixed(2)}</span>
                  <p className="text-sm text-muted-foreground">Total Generated for Charity</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Pending Claims
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userWinnings?.filter(w => w.claimStatus !== 'verified').map((win, i) => (
                  <div key={win.id} className="flex flex-col gap-3 p-3 border rounded-lg bg-background">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold">{win.matchCount} Matches Found!</p>
                        <p className="text-xs text-muted-foreground">Draw ID: {win.drawId}</p>
                      </div>
                      <Badge variant={win.claimStatus === 'claimed' ? 'secondary' : 'outline'}>
                        {win.claimStatus}
                      </Badge>
                    </div>
                    {win.claimStatus === 'pending' && (
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Link to proof (e.g. scorecard URL)" 
                          className="h-8 text-xs" 
                          value={activeWinningId === win.id ? claimProof : ''}
                          onChange={(e) => {
                            setActiveWinningId(win.id);
                            setClaimProof(e.target.value);
                          }}
                        />
                        <Button size="sm" className="h-8" onClick={() => handleClaimWinning(win.id)}>Claim</Button>
                      </div>
                    )}
                  </div>
                ))}
                {(!userWinnings || userWinnings.filter(w => w.claimStatus !== 'verified').length === 0) && (
                  <div className="text-center py-8 text-muted-foreground italic text-sm">
                    No pending prizes to claim.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
