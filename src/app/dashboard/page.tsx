'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Trophy, Calendar, CreditCard, ChevronRight, Heart, Plus, LogOut, ShieldCheck, Lock, Upload, CheckCircle2, Clock, Loader2, Target } from 'lucide-react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp, collection, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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

  const heroImage = PlaceHolderImages.find(img => img.id === 'golf-course-hero');

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router, mounted]);

  const handleLogScore = () => {
    const scoreVal = parseInt(newScore);
    if (isNaN(scoreVal) || scoreVal < 1 || scoreVal > 45 || !userRef || !userProfile) return;

    if (userProfile.status !== 'active') {
      toast({
        variant: 'destructive',
        title: 'Subscription Required',
        description: 'Please activate your subscription to log scores.',
      });
      return;
    }

    const currentScores = userProfile.last5Scores || [];
    const scoreObject = { value: scoreVal, date: new Date().toISOString() };
    const updatedScores = [...currentScores, scoreObject];
    
    if (updatedScores.length > 5) {
      updatedScores.shift();
    }

    updateDocumentNonBlocking(userRef, {
      last5Scores: updatedScores,
      updatedAt: serverTimestamp(),
    });

    setNewScore('');
    setIsScoreDialogOpen(false);
    toast({ title: 'Score Logged', description: `Score ${scoreVal} added with today's date.` });
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
    toast({ title: 'Claim Submitted', description: 'Administrator will verify your proof shortly.' });
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
    toast({ title: 'Subscription Active', description: 'Monthly Pro plan activated!' });
  };

  if (!mounted || isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfile) return null;

  const latestScores = userProfile.last5Scores || [];
  const isSubscribed = userProfile.status === 'active';

  return (
    <div className="min-h-screen bg-background pb-20">
      <nav className="bg-white border-b px-6 h-16 flex items-center justify-between sticky top-0 z-40 shadow-sm">
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
        {/* Hero Section with Image */}
        <div className="relative h-[250px] md:h-[350px] w-full rounded-[2rem] overflow-hidden shadow-2xl mb-10 group">
          {heroImage && (
            <Image 
              src={heroImage.imageUrl} 
              alt={heroImage.description} 
              fill 
              className="object-cover transition-transform duration-700 group-hover:scale-105" 
              priority
              data-ai-hint={heroImage.imageHint}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8 md:p-12 text-white">
            <h1 className="text-3xl md:text-5xl font-bold mb-2">Welcome, {userProfile.firstName}</h1>
            <p className="text-lg opacity-90 max-w-lg">
              {isSubscribed 
                ? "You're all set for the next monthly draw. Keep playing with purpose." 
                : "Join the pro club today and start turning your weekend rounds into major winnings."}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Your Performance</h2>
            <p className="text-muted-foreground text-sm">Track your progress and prize eligibility.</p>
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
                    <p className="text-xs text-muted-foreground">Stableford points from your latest round. Only the 5 most recent rounds are saved.</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsScoreDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleLogScore}>Save Score</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {!isSubscribed && (
          <Card className="bg-primary/5 border-primary/20 shadow-none border-dashed">
            <CardContent className="flex flex-col md:flex-row items-center justify-between p-6 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Subscription Required</h3>
                  <p className="text-muted-foreground text-sm">Activate your membership to unlock score entry and monthly prize eligibility.</p>
                </div>
              </div>
              <Button onClick={handleSubscribe} className="bg-primary hover:bg-primary/90 px-8 h-12 rounded-xl font-bold">Subscribe for $19/mo</Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 shadow-sm border-none bg-white relative overflow-hidden rounded-[2rem]">
            {!isSubscribed && <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex items-center justify-center" />}
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Scores (Top 5)</CardTitle>
                <CardDescription>Qualifying Stableford points for the next draw.</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-accent/10 text-accent">
                Monthly Active
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-40">
                {latestScores.map((s: any, i: number) => {
                  const val = typeof s === 'object' ? s.value : s;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <div 
                        className="w-full bg-primary/10 rounded-t-md transition-all group-hover:bg-primary/20 relative" 
                        style={{ height: `${(val / 45) * 100}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-white text-[10px] px-2 py-1 rounded">
                          {val}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium truncate w-full text-center">
                        {typeof s === 'object' ? new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `Rd ${i+1}`}
                      </span>
                    </div>
                  );
                })}
                {Array.from({ length: Math.max(0, 5 - latestScores.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-secondary/30 h-8 rounded-t-md border-2 border-dashed border-muted" />
                    <span className="text-xs text-muted-foreground font-medium italic">Empty</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className={`shadow-sm border-none rounded-[2rem] ${isSubscribed ? 'bg-primary text-primary-foreground shadow-primary/20 shadow-lg' : 'bg-secondary text-muted-foreground opacity-70'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  Subscription
                  <CreditCard className="h-5 w-5 opacity-70" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-90">Status</span>
                  <Badge className={isSubscribed ? "bg-white text-primary" : "bg-muted text-muted-foreground"}>
                    {isSubscribed ? 'Pro' : 'Inactive'}
                  </Badge>
                </div>
                {isSubscribed && <p className="text-xs opacity-80">Renews automatically next month</p>}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-none bg-white rounded-[2rem]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between text-primary">
                  Total Winnings
                  <Trophy className="h-5 w-5 text-accent" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${userProfile.totalWinnings || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Platform earnings to date</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm border-none bg-white rounded-[2rem]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-destructive" />
                Charity Selection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30">
                  <div>
                    <p className="text-sm font-bold">{selectedCharity?.name || 'Search Foundations'}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">10% of your fee is donated here.</p>
                  </div>
                  <Button variant="outline" size="sm" asChild className="rounded-xl">
                    <Link href="/charities">Change</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none bg-white rounded-[2rem]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Calendar className="h-5 w-5" />
                Active Prize Claims
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userWinnings?.filter(w => w.claimStatus !== 'verified').map((win) => (
                  <div key={win.id} className="flex flex-col gap-3 p-4 border border-secondary rounded-2xl bg-background/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-primary">${win.prizeAmount} Prize Won!</p>
                        <p className="text-[10px] text-muted-foreground">Match count: {win.matchCount}</p>
                      </div>
                      <Badge variant={win.claimStatus === 'claimed' ? 'secondary' : 'outline'} className="rounded-lg">
                        {win.claimStatus}
                      </Badge>
                    </div>
                    {win.claimStatus === 'pending' && (
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Link to score proof" 
                          className="h-9 text-xs bg-white border-none rounded-xl" 
                          value={activeWinningId === win.id ? claimProof : ''}
                          onChange={(e) => {
                            setActiveWinningId(win.id);
                            setClaimProof(e.target.value);
                          }}
                        />
                        <Button size="sm" className="h-9 rounded-xl px-4" onClick={() => handleClaimWinning(win.id)}>Submit</Button>
                      </div>
                    )}
                  </div>
                ))}
                {(!userWinnings || userWinnings.filter(w => w.claimStatus !== 'verified').length === 0) && (
                  <div className="text-center py-10 text-muted-foreground italic text-sm">
                    No active prizes to claim yet. Keep playing!
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
