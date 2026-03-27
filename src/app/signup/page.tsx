'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { ShieldAlert, Loader2, ArrowLeft } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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

  const signupImage = PlaceHolderImages.find(img => img.id === 'signup-visual');

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
      {/* Background Image */}
      {signupImage && (
        <div className="absolute inset-0 z-0">
          <Image 
            src={signupImage.imageUrl} 
            alt={signupImage.description} 
            fill 
            className="object-cover"
            data-ai-hint={signupImage.imageHint}
            priority
          />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" />
        </div>
      )}

      {/* Floating Logo */}
      <Link href="/" className="absolute top-8 left-8 z-20 flex items-center gap-2 text-white group">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-transform shadow-lg shadow-accent/20">FF</div>
        <span className="font-bold hidden sm:inline text-xl tracking-tight">FairwayFortune</span>
      </Link>

      <div className="w-full max-w-lg relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
          <form onSubmit={handleSignup}>
            <CardHeader className="p-8 pb-4 text-center">
              <CardTitle className="text-3xl font-bold tracking-tight">Create Account</CardTitle>
              <CardDescription className="text-base">Join the modern golf prizes community today.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-secondary/30 border-none rounded-xl"
                />
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-secondary/50 mt-4">
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
                    <ShieldAlert className="h-4 w-4" /> Administrative Access (Dev Only)
                  </Label>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="terms" required className="rounded-md" />
                <Label htmlFor="terms" className="text-xs text-muted-foreground font-normal leading-none cursor-pointer">
                  I agree to the <Link href="#" className="text-primary hover:underline">Terms of Service</Link> and <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>.
                </Label>
              </div>
              <Button 
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] mt-4"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : 'Get Started Now'}
              </Button>
            </CardContent>
          </form>
          <CardFooter className="px-8 pb-8 text-center border-t border-secondary/20 pt-6">
            <p className="text-sm text-muted-foreground w-full">
              Already have an account? <Link href="/login" className="text-primary hover:underline font-bold">Sign in here</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
