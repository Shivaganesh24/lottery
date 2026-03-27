
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Calendar, CreditCard, ChevronRight, History, Heart, Plus } from 'lucide-react';
import { db } from '@/lib/mock-db';

export default function Dashboard() {
  const [user, setUser] = useState(db.users['user-1']);
  const [newScore, setNewScore] = useState<string>('');
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);
  const [isCharityDialogOpen, setIsCharityDialogOpen] = useState(false);

  const latestScores = user.scores;
  const charity = db.charities.find(c => c.id === user.charityId);

  const handleLogScore = () => {
    const scoreVal = parseInt(newScore);
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 60) return;

    db.addScore(user.id, scoreVal);
    setUser({ ...db.users[user.id] });
    setNewScore('');
    setIsScoreDialogOpen(false);
  };

  const handleChangeCharity = (charityId: string) => {
    const updatedUser = { ...user, charityId };
    db.users[user.id] = updatedUser;
    setUser(updatedUser);
    setIsCharityDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-white border-b px-6 h-16 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">FF</div>
          <span className="text-xl font-bold tracking-tight text-primary">FairwayFortune</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="sm">Admin Portal</Button>
          </Link>
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary font-bold">AP</div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user.name}</h1>
            <p className="text-muted-foreground">You are currently entered in the March Draw.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="hidden sm:flex">
              <History className="mr-2 h-4 w-4" /> Participation History
            </Button>
            
            <Dialog open={isScoreDialogOpen} onOpenChange={setIsScoreDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90">
                  <Plus className="mr-2 h-4 w-4" /> Log New Score
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log Stableford Score</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="score">Score Received</Label>
                    <Input 
                      id="score" 
                      type="number" 
                      placeholder="e.g. 36" 
                      value={newScore}
                      onChange={(e) => setNewScore(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Stableford points from your latest round.</p>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 shadow-sm border-none bg-white">
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
                {latestScores.map((score, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div 
                      className="w-full bg-primary/10 rounded-t-md transition-all group-hover:bg-primary/20 relative" 
                      style={{ height: `${(score / 50) * 100}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-white text-xs px-2 py-1 rounded">
                        {score}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">Round {i + 1}</span>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 5 - latestScores.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-secondary/30 h-8 rounded-t-md border-2 border-dashed border-muted" />
                    <span className="text-xs text-muted-foreground font-medium italic">Pending</span>
                  </div>
                ))}
              </div>
              {latestScores.length < 5 && (
                <div className="mt-6 p-4 rounded-lg bg-secondary/50 border border-dashed text-center">
                  <p className="text-sm text-muted-foreground">You need {5 - latestScores.length} more scores to qualify for the next draw.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-sm border-none bg-primary text-primary-foreground">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  Subscription
                  <CreditCard className="h-5 w-5 opacity-70" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-90">Plan Status</span>
                  <Badge className="bg-white text-primary hover:bg-white/90">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-90">Current Plan</span>
                  <span className="font-semibold capitalize">{user.plan}</span>
                </div>
                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-1 opacity-80">
                    <span>Next Payment</span>
                    <span>March 28, 2024</span>
                  </div>
                  <Progress value={65} className="h-1 bg-white/20" />
                </div>
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
                <div className="text-3xl font-bold">${user.winnings}</div>
                <p className="text-xs text-muted-foreground mt-1">Available for withdrawal</p>
                <Button variant="ghost" size="sm" className="w-full mt-4 text-primary hover:text-primary/80">
                  Withdraw Funds <ChevronRight className="ml-1 h-4 w-4" />
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
                    <p className="text-sm font-semibold">{charity?.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{charity?.mission}</p>
                  </div>
                  <Dialog open={isCharityDialogOpen} onOpenChange={setIsCharityDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">Change</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Select Your Charity</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <Select onValueChange={handleChangeCharity} defaultValue={user.charityId || undefined}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a charity" />
                          </SelectTrigger>
                          <SelectContent>
                            {db.charities.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">10% of your entries go to this organization.</p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="text-center py-4">
                  <span className="text-4xl font-bold text-primary">${(user.winnings * 0.1).toFixed(2)}</span>
                  <p className="text-sm text-muted-foreground">Total Generated for Charity</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Draws
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Monthly Masters Draw', date: 'March 31', prize: '$5,000 Cash' },
                  { name: 'Club Champion Gear', date: 'April 30', prize: 'Full Set of Irons' },
                ].map((draw, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border-b last:border-0">
                    <div>
                      <p className="text-sm font-semibold">{draw.name}</p>
                      <p className="text-xs text-muted-foreground">{draw.date}</p>
                    </div>
                    <Badge variant="outline">{draw.prize}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
