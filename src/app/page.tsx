import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Trophy, Target, Heart, ArrowRight } from 'lucide-react';

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
        <section className="relative py-24 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(80,204,163,0.1),transparent)]" />
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-accent">
              Your Best Scores,<br />Real World Rewards.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              FairwayFortune turns your weekend golf scores into monthly chances to win premium prizes while supporting charities you care about.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="h-12 px-8 text-base bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                  Start Playing <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                  View Latest Draws
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 bg-secondary/30">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Submit Scores</h3>
                <p className="text-muted-foreground">Log your last 5 Stableford scores. We keep the best records for the draw.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6">
                  <Trophy className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3">Enter Draw</h3>
                <p className="text-muted-foreground">Every month, we draw 5 numbers. Match your scores to win luxury golf gear.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Give Back</h3>
                <p className="text-muted-foreground">10% of every subscription goes directly to your chosen golf charity.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white text-xs font-bold">FF</div>
            <span className="font-bold text-primary">FairwayFortune</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 FairwayFortune. All rights reserved. Play responsibly.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-primary">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}