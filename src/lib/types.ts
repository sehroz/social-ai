
export interface FullSocialPostOutput {
  image_copy: string;
  caption: string;
  alt_text: string;
  rationale: string;
  notes: {
    colour_hex: string;
    font: string;
    layout_tips: string;
    headlineFontFamily?: string;
    headlineFontSize?: number;
    headlineColor?: string;
    subheadlineFontFamily?: string;
    subheadlineFontSize?: number;
    subheadlineColor?: string;
  };
  headline_suggestion?: string;
  subheadline_suggestion?: string;
  footer_left_text_suggestion?: string;
  footer_right_slogan_suggestion?: string;
  video_concept_ideas?: string[]; // Array of strings
  theme?: string;
  calendar_context?: string;
  creative_direction?: string;
}

export interface DraggableElementPosition {
  x: number; // percentage
  y: number; // percentage
}

export interface ContentRequest {
  id: string;
  clientId: string;
  campaignName: string;
  initialTopicIdea?: string;
  dueDate: string; // Keep as string
  brandGuidelinesLink: string;
  notes?: string;
  clientNiche: string;
  platform: 'Instagram' | 'Facebook' | 'LinkedIn' | 'Twitter' | 'TikTok' | 'Pinterest';
  status: 'Pending' | 'TopicsGenerated' | 'CopyGenerated' | 'ImageGenerated' | 'PostGenerated' | 'Review' | 'Scheduled' | 'Posted';
  createdAt: string; // Keep as string
  updatedAt?: string; // Keep as string

  socialPostOutput?: FullSocialPostOutput; // Single object

  imageUrl?: string;
  uploadedBackgroundImageUrl?: string;
  uploadedLogoUrl?: string;
  uploadedFooterImageUrl?: string;
  uploadedExamplePostUrl?: string; // For analyzing an example post

  headlinePosition?: DraggableElementPosition;
  subheadlinePosition?: DraggableElementPosition;
  logoOverlayPosition?: DraggableElementPosition;

  theme?: string;
  calendar_context?: string;
  creative_direction?: string;

  // Fields for "Generate Image w/ AI Text" feature
  imageWasGeneratedWithAiText?: boolean;
}

export interface ClientProfileBrandGuidelines {
  colors: string[];
  primaryFont: string;
  secondaryFont?: string;
  logoUrl?: string;
  secondaryLogoUrl?: string;
  toneOfVoice: string;
  brandVoice: string;
  targetAudience: string;
  styleGuideUrl?: string;
  assetLibraryUrl?: string;
  instagramFeedUrl?: string;
  negativeKeywords?: string[];
  preferredEmojis?: string;
  canvaUsageNotes?: string;
  brandKitDetails?: string;
  assetLibraryDetails?: string;
}

export interface ClientProfile {
  id: string;
  name: string;
  niche: string;
  brandGuidelines: ClientProfileBrandGuidelines;
  socialProfiles: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    tiktok?: string;
  };
}

// Input schema for the structured social post generation flow
export interface GenerateStructuredSocialPostInput {
  clientName: string;
  clientNiche: string;
  platform: string;
  initialTopicIdea?: string;
  calendarContext?: string;
  creativeDirection?: string;
  brandGuidelinesSummary: string;
  brandInstagramFeedUrl?: string;
  creativeMode?: boolean;
}
