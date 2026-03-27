
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isAdminRegistration, setIsAdminRegistration] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user && mounted) {
      router.push('/dashboard');
    }
  }, [user, router, mounted]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please fill in all details.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      await setDoc(doc(db, 'users', newUser.uid), {
        id: newUser.uid,
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: isAdminRegistration ? 'admin' : 'user',
        status: 'inactive',
        totalWinnings: 0,
        last5Scores: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (isAdminRegistration) {
        await setDoc(doc(db, 'admin_users', newUser.uid), {
          uid: newUser.uid,
          email: email,
          promotedAt: serverTimestamp(),
        });
      }

      toast({
        title: 'Account created!',
        description: `Welcome to FairwayFortune${isAdminRegistration ? ' (Admin Mode)' : ''}.`,
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Signup failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-black">
      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-left-4 duration-1000">
          <div className="text-center lg:text-left">
            <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-transform">FF</div>
              <span className="text-3xl font-bold tracking-tight text-primary">FairwayFortune</span>
            </Link>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Create Account</h1>
            <p className="text-muted-foreground">Start turning your golf scores into charitable winnings.</p>
          </div>

          <Card className="border-none shadow-2xl bg-white rounded-3xl overflow-hidden">
            <form onSubmit={handleSignup}>
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl">Sign Up</CardTitle>
                <CardDescription>Enter your details to get started.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input 
                      id="first-name" 
                      placeholder="John" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="h-11 bg-secondary/30 border-none rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input 
                      id="last-name" 
                      placeholder="Doe" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="h-11 bg-secondary/30 border-none rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 bg-secondary/30 border-none rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 bg-secondary/30 border-none rounded-xl"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-4 border-t border-dashed mt-4">
                  <Checkbox 
                    id="admin-reg" 
                    checked={isAdminRegistration}
                    onCheckedChange={(checked) => setIsAdminRegistration(!!checked)}
                    className="rounded-md"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label 
                      htmlFor="admin-reg" 
                      className="text-sm font-bold leading-none flex items-center gap-1.5 text-accent"
                    >
                      <ShieldAlert className="h-4 w-4" /> Administrative Access (Dev)
                    </Label>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox id="terms" required className="rounded-md" />
                  <Label htmlFor="terms" className="text-xs text-muted-foreground font-normal leading-none cursor-pointer">
                    I agree to the <Link href="#" className="text-primary hover:underline">Terms</Link> and <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>.
                  </Label>
                </div>
                <Button 
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Get Started'}
                </Button>
              </CardContent>
            </form>
            <CardFooter className="px-8 pb-8">
              <p className="text-center text-sm text-muted-foreground w-full">
                Already registered? <Link href="/login" className="text-primary hover:underline font-bold">Log in here</Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Visual Side with Video Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-golf-ball-rolling-into-the-hole-in-the-green-grass-41220-large.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-l from-black/60 to-transparent" />
        <div className="relative z-10 p-20 flex flex-col justify-end text-white text-right w-full">
          <h2 className="text-6xl font-extrabold leading-tight mb-6">Play with Purpose.<br /><span className="text-accent italic">Win for All.</span></h2>
          <p className="text-xl text-zinc-300 max-w-md ml-auto">Join thousands of golfers worldwide who are turning their game into a powerful tool for global charitable impact.</p>
        </div>
      </div>
    </div>
  );
}
