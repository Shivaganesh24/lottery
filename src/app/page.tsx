
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Trophy, Target, Heart, ArrowRight, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
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
        <section className="relative min-h-[95vh] flex items-center py-24 px-6 overflow-hidden bg-black">
          {/* Video Background Container */}
          <div className="absolute inset-0 z-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-70"
            >
              <source src="https://assets.mixkit.co/videos/preview/mixkit-golf-ball-rolling-into-the-hole-in-the-green-grass-41220-large.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {/* Sophisticated Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>

          <div className="max-w-5xl mx-auto relative z-10 text-left w-full">
            <Badge className="mb-8 bg-accent/30 text-accent-foreground border-accent/40 backdrop-blur-md px-4 py-2 text-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Trophy className="h-4 w-4 mr-2" /> Win Luxury Golf Gear Every Month
            </Badge>
            <h1 className="text-6xl md:text-9xl font-extrabold tracking-tighter mb-8 text-white leading-[0.95] animate-in fade-in slide-in-from-bottom-8 duration-1000">
              Your Best Rounds,<br />
              <span className="text-accent italic">Exceptional</span> Prizes.
            </h1>
            <p className="text-xl md:text-2xl text-zinc-300 mb-12 max-w-2xl leading-relaxed opacity-90 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
              FairwayFortune transforms your weekend scores into monthly chances to win while funding global golf charities.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
              <Link href="/signup">
                <Button size="lg" className="h-16 px-12 text-xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/40 transition-all hover:scale-105 rounded-full font-bold">
                  Join the Club <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="h-16 px-12 text-xl bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white/20 transition-all rounded-full font-bold">
                  <Play className="mr-2 h-6 w-6 fill-current" /> See The Draw
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-32 bg-white relative">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-bold mb-6">A Platform for the Modern Golfer</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Elevating the game through performance, competition, and a commitment to charitable impact.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center text-center p-10 rounded-[3rem] bg-secondary/20 border border-secondary/50 transition-all hover:shadow-2xl hover:-translate-y-2 group">
                <div className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center mb-10 group-hover:bg-primary transition-colors">
                  <Target className="h-12 w-12 text-primary group-hover:text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-6">Enter Scores</h3>
                <p className="text-muted-foreground leading-relaxed">Simply log your latest Stableford rounds. We securely store your top 5 for draw eligibility.</p>
              </div>
              <div className="flex flex-col items-center text-center p-10 rounded-[3rem] bg-secondary/20 border border-secondary/50 transition-all hover:shadow-2xl hover:-translate-y-2 group">
                <div className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center mb-10 group-hover:bg-accent transition-colors">
                  <Trophy className="h-12 w-12 text-accent group-hover:text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-6">Win Big</h3>
                <p className="text-muted-foreground leading-relaxed">Match 3 or more scores to the winning numbers in our monthly live draw to claim premium golf kits.</p>
              </div>
              <div className="flex flex-col items-center text-center p-10 rounded-[3rem] bg-secondary/20 border border-secondary/50 transition-all hover:shadow-2xl hover:-translate-y-2 group">
                <div className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center mb-10 group-hover:bg-destructive transition-colors">
                  <Heart className="h-12 w-12 text-destructive group-hover:text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-6">Empower</h3>
                <p className="text-muted-foreground leading-relaxed">A portion of every subscription is donated to youth and environment projects across the golf world.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-32 bg-primary text-primary-foreground overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-accent opacity-20 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]" />
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-5xl md:text-7xl font-bold mb-10 italic tracking-tight">"Where performance meets purpose."</h2>
            <p className="text-2xl opacity-90 mb-12 leading-relaxed">
              Join a global community of golfers who are turning their game into a force for good. No more empty rounds.
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="h-16 px-16 text-2xl font-bold rounded-full hover:scale-105 transition-transform">
                Start Winning Today
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-16 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white text-lg font-bold">FF</div>
                <span className="font-bold text-3xl text-primary tracking-tight">FairwayFortune</span>
              </div>
              <p className="text-muted-foreground max-w-sm leading-relaxed text-lg">Modernizing the game through a unique subscription experience focused on rewards and impact.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
              <div className="space-y-6">
                <h4 className="font-bold text-lg">Experience</h4>
                <nav className="flex flex-col gap-3 text-muted-foreground">
                  <Link href="#" className="hover:text-primary">The Draw</Link>
                  <Link href="#" className="hover:text-primary">Prize Store</Link>
                  <Link href="#" className="hover:text-primary">Scoreboard</Link>
                </nav>
              </div>
              <div className="space-y-6">
                <h4 className="font-bold text-lg">Community</h4>
                <nav className="flex flex-col gap-3 text-muted-foreground">
                  <Link href="#" className="hover:text-primary">Impact Report</Link>
                  <Link href="#" className="hover:text-primary">Partner Clubs</Link>
                  <Link href="#" className="hover:text-primary">Contact</Link>
                </nav>
              </div>
            </div>
          </div>
          <div className="border-t pt-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-muted-foreground">© 2024 FairwayFortune. All rights reserved.</p>
            <div className="flex gap-10 text-muted-foreground">
              <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
