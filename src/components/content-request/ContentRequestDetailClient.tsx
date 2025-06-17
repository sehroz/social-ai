
"use client";

import type { ContentRequest, FullSocialPostOutput, DraggableElementPosition, ClientProfile, GenerateStructuredSocialPostInput as LibGenerateStructuredSocialPostInput } from '@/lib/types';
import { generateStructuredSocialPost, type GenerateStructuredSocialPostInput } from '@/ai/flows/generate-structured-social-post';
import { generateSocialMediaImage, type GenerateSocialMediaImageInput, type GenerateSocialMediaImageOutput } from '@/ai/flows/generate-social-media-image';
import { analyzeUploadedPost, type AnalyzeUploadedPostInput, type AnalyzeUploadedPostOutput } from '@/ai/flows/analyze-uploaded-post-flow';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, AlertTriangle, CalendarDays, FileText, Image as ImageIcon, Info, Lightbulb, Link as LinkIcon, Loader2, MessageSquare, Mic, Palette, Send, Settings2, Sparkles, Target, Type, UploadCloud, Wand2, WholeWord, X, CheckSquare, AlignLeft, ListChecks, Video, Download, LayoutGrid, ChevronRight, ChevronLeft, Footprints, TextCursorInput, Zap, Figma, Copy, Replace, ArrowLeft, ArrowRight, Share2, BookCopy, SlidersHorizontal, Bot, FileImage, Eye, EyeOff, UserPlus, LogOut } from 'lucide-react';

import { saveContentRequest, getContentRequest } from '@/lib/firestore-service';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

const MERRY_MAIDS_CLIENT_DETAILS: Pick<ContentRequest, 'clientName' | 'clientNiche' | 'brandGuidelinesLink' | 'brandVoice' | 'targetAudience' | 'uploadedLogoUrl'> = {
  clientName: "Merry Maids Canada",
  clientNiche: "Home Cleaning Services",
  brandGuidelinesLink: "https://www.instagram.com/merrymaidscanada",
  brandVoice: "We speak in clear, Canadian English. We focus on the relief and joy of a clean home. We are experts in cleaning and care about our customers' well-being.",
  targetAudience: "Busy homeowners, families, and individuals in Canada aged 30-65 seeking reliable, professional home cleaning services to free up their time.",
  uploadedLogoUrl: "https://www.merrymaids.ca/medias/Logo.svg?context=bWFzdGVyfGltYWdlc3w3MDMyfGltYWdlL3N2Zyt4bWx8aDdkL2g5My84ODEzNzk0NjE1MzI2L0xvZ28uc3ZnfDYwY2RiODRhOTA3M2ZmNTE1YjcxZTE3ZDU0OTNmMzE2ZWE0MWEyZDU2NTAzMWFiY2YwMmQ5NDVjYjYzYjc2ZDI"
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

const WEB_SAFE_FONTS = [
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial (sans-serif)' },
  { value: "'Arial Black', Gadget, sans-serif", label: 'Arial Black (sans-serif)'},
  { value: "'Times New Roman', Times, serif", label: 'Times New Roman (serif)' },
  { value: 'Georgia, serif', label: 'Georgia (serif)' },
  { value: "'Courier New', Courier, monospace", label: 'Courier New (monospace)' },
  { value: "'Lucida Console', Monaco, monospace", label: 'Lucida Console (monospace)'},
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana (sans-serif)' },
  { value: 'Tahoma, Geneva, sans-serif', label: 'Tahoma (sans-serif)' },
  { value: "'Trebuchet MS', Helvetica, sans-serif", label: 'Trebuchet MS (sans-serif)' },
  { value: 'Impact, Charcoal, sans-serif', label: 'Impact (sans-serif)' },
  { value: "'Comic Sans MS', 'Comic Sans', cursive", label: 'Comic Sans MS (cursive)' },
  { value: 'cursive', label: 'Generic Cursive' },
  { value: 'fantasy', label: 'Generic Fantasy' },
  { value: 'sans-serif', label: 'Generic Sans-Serif' },
  { value: 'serif', label: 'Generic Serif' },
];

const MAX_IMAGE_DATA_LENGTH = 700000; // Approx 0.7MB Base64, Firestore field limit is 1MiB (~1.04M bytes, Base64 is ~1.37x larger)

interface ContentRequestDetailClientProps {
    initialRequest: ContentRequest;
}


// Step 1: Request Overview & Creative Direction
const RequestOverviewStep: React.FC<{
  request: ContentRequest;
  onFieldChange: (fieldName: keyof Pick<ContentRequest, 'campaignName' | 'dueDate' | 'platform' | 'theme' | 'calendar_context' | 'initialTopicIdea' | 'creative_direction' | 'notes' | 'clientName' | 'clientNiche' | 'brandGuidelinesLink' | 'brandVoice' | 'targetAudience' >, value: any) => void;
  isSaving: boolean;
  onAnalyzeExamplePost: (file: File) => void;
  isAnalyzingExamplePost: boolean;
  uploadedExamplePostUrl: string | null;
}> = ({ request, onFieldChange, isSaving, onAnalyzeExamplePost, isAnalyzingExamplePost, uploadedExamplePostUrl }) => {

  const examplePostFileInputRef = useRef<HTMLInputElement>(null);

  const handleExampleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onAnalyzeExamplePost(file);
    }
    if (event.target) {
        event.target.value = ''; // Reset file input
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
           <Input
            id="campaignName"
            value={request.campaignName || ""}
            onChange={(e) => onFieldChange('campaignName', e.target.value)}
            className="text-3xl font-bold border-0 focus:ring-0 focus:border-0 p-0 h-auto shadow-none disabled:bg-transparent"
            placeholder="Campaign Name"
            disabled={isSaving || isAnalyzingExamplePost}
          />
          <Badge variant={request.status === 'Pending' ? 'destructive' : request.status === 'Scheduled' ? 'default' : 'secondary'} className="capitalize text-sm px-3 py-1">
            {request.status}
          </Badge>
        </div>
        <CardDescription className="text-base">
          Managing content for {request.clientName || MERRY_MAIDS_CLIENT_DETAILS.clientName} (Req ID: {request.id})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
                <Label htmlFor="clientNameDisplay" className="flex items-center mb-1"><Users className="inline mr-2 h-4 w-4 text-primary" /><strong>Client Name:</strong></Label>
                <Input id="clientNameDisplay" value={request.clientName || MERRY_MAIDS_CLIENT_DETAILS.clientName} disabled className="text-sm bg-muted/30"/>
            </div>
             <div>
                <Label htmlFor="dueDate" className="flex items-center mb-1"><CalendarDays className="inline mr-2 h-4 w-4 text-primary" /><strong>Due Date:</strong></Label>
                <Input id="dueDate" type="date" value={request.dueDate ? new Date(request.dueDate).toISOString().split('T')[0] : ''} onChange={(e) => onFieldChange('dueDate', e.target.value)} disabled={isSaving || isAnalyzingExamplePost} className="text-sm"/>
            </div>
            <div>
                <Label htmlFor="platform" className="flex items-center mb-1"><Target className="inline mr-2 h-4 w-4 text-primary" /><strong>Platform:</strong></Label>
                 <Select value={request.platform} onValueChange={(value) => onFieldChange('platform', value as ContentRequest['platform'])} disabled={isSaving || isAnalyzingExamplePost}>
                    <SelectTrigger id="platform" className="text-sm"><SelectValue placeholder="Select platform" /></SelectTrigger>
                    <SelectContent>
                        {['Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'TikTok', 'Pinterest'].map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="clientNicheDisplay" className="flex items-center mb-1"><Settings2 className="inline mr-2 h-4 w-4 text-primary" /><strong>Client Niche:</strong></Label>
                <Input id="clientNicheDisplay" value={request.clientNiche || MERRY_MAIDS_CLIENT_DETAILS.clientNiche} disabled className="text-sm bg-muted/30"/>
            </div>
        </div>

        <Separator />

        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary flex items-center"><Info className="mr-2 h-5 w-5" />Core Inputs for AI</h3>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="reqTheme" className="flex items-center font-semibold mb-1"><Palette className="inline mr-2 h-4 w-4" />Specific Post Theme</Label>
                  <Input id="reqTheme" value={request.theme || ""} onChange={(e) => onFieldChange('theme', e.target.value)} placeholder="e.g., Kitchen cleaning tips" disabled={isSaving || isAnalyzingExamplePost} />
                </div>
                <div>
                  <Label htmlFor="reqCalendarContext" className="flex items-center font-semibold mb-1"><CalendarDays className="inline mr-2 h-4 w-4" />Calendar Context</Label>
                  <Input id="reqCalendarContext" value={request.calendar_context || ""} onChange={(e) => onFieldChange('calendar_context', e.target.value)} placeholder="e.g., Mother's Day, Back to School" disabled={isSaving || isAnalyzingExamplePost} />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="reqInitialTopicIdea" className="flex items-center font-semibold mb-1"><Lightbulb className="inline mr-2 h-4 w-4" />Key Message / Initial Idea for AI</Label>
                  <Input id="reqInitialTopicIdea" value={request.initialTopicIdea || ""} onChange={(e) => onFieldChange('initialTopicIdea', e.target.value)} placeholder="Core message for AI (e.g., Spring Cleaning)" disabled={isSaving || isAnalyzingExamplePost}/>
                </div>
            </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary flex items-center"><FileImage className="mr-2 h-5 w-5" />Optional: Start with an Example Post</h3>
           <p className="text-xs text-muted-foreground">Upload an image of a post you like. The AI will analyze it to help populate the "Creative Direction" below.</p>
          <div className="space-y-2">
            <Label htmlFor="examplePostUpload">Upload Example Post Image:</Label>
            <Input
              id="examplePostUpload"
              type="file"
              accept="image/png, image/jpeg, image/webp"
              ref={examplePostFileInputRef}
              onChange={handleExampleImageUpload}
              disabled={isSaving || isAnalyzingExamplePost}
            />
            {isAnalyzingExamplePost && <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Analyzing image...</div>}
            {uploadedExamplePostUrl && !isAnalyzingExamplePost && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-muted-foreground">Example loaded:</p>
                <Image src={uploadedExamplePostUrl} alt="Uploaded example post" width={150} height={150} className="rounded-md border" data-ai-hint="example social media"/>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary flex items-center"><LayoutGrid className="mr-2 h-5 w-5" />Creative Direction for AI</h3>
             <p className="text-xs text-muted-foreground">
                This direction is CRITICAL. It guides both AI text and image generation.
                Be very specific for best results, describing the scene, desired text content (headline, subheadline), font styles, branding (like footer details), output specs, and negative keywords.
                The AI image generator will use this to create the background. The text AI will use it for headlines, captions, etc.
                Use the detailed template provided when creating new requests as a guide.
            </p>
            <Textarea
              id="creativeDirectionDisplay"
              value={request.creative_direction || ""}
              onChange={(e) => onFieldChange('creative_direction', e.target.value)}
              rows={16}
              className="bg-muted/30 focus:border-primary text-xs disabled:bg-muted/10"
              placeholder="Describe image style, layout, overlay text ideas (headline, subheading, font styles), footer details, etc. Or, upload an example post above to have AI generate this for you."
              disabled={isSaving || isAnalyzingExamplePost}
            />
        </div>

        <Separator />
         <div className="space-y-2">
            <Label htmlFor="reqNotes" className="flex items-center font-semibold"><FileText className="mr-2 h-4 w-4" />Internal Creator Notes (Optional)</Label>
            <Textarea id="reqNotes" value={request.notes || ""} onChange={(e) => onFieldChange('notes', e.target.value)} placeholder="Any specific instructions or details..." disabled={isSaving || isAnalyzingExamplePost} rows={3}/>
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
            <h3 className="text-lg font-semibold text-primary mb-2">Brand Reference</h3>
             <div>
                <Label htmlFor="brandGuidelinesLink" className="flex items-center mb-1"><LinkIcon className="inline mr-2 h-4 w-4" /><strong>Brand Guidelines Link:</strong></Label>
                <Input id="brandGuidelinesLink" value={request.brandGuidelinesLink || ""} onChange={(e) => onFieldChange('brandGuidelinesLink', e.target.value)} disabled={isSaving || isAnalyzingExamplePost} className="text-sm"/>
            </div>
             <div>
                <Label htmlFor="brandVoice" className="flex items-center mb-1"><Mic className="inline mr-2 h-4 w-4" /><strong>Brand Voice:</strong></Label>
                <Textarea id="brandVoice" value={request.brandVoice || ""} onChange={(e) => onFieldChange('brandVoice', e.target.value)} disabled={isSaving || isAnalyzingExamplePost} rows={3} className="text-sm"/>
            </div>
             <div>
                <Label htmlFor="targetAudience" className="flex items-center mb-1"><Users className="inline mr-2 h-4 w-4" /><strong>Target Audience:</strong></Label>
                <Textarea id="targetAudience" value={request.targetAudience || ""} onChange={(e) => onFieldChange('targetAudience', e.target.value)} disabled={isSaving || isAnalyzingExamplePost} rows={3} className="text-sm"/>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Step 2: AI Text Generation
const AITextGenerationStep: React.FC<{
  request: ContentRequest;
  onGenerateStandardPost: () => void;
  onGenerateCreativePost: () => void;
  isGeneratingStandardPost: boolean;
  isGeneratingCreativePost: boolean;
  onSocialPostOutputFieldChange: (fieldName: keyof FullSocialPostOutput | `notes.${keyof FullSocialPostOutput['notes']}` | 'video_concept_ideas_string', value: any) => void;
}> = ({
  request,
  onGenerateStandardPost,
  onGenerateCreativePost,
  isGeneratingStandardPost,
  isGeneratingCreativePost,
  onSocialPostOutputFieldChange
}) => {
  const socialPostOutput = request.socialPostOutput || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT;

  const handleVideoIdeasChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const ideasArray = e.target.value.split('\n').map(s => s.trim()).filter(Boolean);
    onSocialPostOutputFieldChange('video_concept_ideas', ideasArray);
  };

  const videoIdeasString = Array.isArray(socialPostOutput.video_concept_ideas) ? socialPostOutput.video_concept_ideas.join('\n') : '';

  // This is now used for read-only display for the Textarea component
  const derivedImageCopyForDisplay = React.useMemo(() => {
      const h = socialPostOutput.headline_suggestion || "";
      const s = socialPostOutput.subheadline_suggestion || "";
      if (h && s) return `${h}\n${s}`;
      if (h) return h;
      if (s) return s;
      return socialPostOutput.image_copy || ""; 
  }, [socialPostOutput.headline_suggestion, socialPostOutput.subheadline_suggestion, socialPostOutput.image_copy]);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center"><Bot className="mr-2 h-6 w-6 text-primary"/>AI Generated Textual Content</CardTitle>
        <CardDescription>
          Generate or refine textual content for your social media post. All fields below are editable.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
         <div className="flex flex-wrap gap-2">
            <Button onClick={onGenerateStandardPost} disabled={isGeneratingStandardPost || !request.creative_direction} className="flex-grow sm:flex-grow-0">
                {isGeneratingStandardPost ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Generate/Regenerate Post (Standard)
            </Button>
            <Button onClick={onGenerateCreativePost} disabled={isGeneratingCreativePost || !request.creative_direction} className="flex-grow sm:flex-grow-0" variant="outline">
                {isGeneratingCreativePost ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                Generate/Regenerate Post (Creative)
            </Button>
            {!request.creative_direction && <p className="text-xs text-destructive mt-1 w-full text-center sm:text-left">Creative Direction (in Step 1) is required to generate textual content.</p>}
        </div>

        <Accordion type="single" collapsible className="w-full" defaultValue='item-1'>
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg font-semibold">Edit Main Content</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div>
                <Label htmlFor="aiHeadline" className="font-semibold">Headline Suggestion</Label>
                <Input id="aiHeadline" value={socialPostOutput.headline_suggestion || ""} onChange={(e) => onSocialPostOutputFieldChange('headline_suggestion', e.target.value)} placeholder="AI Suggested Headline" />
              </div>
              <div>
                <Label htmlFor="aiSubheadline" className="font-semibold">Subheadline Suggestion</Label>
                <Input id="aiSubheadline" value={socialPostOutput.subheadline_suggestion || ""} onChange={(e) => onSocialPostOutputFieldChange('subheadline_suggestion', e.target.value)} placeholder="AI Suggested Subheadline" />
              </div>
               <div>
                <Label htmlFor="aiImageCopyDisplay" className="font-semibold">Image Copy (Derived from Headline/Subheadline)</Label>
                <Textarea id="aiImageCopyDisplay" value={derivedImageCopyForDisplay} placeholder="Auto-generated from Headline & Subheadline" rows={3} readOnly className="bg-muted/50"/>
                 <p className="text-xs text-muted-foreground mt-1">This field is auto-populated. Edit Headline/Subheadline fields to change this.</p>
              </div>
              <div>
                <Label htmlFor="aiCaption" className="font-semibold">Caption</Label>
                <Textarea id="aiCaption" value={socialPostOutput.caption || ""} onChange={(e) => onSocialPostOutputFieldChange('caption', e.target.value)} placeholder="AI Suggested Caption" rows={5} />
              </div>
              <div>
                <Label htmlFor="aiAltText" className="font-semibold">Alt Text</Label>
                <Input id="aiAltText" value={socialPostOutput.alt_text || ""} onChange={(e) => onSocialPostOutputFieldChange('alt_text', e.target.value)} placeholder="AI Suggested Alt Text" />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg font-semibold">Edit Footer & Rationale</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div>
                <Label htmlFor="aiFooterL" className="font-semibold">Footer Left Text Suggestion</Label>
                <Textarea id="aiFooterL" value={socialPostOutput.footer_left_text_suggestion || ""} onChange={(e) => onSocialPostOutputFieldChange('footer_left_text_suggestion', e.target.value)} placeholder="AI Suggested Footer Left Text" rows={3}/>
              </div>
              <div>
                <Label htmlFor="aiFooterR" className="font-semibold">Footer Right Slogan Suggestion</Label>
                <Input id="aiFooterR" value={socialPostOutput.footer_right_slogan_suggestion || ""} onChange={(e) => onSocialPostOutputFieldChange('footer_right_slogan_suggestion', e.target.value)} placeholder="AI Suggested Footer Right Slogan" />
              </div>
              <div>
                <Label htmlFor="aiRationale" className="font-semibold">Rationale</Label>
                <Textarea id="aiRationale" value={socialPostOutput.rationale || ""} onChange={(e) => onSocialPostOutputFieldChange('rationale', e.target.value)} placeholder="AI Rationale" rows={3}/>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-lg font-semibold">Edit AI Notes & Video Ideas</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div>
                <Label htmlFor="aiLayoutTips" className="font-semibold">Layout Tips (from AI)</Label>
                <Textarea id="aiLayoutTips" value={socialPostOutput.notes?.layout_tips || ""} onChange={(e) => onSocialPostOutputFieldChange('notes.layout_tips', e.target.value)} placeholder="AI Layout Tips" rows={4}/>
              </div>
              <div className="text-sm">
                <p><strong>Suggested Brand Color (from AI):</strong> <span style={{ color: socialPostOutput.notes?.colour_hex || '#FFFFFF', backgroundColor: socialPostOutput.notes?.colour_hex ? (parseInt(socialPostOutput.notes.colour_hex.substring(1,3),16) > 128 ? 'black':'white') : 'transparent', padding: '0 4px', borderRadius: '3px' }}>{socialPostOutput.notes?.colour_hex || "N/A"}</span></p>
                <p><strong>Suggested Brand Font (from AI):</strong> {socialPostOutput.notes?.font || "N/A"}</p>
              </div>
              <div>
                <Label htmlFor="aiVideoIdeas" className="font-semibold">Video Concept Ideas (from AI, one idea per line)</Label>
                <Textarea id="aiVideoIdeas" value={videoIdeasString} onChange={handleVideoIdeasChange} placeholder="AI Video Concept Ideas" rows={3}/>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};


// Step 3: Visual Composition
const VisualComposerStep: React.FC<{
    request: ContentRequest;

    editableHeadline: string; setEditableHeadline: (text: string) => void;
    editableSubheadline: string; setEditableSubheadline: (text: string) => void;

    headlineFontFamily: string; setHeadlineFontFamily: (font: string) => void;
    headlineFontSize: number; setHeadlineFontSize: (size: number) => void;
    headlineColor: string; setHeadlineColor: (color: string) => void;
    subheadlineFontFamily: string; setSubheadlineFontFamily: (font: string) => void;
    subheadlineFontSize: number; setSubheadlineFontSize: (size: number) => void;
    subheadlineColor: string; setSubheadlineColor: (color: string) => void;

    generatedImageOptions: [string | null, string | null];
    selectedImageIndex: number | null;
    handleSelectImageOption: (index: number) => void;
    imageOptionsWereGeneratedWithAiText: [boolean, boolean];

    uploadedBackgroundImage: string | null;
    bgFileInputRef: React.RefObject<HTMLInputElement>;
    uploadedLogoUrl: string | null;
    logoFileInputRef: React.RefObject<HTMLInputElement>;
    uploadedFooterImageUrl: string | null;
    footerFileInputRef: React.RefObject<HTMLInputElement>;


    headlinePosition: DraggableElementPosition; setHeadlinePosition: (pos: DraggableElementPosition) => void;
    subheadlinePosition: DraggableElementPosition; setSubheadlinePosition: (pos: DraggableElementPosition) => void;
    logoPosition: DraggableElementPosition; setLogoPosition: (pos: DraggableElementPosition) => void;

    draggingElement: 'headline' | 'subheadline' | 'logo' | null;
    imagePreviewRef: React.RefObject<HTMLDivElement>;

    isGeneratingImage: boolean; // This prop is expected
    imageEditingPrompt: string; setImageEditingPrompt: (prompt: string) => void;
    isUpdatingImage: boolean;

    onGenerateImageWithOptions: (renderTextDirectly: boolean) => void;
    onUpdateSelectedImage: () => void;

    onClearUploadedImage: (type: 'background' | 'logo' | 'footer') => void;
    onImageFileUpload: (event: React.ChangeEvent<HTMLInputElement>, type: 'background' | 'logo' | 'footer') => void;
    handleMouseDown: (e: React.MouseEvent<HTMLDivElement>, elementType: 'headline' | 'subheadline' | 'logo') => void;
    handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
    handleMouseUp: () => void;

    imageWasGeneratedWithAiText: boolean;
}> = (props) => {
    const {
        request,
        editableHeadline, setEditableHeadline, editableSubheadline, setEditableSubheadline,
        headlineFontFamily, setHeadlineFontFamily, headlineFontSize, setHeadlineFontSize, headlineColor, setHeadlineColor,
        subheadlineFontFamily, setSubheadlineFontFamily, subheadlineFontSize, setSubheadlineFontSize, subheadlineColor, setSubheadlineColor,

        generatedImageOptions, selectedImageIndex, handleSelectImageOption, imageOptionsWereGeneratedWithAiText,

        uploadedBackgroundImage, uploadedLogoUrl, uploadedFooterImageUrl,
        bgFileInputRef, logoFileInputRef, footerFileInputRef,

        headlinePosition, setHeadlinePosition,
        subheadlinePosition, setSubheadlinePosition,
        logoPosition, setLogoPosition,

        draggingElement, imagePreviewRef,

        isGeneratingImage: isGeneratingImageProps, // Renamed to avoid conflict
        imageEditingPrompt, setImageEditingPrompt, isUpdatingImage,
        onGenerateImageWithOptions, onUpdateSelectedImage,

        onClearUploadedImage, onImageFileUpload,
        handleMouseDown, handleMouseMove, handleMouseUp,
        imageWasGeneratedWithAiText
    } = props;

  const [isGeneratingImageStep, setIsGeneratingImageStep] = useState(false); // Local loading state for buttons in this step

  const selectedGeneratedImageUrl = useMemo(() => {
    if (selectedImageIndex !== null && generatedImageOptions && generatedImageOptions[selectedImageIndex]) {
        return generatedImageOptions[selectedImageIndex];
    }
    return null;
  }, [selectedImageIndex, generatedImageOptions]);

  const currentBaseImage = uploadedBackgroundImage || selectedGeneratedImageUrl;

  const previewHeadlineStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${headlinePosition.x}%`,
    top: `${headlinePosition.y}%`,
    transform: 'translate(-50%, -50%)',
    fontFamily: headlineFontFamily,
    fontSize: `${headlineFontSize * 0.75}px`, // Adjusted for preview scale
    color: headlineColor,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textShadow: '1px 1px 0px rgba(0,0,0,0.6), -1px -1px 0px rgba(0,0,0,0.6), 1px -1px 0px rgba(0,0,0,0.6), -1px 1px 0px rgba(0,0,0,0.6), 1px 1px 2px rgba(0,0,0,0.5)',
    lineHeight: '1.1',
    userSelect: 'none',
    cursor: draggingElement ? 'grabbing' : 'grab',
    padding: '2px',
    textAlign: 'center',
    whiteSpace: 'pre-wrap', // To respect newlines in the headline text
  };

  const previewSubheadlineStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${subheadlinePosition.x}%`,
    top: `${subheadlinePosition.y}%`,
    transform: 'translate(-50%, -50%)',
    fontFamily: subheadlineFontFamily,
    fontSize: `${subheadlineFontSize * 0.75}px`, // Adjusted for preview scale
    color: subheadlineColor,
    fontStyle: subheadlineFontFamily.toLowerCase().includes('cursive') || subheadlineFontFamily.toLowerCase().includes('script') ? 'italic' : 'normal',
    textShadow: '1px 1px 0px rgba(0,0,0,0.6), -1px -1px 0px rgba(0,0,0,0.6), 1px -1px 0px rgba(0,0,0,0.6), -1px 1px 0px rgba(0,0,0,0.6), 1px 1px 2px rgba(0,0,0,0.5)',
    lineHeight: '1.1',
    userSelect: 'none',
    cursor: draggingElement ? 'grabbing' : 'grab',
    padding: '2px',
    textAlign: 'center',
    whiteSpace: 'pre-wrap', // To respect newlines
  };


  const handleGenerateImageWithOptionsClick = async (renderText: boolean) => {
    setIsGeneratingImageStep(true);
    await onGenerateImageWithOptions(renderText);
    setIsGeneratingImageStep(false);
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center"><ImageIcon className="mr-2 h-6 w-6 text-primary"/>Interactive Image Composer & Download</CardTitle>
        <CardDescription>
          Generate AI background options, upload assets, edit text overlays, and position elements.
          {imageWasGeneratedWithAiText && selectedGeneratedImageUrl && <span className="block text-xs text-primary mt-1">Selected image was generated with AI attempting to render text. Draggable text overlays are hidden for it.</span>}
          {!imageWasGeneratedWithAiText && (currentBaseImage) && <span className="block text-xs text-muted-foreground mt-1">Headline, Subheadline, and Logo are draggable on the selected image below.</span>}
           <p className="text-xs text-muted-foreground mt-1">
              Text and logo rendering in this preview is approximate. Use Download (Step 4) for the final composed image.
            </p>
            { imageOptionsWereGeneratedWithAiText[selectedImageIndex ?? 0] && <p className="text-xs text-destructive mt-1">
              AI Text Rendering is experimental. If text isn't visible/correct, use 'Generate AI Background' and the composer below.
            </p>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="editableHeadlineDraggable" className="font-semibold">Headline Text (Draggable)</Label>
                <Input
                    id="editableHeadlineDraggable"
                    placeholder="AI populates from Step 2"
                    value={editableHeadline}
                    onChange={(e) => setEditableHeadline(e.target.value)}
                    className="bg-muted/30 focus:border-primary"
                />
            </div>
            <div>
                <Label htmlFor="editableSubheadlineDraggable" className="font-semibold">Subheadline Text (Draggable)</Label>
                <Input
                    id="editableSubheadlineDraggable"
                    placeholder="AI populates from Step 2"
                    value={editableSubheadline}
                    onChange={(e) => setEditableSubheadline(e.target.value)}
                    className="bg-muted/30 focus:border-primary"
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-2 border p-3 rounded-md">
            <div className="font-medium flex items-center"><Type className="mr-2 h-4 w-4"/>Headline Style</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="headlineFontFamily" className="text-xs">Font Family</Label>
                 <Select value={headlineFontFamily} onValueChange={setHeadlineFontFamily}>
                  <SelectTrigger id="headlineFontFamily"><SelectValue placeholder="Select font" /></SelectTrigger>
                  <SelectContent>
                    {WEB_SAFE_FONTS.map(font => <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="headlineFontSize" className="text-xs">Font Size (px)</Label>
                <Input id="headlineFontSize" type="number" value={headlineFontSize} onChange={(e) => setHeadlineFontSize(parseInt(e.target.value, 10) || 30)} className="h-9"/>
              </div>
            </div>
            <div>
              <Label htmlFor="headlineColor" className="text-xs">Font Color</Label>
              <Input id="headlineColor" type="color" value={headlineColor} onChange={(e) => setHeadlineColor(e.target.value)} className="h-9 w-full"/>
            </div>
          </div>

          <div className="space-y-2 border p-3 rounded-md">
            <div className="font-medium flex items-center"><Type className="mr-2 h-4 w-4"/>Subheadline Style</div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                <Label htmlFor="subheadlineFontFamily" className="text-xs">Font Family</Label>
                <Select value={subheadlineFontFamily} onValueChange={setSubheadlineFontFamily}>
                  <SelectTrigger id="subheadlineFontFamily"><SelectValue placeholder="Select font" /></SelectTrigger>
                  <SelectContent>
                    {WEB_SAFE_FONTS.map(font => <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subheadlineFontSize" className="text-xs">Font Size (px)</Label>
                <Input id="subheadlineFontSize" type="number" value={subheadlineFontSize} onChange={(e) => setSubheadlineFontSize(parseInt(e.target.value, 10) || 20)} className="h-9"/>
              </div>
            </div>
            <div>
              <Label htmlFor="subheadlineColor" className="text-xs">Font Color</Label>
              <Input id="subheadlineColor" type="color" value={subheadlineColor} onChange={(e) => setSubheadlineColor(e.target.value)} className="h-9 w-full"/>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="logoUpload" className="flex items-center"><LogOut className="mr-2 h-4 w-4 text-muted-foreground"/>Merry Maids Logo (Draggable)</Label>
              <div className="flex items-center space-x-2">
                <Input id="logoUpload" type="file" accept="image/png, image/svg+xml, image/jpeg" ref={logoFileInputRef} onChange={(e) => onImageFileUpload(e, 'logo')} className="flex-grow"/>
                {uploadedLogoUrl && uploadedLogoUrl !== MERRY_MAIDS_CLIENT_DETAILS.uploadedLogoUrl && <Button variant="ghost" size="icon" onClick={() => onClearUploadedImage('logo')} aria-label="Clear uploaded logo & revert to default"><X className="h-4 w-4" /></Button>}
              </div>
               {uploadedLogoUrl && <p className="text-xs text-muted-foreground mt-1">Current logo: {uploadedLogoUrl === MERRY_MAIDS_CLIENT_DETAILS.uploadedLogoUrl ? "Default Merry Maids Logo" : "Custom Uploaded Logo"}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="footerImageUpload" className="flex items-center"><Footprints className="mr-2 h-4 w-4 text-muted-foreground"/>Custom Footer Image (Optional)</Label>
                <div className="flex items-center space-x-2">
                    <Input id="footerImageUpload" type="file" accept="image/*" ref={footerFileInputRef} onChange={(e) => onImageFileUpload(e, 'footer')} className="flex-grow"/>
                    {uploadedFooterImageUrl && <Button variant="ghost" size="icon" onClick={() => onClearUploadedImage('footer')} aria-label="Remove uploaded footer image"><X className="h-4 w-4" /></Button>}
                </div>
                {uploadedFooterImageUrl && <div className="mt-2 relative w-full max-w-xs h-32 border rounded-md overflow-hidden"><Image src={uploadedFooterImageUrl} alt="Uploaded footer preview" layout="fill" objectFit="cover" data-ai-hint="footer graphic"/></div>}
            </div>
          </div>

         <div className="space-y-2">
              <Label htmlFor="bgImageUpload" className="flex items-center"><UploadCloud className="mr-2 h-4 w-4 text-muted-foreground"/>Custom Background (Optional, Overrides AI Gen)</Label>
              <div className="flex items-center space-x-2">
                  <Input id="bgImageUpload" type="file" accept="image/*" ref={bgFileInputRef} onChange={(e) => onImageFileUpload(e, 'background')} className="flex-grow"/>
                  {uploadedBackgroundImage && <Button variant="ghost" size="icon" onClick={() => onClearUploadedImage('background')} aria-label="Remove uploaded background image"><X className="h-4 w-4" /></Button>}
              </div>
              {uploadedBackgroundImage && <div className="mt-2 relative w-full max-w-xs h-32 border rounded-md overflow-hidden"><Image src={uploadedBackgroundImage} alt="Uploaded background preview" layout="fill" objectFit="cover" data-ai-hint="background preview"/></div>}
          </div>

        <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4">
          <Button
              onClick={() => handleGenerateImageWithOptionsClick(false)}
              disabled={isGeneratingImageStep || isGeneratingImageProps || !!uploadedBackgroundImage || !request.creative_direction}
              className="w-full sm:w-auto"
              title={!request.creative_direction ? "Creative Direction (Step 1) is needed to generate an AI background." : uploadedBackgroundImage ? "Clear custom background to enable AI generation." : "AI will generate background image options based on Creative Direction (Gemini)."}
          >
            {isGeneratingImageStep || isGeneratingImageProps ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            {(generatedImageOptions[0] || generatedImageOptions[1]) ? "Regenerate AI Background (Gemini)" : "Generate AI Background (Gemini)"}
          </Button>
          <div>
            <Button
                onClick={() => handleGenerateImageWithOptionsClick(true)}
                disabled={isGeneratingImageStep || isGeneratingImageProps || !!uploadedBackgroundImage || !request.creative_direction}
                className="w-full sm:w-auto"
                title={!request.creative_direction ? "Creative Direction (Step 1) is needed to generate an AI image with text." : uploadedBackgroundImage ? "Clear custom background to enable AI generation with text." : "AI will attempt to generate image options WITH text rendered (Experimental - Gemini)."}
            >
              {isGeneratingImageStep || isGeneratingImageProps ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TextCursorInput className="mr-2 h-4 w-4" />}
              {(generatedImageOptions[0] || generatedImageOptions[1]) ? "Regenerate w/ AI Text (Gemini - Exp.)" : "Generate Image w/ AI Text (Gemini - Exp.)"}
            </Button>
             <p className="text-xs text-muted-foreground mt-1 text-center sm:text-left">
              Gemini AI text rendering is experimental & may be unreliable. <br/> Use Download (Step 4) for precise text control if needed.
            </p>
          </div>
        </div>
        {(!request.creative_direction && !uploadedBackgroundImage && !(isGeneratingImageStep || isGeneratingImageProps)) && <p className="text-xs text-center text-destructive mt-2">Provide 'Creative Direction' (in Step 1) to enable AI background generation, or upload a custom background.</p>}
        {(isGeneratingImageStep || isGeneratingImageProps) && <div className="flex flex-col items-center justify-center p-8 mt-4"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /><p className="text-muted-foreground">Generating your AI image options, please wait...</p></div>}

        <div key={generatedImageOptions.map((url, idx) => `${url || 'null'}-${idx}`).join('|')} className="mt-6">
             {(generatedImageOptions[0] || generatedImageOptions[1]) && selectedImageIndex === null && !(isGeneratingImageStep || isGeneratingImageProps) && (
                <div className="p-4 border rounded-md bg-muted/30">
                    <h4 className="text-lg font-semibold mb-3 text-center">Generated Image Options - Select One:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    {generatedImageOptions.map((imgUrl, index) => (
                        <div key={`option-${index}`} className="flex flex-col items-center space-y-2 p-2 border rounded-md hover:shadow-lg transition-shadow">
                        {imgUrl ? (
                            <div className="relative w-full aspect-square overflow-hidden rounded-md">
                            <Image src={imgUrl} alt={`Generated Option ${index + 1}`} layout="fill" objectFit="contain" data-ai-hint="social media option"/>
                            </div>
                        ) : (
                            <div className="w-full aspect-square bg-muted/50 rounded-md flex flex-col items-center justify-center text-sm text-muted-foreground">
                            <ImageIcon className="h-12 w-12 mb-2" />
                            <p>Option {index + 1} Not Generated</p>
                            </div>
                        )}
                        {imgUrl && (
                            <Button
                            onClick={() => handleSelectImageOption(index)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                            >
                            Select Option {index + 1}
                            </Button>
                        )}
                        </div>
                    ))}
                    </div>
                </div>
            )}
        </div>


        {selectedImageIndex !== null && generatedImageOptions[selectedImageIndex] && !uploadedBackgroundImage && (
          <div className="mt-4 space-y-3">
             <h4 className="text-md font-semibold text-center">Editing Selected Image Option {selectedImageIndex + 1}</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Textarea
                    value={imageEditingPrompt}
                    onChange={(e) => setImageEditingPrompt(e.target.value)}
                    placeholder="Enter prompt to edit the selected image (e.g., 'make the sky bluer', 'add more flowers')..."
                    rows={3}
                    className="text-xs"
                />
                <Button onClick={onUpdateSelectedImage} disabled={isUpdatingImage || !imageEditingPrompt || selectedImageIndex === null}>
                    {isUpdatingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Replace className="mr-2 h-4 w-4"/>}
                    Update Selected Image
                </Button>
            </div>
             <div
              ref={imagePreviewRef}
              className="relative w-full max-w-md mx-auto aspect-square shadow-md rounded-md overflow-hidden border select-none bg-muted cursor-grab active:cursor-grabbing"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <Image src={currentBaseImage!} alt="Image Preview" layout="fill" objectFit="cover" data-ai-hint="social media base cleaning" draggable="false"/>

              {!imageWasGeneratedWithAiText && editableHeadline && (
                  <div
                    className="draggable-text-wrapper"
                    style={previewHeadlineStyle}
                    onMouseDown={(e) => handleMouseDown(e, 'headline')}
                  >
                      {editableHeadline.split('\n').map((line,i) => <div key={`h-line-${i}`}>{line}</div>)}
                  </div>
              )}
              {!imageWasGeneratedWithAiText && editableSubheadline && (
                  <div
                    className="draggable-text-wrapper"
                    style={previewSubheadlineStyle}
                    onMouseDown={(e) => handleMouseDown(e, 'subheadline')}
                  >
                      {editableSubheadline.split('\n').map((line,i) => <div key={`s-line-${i}`}>{line}</div>)}
                  </div>
              )}


              {uploadedLogoUrl && !imageWasGeneratedWithAiText && (
                <div
                    className="draggable-logo absolute cursor-move select-none pointer-events-auto"
                    style={{
                        left: `${logoPosition.x}%`,
                        top: `${logoPosition.y}%`,
                        transform: `translate(-50%, -50%)`,
                        touchAction: 'none',
                        userSelect: 'none',
                        width: '100px', 
                        height: '50px', 
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'logo')}
                >
                  <Image src={uploadedLogoUrl} alt="Uploaded Logo" layout="fill" objectFit="contain" data-ai-hint="company logo" draggable="false" className="pointer-events-none"/>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedImageIndex === null && uploadedBackgroundImage && (
             <div className="mt-4 space-y-3">
                <h4 className="text-md font-semibold text-center">Editing Custom Uploaded Background</h4>
                <div
                ref={imagePreviewRef}
                className="relative w-full max-w-md mx-auto aspect-square shadow-md rounded-md overflow-hidden border select-none bg-muted cursor-grab active:cursor-grabbing"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                >
                    <Image src={currentBaseImage!} alt="Custom Background Preview" layout="fill" objectFit="cover" data-ai-hint="custom social media background" draggable="false"/>
                    {!imageWasGeneratedWithAiText && editableHeadline && (
                        <div
                            className="draggable-text-wrapper"
                            style={previewHeadlineStyle}
                            onMouseDown={(e) => handleMouseDown(e, 'headline')}
                        >
                            {editableHeadline.split('\n').map((line,i) => <div key={`h-line-${i}`}>{line}</div>)}
                        </div>
                    )}
                    {!imageWasGeneratedWithAiText && editableSubheadline && (
                        <div
                           className="draggable-text-wrapper"
                            style={previewSubheadlineStyle}
                            onMouseDown={(e) => handleMouseDown(e, 'subheadline')}
                        >
                           {editableSubheadline.split('\n').map((line,i) => <div key={`s-line-${i}`}>{line}</div>)}
                        </div>
                    )}
                    {uploadedLogoUrl && !imageWasGeneratedWithAiText && (
                        <div className="draggable-logo absolute cursor-move select-none pointer-events-auto"
                        style={{
                            left: `${logoPosition.x}%`, top: `${logoPosition.y}%`, transform: `translate(-50%, -50%)`, touchAction: 'none', userSelect: 'none', width: '100px', height: '50px',
                        }}
                        onMouseDown={(e) => handleMouseDown(e, 'logo')}
                        >
                        <Image src={uploadedLogoUrl} alt="Uploaded Logo" layout="fill" objectFit="contain" data-ai-hint="company logo" draggable="false" className="pointer-events-none"/>
                        </div>
                    )}
                </div>
            </div>
        )}

        {selectedImageIndex === null && !currentBaseImage && !(isGeneratingImageStep || isGeneratingImageProps) && !(generatedImageOptions[0] || generatedImageOptions[1]) && <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-md mt-4"><ImageIcon className="h-16 w-16 text-muted-foreground mb-4" /><p className="text-muted-foreground">No base image loaded.</p><p className="text-xs text-muted-foreground">Upload a custom background, or use an AI generation button above.</p></div>}

      </CardContent>
    </Card>
  );
};

// Step 4: Download
const DownloadStep: React.FC<{
    request: ContentRequest;
    editableHeadline: string;
    editableSubheadline: string;
    headlineFontFamily: string; headlineFontSize: number; headlineColor: string;
    subheadlineFontFamily: string; subheadlineFontSize: number; subheadlineColor: string;
    headlinePosition: DraggableElementPosition;
    subheadlinePosition: DraggableElementPosition;
    logoPosition: DraggableElementPosition;

    selectedGeneratedImageUrl: string | null;
    uploadedBackgroundImage: string | null;
    uploadedLogoUrl: string | null;
    uploadedFooterImageUrl: string | null;

    onDownloadImage: () => void;
    onDownloadSvg: () => void;
    imageWasGeneratedWithAiText: boolean;
}> = ({
    request,
    editableHeadline, editableSubheadline,
    headlineFontFamily, headlineFontSize, headlineColor,
    subheadlineFontFamily, subheadlineFontSize, subheadlineColor,
    headlinePosition, subheadlinePosition, logoPosition,
    selectedGeneratedImageUrl, uploadedBackgroundImage, uploadedLogoUrl, uploadedFooterImageUrl,
    onDownloadImage, onDownloadSvg, imageWasGeneratedWithAiText
}) => {
    const socialPostOutput = request.socialPostOutput || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT;
    const baseImageForDownload = uploadedBackgroundImage || selectedGeneratedImageUrl;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl flex items-center"><Download className="mr-2 h-6 w-6 text-primary"/>Download Final Image</CardTitle>
                <CardDescription>
                    Review the active post details and download the composed image (PNG or SVG for Figma).
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-sm space-y-1 bg-muted/30 p-3 rounded-md">
                   {imageWasGeneratedWithAiText && selectedGeneratedImageUrl ? (
                     <p><strong>Image Content:</strong> AI attempted to render text directly on the selected image.</p>
                   ) : (
                     <>
                        <p><strong>Headline:</strong> {editableHeadline || "N/A"}</p>
                        <p><strong>Subheadline:</strong> {editableSubheadline || "N/A"}</p>
                     </>
                   )}
                    <p><strong>Caption (for social post):</strong> <span className="whitespace-pre-wrap block text-xs">{socialPostOutput.caption || "N/A"}</span></p>
                    <p><strong>Footer Left:</strong> <span className="whitespace-pre-wrap block text-xs">{socialPostOutput.footer_left_text_suggestion || "N/A"}</span></p>
                    <p><strong>Footer Right:</strong> <span className="whitespace-pre-wrap block text-xs">{socialPostOutput.footer_right_slogan_suggestion || "N/A"}</span></p>
                </div>
                 <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 mt-6 pt-4 border-t">
                    <Button onClick={onDownloadImage} disabled={!baseImageForDownload} className="w-full sm:w-auto">
                        <Download className="mr-2 h-4 w-4" />
                        Download Composed Image (PNG)
                    </Button>
                    <Button onClick={onDownloadSvg} disabled={!baseImageForDownload} className="w-full sm:w-auto" variant="outline">
                        <Figma className="mr-2 h-4 w-4" />
                        Download as SVG (for Figma)
                    </Button>
                </div>
                 {!baseImageForDownload && <p className="text-xs text-center text-destructive mt-2">Please select or upload a background image in Step 3 before downloading.</p>}
            </CardContent>
        </Card>
    );
};


export function ContentRequestDetailClient({ initialRequest }: ContentRequestDetailClientProps) {
  const [request, setRequest] = useState<ContentRequest | null>(null);
  const requestRef = useRef<ContentRequest | null>(null);
  const initialDataLoadedRef = useRef(false);
  const isAiUpdatingRef = useRef(false); // Guard to prevent feedback loops from AI updates

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [isGeneratingStandardPost, setIsGeneratingStandardPost] = useState<boolean>(false);
  const [isGeneratingCreativePost, setIsGeneratingCreativePost] = useState<boolean>(false);
  
  const [generatedImageOptions, setGeneratedImageOptions] = useState<[string | null, string | null]>(initialRequest?.generatedImageOptions || [null, null]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(initialRequest?.selectedImageIndex !== undefined ? initialRequest.selectedImageIndex : null);
  const [imageOptionsWereGeneratedWithAiText, setImageOptionsWereGeneratedWithAiText] = useState<[boolean, boolean]>(initialRequest?.imageOptionsWereGeneratedWithAiText || [false, false]);
  const [imageWasGeneratedWithAiText, setImageWasGeneratedWithAiText] = useState<boolean>(initialRequest?.imageWasGeneratedWithAiText || false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false); // Tracks general image generation loading state
  
  const [imageEditingPrompt, setImageEditingPrompt] = useState("");
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);

  const [uploadedExamplePostUrl, setUploadedExamplePostUrl] = useState<string | null>(initialRequest?.uploadedExamplePostUrl || null);
  const [isAnalyzingExamplePost, setIsAnalyzingExamplePost] = useState<boolean>(false);

  const currentSocialPostOutput = useMemo(() => {
    return request?.socialPostOutput || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT;
  }, [request?.socialPostOutput]);

  // Editable text state for the composer
  const [editableHeadline, setEditableHeadline] = useState<string>("");
  const [editableSubheadline, setEditableSubheadline] = useState<string>("");

  const [uploadedBackgroundImage, setUploadedBackgroundImage] = useState<string | null>(initialRequest?.uploadedBackgroundImageUrl || null);
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(initialRequest?.uploadedLogoUrl || MERRY_MAIDS_CLIENT_DETAILS.uploadedLogoUrl || null);
  const [uploadedFooterImageUrl, setUploadedFooterImageUrl] = useState<string | null>(initialRequest?.uploadedFooterImageUrl || null);

  const [headlinePosition, setHeadlinePosition] = useState<DraggableElementPosition>(initialRequest?.headlinePosition || DEFAULT_HEADLINE_POSITION);
  const [subheadlinePosition, setSubheadlinePosition] = useState<DraggableElementPosition>(initialRequest?.subheadlinePosition || DEFAULT_SUBHEADLINE_POSITION);
  const [logoPosition, setLogoPosition] = useState<DraggableElementPosition>(initialRequest?.logoOverlayPosition || DEFAULT_LOGO_POSITION);

  const [draggingElement, setDraggingElement] = useState<'headline' | 'subheadline' | 'logo' | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
  const [elementStart, setElementStart] = useState<{ x: number, y: number } | null>(null);

  const imagePreviewRef = useRef<HTMLDivElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const footerFileInputRef = useRef<HTMLInputElement>(null);

  const [headlineFontFamily, setHeadlineFontFamily] = useState(DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.headlineFontFamily!);
  const [headlineFontSize, setHeadlineFontSize] = useState(DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.headlineFontSize!);
  const [headlineColor, setHeadlineColor] = useState(DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.headlineColor!);
  const [subheadlineFontFamily, setSubheadlineFontFamily] = useState(DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.subheadlineFontFamily!);
  const [subheadlineFontSize, setSubheadlineFontSize] = useState(DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.subheadlineFontSize!);
  const [subheadlineColor, setSubheadlineColor] = useState(DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.subheadlineColor!);
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();


  const updateRequestInFirestore = useCallback(async (updatedFields: Partial<ContentRequest>, skipToast = false) => {
    if (!requestRef.current) return;
    setIsSaving(true);

    let newRequestState: ContentRequest = { ...requestRef.current, ...updatedFields, updatedAt: new Date().toISOString() };

    if (newRequestState.socialPostOutput) {
        newRequestState.socialPostOutput = {
          ...DEFAULT_SINGLE_SOCIAL_POST_OUTPUT,
          ...newRequestState.socialPostOutput,
          notes: {
            ...DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes,
            ...(newRequestState.socialPostOutput.notes || {})
          }
        };
    } else {
        newRequestState.socialPostOutput = JSON.parse(JSON.stringify(DEFAULT_SINGLE_SOCIAL_POST_OUTPUT));
    }

    const imageFieldsToSanitize: (keyof Pick<ContentRequest, 'generatedImageOptions' | 'uploadedBackgroundImageUrl' | 'uploadedLogoUrl' | 'uploadedFooterImageUrl' | 'uploadedExamplePostUrl'>)[] = ['generatedImageOptions', 'uploadedBackgroundImageUrl', 'uploadedLogoUrl', 'uploadedFooterImageUrl', 'uploadedExamplePostUrl'];
    let imagesWereSanitizedThisCall = false;

    for (const field of imageFieldsToSanitize) {
      if (field === 'generatedImageOptions' && newRequestState[field]) {
        const options = newRequestState[field] as [string | null, string | null];
        const sanitizedOptions: [string | null, string | null] = [null, null];
          for (let i = 0; i < options.length; i++) {
            const fieldValue = options[i];
            if (fieldValue && typeof fieldValue === 'string' && fieldValue.startsWith('data:image') && fieldValue.length > MAX_IMAGE_DATA_LENGTH) {
              if (!skipToast) {
                toast({
                    title: "Image Too Large to Save",
                    description: `An AI generated image option (length: ${fieldValue.length.toLocaleString()}) is too large (>${(MAX_IMAGE_DATA_LENGTH).toLocaleString()}) and was not saved. It will be lost on refresh if not saved externally.`,
                    variant: "destructive",
                    duration: 7000,
                });
              }
              sanitizedOptions[i] = undefined as any; 
              imagesWereSanitizedThisCall = true;
            } else {
              sanitizedOptions[i] = fieldValue;
            }
          }
          (newRequestState as any)[field] = sanitizedOptions;
        
      } else {
        const fieldValue = newRequestState[field] as string | undefined;
        if (fieldValue && typeof fieldValue === 'string' && fieldValue.startsWith('data:image') && fieldValue.length > MAX_IMAGE_DATA_LENGTH) {
            if (!skipToast) {
              toast({
                  title: "Image Too Large to Save",
                  description: `The image for "${field}" (length: ${fieldValue.length.toLocaleString()}) is too large (>${(MAX_IMAGE_DATA_LENGTH).toLocaleString()}) and was not saved. It will be lost on refresh if not saved externally.`,
                  variant: "destructive",
                  duration: 7000,
              });
            }
            (newRequestState as any)[field] = undefined; 
            imagesWereSanitizedThisCall = true;
        }
      }
    }
    
    // Sanitize individual slide images in carouselOutput if it exists
    if (newRequestState.carouselOutput && newRequestState.carouselOutput.slides) {
      const sanitizedSlides = newRequestState.carouselOutput.slides.map(slide => {
        if (slide.generatedImageUrl && typeof slide.generatedImageUrl === 'string' && slide.generatedImageUrl.startsWith('data:image') && slide.generatedImageUrl.length > MAX_IMAGE_DATA_LENGTH) {
          if (!skipToast) {
            toast({
              title: "Carousel Slide Image Too Large",
              description: `A carousel slide image (length: ${slide.generatedImageUrl.length.toLocaleString()}) is too large and was not saved.`,
              variant: "destructive",
              duration: 7000,
            });
          }
          imagesWereSanitizedThisCall = true;
          return { ...slide, generatedImageUrl: undefined };
        }
        return slide;
      });
      newRequestState.carouselOutput = { ...newRequestState.carouselOutput, slides: sanitizedSlides };
    }


    try {
      const requestToSave = JSON.parse(JSON.stringify(newRequestState)); 
      
      await saveContentRequest(requestToSave);
      setRequest(newRequestState); 
      requestRef.current = newRequestState;
       if (!skipToast && !imagesWereSanitizedThisCall && Object.keys(updatedFields).length > 0 && Object.keys(updatedFields).some(key => !['updatedAt', 'createdAt', 'id'].includes(key))) {
         toast({ title: "Changes Saved", description: "Your updates have been saved to Firestore.", duration: 3000 });
       }
    } catch (error: any) {
        let description = 'Failed to save content request.';
         if (error.message && typeof error.message === 'string') {
            description = error.message; 
        } else if (error.code && typeof error.code === 'string') {
             description = `Failed to save content request. Firebase Code: ${error.code}`;
        }
        if (!skipToast) {
          toast({
              title: "Error Saving to Firestore",
              description: description,
              variant: "destructive",
              duration: 7000,
          });
        }
        console.error("Firestore Save Error Details (client trying to save):", error);
    } finally {
      setIsSaving(false);
    }
  }, [toast]);

  useEffect(() => {
    requestRef.current = request;
  }, [request]);

  useEffect(() => {
    if (!initialDataLoadedRef.current || !request?.socialPostOutput) return;
    
    isAiUpdatingRef.current = true; 

    const output = request.socialPostOutput;
    const notes = output.notes || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes;

    const aiHeadline = output.headline_suggestion || "";
    const aiSubheadline = output.subheadline_suggestion || "";

    if (editableHeadline !== aiHeadline) setEditableHeadline(aiHeadline);
    if (editableSubheadline !== aiSubheadline) setEditableSubheadline(aiSubheadline);
    
    if(headlineFontFamily !== (notes.headlineFontFamily || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.headlineFontFamily!)) setHeadlineFontFamily(notes.headlineFontFamily || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.headlineFontFamily!);
    if(headlineFontSize !== (notes.headlineFontSize || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.headlineFontSize!)) setHeadlineFontSize(notes.headlineFontSize || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.headlineFontSize!);
    if(headlineColor !== (notes.headlineColor || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.headlineColor!)) setHeadlineColor(notes.headlineColor || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.headlineColor!);
    if(subheadlineFontFamily !== (notes.subheadlineFontFamily || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.subheadlineFontFamily!)) setSubheadlineFontFamily(notes.subheadlineFontFamily || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.subheadlineFontFamily!);
    if(subheadlineFontSize !== (notes.subheadlineFontSize || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.subheadlineFontSize!)) setSubheadlineFontSize(notes.subheadlineFontSize || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.subheadlineFontSize!);
    if(subheadlineColor !== (notes.subheadlineColor || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.subheadlineColor!)) setSubheadlineColor(notes.subheadlineColor || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.subheadlineColor!);

    requestAnimationFrame(() => { isAiUpdatingRef.current = false; });

  }, [request?.socialPostOutput]);

  const debouncedSaveEditableTexts = useCallback(
    debounce(() => {
      if (!initialDataLoadedRef.current || isAiUpdatingRef.current || isSaving) return;

      const latestRequest = requestRef.current;
      if (!latestRequest || !latestRequest.socialPostOutput) return;

      const currentOutput = latestRequest.socialPostOutput;
      const derivedImgCopy = (() => {
          const h = editableHeadline || "";
          const s = editableSubheadline || "";
          if (h && s) return `${h}\n${s}`;
          if (h) return h;
          if (s) return s;
          return "";
      })();


      if (
        currentOutput.headline_suggestion !== editableHeadline ||
        currentOutput.subheadline_suggestion !== editableSubheadline
      ) {
        let updatedOutput: FullSocialPostOutput = {
            ...currentOutput,
            headline_suggestion: editableHeadline,
            subheadline_suggestion: editableSubheadline,
            image_copy: derivedImgCopy, 
        };
        updatedOutput = { ...DEFAULT_SINGLE_SOCIAL_POST_OUTPUT, ...updatedOutput, notes: {...DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes, ...(updatedOutput.notes || {}) }};
        updateRequestInFirestore({ socialPostOutput: updatedOutput }, true);
      }
    }, 1000),
    [editableHeadline, editableSubheadline, updateRequestInFirestore, isSaving] 
  );

  useEffect(() => {
     if (!initialDataLoadedRef.current || isAiUpdatingRef.current) return;
     debouncedSaveEditableTexts();
  }, [editableHeadline, editableSubheadline, debouncedSaveEditableTexts]);


  const debouncedSaveTextAndStyleEdits = useCallback(
    debounce(() => {
      if (!initialDataLoadedRef.current || isAiUpdatingRef.current || isSaving) return;

      const latestRequest = requestRef.current;
      if (!latestRequest || !latestRequest.socialPostOutput) return;

      const currentOutput = latestRequest.socialPostOutput;
      const currentNotes = currentOutput.notes || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes;

      if (
        currentNotes.headlineFontFamily !== headlineFontFamily ||
        currentNotes.headlineFontSize !== headlineFontSize ||
        currentNotes.headlineColor !== headlineColor ||
        currentNotes.subheadlineFontFamily !== subheadlineFontFamily ||
        currentNotes.subheadlineFontSize !== subheadlineFontSize ||
        currentNotes.subheadlineColor !== subheadlineColor
      ) {
        let updatedOutput: FullSocialPostOutput = {
            ...currentOutput,
            notes: {
                ...(currentOutput.notes || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes),
                headlineFontFamily,
                headlineFontSize,
                headlineColor,
                subheadlineFontFamily,
                subheadlineFontSize,
                subheadlineColor,
            }
        };
        updatedOutput = { ...DEFAULT_SINGLE_SOCIAL_POST_OUTPUT, ...updatedOutput, notes: {...DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes, ...(updatedOutput.notes || {}) }};
        updateRequestInFirestore({ socialPostOutput: updatedOutput }, true);
      }
    }, 1000),
    [headlineFontFamily, headlineFontSize, headlineColor, subheadlineFontFamily, subheadlineFontSize, subheadlineColor, updateRequestInFirestore, isSaving]
  );

  useEffect(() => {
     if (!initialDataLoadedRef.current || isAiUpdatingRef.current) return;
     debouncedSaveTextAndStyleEdits();
  }, [headlineFontFamily, headlineFontSize, headlineColor, subheadlineFontFamily, subheadlineFontSize, subheadlineColor, debouncedSaveTextAndStyleEdits]);


  const debouncedSaveDraggablePositions = useCallback(
    debounce(() => {
      if (!initialDataLoadedRef.current || isAiUpdatingRef.current || isSaving) return;
       const latestRequest = requestRef.current;
       if (!latestRequest) return;

       if (
           latestRequest.headlinePosition?.x !== headlinePosition.x || latestRequest.headlinePosition?.y !== headlinePosition.y ||
           latestRequest.subheadlinePosition?.x !== subheadlinePosition.x || latestRequest.subheadlinePosition?.y !== subheadlinePosition.y ||
           latestRequest.logoOverlayPosition?.x !== logoPosition.x || latestRequest.logoOverlayPosition?.y !== logoPosition.y
       ) {
          updateRequestInFirestore({
            headlinePosition,
            subheadlinePosition,
            logoOverlayPosition: logoPosition,
          }, true);
       }
    }, 1000),
    [headlinePosition, subheadlinePosition, logoPosition, updateRequestInFirestore, isSaving]
  );

  useEffect(() => {
    if (!initialDataLoadedRef.current || isAiUpdatingRef.current) return;
    debouncedSaveDraggablePositions();
  }, [headlinePosition, subheadlinePosition, logoPosition, debouncedSaveDraggablePositions]);


  useEffect(() => {
    if (initialRequest && !initialDataLoadedRef.current) {
        const output = initialRequest.socialPostOutput || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT;
        const currentNotesForInit = output.notes || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes;

        const fullInitialRequest: ContentRequest = {
            ...initialRequest,
            clientName: initialRequest.clientName || MERRY_MAIDS_CLIENT_DETAILS.clientName,
            clientNiche: initialRequest.clientNiche || MERRY_MAIDS_CLIENT_DETAILS.clientNiche,
            brandGuidelinesLink: initialRequest.brandGuidelinesLink || MERRY_MAIDS_CLIENT_DETAILS.brandGuidelinesLink,
            brandVoice: initialRequest.brandVoice || MERRY_MAIDS_CLIENT_DETAILS.brandVoice,
            targetAudience: initialRequest.targetAudience || MERRY_MAIDS_CLIENT_DETAILS.targetAudience,
            socialPostOutput: output,
            generatedImageOptions: initialRequest.generatedImageOptions || [null, null],
            selectedImageIndex: initialRequest.selectedImageIndex !== undefined ? initialRequest.selectedImageIndex : null,
            imageOptionsWereGeneratedWithAiText: initialRequest.imageOptionsWereGeneratedWithAiText || [false, false],
            imageWasGeneratedWithAiText: initialRequest.imageWasGeneratedWithAiText || false,
            headlinePosition: initialRequest.headlinePosition || DEFAULT_HEADLINE_POSITION,
            subheadlinePosition: initialRequest.subheadlinePosition || DEFAULT_SUBHEADLINE_POSITION,
            logoOverlayPosition: initialRequest.logoOverlayPosition || DEFAULT_LOGO_POSITION,
            uploadedLogoUrl: initialRequest.uploadedLogoUrl || MERRY_MAIDS_CLIENT_DETAILS.uploadedLogoUrl,
        };
        setRequest(fullInitialRequest);
        requestRef.current = fullInitialRequest;

        setGeneratedImageOptions(fullInitialRequest.generatedImageOptions || [null,null]);
        setSelectedImageIndex(fullInitialRequest.selectedImageIndex !== undefined ? fullInitialRequest.selectedImageIndex : null);
        setImageOptionsWereGeneratedWithAiText(fullInitialRequest.imageOptionsWereGeneratedWithAiText || [false, false]);
        setImageWasGeneratedWithAiText(fullInitialRequest.imageWasGeneratedWithAiText || false);

        setUploadedBackgroundImage(initialRequest.uploadedBackgroundImageUrl || null);
        setUploadedFooterImageUrl(initialRequest.uploadedFooterImageUrl || null);
        setUploadedLogoUrl(initialRequest.uploadedLogoUrl || MERRY_MAIDS_CLIENT_DETAILS.uploadedLogoUrl || null);
        setUploadedExamplePostUrl(initialRequest.uploadedExamplePostUrl || null);

        setEditableHeadline(output.headline_suggestion || "");
        setEditableSubheadline(output.subheadline_suggestion || "");

        setHeadlineFontFamily(currentNotesForInit.headlineFontFamily || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.headlineFontFamily!);
        setHeadlineFontSize(currentNotesForInit.headlineFontSize || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.headlineFontSize!);
        setHeadlineColor(currentNotesForInit.headlineColor || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.headlineColor!);
        setSubheadlineFontFamily(currentNotesForInit.subheadlineFontFamily || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.subheadlineFontFamily!);
        setSubheadlineFontSize(currentNotesForInit.subheadlineFontSize || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.subheadlineFontSize!);
        setSubheadlineColor(currentNotesForInit.subheadlineColor || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes.subheadlineColor!);

        setHeadlinePosition(fullInitialRequest.headlinePosition || DEFAULT_HEADLINE_POSITION);
        setSubheadlinePosition(fullInitialRequest.subheadlinePosition || DEFAULT_SUBHEADLINE_POSITION);
        setLogoPosition(fullInitialRequest.logoOverlayPosition || DEFAULT_LOGO_POSITION);

        initialDataLoadedRef.current = true;
    }
  }, [initialRequest]);


  const handleGenerateFullPost = async (creativeMode: boolean) => {
    if (!requestRef.current) {
        toast({ title: "Content request data not available.", variant: "destructive"});
        return;
    }
    const setLoadingState = creativeMode ? setIsGeneratingCreativePost : setIsGeneratingStandardPost;
    setLoadingState(true);

    try {
        const currentReq = requestRef.current;
        const brandGuidelinesSummary = `Colors: ${MERRY_MAIDS_CLIENT_DETAILS.brandGuidelines?.colors?.join(', ') || '#004C34'}. Fonts: ${MERRY_MAIDS_CLIENT_DETAILS.brandGuidelines?.primaryFont || 'Proxima Nova'} (Primary). Tone: Friendly, professional, trustworthy. Voice: ${currentReq.brandVoice}. Target Audience: ${currentReq.targetAudience}.`;

        const inputForAI: GenerateStructuredSocialPostInput = {
            clientName: currentReq.clientName || MERRY_MAIDS_CLIENT_DETAILS.clientName,
            clientNiche: currentReq.clientNiche || MERRY_MAIDS_CLIENT_DETAILS.clientNiche,
            platform: currentReq.platform,
            initialTopicIdea: currentReq.initialTopicIdea || "General brand promotion",
            calendarContext: currentReq.calendar_context,
            creativeDirection: currentReq.creative_direction,
            brandGuidelinesSummary: brandGuidelinesSummary,
            brandInstagramFeedUrl: currentReq.brandGuidelinesLink,
            creativeMode: creativeMode,
        };

        console.log("Client: Sending to generateStructuredSocialPost flow:", JSON.stringify(inputForAI, null, 2).substring(0,500));
        const result = await generateStructuredSocialPost(inputForAI);
        console.log("Client: Received from generateStructuredSocialPost flow:", JSON.stringify(result, null, 2).substring(0,500));


        if (!result) {
            toast({ title: `AI Error`, description: "AI did not return any post data.", variant: "destructive" });
            throw new Error("AI did not return any post data.");
        }
        
        const newAiOutput: FullSocialPostOutput = {
            ...DEFAULT_SINGLE_SOCIAL_POST_OUTPUT, 
            ...result,
             image_copy: (() => { // This needs to be a direct string, not a function for React.useMemo
              const h = result.headline_suggestion || "";
              const s = result.subheadline_suggestion || "";
              if (h && s) return `${h}\n${s}`;
              if (h) return h;
              if (s) return s;
              return result.image_copy || ""; 
            })(),
            theme: currentReq.initialTopicIdea,
            calendar_context: currentReq.calendar_context,
            creative_direction: currentReq.creative_direction,
            notes: { 
                ...DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes,
                ...(result.notes || {}),
            }
        };
        
        isAiUpdatingRef.current = true; 
        updateRequestInFirestore({ socialPostOutput: newAiOutput, status: 'PostGenerated' });
        requestAnimationFrame(() => { isAiUpdatingRef.current = false; });


        toast({ title: `Social Post Content (${creativeMode ? 'Creative' : 'Standard'}) generated!`, description: "Review the generated content. It's now in the editable fields and composer." });

    } catch (error) {
        console.error(`Error generating full ${creativeMode ? 'creative' : 'standard'} post structure:`, error);
        toast({ title: `Error generating post content`, description: (error as Error).message, variant: "destructive" });
    } finally {
        setLoadingState(false);
    }
  };

  const handleImageFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'background' | 'logo' | 'footer' | 'examplePost') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        let updates: Partial<ContentRequest> = {};
        let skipToastForUpdate = true; 

        if (type === 'background') {
          setUploadedBackgroundImage(dataUri);
          setGeneratedImageOptions([null, null]); 
          setSelectedImageIndex(null);
          setImageOptionsWereGeneratedWithAiText([false,false]);
          setImageWasGeneratedWithAiText(false);
          updates = { uploadedBackgroundImageUrl: dataUri, generatedImageOptions: [null, null], selectedImageIndex: null, imageOptionsWereGeneratedWithAiText: [false,false], imageWasGeneratedWithAiText: false };
        } else if (type === 'logo') {
          setUploadedLogoUrl(dataUri);
          updates = { uploadedLogoUrl: dataUri };
        } else if (type === 'footer') {
          setUploadedFooterImageUrl(dataUri);
          updates = { uploadedFooterImageUrl: dataUri };
        } else if (type === 'examplePost') {
          setUploadedExamplePostUrl(dataUri); 
          handleAnalyzeUploadedPost(dataUri); 
          return; 
        }
        updateRequestInFirestore(updates, skipToastForUpdate);
      };
      reader.readAsDataURL(file);
    }
    if (event.target) {
        event.target.value = '';
    }
  };

  const clearUploadedImage = (type: 'background' | 'logo' | 'footer' | 'examplePost') => {
    let updates: Partial<ContentRequest> = {};
    if (type === 'background') {
      setUploadedBackgroundImage(null);
      if (bgFileInputRef.current) bgFileInputRef.current.value = "";
      updates = { uploadedBackgroundImageUrl: undefined };
    } else if (type === 'logo') {
      if (MERRY_MAIDS_CLIENT_DETAILS.uploadedLogoUrl) {
        setUploadedLogoUrl(MERRY_MAIDS_CLIENT_DETAILS.uploadedLogoUrl);
        updates = { uploadedLogoUrl: MERRY_MAIDS_CLIENT_DETAILS.uploadedLogoUrl };
      } else {
        setUploadedLogoUrl(null);
        updates = { uploadedLogoUrl: undefined };
      }
      if (logoFileInputRef.current) logoFileInputRef.current.value = "";
    } else if (type === 'footer') {
        setUploadedFooterImageUrl(null);
        if (footerFileInputRef.current) footerFileInputRef.current.value = "";
        updates = { uploadedFooterImageUrl: undefined };
    } else if (type === 'examplePost') {
        setUploadedExamplePostUrl(null);
        updates = { uploadedExamplePostUrl: undefined, creative_direction: initialRequest.creative_direction }; 
        const exampleInput = document.getElementById('examplePostUpload') as HTMLInputElement;
        if(exampleInput) exampleInput.value = "";
    }
     updateRequestInFirestore(updates, true);
  };

  const handleGenerateImageWithOptions = async (renderTextDirectly: boolean) => {
    if (!requestRef.current) {
      toast({ title: "Content request data not available.", variant: "destructive" });
      return;
    }
    const currentReq = requestRef.current;
    const currentOutput = currentReq.socialPostOutput || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT;

    const textForImageInspiration = currentOutput.image_copy || currentReq.initialTopicIdea || "Professional cleaning service";

    if (!currentReq.creative_direction && !textForImageInspiration) {
        toast({ title: "Input needed for Image Generation", description: "Please provide 'Creative Direction' (Step 1) or ensure 'Image Copy' text is available (Step 2).", variant: "destructive" });
        return;
    }
    
    setIsGeneratingImage(true);
    setSelectedImageIndex(null); 
    setGeneratedImageOptions([null, null]);

    const genkitInput: GenerateSocialMediaImageInput = {
        imageCopyText: textForImageInspiration,
        backgroundImageUrl: uploadedBackgroundImage || undefined,
        logoUrl: uploadedLogoUrl || undefined,
        platform: currentReq.platform,
        designSpecifications: {
            imageStyleAndLayout: currentReq.creative_direction
        },
        renderTextDirectly: renderTextDirectly,
    };

    try {
      console.log("Client: Calling generateSocialMediaImage flow with input:", JSON.stringify(genkitInput, null, 2).substring(0,500));
      const result: GenerateSocialMediaImageOutput = await generateSocialMediaImage(genkitInput);
      console.log("Client: Received from generateSocialMediaImage flow:", JSON.stringify(result, null, 2).substring(0,500));

      if (result && result.imageUrls && Array.isArray(result.imageUrls) && result.imageUrls.length === 2) {
        const [url1, url2] = result.imageUrls;
        
        isAiUpdatingRef.current = true;
        setGeneratedImageOptions([url1 || null, url2 || null]);
        setImageOptionsWereGeneratedWithAiText([renderTextDirectly, renderTextDirectly]);
        setImageWasGeneratedWithAiText(false); // Reset this as user will need to select an option
        setUploadedBackgroundImage(null); 
        if (bgFileInputRef.current) bgFileInputRef.current.value = "";
        setSelectedImageIndex(null); 
        requestAnimationFrame(() => { isAiUpdatingRef.current = false; });


        updateRequestInFirestore({
          generatedImageOptions: [url1 || null, url2 || null],
          selectedImageIndex: null, 
          imageOptionsWereGeneratedWithAiText: [renderTextDirectly, renderTextDirectly],
          status: 'ImageGenerated',
          uploadedBackgroundImageUrl: undefined,
          imageWasGeneratedWithAiText: false, 
        }, true); 

        if (url1 || url2) {
            toast({
                title: renderTextDirectly ? "AI Image Options w/ Text Generated (Gemini)!" : "AI Background Image Options Generated (Gemini)!",
                description: (url1 && url2) ? "Two image options generated. Please select one to continue." : "One image option generated. Please review.",
                duration: 7000
            });
        } else {
             toast({ title: "Image Generation Issue", description: "AI did not return any image options. Please try again or adjust your prompt.", variant: "destructive" });
        }
      } else {
        console.error("AI did not return two image URLs as expected. Result:", result);
        toast({ title: "Image Generation Error", description: "AI response was not in the expected format (expected 2 image URLs).", variant: "destructive" });
        setGeneratedImageOptions([null, null]);
      }
    } catch (error: any) {
      console.error(`Error generating image options ${renderTextDirectly ? "with text" : "background"} using Genkit/Gemini:`, error);
      toast({ title: `Error generating image options (Gemini)`, description: error.message, variant: "destructive" });
      setGeneratedImageOptions([null, null]);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSelectImageOption = (index: number) => {
    if (generatedImageOptions[index]) {
        isAiUpdatingRef.current = true;
        setSelectedImageIndex(index);
        setImageWasGeneratedWithAiText(imageOptionsWereGeneratedWithAiText[index] || false);
        setUploadedBackgroundImage(null); 
         if (bgFileInputRef.current) bgFileInputRef.current.value = "";
        requestAnimationFrame(() => { isAiUpdatingRef.current = false; });

        updateRequestInFirestore({
          selectedImageIndex: index,
          uploadedBackgroundImageUrl: undefined,
          imageWasGeneratedWithAiText: imageOptionsWereGeneratedWithAiText[index] || false,
        }, true); 
    } else {
        toast({title: "Selection Error", description: "This image option is not available.", variant: "destructive"});
    }
  };

  const handleUpdateSelectedImage = async () => {
    if (selectedImageIndex === null || !generatedImageOptions[selectedImageIndex] || !imageEditingPrompt) {
        toast({title: "Input Required", description: "Please select an image and enter an editing prompt.", variant: "destructive"});
        return;
    }
    setIsUpdatingImage(true);
    const baseImageToEdit = generatedImageOptions[selectedImageIndex]!;
    const wasGeneratedWithAiTextForEditing = imageOptionsWereGeneratedWithAiText[selectedImageIndex];

    const genkitInput: GenerateSocialMediaImageInput = {
        imageCopyText: imageEditingPrompt, 
        baseImageDataUri: baseImageToEdit, 
        platform: request?.platform,
        designSpecifications: { imageStyleAndLayout: request?.creative_direction },
        renderTextDirectly: wasGeneratedWithAiTextForEditing,
    };

    try {
        console.log("Client: Calling generateSocialMediaImage for editing:", JSON.stringify(genkitInput, null, 2).substring(0,500));
        const result: GenerateSocialMediaImageOutput = await generateSocialMediaImage(genkitInput); 
        console.log("Client: Received from generateSocialMediaImage (editing):", JSON.stringify(result, null, 2).substring(0,500));

        if (result.imageUrls && result.imageUrls[0]) { 
            const updatedImageUrl = result.imageUrls[0];
            const newOptions: [string | null, string | null] = [...generatedImageOptions];
            newOptions[selectedImageIndex] = updatedImageUrl;
            
            const newImageOptionsWereGenerated: [boolean, boolean] = [...imageOptionsWereGeneratedWithAiText];
            newImageOptionsWereGenerated[selectedImageIndex] = wasGeneratedWithAiTextForEditing; 

            isAiUpdatingRef.current = true;
            setGeneratedImageOptions(newOptions);
            setImageOptionsWereGeneratedWithAiText(newImageOptionsWereGenerated);
            setImageWasGeneratedWithAiText(wasGeneratedWithAiTextForEditing); // Update the main flag too
            setImageEditingPrompt("");
            requestAnimationFrame(() => { isAiUpdatingRef.current = false; });


            updateRequestInFirestore({
              generatedImageOptions: newOptions,
              imageOptionsWereGeneratedWithAiText: newImageOptionsWereGenerated,
              selectedImageIndex: selectedImageIndex, 
              imageWasGeneratedWithAiText: wasGeneratedWithAiTextForEditing, 
            }, true); 
            toast({title: "Image Updated!", description: "The selected image has been updated with your edits."});
        } else {
            let errorDescription = "AI did not return an updated image.";
            if (result.imageUrls && result.imageUrls[0] === null) {
                errorDescription = "AI process completed but no updated image was provided. Check AI logs.";
                console.error("AI process completed but no updated image was provided. Response from editing:", result);
            } else {
                 console.error("AI did not return an updated image or response was malformed. Response from editing:", result);
            }
            toast({title: "Image Update Failed", description: errorDescription, variant: "destructive"});
        }

    } catch (error:any) {
        console.error("Error updating image:", error);
        toast({title: "Error Updating Image", description: error.message, variant: "destructive"});
    } finally {
        setIsUpdatingImage(false);
    }
  };


  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, elementType: 'headline' | 'subheadline' | 'logo') => {
    e.preventDefault();
    if (!imagePreviewRef.current) return;

    setDraggingElement(elementType);
    const rect = imagePreviewRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    setDragStart({ x: clickX, y: clickY });

    if (elementType === 'headline') setElementStart({x: headlinePosition.x, y: headlinePosition.y});
    else if (elementType === 'subheadline') setElementStart({x: subheadlinePosition.x, y: subheadlinePosition.y});
    else if (elementType === 'logo') setElementStart({x: logoPosition.x, y: logoPosition.y});
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingElement || !dragStart || !elementStart || !imagePreviewRef.current) return;

    const rect = imagePreviewRef.current.getBoundingClientRect();
    const currentMouseX = e.clientX - rect.left;
    const currentMouseY = e.clientY - rect.top;

    const dx = currentMouseX - dragStart.x;
    const dy = currentMouseY - dragStart.y;

    let newXPixels = (elementStart.x / 100) * rect.width + dx;
    let newYPixels = (elementStart.y / 100) * rect.height + dy;

    let newXPercent = Math.max(0, Math.min((newXPixels / rect.width) * 100, 100));
    let newYPercent = Math.max(0, Math.min((newYPixels / rect.height) * 100, 100));

    if (draggingElement === 'headline') setHeadlinePosition({ x: newXPercent, y: newYPercent });
    else if (draggingElement === 'subheadline') setSubheadlinePosition({ x: newXPercent, y: newYPercent });
    else if (draggingElement === 'logo') setLogoPosition({ x: newXPercent, y: newYPercent });
  };


  const handleMouseUp = () => {
    if (!draggingElement) return;
    setDraggingElement(null);
    setDragStart(null);
    setElementStart(null);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
        if (draggingElement && imagePreviewRef.current) {
             const rect = imagePreviewRef.current.getBoundingClientRect();
             const syntheticEvent = {
                clientX: e.clientX,
                clientY: e.clientY,
                preventDefault: () => e.preventDefault(),
            } as unknown as React.MouseEvent<HTMLDivElement>;
            handleMouseMove(syntheticEvent);
        }
    };
    const handleGlobalMouseUp = () => { if (draggingElement) handleMouseUp(); };

    if (draggingElement) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggingElement, dragStart, elementStart, headlinePosition, subheadlinePosition, logoPosition, handleMouseMove, handleMouseUp]);


  const handleDownloadImage = async () => {
    const activeBaseImageUrl = uploadedBackgroundImage || (selectedImageIndex !== null ? generatedImageOptions[selectedImageIndex] : null) ;
    const currentReq = requestRef.current;
    
    if (!currentReq || !activeBaseImageUrl || !currentReq.socialPostOutput) {
      toast({ title: "Missing data", description: "Ensure an AI background is selected/uploaded, and text content is available.", variant: "destructive" });
      return;
    }
    const currentOutput = currentReq.socialPostOutput;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast({ title: "Error", description: "Could not create drawing context.", variant: "destructive" });
      return;
    }

    const canvasWidth = 1080;
    const canvasHeight = 1080;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    let mainImageHeight = canvasHeight;
    let footerActualHeight = 0;

    if (uploadedFooterImageUrl) {
      const footerImage = new window.Image();
      footerImage.crossOrigin = "anonymous";
      try {
        await new Promise<void>((resolve, reject) => {
          footerImage.onload = () => {
            const scaleToFitWidth = canvasWidth / footerImage.naturalWidth;
            footerActualHeight = footerImage.naturalHeight * scaleToFitWidth;
            const maxFooterHeight = canvasHeight * 0.20; 
            const minFooterHeight = canvasHeight * 0.10; 
            footerActualHeight = Math.max(minFooterHeight, Math.min(footerActualHeight, maxFooterHeight));
            mainImageHeight = canvasHeight - footerActualHeight;
            ctx.drawImage(footerImage, 0, mainImageHeight, canvasWidth, footerActualHeight);
            resolve();
          };
          footerImage.onerror = (e) => {
            console.error("Footer image load error:", e);
            reject(new Error('Failed to load footer image.'));
          }
          footerImage.src = uploadedFooterImageUrl;
        });
      } catch (e: any) {
        toast({ title: "Error loading footer image", description: e.message, variant: "destructive" });
        mainImageHeight = canvasHeight; 
        footerActualHeight = 0;
      }
    }

    const baseImage = new window.Image();
    baseImage.crossOrigin = "anonymous";
    try {
      await new Promise<void>((resolve, reject) => {
        baseImage.onload = () => {
          ctx.drawImage(baseImage, 0, 0, canvasWidth, mainImageHeight);
          resolve();
        };
        baseImage.onerror = (e) => {
          console.error("Base image load error:", e);
          reject(new Error('Failed to load base image.'));
        }
        baseImage.src = activeBaseImageUrl;
      });
    } catch (e: any) {
      toast({ title: "Error loading base image", description: e.message, variant: "destructive" });
      return;
    }

    const drawStyledTextOnCanvas = (
        text: string,
        xPercent: number, yPercent: number,
        fontFamilyVal: string, fontSizeVal: number, colorVal: string,
        fontWeightVal = "normal", fontStyleVal = "normal", textTransformVal = "none",
        textAlignVal: CanvasTextAlign = "center",
        textBaselineVal: CanvasTextBaseline = "middle",
        shadowColorVal = "rgba(0,0,0,0.5)", shadowBlurVal = 2, shadowOffsetXVal = 1, shadowOffsetYVal = 1,
        lineHeightFactor = 1.1,
        renderAreaHeight = mainImageHeight,
        maxWidthPercent = 0.9
    ) => {
        if (!text) return;
        ctx.font = `${fontStyleVal} ${fontWeightVal} ${fontSizeVal}px ${fontFamilyVal}`;
        ctx.fillStyle = colorVal;
        ctx.textAlign = textAlignVal;
        ctx.textBaseline = textBaselineVal;
        ctx.shadowColor = shadowColorVal;
        ctx.shadowBlur = shadowBlurVal;
        ctx.shadowOffsetX = shadowOffsetXVal;
        ctx.shadowOffsetY = shadowOffsetYVal;

        const actualX = (xPercent / 100) * canvasWidth;
        let actualY = (yPercent / 100) * renderAreaHeight;

        const lines = text.split('\n');
        const lineHeight = fontSizeVal * lineHeightFactor;

        if (textBaselineVal === "middle") {
           actualY -= ((lines.length - 1) * lineHeight) / 2;
        } else if (textBaselineVal === "bottom") {
            actualY -= (lines.length -1) * lineHeight;
        }
        
        lines.forEach((line, lineIndex) => {
            const textToRender = textTransformVal === 'uppercase' ? line.toUpperCase() : line;
            const maxWidthPx = canvasWidth * maxWidthPercent;
            let words = textToRender.split(' ');
            let currentLineCanvas = '';
            let currentYOffset = actualY + (lineIndex * lineHeight);

            for(let n = 0; n < words.length; n++) {
                let testLine = currentLineCanvas + words[n] + ' ';
                let metrics = ctx.measureText(testLine);
                let testWidth = metrics.width;
                if (testWidth > maxWidthPx && n > 0) {
                    ctx.fillText(currentLineCanvas.trim(), actualX, currentYOffset);
                    currentLineCanvas = words[n] + ' ';
                    currentYOffset += lineHeight;
                } else {
                    currentLineCanvas = testLine;
                }
            }
            ctx.fillText(currentLineCanvas.trim(), actualX, currentYOffset);
        });
        ctx.shadowColor = "transparent"; 
    };

    const finalImageWasGeneratedWithAiText = imageWasGeneratedWithAiText; // From component state


    if (!finalImageWasGeneratedWithAiText) {
        // Render headline if not AI-text image
        drawStyledTextOnCanvas(editableHeadline, headlinePosition.x, headlinePosition.y, headlineFontFamily, headlineFontSize, headlineColor, "bold", "normal", "uppercase", "center", "middle", "rgba(0,0,0,0.3)", 2, 1, 1, 1.1, mainImageHeight);
        // Render subheadline if not AI-text image
        const subheadlineIsCursive = subheadlineFontFamily.toLowerCase().includes('cursive') || subheadlineFontFamily.toLowerCase().includes('script');
        drawStyledTextOnCanvas(editableSubheadline, subheadlinePosition.x, subheadlinePosition.y, subheadlineFontFamily, subheadlineFontSize, subheadlineColor, "normal", subheadlineIsCursive ? "italic" : "normal", "none", "center", "middle", "rgba(0,0,0,0.3)", 2, 1, 1, 1.1, mainImageHeight);
    }


    if (uploadedFooterImageUrl && footerActualHeight > 0) {
        const footerTextYBaseline = mainImageHeight + (footerActualHeight * 0.45); 
        const footerFontSize = Math.max(14, Math.min(18, footerActualHeight * 0.10)); 
        const footerLeftTextColor = "#000000"; 
        const footerRightTextColor = "#000000"; 

        if (currentOutput.footer_left_text_suggestion) {
            drawStyledTextOnCanvas(
                currentOutput.footer_left_text_suggestion,
                5, (footerTextYBaseline / canvasHeight) * 100, 
                "Arial, sans-serif", footerFontSize, footerLeftTextColor,
                "bold", "normal", "none", "left", "middle",
                "rgba(0,0,0,0.1)", 1, 1, 1, 1.1,
                canvasHeight, 0.40
            );
        }

        if (uploadedLogoUrl) {
            const logoImg = new window.Image();
            logoImg.crossOrigin = "anonymous";
            try {
                await new Promise<void>((resolve, reject) => {
                    logoImg.onload = () => {
                        let logoDrawHeight = footerActualHeight * 0.6;
                        let logoAspectRatio = 1;
                        if(logoImg.naturalHeight > 0) {
                            logoAspectRatio = logoImg.naturalWidth / logoImg.naturalHeight;
                        }
                        let logoDrawWidth = logoDrawHeight * logoAspectRatio;

                        if (logoDrawWidth > canvasWidth * 0.25) { 
                            logoDrawWidth = canvasWidth * 0.25;
                            logoDrawHeight = logoDrawWidth / logoAspectRatio;
                        }
                        if (logoDrawHeight > footerActualHeight * 0.6) { 
                            logoDrawHeight = footerActualHeight * 0.6;
                            logoDrawWidth = logoDrawHeight * logoAspectRatio;
                        }
                        const logoX = canvasWidth * 0.72 - logoDrawWidth / 2; 
                        const logoY = footerTextYBaseline - logoDrawHeight - (currentOutput.footer_right_slogan_suggestion ? footerFontSize * 0.7 : 0) ; 
                        ctx.drawImage(logoImg, logoX, logoY, logoDrawWidth, logoDrawHeight);
                        resolve();
                    };
                    logoImg.onerror = (e) => reject(new Error('Failed to load Merry Maids logo for download.'));
                    logoImg.src = uploadedLogoUrl!;
                });
            } catch (e: any) {
                toast({ title: "Error loading MM logo", description: e.message, variant: "destructive" });
            }
        }

        if (currentOutput.footer_right_slogan_suggestion) {
             drawStyledTextOnCanvas(
                currentOutput.footer_right_slogan_suggestion,
                95, ((footerTextYBaseline + (uploadedLogoUrl ? footerActualHeight * 0.05 : 0) ) / canvasHeight) * 100, 
                "Arial, sans-serif", footerFontSize * 0.9, footerRightTextColor,
                "normal", "italic", "none", "right", "middle",
                "rgba(0,0,0,0.1)", 1, 1, 1, 1.1,
                canvasHeight, 0.35
            );
        }

    } else if (uploadedLogoUrl && !finalImageWasGeneratedWithAiText) { // Draw logo based on draggable position if no footer
        const logoImg = new window.Image();
        logoImg.crossOrigin = "anonymous";
        try {
            await new Promise<void>((resolve, reject) => {
                logoImg.onload = () => {
                    let logoAspectRatio = 1;
                    if (logoImg.naturalHeight > 0) {
                         logoAspectRatio = logoImg.naturalWidth / logoImg.naturalHeight;
                    }
                    let finalLogoWidth = Math.min(canvasWidth * 0.18, 180); 
                    let finalLogoHeight = finalLogoWidth / (logoAspectRatio || 1);

                    if (finalLogoHeight > mainImageHeight * 0.18) {
                        finalLogoHeight = mainImageHeight * 0.18;
                        finalLogoWidth = finalLogoHeight * (logoAspectRatio || 1);
                    }
                    
                    const logoCanvasTopLeftX = (logoPosition.x / 100) * canvasWidth - finalLogoWidth / 2;
                    const logoCanvasTopLeftY = (logoPosition.y / 100) * mainImageHeight - finalLogoHeight / 2;

                    ctx.drawImage(logoImg, logoCanvasTopLeftX, logoCanvasTopLeftY, finalLogoWidth, finalLogoHeight);
                    resolve();
                };
                logoImg.onerror = (e) => reject(new Error('Failed to load Merry Maids logo.'));
                logoImg.src = uploadedLogoUrl!;
            });
        } catch (e: any)
        {
            toast({ title: "Error loading MM logo", description: e.message, variant: "destructive" });
        }
    }

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `social_post_${currentReq?.id || 'composed'}_single.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Image download started!" });
  };

  const handleDownloadSvg = async () => {
    const activeBaseImageUrl = uploadedBackgroundImage || (selectedImageIndex !== null ? generatedImageOptions[selectedImageIndex] : null) ;
    const currentReq = requestRef.current;

    if (!currentReq || !activeBaseImageUrl || !currentReq.socialPostOutput) {
      toast({ title: "Missing base image or text content", description: "Generate or upload a background image and ensure text content for the active version is available.", variant: "destructive" });
      return;
    }
    const currentOutput = currentReq.socialPostOutput;

    const svgWidth = 1080;
    const svgHeight = 1080;
    let mainImageDisplayHeight = svgHeight;
    let footerDisplayHeight = 0;
    let footerImageDataBase64 = "";
    let logoDataBase64 = "";

    if (uploadedFooterImageUrl) {
        try {
            const response = await fetch(uploadedFooterImageUrl);
            const blob = await response.blob();
            footerImageDataBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

            const footerImg = new window.Image();
            footerImg.src = footerImageDataBase64;
            await new Promise<void>(resolve => { footerImg.onload = () => resolve(); footerImg.onerror = () => resolve();}); 
            if (footerImg.naturalWidth > 0 && footerImg.naturalHeight > 0) {
              const footerAspectRatio = footerImg.naturalWidth / footerImg.naturalHeight;
              footerDisplayHeight = svgWidth / footerAspectRatio; 
              const maxFooterHeight = svgHeight * 0.20; 
              const minFooterHeight = svgHeight * 0.10; 
              footerDisplayHeight = Math.max(minFooterHeight, Math.min(footerDisplayHeight, maxFooterHeight));
            } else {
               footerDisplayHeight = svgHeight * 0.18; 
            }
            mainImageDisplayHeight = svgHeight - footerDisplayHeight;
        } catch (e) {
            console.warn("Could not load footer image for SVG, using default ratio.", e);
            footerDisplayHeight = svgHeight * 0.18;
            mainImageDisplayHeight = svgHeight - footerDisplayHeight;
        }
    }

    if (uploadedLogoUrl) {
        try {
            const response = await fetch(uploadedLogoUrl);
            const blob = await response.blob();
            logoDataBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.warn("Could not load logo for SVG embedding.", e);
        }
    }

    const finalImageWasGeneratedWithAiTextForSvg = imageWasGeneratedWithAiText; // Use component state


    let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;

    const fontsToEmbed = new Set<string>();

    if (!finalImageWasGeneratedWithAiTextForSvg){
      fontsToEmbed.add(headlineFontFamily.split(',')[0].replace(/'/g, "").trim());
      fontsToEmbed.add(subheadlineFontFamily.split(',')[0].replace(/'/g, "").trim());
    }
    fontsToEmbed.add("Arial"); 

    const googleFontsImportString = Array.from(fontsToEmbed).filter(Boolean).map(font => font.replace(/\s+/g, '+')).join('%7C');
    
    if (googleFontsImportString) {
        svgContent += `<defs><style type="text/css">@import url('https://fonts.googleapis.com/css2?family=${googleFontsImportString}:ital,wght@0,400;0,700;1,400;1,700&amp;display=swap');</style></defs>`;
    }
    svgContent += `<rect width="100%" height="100%" fill="${(currentOutput.notes || DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes).colour_hex || '#f0f0f0'}" />`;

    svgContent += `<image xlink:href="${activeBaseImageUrl}" x="0" y="0" width="${svgWidth}" height="${mainImageDisplayHeight}" preserveAspectRatio="xMidYMid slice" />`;

    if (uploadedFooterImageUrl && footerImageDataBase64 && footerDisplayHeight > 0) {
        svgContent += `<image xlink:href="${footerImageDataBase64}" x="0" y="${mainImageDisplayHeight}" width="${svgWidth}" height="${footerDisplayHeight}" preserveAspectRatio="xMidYMid slice" />`;
    }

    const addTextElementToSvg = (
      text: string, xPercent: number, yPercent: number,
      fontFamilyVal: string, fontSizeVal: number, colorVal: string,
      fontWeightVal = "normal", fontStyleVal = "normal", textTransformVal = "none",
      textAnchorVal = "middle", renderAreaHeight = mainImageDisplayHeight, maxWidthPercent = 0.9
    ) => {
      if(!text) return "";
      const lines = text.split('\n');
      let tspans = "";
      const lineHeight = fontSizeVal * 1.1; 
      const xPx = (xPercent / 100) * svgWidth;
      let initialYPx = (yPercent / 100) * renderAreaHeight;
      if (textAnchorVal === "middle") { 
         initialYPx -= ((lines.length - 1) * lineHeight) / 2;
      }
      initialYPx += fontSizeVal * 0.33; 


      lines.forEach((line, lineIndex) => {
        const textToRender = textTransformVal === 'uppercase' ? line.toUpperCase() : line;
        tspans += `<tspan x="${xPx}" dy="${lineIndex === 0 ? '0' : lineHeight + 'px'}">${xmlEscape(textToRender)}</tspan>`;
      });

       return `<text x="${xPx}" y="${initialYPx}" text-anchor="${textAnchorVal}" dominant-baseline="central" font-family="${xmlEscape(fontFamilyVal.split(',')[0].replace(/'/g, "").trim())}" font-size="${fontSizeVal}px" font-weight="${fontWeightVal}" font-style="${fontStyleVal}" fill="${xmlEscape(colorVal)}" style="text-transform: ${textTransformVal}; filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.2));">${tspans}</text>`;
    };


    if (!finalImageWasGeneratedWithAiTextForSvg) {
        svgContent += addTextElementToSvg(editableHeadline, headlinePosition.x, headlinePosition.y, headlineFontFamily, headlineFontSize, headlineColor, "bold", "normal", "uppercase", "middle", mainImageDisplayHeight);
        const subheadlineIsCursiveForSvg = subheadlineFontFamily.toLowerCase().includes('cursive') || subheadlineFontFamily.toLowerCase().includes('script');
        svgContent += addTextElementToSvg(editableSubheadline, subheadlinePosition.x, subheadlinePosition.y, subheadlineFontFamily, subheadlineFontSize, subheadlineColor, "normal", subheadlineIsCursiveForSvg ? "italic" : "normal", "none", "middle", mainImageDisplayHeight);
    }


    if (uploadedFooterImageUrl && footerImageDataBase64 && footerDisplayHeight > 0) {
        const footerSvgFontSize = Math.max(12, Math.min(18, footerDisplayHeight * 0.10)); 
        const footerLeftTextColorSvg = "#000000"; 
        const footerRightTextColorSvg = "#000000";

        const footerAbsoluteYBase = mainImageDisplayHeight + (footerDisplayHeight * 0.5);

        if (currentOutput.footer_left_text_suggestion) {
            svgContent += addTextElementToSvg(currentOutput.footer_left_text_suggestion, 5, (footerAbsoluteYBase / svgHeight) * 100, "Arial", footerSvgFontSize, footerLeftTextColorSvg, "bold", "normal", "none", "start", svgHeight, 0.45);
        }

        const rightSectionAnchorXPercentSvg = 95; 
        let logoHeightInFooterSvg = footerDisplayHeight * 0.5; 
        let logoWidthInFooterSvg = logoHeightInFooterSvg * 2; 

        if (uploadedLogoUrl && logoDataBase64) {
          const logoPreviewImg = new window.Image();
          logoPreviewImg.src = logoDataBase64;
          await new Promise<void>(resolve => {logoPreviewImg.onload = () => resolve(); logoPreviewImg.onerror = () => resolve();}); 
          let logoAspectRatioSvg = 1;
          if(logoPreviewImg.naturalWidth > 0 && logoPreviewImg.naturalHeight > 0){
            logoAspectRatioSvg = logoPreviewImg.naturalWidth / logoPreviewImg.naturalHeight;
            logoWidthInFooterSvg = logoHeightInFooterSvg * logoAspectRatioSvg;
             if (logoWidthInFooterSvg > svgWidth * 0.20) { 
                logoWidthInFooterSvg = svgWidth * 0.20;
                logoHeightInFooterSvg = logoWidthInFooterSvg / logoAspectRatioSvg;
            }
          }

          const logoYInFooterSvg = footerAbsoluteYBase - (currentOutput.footer_right_slogan_suggestion ? logoHeightInFooterSvg * 0.65 : logoHeightInFooterSvg * 0.5); 
          svgContent += `<image xlink:href="${logoDataBase64}" x="${(rightSectionAnchorXPercentSvg / 100 * svgWidth) - logoWidthInFooterSvg - (svgWidth*0.02)}" y="${logoYInFooterSvg}" width="${logoWidthInFooterSvg}" height="${logoHeightInFooterSvg}" preserveAspectRatio="xMidYMid meet"/>`;
        }

        if (currentOutput.footer_right_slogan_suggestion) {
            const sloganYOffset = uploadedLogoUrl && logoDataBase64 ? footerDisplayHeight * 0.20 : 0; 
            svgContent += addTextElementToSvg(currentOutput.footer_right_slogan_suggestion, rightSectionAnchorXPercentSvg, ((footerAbsoluteYBase + sloganYOffset) / svgHeight) * 100, "Arial", footerSvgFontSize * 0.9, footerRightTextColorSvg, "normal", "italic", "none", "end", svgHeight, 0.35);
        }

    } else if (uploadedLogoUrl && logoDataBase64 && !finalImageWasGeneratedWithAiTextForSvg) { // Draw logo based on draggable position if no footer
        const logoPreviewImg = new window.Image();
        logoPreviewImg.src = logoDataBase64;
        await new Promise<void>(resolve => {logoPreviewImg.onload = () => resolve(); logoPreviewImg.onerror = () => resolve();});

        let generalLogoSvgWidth = Math.min(svgWidth * 0.18, 180); 
        let generalLogoSvgHeight = generalLogoSvgWidth * 0.5; 
        let logoAspectRatioSvg = 1;
        if(logoPreviewImg.naturalWidth > 0 && logoPreviewImg.naturalHeight > 0){
            logoAspectRatioSvg = logoPreviewImg.naturalWidth / (logoPreviewImg.naturalHeight || 1);
            generalLogoSvgHeight = generalLogoSvgWidth / (logoAspectRatioSvg || 1);
            if (generalLogoSvgHeight > mainImageDisplayHeight * 0.18) {
                generalLogoSvgHeight = mainImageDisplayHeight * 0.18;
                generalLogoSvgWidth = generalLogoSvgHeight * (logoAspectRatioSvg || 1);
            }
        }

        const logoCenterX = (logoPosition.x / 100) * svgWidth;
        const logoCenterY = (logoPosition.y / 100) * mainImageDisplayHeight;

        const logoTopLeftX = logoCenterX - generalLogoSvgWidth / 2;
        const logoTopLeftY = logoCenterY - generalLogoSvgHeight / 2;

        svgContent += `<image xlink:href="${logoDataBase64}" x="${logoTopLeftX}" y="${logoTopLeftY}" width="${generalLogoSvgWidth}" height="${generalLogoSvgHeight}" preserveAspectRatio="xMidYMid meet"/>`;
    }

    svgContent += `</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `social_post_${currentReq?.id || 'composed'}_single.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "SVG download started!" });
  };

  function xmlEscape(str: string): string {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>&'"]/g, (match) => {
        switch (match) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
            default: return match;
        }
    });
  }

  const handleRequestFieldChange = (fieldName: keyof Pick<ContentRequest, 'campaignName' | 'dueDate' | 'platform' | 'theme' | 'calendar_context' | 'initialTopicIdea' | 'creative_direction' | 'notes' | 'clientName' | 'clientNiche' | 'brandGuidelinesLink' | 'brandVoice' | 'targetAudience' >, value: any) => {
    if (!requestRef.current) return;
    
    isAiUpdatingRef.current = true; 
    const updatedRequestPart = { [fieldName]: value };
    const newFullRequest = { ...requestRef.current, ...updatedRequestPart };
    
    setRequest(newFullRequest);
    updateRequestInFirestore(updatedRequestPart, true); 
    
    requestAnimationFrame(() => { isAiUpdatingRef.current = false; });
  };


  const handleSocialPostOutputFieldChange = (
    fieldName: keyof FullSocialPostOutput | `notes.${keyof FullSocialPostOutput['notes']}` | 'video_concept_ideas_string',
    value: any
  ) => {
    const currentReq = requestRef.current;
    if (!currentReq) return;

    isAiUpdatingRef.current = true; 

    let baseOutput = currentReq.socialPostOutput
      ? JSON.parse(JSON.stringify(currentReq.socialPostOutput))
      : JSON.parse(JSON.stringify(DEFAULT_SINGLE_SOCIAL_POST_OUTPUT));

    if (fieldName.startsWith('notes.')) {
        const noteField = fieldName.substring(6) as keyof FullSocialPostOutput['notes'];
        if (!baseOutput.notes) {
            baseOutput.notes = { ...DEFAULT_SINGLE_SOCIAL_POST_OUTPUT.notes };
        }
        (baseOutput.notes as any)[noteField] = value;
    } else if (fieldName === 'video_concept_ideas_string') { 
        baseOutput.video_concept_ideas = typeof value === 'string' ? value.split('\n').map(s => s.trim()).filter(Boolean) : [];
    } else if (fieldName === 'video_concept_ideas') { 
        baseOutput.video_concept_ideas = Array.isArray(value) ? value : [];
    }
     else {
        (baseOutput as any)[fieldName] = value;
    }
    
    // When these core text fields from AI are edited, update editableHeadline/Subheadline
    if (fieldName === 'headline_suggestion') {
        if(editableHeadline !== value) setEditableHeadline(value || "");
    }
    if (fieldName === 'subheadline_suggestion') {
        if(editableSubheadline !== value) setEditableSubheadline(value || "");
    }


    const updatedRequestFields = { socialPostOutput: baseOutput };
    
    const newFullRequest = { ...currentReq, ...updatedRequestFields };
    setRequest(newFullRequest);
    updateRequestInFirestore(updatedRequestFields, true);


    requestAnimationFrame(() => { isAiUpdatingRef.current = false; });
  };

  const handleAnalyzeUploadedPost = async (imageDataUri: string) => {
    if (!requestRef.current) return;
    setIsAnalyzingExamplePost(true);
    try {
      const result: AnalyzeUploadedPostOutput = await analyzeUploadedPost({ imageDataUri });
      if (result.creativeDirectionSuggestion) {
        
        isAiUpdatingRef.current = true;
        const updatedFields = { creative_direction: result.creativeDirectionSuggestion, uploadedExamplePostUrl: imageDataUri };
        const newFullRequest = { ...requestRef.current, ...updatedFields };
        setRequest(newFullRequest);
        updateRequestInFirestore(updatedFields); 
        requestAnimationFrame(() => { isAiUpdatingRef.current = false; });

        toast({ title: "Analysis Complete!", description: "Creative Direction has been populated from the example image." });
      } else {
        toast({ title: "Analysis Failed", description: "Could not extract creative direction from the image.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Error analyzing uploaded post:", error);
      toast({ title: "Error Analyzing Image", description: error.message, variant: "destructive" });
    } finally {
      setIsAnalyzingExamplePost(false);
    }
  };


  const visualComposerProps = {
    request: request!,
    editableHeadline, setEditableHeadline,
    editableSubheadline, setEditableSubheadline,
    headlineFontFamily, setHeadlineFontFamily, headlineFontSize, setHeadlineFontSize, headlineColor, setHeadlineColor,
    subheadlineFontFamily, setSubheadlineFontFamily, subheadlineFontSize, setSubheadlineFontSize, subheadlineColor, setSubheadlineColor,

    generatedImageOptions,
    selectedImageIndex,
    handleSelectImageOption,
    imageOptionsWereGeneratedWithAiText,
    imageWasGeneratedWithAiText,

    uploadedBackgroundImage,
    bgFileInputRef,
    uploadedLogoUrl,
    logoFileInputRef,
    uploadedFooterImageUrl,
    footerFileInputRef,

    headlinePosition, setHeadlinePosition,
    subheadlinePosition, setSubheadlinePosition,
    logoPosition, setLogoPosition,

    draggingElement,
    imagePreviewRef,

    isGeneratingImage: isGeneratingImage, // Pass down the general loading state
    imageEditingPrompt, setImageEditingPrompt,
    isUpdatingImage,
    onGenerateImageWithOptions: handleGenerateImageWithOptions,
    onUpdateSelectedImage: handleUpdateSelectedImage,

    onClearUploadedImage: clearUploadedImage,
    onImageFileUpload: (e, type) => handleImageFileUpload(e, type as 'background' | 'logo' | 'footer'),
    handleMouseDown, handleMouseMove, handleMouseUp
  };

  const downloadStepProps = {
    request: request!,
    editableHeadline,
    editableSubheadline,
    headlineFontFamily, headlineFontSize, headlineColor,
    subheadlineFontFamily, subheadlineFontSize, subheadlineColor,
    headlinePosition, subheadlinePosition, logoPosition,
    selectedGeneratedImageUrl: selectedImageIndex !== null ? generatedImageOptions[selectedImageIndex] : null,
    uploadedBackgroundImage,
    uploadedLogoUrl,
    uploadedFooterImageUrl,
    onDownloadImage: handleDownloadImage,
    onDownloadSvg: handleDownloadSvg,
    imageWasGeneratedWithAiText: imageWasGeneratedWithAiText,
  };


  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Loading Request Data...</h2>
        <p className="text-muted-foreground">Please wait while the content request is being fetched from the database. If this persists, check your connection or the request ID.</p>
         <Loader2 className="h-8 w-8 animate-spin text-primary mt-4" />
      </div>
    );
  }

  const StepNavigation = () => (
     <div className="flex justify-between items-center mt-8 border-t pt-4">
        <Button onClick={() => setCurrentStep(s => Math.max(1, s - 1))} disabled={currentStep === 1 || isSaving} variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous Step
        </Button>
        <div className="text-sm text-muted-foreground">Step {currentStep} of {totalSteps}</div>
        <Button
          onClick={() => {
            if (currentStep === 3 && !(selectedImageIndex !== null || uploadedBackgroundImage) ) {
              toast({
                title: "Image Required",
                description: "Please select an AI generated image or upload a custom background in Step 3 before proceeding to Download.",
                variant: "destructive",
                duration: 6000
              });
              return;
            }
            setCurrentStep(s => Math.min(totalSteps, s + 1));
          }}
          disabled={
            currentStep === totalSteps ||
            (currentStep === 3 && !(selectedImageIndex !== null || uploadedBackgroundImage)) ||
            isSaving || isGeneratingImage || isUpdatingImage || isGeneratingStandardPost || isGeneratingCreativePost || isAnalyzingExamplePost
          }
          title={
            (currentStep === 3 && !(selectedImageIndex !== null || uploadedBackgroundImage))
            ? "Please select or upload a background image before proceeding."
            : ""
          }
        >
            Next Step <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
    </div>
  );

  return (
    <div className="space-y-8 p-1 md:p-2 lg:p-4">
        {currentStep === 1 && (
            <RequestOverviewStep
                request={request}
                onFieldChange={handleRequestFieldChange}
                isSaving={isSaving}
                onAnalyzeExamplePost={(file: File) => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const dataUri = reader.result as string;
                    setUploadedExamplePostUrl(dataUri); 
                    handleAnalyzeUploadedPost(dataUri);
                  };
                  reader.readAsDataURL(file);
                }}
                isAnalyzingExamplePost={isAnalyzingExamplePost}
                uploadedExamplePostUrl={uploadedExamplePostUrl}
            />
        )}

        {currentStep === 2 && (
            <AITextGenerationStep
                request={request}
                onGenerateStandardPost={() => handleGenerateFullPost(false)}
                onGenerateCreativePost={() => handleGenerateFullPost(true)}
                isGeneratingStandardPost={isGeneratingStandardPost}
                isGeneratingCreativePost={isGeneratingCreativePost}
                onSocialPostOutputFieldChange={handleSocialPostOutputFieldChange}
            />
        )}

        {currentStep === 3 && (
            <VisualComposerStep {...visualComposerProps} />
        )}

        {currentStep === 4 && (
             <DownloadStep {...downloadStepProps} />
        )}

        <StepNavigation />
    </div>
  );
}
