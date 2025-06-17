
'use client';

import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import type { ContentRequest, ClientProfile, ClientProfileBrandGuidelines, FullSocialPostOutput, DraggableElementPosition } from '@/lib/types';
import { ContentRequestDetailClient } from '@/components/content-request/ContentRequestDetailClient';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { getContentRequest } from '@/lib/firestore-service';

const merryMaidsBrandGuidelines: ClientProfileBrandGuidelines = {
  colors: ["#004C34", "#007A52", "#FFD700", "#F0F0F0", "#333333"],
  primaryFont: "Proxima Nova",
  secondaryFont: "Arial",
  logoUrl: "https://www.merrymaids.ca/medias/Logo.svg?context=bWFzdGVyfGltYWdlc3w3MDMyfGltYWdlL3N2Zyt4bWx8aDdkL2g5My84ODEzNzk0NjE1MzI2L0xvZ28uc3ZnfDYwY2RiODRhOTA3M2ZmNTE1YjcxZTE3ZDU0OTNmMzE2ZWE0MWEyZDU2NTAzMWFiY2YwMmQ5NDVjYjYzYjc2ZDI",
  toneOfVoice: "Friendly, professional, trustworthy, reassuring, and helpful.",
  brandVoice: "We speak in clear, Canadian English. Focus on relief and joy of a clean home. Experts in cleaning, care about customers' well-being.",
  targetAudience: "Busy homeowners, families, individuals in Canada (30-65) seeking reliable, professional home cleaning.",
  styleGuideUrl: "https://www.instagram.com/merrymaidscanada",
  assetLibraryUrl: "",
  instagramFeedUrl: "https://www.instagram.com/merrymaidscanada",
  negativeKeywords: ["cheap", "quick fix", "sloppy", "competitor_pink", "competitor_blue"],
  preferredEmojis: "✨🧹🧼😊",
  canvaUsageNotes: "Prioritize clean layouts, high-quality images of spotless homes or happy clients. Ensure text is legible and contrasts well with backgrounds. Use logo consistently. Adhere to WCAG AA for contrast.",
  brandKitDetails: "Colors: Green (#004C34, #007A52), Yellow (#FFD700), Greys. Fonts: Proxima Nova (Primary). Logo: Standard Merry Maids logo. Tone: Friendly, professional, trustworthy.",
  assetLibraryDetails: "Use photos of sparkling clean kitchens, bathrooms, living rooms; happy homeowners; professional cleaning teams (respectfully depicted). Icons for sparkle, cleaning tools."
};

const MERRY_MAIDS_CLIENT: ClientProfile = {
  id: "merry-maids-canada",
  name: "Merry Maids Canada",
  niche: "Home Cleaning Services",
  brandGuidelines: merryMaidsBrandGuidelines,
  socialProfiles: {
    instagram: "@merrymaidscanada",
    facebook: "MerryMaidsCanada",
    linkedin: "company/merry-maids-canada",
  }
};

const DEFAULT_HEADLINE_POSITION: DraggableElementPosition = { x: 50, y: 20 };
const DEFAULT_SUBHEADLINE_POSITION: DraggableElementPosition = { x: 50, y: 35 };
const DEFAULT_LOGO_POSITION: DraggableElementPosition = { x: 50, y: 85 };

const DEFAULT_SINGLE_SOCIAL_POST_OUTPUT: FullSocialPostOutput = {
  image_copy: "",
  caption: "",
  alt_text: "",
  rationale: "",
  notes: {
    colour_hex: MERRY_MAIDS_CLIENT.brandGuidelines.colors[0] || "#004C34",
    font: MERRY_MAIDS_CLIENT.brandGuidelines.primaryFont || "Arial",
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

const createDefaultRequest = (id: string): ContentRequest => ({
  id,
  clientId: MERRY_MAIDS_CLIENT.id,
  campaignName: 'New Campaign',
  initialTopicIdea: 'A great new idea',
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  brandGuidelinesLink: MERRY_MAIDS_CLIENT.brandGuidelines.instagramFeedUrl!,
  notes: '',
  clientNiche: MERRY_MAIDS_CLIENT.niche,
  platform: 'Instagram',
  status: 'Pending',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  socialPostOutput: JSON.parse(JSON.stringify(DEFAULT_SINGLE_SOCIAL_POST_OUTPUT)), 
  headlinePosition: DEFAULT_HEADLINE_POSITION,
  subheadlinePosition: DEFAULT_SUBHEADLINE_POSITION,
  logoOverlayPosition: DEFAULT_LOGO_POSITION,
  uploadedBackgroundImageUrl: undefined,
  uploadedLogoUrl: MERRY_MAIDS_CLIENT.brandGuidelines.logoUrl,
  uploadedFooterImageUrl: undefined,
  uploadedExamplePostUrl: undefined,
  imageWasGeneratedWithAiText: false,
  calendar_context: "",
  creative_direction: `Image Style & Layout:
Describe the desired image style here...

Overlay Text Content:
Headline (Style): YOUR HEADLINE TEXT
Subheading (Style): Your subheading text.

Branding & Footer Section:
Describe footer details...`,
});


export default function ContentRequestDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';

  const [request, setRequest] = useState<ContentRequest | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      setError(null);
      getContentRequest(id)
        .then(fetchedRequest => {
          if (fetchedRequest) {
             const ensureSingleOutput = (output: FullSocialPostOutput | undefined, defaultObj: FullSocialPostOutput) => {
                return output 
                    ? {...JSON.parse(JSON.stringify(defaultObj)), ...output, notes: {...defaultObj.notes, ...(output.notes || {})}} 
                    : JSON.parse(JSON.stringify(defaultObj));
            };

            const processedRequest: ContentRequest = {
              ...createDefaultRequest(id), 
              ...fetchedRequest, 
              socialPostOutput: ensureSingleOutput(fetchedRequest.socialPostOutput, DEFAULT_SINGLE_SOCIAL_POST_OUTPUT),
              headlinePosition: fetchedRequest.headlinePosition || DEFAULT_HEADLINE_POSITION,
              subheadlinePosition: fetchedRequest.subheadlinePosition || DEFAULT_SUBHEADLINE_POSITION,
              logoOverlayPosition: fetchedRequest.logoOverlayPosition || DEFAULT_LOGO_POSITION,
              uploadedLogoUrl: fetchedRequest.uploadedLogoUrl || MERRY_MAIDS_CLIENT.brandGuidelines.logoUrl,
              imageWasGeneratedWithAiText: fetchedRequest.imageWasGeneratedWithAiText || false,
            };
            setRequest(processedRequest);
          } else {
            setError(`Content request with ID "${id}" not found for ${MERRY_MAIDS_CLIENT.name}. This app version primarily supports Merry Maids.`);
          }
        })
        .catch((err: any) => {
          console.error("Error fetching request from Firestore:", err);
          let errorMessage = "Failed to load content request data from the database. Please try again later.";
           if (err.code === 'unavailable' || (err.message && typeof err.message === 'string' && err.message.toLowerCase().includes('offline'))) {
            errorMessage = "Failed to load content request: The application appears to be offline. Please check your internet connection.";
          } else if (err.message && typeof err.message === 'string') {
            errorMessage = err.message;
          }
          setError(errorMessage);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setError("Invalid request ID.");
      setIsLoading(false);
    }
  }, [id]);

  if (isLoading || request === undefined) {
    return (
      <div className="space-y-8 p-4 md:p-6 lg:p-8">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Request</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!request) {
     return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Request</h2>
        <p className="text-muted-foreground">Content request data could not be loaded or does not exist.</p>
      </div>
    );
  }

  return <ContentRequestDetailClient initialRequest={request} />;
}
