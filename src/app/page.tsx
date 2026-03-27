import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Trophy, Target, Heart, ArrowRight, Play } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 h-16 flex items-center justify-between border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">FF</div>
          <span className="text-xl font-bold tracking-tight text-primary">FairwayFortune</span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <Link href="#how-it-works" className="hover:text-primary transition-colors">How it Works</Link>
          <Link href="#prizes" className="hover:text-primary transition-colors">Prizes</Link>
          <Link href="#charity" className="hover:text-primary transition-colors">Charity</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="bg-primary hover:bg-primary/90">Join Now</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative min-h-[85vh] flex items-center py-24 px-6 overflow-hidden bg-black">
          {/* Video Background */}
          <div className="absolute inset-0 z-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-60 grayscale-[0.3]"
            >
              <source src="https://assets.mixkit.co/videos/preview/mixkit-golf-ball-rolling-into-the-hole-in-the-green-grass-41220-large.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>

          <div className="max-w-5xl mx-auto relative z-10 text-left md:text-center w-full">
            <Badge className="mb-4 bg-accent/20 text-accent border-accent/30 backdrop-blur-sm px-3 py-1">
              <Trophy className="h-3 w-3 mr-2" /> Win Premium Golf Gear Monthly
            </Badge>
            <h1 className="text-5xl md:text-8xl font-extrabold tracking-tight mb-6 text-white leading-[1.1]">
              Your Best Scores,<br />
              <span className="text-accent italic">Real World</span> Rewards.
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              FairwayFortune turns your weekend golf scores into monthly chances to win premium prizes while supporting charities you care about.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="h-14 px-10 text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                  Start Playing <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="h-14 px-10 text-lg bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20">
                  <Play className="mr-2 h-5 w-5 fill-current" /> Watch How it Works
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-24 bg-white relative">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Turn Every Hole Into a Contribution</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Our unique ecosystem ensures your performance on the course generates real value for yourself and others.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center text-center p-8 rounded-3xl bg-secondary/30 border border-secondary transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="w-20 h-20 rounded-2xl bg-white shadow-md flex items-center justify-center mb-8">
                  <Target className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Submit Scores</h3>
                <p className="text-muted-foreground">Log your latest Stableford scores. We keep your top 5 records active for the monthly prize pool.</p>
              </div>
              <div className="flex flex-col items-center text-center p-8 rounded-3xl bg-secondary/30 border border-secondary transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="w-20 h-20 rounded-2xl bg-white shadow-md flex items-center justify-center mb-8">
                  <Trophy className="h-10 w-10 text-accent" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Enter Draw</h3>
                <p className="text-muted-foreground">Match 3, 4, or 5 of your scores to the winning numbers drawn every month to win luxury golf equipment.</p>
              </div>
              <div className="flex flex-col items-center text-center p-8 rounded-3xl bg-secondary/30 border border-secondary transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="w-20 h-20 rounded-2xl bg-white shadow-md flex items-center justify-center mb-8">
                  <Heart className="h-10 w-10 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Give Back</h3>
                <p className="text-muted-foreground">10% of your membership goes directly to your selected golf charity. Every round helps someone else tee off.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-primary text-primary-foreground overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 italic">"The most rewarding round you'll ever play."</h2>
            <p className="text-xl opacity-80 mb-10 leading-relaxed">
              Join thousands of golfers who are adding purpose to their scorecards. Whether you're hitting fairways or finding bunkers, every score matters.
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="h-14 px-12 text-lg font-bold">
                Get Started For $19/mo
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white text-sm font-bold">FF</div>
                <span className="font-bold text-2xl text-primary">FairwayFortune</span>
              </div>
              <p className="text-muted-foreground max-w-xs">Elevating the game of golf through performance, competition, and charitable impact.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
              <div className="space-y-4">
                <h4 className="font-bold">Platform</h4>
                <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <Link href="#" className="hover:text-primary">Monthly Draw</Link>
                  <Link href="#" className="hover:text-primary">Prize History</Link>
                  <Link href="#" className="hover:text-primary">Leaderboard</Link>
                </nav>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold">Company</h4>
                <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <Link href="#" className="hover:text-primary">About Us</Link>
                  <Link href="#" className="hover:text-primary">Charity Partners</Link>
                  <Link href="#" className="hover:text-primary">Contact</Link>
                </nav>
              </div>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm text-muted-foreground">© 2024 FairwayFortune. All rights reserved. Play responsibly.</p>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-primary">Privacy Policy</Link>
              <Link href="#" className="hover:text-primary">Terms of Service</Link>
              <Link href="#" className="hover:text-primary">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { Badge } from '@/components/ui/badge';
