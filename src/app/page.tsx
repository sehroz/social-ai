
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ContentRequestCard } from '@/components/content-request/ContentRequestCard';
import type { ContentRequest, FullSocialPostOutput, DraggableElementPosition } from '@/lib/types';
import { PlusCircle, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAllContentRequests } from '@/lib/firestore-service';
import { Skeleton } from '@/components/ui/skeleton';

const DEFAULT_HEADLINE_POSITION: DraggableElementPosition = { x: 50, y: 20 };
const DEFAULT_SUBHEADLINE_POSITION: DraggableElementPosition = { x: 50, y: 35 };
const DEFAULT_LOGO_POSITION: DraggableElementPosition = { x: 50, y: 85 };

const DEFAULT_SINGLE_SOCIAL_POST_OUTPUT: FullSocialPostOutput = {
  image_copy: "",
  caption: "",
  alt_text: "",
  rationale: "",
  notes: {
    colour_hex: "#004C34",
    font: "Proxima Nova",
    layout_tips: "",
    headlineFontFamily: 'Arial, Helvetica, sans-serif',
    headlineFontSize: 60,
    headlineColor: '#FFFFFF',
    subheadlineFontFamily: "'Times New Roman', Times, serif",
    subheadlineFontSize: 40,
    subheadlineColor: '#FFFFFF',
  },
  headline_suggestion: "",
  subheadline_suggestion: "",
  footer_left_text_suggestion: "",
  footer_right_slogan_suggestion: "",
  video_concept_ideas: [],
};


export default function DashboardPage() {
  const [displayedRequests, setDisplayedRequests] = useState<ContentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getAllContentRequests()
      .then(requestsFromFirestore => {
        const processedRequests = requestsFromFirestore.map(req => {
           const ensureSingleOutput = (output: FullSocialPostOutput | undefined, defaultObj: FullSocialPostOutput) => {
              return output 
                ? {...JSON.parse(JSON.stringify(defaultObj)), ...output, notes: {...defaultObj.notes, ...(output.notes || {})}} 
                : JSON.parse(JSON.stringify(defaultObj));
            };

          return {
            ...req,
            clientId: req.clientId || 'merry-maids-canada',
            clientNiche: req.clientNiche || 'Home Cleaning Services',
            brandVoice: req.brandVoice || "Friendly, professional, trustworthy",
            targetAudience: req.targetAudience || "Busy homeowners in Canada",
            brandGuidelinesLink: req.brandGuidelinesLink || 'https://www.instagram.com/merrymaidscanada',
            status: req.status || 'Pending',
            createdAt: req.createdAt || new Date().toISOString(),
            updatedAt: req.updatedAt || new Date().toISOString(),
            socialPostOutput: ensureSingleOutput(req.socialPostOutput, DEFAULT_SINGLE_SOCIAL_POST_OUTPUT),
            headlinePosition: req.headlinePosition || DEFAULT_HEADLINE_POSITION,
            subheadlinePosition: req.subheadlinePosition || DEFAULT_SUBHEADLINE_POSITION,
            logoOverlayPosition: req.logoOverlayPosition || DEFAULT_LOGO_POSITION,
            uploadedBackgroundImageUrl: req.uploadedBackgroundImageUrl,
            uploadedLogoUrl: req.uploadedLogoUrl,
            uploadedFooterImageUrl: req.uploadedFooterImageUrl,
            uploadedExamplePostUrl: req.uploadedExamplePostUrl,
            imageWasGeneratedWithAiText: req.imageWasGeneratedWithAiText || false,
          };
        });
        setDisplayedRequests(processedRequests);
        setError(null);
      })
      .catch((err: any) => {
        console.error("Error fetching requests from Firestore:", err);
        let errorMessage = "Failed to load content requests. Please try again later.";
         if (err.code === 'unavailable' || (err.message && typeof err.message === 'string' && err.message.toLowerCase().includes('offline'))) {
            errorMessage = "Failed to load content requests: The application appears to be offline. Please check your internet connection.";
        } else if (err.message && typeof err.message === 'string') {
           errorMessage = err.message;
        }
        setError(errorMessage);
        setDisplayedRequests([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto_">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-9 w-1/3" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto_ text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Content</h2>
        <p className="text-muted-foreground">{error}</p>
         <Button asChild className="mt-4">
          <Link href="/requests/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Request
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto_">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Content Dashboard</h1>
        <Button asChild>
          <Link href="/requests/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Request
          </Link>
        </Button>
      </div>

      {displayedRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedRequests.map((request) => (
            <ContentRequestCard key={request.id} request={request} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No content requests yet.</h2>
          <p className="text-muted-foreground mb-4">Get started by creating a new content request for Merry Maids.</p>
          <Button asChild variant="outline">
            <Link href="/requests/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Create Request
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
