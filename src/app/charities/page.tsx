'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Heart, Search, ArrowLeft, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useCollection, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, query, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const MOCK_CHARITIES = [
  {
    id: 'charity-1',
    name: 'Junior Golf Foundation',
    description: 'Providing equipment and coaching to underprivileged children to empower them through sports.',
    image: 'https://picsum.photos/seed/golf-kid/600/400',
    category: 'Youth'
  },
  {
    id: 'charity-2',
    name: 'Green Fairways Project',
    description: 'Protecting local environments by helping golf courses implement sustainable water management.',
    image: 'https://picsum.photos/seed/golf-green/600/400',
    category: 'Environment'
  },
  {
    id: 'charity-3',
    name: 'Veterans Tee Off',
    description: 'Helping veterans reintegrate through golf community and therapeutic sport environments.',
    image: 'https://picsum.photos/seed/golf-vet/600/400',
    category: 'Community'
  },
  {
    id: 'charity-4',
    name: 'Women on the Green',
    description: 'Dedicated to increasing female participation and leadership in the world of golf.',
    image: 'https://picsum.photos/seed/golf-woman/600/400',
    category: 'Diversity'
  }
];

export default function CharitiesPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const charitiesQuery = useMemoFirebase(() => query(collection(db, 'charities')), [db]);
  const { data: dbCharities, isLoading: charitiesLoading } = useCollection(charitiesQuery);

  const displayCharities = (dbCharities && dbCharities.length > 0) ? [...MOCK_CHARITIES, ...dbCharities] : MOCK_CHARITIES;

  const filteredCharities = displayCharities.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCharity = (charityId: string, charityName: string) => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    const userRef = doc(db, 'users', user.uid);
    updateDocumentNonBlocking(userRef, {
      preferredCharityId: charityId,
      updatedAt: serverTimestamp(),
    });

    toast({
      title: 'Charity Selected',
      description: `10% of your contributions now support ${charityName}.`,
    });
    router.push('/dashboard');
  };

  if (!mounted || isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Heart className="h-8 w-8 text-destructive fill-destructive" />
                Select Impact
              </h1>
              <p className="text-muted-foreground">Every score contributes to a better world.</p>
            </div>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or category..." 
              className="pl-9" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredCharities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCharities.map((charity) => (
              <Card key={charity.id} className="group hover:shadow-lg transition-all border-none shadow-sm overflow-hidden flex flex-col">
                <div className="relative h-48 w-full">
                  <Image 
                    src={charity.image || charity.logoUrl || `https://picsum.photos/seed/${charity.id}/600/400`} 
                    alt={charity.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    data-ai-hint="golf charity"
                  />
                  <Badge className="absolute top-4 right-4 bg-white/90 text-primary hover:bg-white">
                    {charity.category || 'Global Impact'}
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">{charity.name}</CardTitle>
                  <CardDescription className="line-clamp-3">{charity.description}</CardDescription>
                </CardHeader>
                <CardFooter className="mt-auto">
                  <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => handleSelectCharity(charity.id, charity.name)}>
                    Choose Foundation
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed">
            <Search className="h-10 w-10 mx-auto text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground">No charities match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
