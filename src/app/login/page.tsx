'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const loginImage = PlaceHolderImages.find(img => img.id === 'login-visual');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user && mounted) {
      router.push('/dashboard');
    }
  }, [user, router, mounted]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
      {/* Background Image */}
      {loginImage && (
        <div className="absolute inset-0 z-0">
          <Image 
            src={loginImage.imageUrl} 
            alt={loginImage.description} 
            fill 
            className="object-cover"
            data-ai-hint={loginImage.imageHint}
            priority
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        </div>
      )}

      {/* Floating Home Link */}
      <Link href="/" className="absolute top-8 left-8 z-20 flex items-center gap-2 text-white/80 hover:text-white transition-colors group">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-transform">FF</div>
        <span className="font-bold hidden sm:inline">FairwayFortune</span>
      </Link>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
          <form onSubmit={handleLogin}>
            <CardHeader className="p-8 pb-4 text-center">
              <CardTitle className="text-3xl font-bold tracking-tight text-primary">Welcome Back</CardTitle>
              <CardDescription className="text-base">Sign in to manage your rounds and participation.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-secondary/30 border-none rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="#" className="text-xs text-primary font-semibold hover:underline">Forgot password?</Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-secondary/30 border-none rounded-xl"
                />
              </div>
              <Button 
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : 'Sign In to Portal'}
              </Button>
            </CardContent>
          </form>
          <CardFooter className="px-8 pb-8 flex flex-col space-y-6">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-secondary" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/95 px-3 text-muted-foreground font-medium">Alternative access</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
              <Button variant="outline" className="h-12 rounded-xl font-bold border-secondary hover:bg-secondary/20 transition-colors">Google</Button>
              <Button variant="outline" className="h-12 rounded-xl font-bold border-secondary hover:bg-secondary/20 transition-colors">Apple</Button>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Not a member? <Link href="/signup" className="text-primary hover:underline font-bold">Create an account</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
