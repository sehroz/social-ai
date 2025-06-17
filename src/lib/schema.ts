import { z } from 'zod';

export const contentRequestSchema = z.object({
  clientId: z.string().min(1, "Client ID is required."), // Will be fixed to Merry Maids
  campaignName: z.string().min(3, "Campaign name/theme must be at least 3 characters."),
  initialTopicIdea: z.string().min(3, "Key message must be at least 3 characters."),
  dueDate: z.string().min(1, "Due date is required."), 
  brandGuidelinesLink: z.string().url("Must be a valid URL.").or(z.literal('')).optional(),
  notes: z.string().optional(),
  clientNiche: z.string().min(3, "Client niche is required for AI suggestions."),
  platform: z.enum(['Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'TikTok'], {
    errorMap: () => ({ message: "Please select a platform." })
  }),
  brandVoice: z.string().optional(),
  targetAudience: z.string().optional(),
  // Dynamic Input fields from user's JSON example
  theme: z.string().optional(), // Specific post theme
  calendar_context: z.string().optional(), // e.g., Mother's Day
  creative_direction: z.string().optional(), // Visual style, image ideas
  // New fields for Image Generation Specifications
  imageSpecifications: z.object({
    imagePrompt: z.string().optional(), // Detailed description for image generation
    imageStyle: z.string().optional(), // Visual style, mood, lighting
    overlayText: z.object({
      headline: z.object({
        text: z.string(),
        font: z.string().optional(),
        style: z.string().optional(), // e.g., All Caps
        color: z.string().optional(),
      }).optional(),
      subheading: z.object({
        text: z.string(),
        font: z.string().optional(), // e.g., Handwritten/Script Style Font
        color: z.string().optional(),
        position: z.string().optional(), // e.g., below headline
      }).optional(),
    }).optional(),
    textOverlayGradient: z.object({
      color: z.string().optional(), // e.g., light green
      position: z.string().optional(), // e.g., bottom
      opacity: z.number().optional(),
    }).optional(),
    brandingFooter: z.object({
      layout: z.string().optional(), // e.g., Split footer into two sections
      leftSection: z.object({
        backgroundColor: z.string().optional(), // e.g., White
        icon: z.string().optional(), // e.g., red maple leaf
        text: z.string().optional(),
        textColor: z.string().optional(), // e.g., bold red
      }).optional(),
      rightSection: z.object({
        backgroundColor: z.string().optional(), // e.g., Green
        logo: z.string().optional(), // e.g., Merry Maids logo in white
        slogan: z.string().optional(), // e.g., Relax. It’s Done.®
        sloganSize: z.string().optional(), // e.g., smaller font
      }).optional(),
    }).optional(),
    imageDimensions: z.object({
      width: z.number().optional(),
      height: z.number().optional(),
    }).optional(),
    outputFormat: z.string().optional(), // e.g., PNG
    platformOptimization: z.string().optional(), // Information about platform-specific requirements
  }).optional(),
});

export type ContentRequestFormValues = z.infer<typeof contentRequestSchema>;

export const generateCopySchema = z.object({
  topic: z.string().min(1, "A topic is required to generate copy."),
  tone: z.string().min(2, "Tone is required."),
  wordLimit: z.number().min(10, "Word limit must be at least 10.").max(1000, "Word limit cannot exceed 1000."), // Increased max limit
});

export type GenerateCopyFormValues = z.infer<typeof generateCopySchema>;
