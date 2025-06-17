
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { contentRequestSchema, type ContentRequestFormValues } from "@/lib/schema";
import type { ClientProfile, ClientProfileBrandGuidelines, ContentRequest, FullSocialPostOutput, DraggableElementPosition } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Target, Users, Link as LinkIcon, FileText, CalendarDays, Lightbulb, MessageSquare, Settings2, Palette, Type, Info, LayoutGrid } from "lucide-react";
import { saveContentRequest } from "@/lib/firestore-service"; // Import the service

const merryMaidsBrandGuidelines: ClientProfileBrandGuidelines = {
  colors: ["#004C34", "#007A52", "#FFD700", "#F0F0F0", "#333333"], 
  primaryFont: "Proxima Nova",
  secondaryFont: "Arial", 
  logoUrl: "https://www.merrymaids.ca/medias/Logo.svg?context=bWFzdGVyfGltYWdlc3w3MDMyfGltYWdlL3N2Zyt4bWx8aDdkL2g5My84ODEzNzk0NjE1MzI2L0xvZ28uc3ZnfDYwY2RiODRhOTA3M2ZmNTE1YjcxZTE3ZDU0OTNmMzE2ZWE0MWEyZDU2NTAzMWFiY2YwMmQ5NDVjYjYzYjc2ZDI", 
  toneOfVoice: "Friendly, professional, trustworthy, reassuring, and helpful.",
  brandVoice: "We speak in clear, Canadian English. We focus on the relief and joy of a clean home. We are experts in cleaning and care about our customers' well-being.",
  targetAudience: "Busy homeowners, families, and individuals in Canada aged 30-65 seeking reliable, professional home cleaning services to free up their time.",
  styleGuideUrl: "https://www.instagram.com/merrymaidscanada", 
  assetLibraryUrl: "", 
  instagramFeedUrl: "https://www.instagram.com/merrymaidscanada",
  negativeKeywords: ["cheap", "quick fix", "sloppy"],
  preferredEmojis: "✨🧹🧼😊",
  canvaUsageNotes: "Prioritize clean layouts, high-quality images of spotless homes or happy clients (if available). Ensure text is legible and contrasts well with backgrounds. Use logo consistently.",
  brandKitDetails: "Colors: Green (#004C34, #007A52), Yellow (#FFD700), Greys. Fonts: Proxima Nova (Primary). Logo: Standard Merry Maids logo. Tone: Friendly, professional, trustworthy.",
  assetLibraryDetails: "Use photos of sparkling clean kitchens, bathrooms, living rooms; happy homeowners; professional cleaning teams (respectfully depicted). Icons for sparkle, cleaning tools."
};

const merryMaidsClient: ClientProfile = {
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

const MOCK_CLIENTS: ClientProfile[] = [merryMaidsClient];

const defaultCreativeDirection = `Image Style & Layout:
Full-bleed background image of a smiling, professional cleaning woman in uniform (Merry Maids apron or shirt), actively cleaning a modern, well-lit home.
The setting should be a tidy, lived-in kitchen or living room with natural light and seasonal greenery.
Include recognizable cleaning props like a mop, bucket, gloves, spray bottle, or cleaning caddy.
Keep the photo warm, welcoming, and bright with a soft-focus look to create a cozy, fresh atmosphere.

Overlay Text Content:
Headline (All Caps, Clean Sans Serif Font): SPRING CLEANING.
Subheading (Handwritten/Script Style Font): Refresh your home for the new season.
Use a white or light-colored font for readability. Apply a light green gradient overlay at the bottom of the image to ensure text stands out.

Branding & Footer Section:
Split footer into two sections:
Left Section (White background):
Include a red maple leaf icon (Canadian symbol).
Add this text in bold red:
Canadian owner.
Canadian team.
For Canadian homes.
Right Section (Green background, matching brand):
Add Merry Maids logo in white.
Slogan underneath in smaller font: Relax. It’s Done.®`;

const DEFAULT_TEXT_POSITION: DraggableElementPosition = { x: 50, y: 25 };
const DEFAULT_LOGO_POSITION: DraggableElementPosition = { x: 50, y: 85 };
const DEFAULT_SINGLE_SOCIAL_POST_OUTPUT: FullSocialPostOutput = {
  image_copy: "",
  headline_suggestion: "",
  subheadline_suggestion: "",
  caption: "",
  alt_text: "",
  rationale: "",
  notes: {
    colour_hex: merryMaidsClient.brandGuidelines.colors[0] || "#004C34",
    font: merryMaidsClient.brandGuidelines.primaryFont || "Arial",
    layout_tips: "",
    headlineFontFamily: 'Arial, Helvetica, sans-serif',
    headlineFontSize: 60,
    headlineColor: '#FFFFFF',
    subheadlineFontFamily: "'Times New Roman', Times, serif",
    subheadlineFontSize: 40,
    subheadlineColor: '#FFFFFF',
  },
  footer_left_text_suggestion: "",
  footer_right_slogan_suggestion: "",
  video_concept_ideas: [],
};


export function ContentRequestForm() {
  const router = useRouter();
  const { toast } = useToast();

  const defaultClient = MOCK_CLIENTS[0];

  const form = useForm<ContentRequestFormValues>({
    resolver: zodResolver(contentRequestSchema),
    defaultValues: {
      clientId: defaultClient.id,
      campaignName: "",
      initialTopicIdea: "Spring Cleaning",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      brandGuidelinesLink: defaultClient.brandGuidelines.styleGuideUrl || defaultClient.brandGuidelines.instagramFeedUrl || "",
      notes: "", 
      clientNiche: defaultClient.niche,
      platform: "Instagram", 
      brandVoice: defaultClient.brandGuidelines.brandVoice,
      targetAudience: defaultClient.brandGuidelines.targetAudience,
      theme: "Spring Cleaning", 
      calendar_context: "",
      creative_direction: defaultCreativeDirection, 
    },
  });

  React.useEffect(() => {
    form.setValue("clientNiche", defaultClient.niche, { shouldValidate: true });
    form.setValue("brandVoice", defaultClient.brandGuidelines.brandVoice || "", { shouldValidate: true });
    form.setValue("targetAudience", defaultClient.brandGuidelines.targetAudience || "", { shouldValidate: true });
    form.setValue("brandGuidelinesLink", defaultClient.brandGuidelines.styleGuideUrl || defaultClient.brandGuidelines.instagramFeedUrl || "", {shouldValidate: true});
  }, [form, defaultClient]);


  async function onSubmit(data: ContentRequestFormValues) {
    const newRequestId = `req-${Date.now().toString().slice(-6)}`;
    const contentRequestData: ContentRequest = {
      id: newRequestId,
      ...data,
      clientId: defaultClient.id, 
      status: 'Pending',
      createdAt: new Date().toISOString(), // This will be a string
      socialPostOutputs: [
        {...DEFAULT_SINGLE_SOCIAL_POST_OUTPUT}, 
        {...DEFAULT_SINGLE_SOCIAL_POST_OUTPUT}, 
        {...DEFAULT_SINGLE_SOCIAL_POST_OUTPUT}
      ],
      activeSocialPostOutputIndex: 0,
      textOverlayPosition: DEFAULT_TEXT_POSITION,
      logoOverlayPosition: DEFAULT_LOGO_POSITION,
      // imageUrl, uploadedBackgroundImageUrl etc. will be undefined initially
    };

    try {
      await saveContentRequest(contentRequestData); // Save to Firestore
      toast({
        title: "Content Request Submitted!",
        description: `Request ID: ${newRequestId} for ${defaultClient.name} saved to Firestore. Redirecting...`,
      });
      router.push(`/requests/${newRequestId}`);
    } catch (error) {
      toast({
        title: "Error submitting request",
        description: "Could not save data to Firestore. Please try again.",
        variant: "destructive",
      });
      console.error("Error saving to Firestore:", error);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <FileText className="mr-2 h-6 w-6 text-primary" />
          New Content Request for {defaultClient.name}
        </CardTitle>
        <CardDescription>Fill in the details below to initiate a new social media content request. A default 'Spring Cleaning' creative direction is provided as an example.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Users className="mr-2 h-4 w-4 text-muted-foreground"/>Client</FormLabel>
                  <FormControl>
                    <Input {...field} value={defaultClient.name} readOnly disabled className="bg-muted/50"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="campaignName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground"/>Campaign Name / Overall Theme</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Spring Cleaning 2024, Holiday Sparkle" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Palette className="mr-2 h-4 w-4 text-muted-foreground"/>Specific Post Theme</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Kitchen cleaning tips, Benefits of regular cleaning" {...field} />
                  </FormControl>
                  <FormDescription>Specific theme for this particular post. Defaults to 'Spring Cleaning'.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="initialTopicIdea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Lightbulb className="mr-2 h-4 w-4 text-muted-foreground"/>Key Message / Initial Idea for AI</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Focus on pet-friendly cleaning solutions this week." {...field} />
                  </FormControl>
                  <FormDescription>Core message or starting point for AI content generation. Defaults to 'Spring Cleaning'.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground"/>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Target className="mr-2 h-4 w-4 text-muted-foreground"/>Target Platform</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'TikTok', 'Pinterest'].map(platform => (
                          <SelectItem key={platform} value={platform}>
                            {platform}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
              control={form.control}
              name="calendar_context"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Info className="mr-2 h-4 w-4 text-muted-foreground"/>Calendar Context (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Mother's Day, National Pet Day" {...field} />
                  </FormControl>
                   <FormDescription>Any relevant holidays or events.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="creative_direction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><LayoutGrid className="mr-2 h-4 w-4 text-muted-foreground"/>Creative Direction for AI</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the desired image style, layout, text overlays, and branding elements..." {...field} rows={16} />
                  </FormControl>
                   <FormDescription>Detailed instructions for the AI to generate the background image and suggest text elements. (Pre-filled with a 'Spring Cleaning' example).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientNiche"
              render={({ field }) => ( <FormItem className="hidden"> <FormLabel>Niche</FormLabel> <FormControl><Input {...field} readOnly disabled /></FormControl><FormMessage /></FormItem>)}
            />
            <FormField
              control={form.control}
              name="brandGuidelinesLink"
              render={({ field }) => (<FormItem className="hidden"><FormLabel>Guidelines</FormLabel><FormControl><Input type="url" {...field} readOnly disabled /></FormControl><FormMessage /></FormItem>)}
            />
             <FormField
              control={form.control}
              name="brandVoice"
              render={({ field }) => (<FormItem className="hidden"><FormLabel>Voice</FormLabel><FormControl><Input {...field} readOnly disabled /></FormControl><FormMessage /></FormItem>)}
            />
            <FormField
              control={form.control}
              name="targetAudience"
              render={({ field }) => (<FormItem className="hidden"><FormLabel>Audience</FormLabel><FormControl><Input {...field} readOnly disabled /></FormControl><FormMessage /></FormItem>)}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><FileText className="mr-2 h-4 w-4 text-muted-foreground"/>Internal Notes for Creator (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any specific instructions or details for this post..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving to Firestore..." : "Submit Content Request"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
