
'use server';
/**
 * @fileOverview AI agent for generating a complete structured social media post's text content.
 *
 * - generateStructuredSocialPost - A function that handles the full post generation process.
 * - GenerateStructuredSocialPostInput - The input type for the function.
 * - FullSocialPostOutput - The return type (defined in @/lib/types).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { FullSocialPostOutput, GenerateStructuredSocialPostInput as LibGenerateStructuredSocialPostInput } from '@/lib/types';

// Use the type from lib/types for the function signature
export type GenerateStructuredSocialPostInput = LibGenerateStructuredSocialPostInput;


const GenerateStructuredSocialPostInputSchema = z.object({
  clientName: z.string().default('Merry Maids Canada').describe('The name of the client.'),
  clientNiche: z.string().default('Home Cleaning Services').describe('The niche of the client.'),
  platform: z.string().default('Instagram').describe('The social media platform (e.g., Instagram, Facebook, Pinterest).'),
  initialTopicIdea: z.string().optional().describe('The core message, theme, or starting point for the post (e.g., "Spring Cleaning"). This should strongly influence the headline.'),
  calendarContext: z.string().optional().describe('Any relevant holidays or events, e.g., Mother\'s Day.'),
  creativeDirection: z.string().optional().describe('Detailed creative direction for the post, including desired image style, layout, OVERLAY TEXT CONTENT (headline, subheading suggestions and their styles), and branding/footer details. This is a key input for the AI.'),
  brandGuidelinesSummary: z.string().describe('A summary of brand guidelines: colors, fonts, logo rules, tone guide.'),
  brandInstagramFeedUrl: z.string().url().optional().describe('URL to the brand\'s Instagram feed for visual reference.'),
  creativeMode: z.boolean().optional().default(false).describe('If true, generate a more fun, trendy post, possibly deviating from strict brand guidelines for creativity.'),
});

// Output schema for a single post version
const SinglePostVersionSchema = z.object({
    image_copy: z.string().describe("Synthesized text for image overlay. Should combine headline and subheadline. E.g., 'SPRING CLEANING.\\nRefresh your home for the new season.' Max 8-10 words ideally. AI will generate this from its headline/subheadline suggestions."),
    headline_suggestion: z.string().optional().describe("Suggested Headline Text (e.g., 'SPRING CLEANING.'). THIS MUST BE DERIVED PRIMARILY FROM THE 'initialTopicIdea'. Should be concise. AI should note if it should be ALL CAPS based on creative direction or common practice."),
    subheadline_suggestion: z.string().optional().describe("Suggested Subheadline Text (e.g., 'Refresh your home for the new season.'). Complementary to the headline and derived from creative direction or initial topic."),
    caption: z.string().describe("Full post caption: hook → message → soft CTA. Friendly Canadian English. Use line breaks. Include 3-5 sharp, relevant hashtags."),
    alt_text: z.string().describe("Alt-text for the image (≤ 125 chars). Describe the visual elements + mood that the AI image generator *should* create based on creativeDirection."),
    rationale: z.string().describe("Brief, insightful rationale explaining why the suggested text components meet the post's goal and align with the brand, considering the creativeDirection and creativeMode if active."),
    notes: z.object({
      colour_hex: z.string().describe("Primary brand color hex suggested for visual consistency (e.g., #004C34 for Merry Maids green)."),
      font: z.string().describe("Primary brand font suggested for overall visual consistency (e.g., Proxima Nova Bold)."),
      layout_tips: z.string().describe("Key layout considerations. Suggest font styles for headline/subheadline (e.g., 'Headline: Clean Sans Serif, ALL CAPS. Subheadline: Handwritten/Script style.'). Suggest gradient ideas or footer layout based on creativeDirection if specified (e.g., 'Light green gradient overlay at bottom. Footer: Left white bg, red text with maple leaf icon. Right green bg, white logo & slogan.'). If creativeMode is active, tips might include more dynamic layout ideas."),
      headlineFontFamily: z.string().optional().describe("Suggested font family for headline if different from main brand font."),
      headlineFontSize: z.number().optional().describe("Suggested font size for headline."),
      headlineColor: z.string().optional().describe("Suggested color for headline text."),
      subheadlineFontFamily: z.string().optional().describe("Suggested font family for subheadline."),
      subheadlineFontSize: z.number().optional().describe("Suggested font size for subheadline."),
      subheadlineColor: z.string().optional().describe("Suggested color for subheadline text."),
    }),
    footer_left_text_suggestion: z.string().optional().describe("Suggested text for the left part of a branded footer, based on creativeDirection (e.g., 'Canadian owner.\\nCanadian team.\\nFor Canadian homes.'). Include \\n for newlines."),
    footer_right_slogan_suggestion: z.string().optional().describe("Suggested text for the right part of a branded footer, typically the brand slogan, based on creativeDirection (e.g., 'Relax. It’s Done.®')."),
    video_concept_ideas: z.array(z.string()).optional().describe("Optional: 2-3 brief concept ideas for a complementary short video. If creativeMode is active, these might be more playful or trend-focused.")
});


export async function generateStructuredSocialPost(input: GenerateStructuredSocialPostInput): Promise<FullSocialPostOutput> {
  return generateStructuredSocialPostFlow(input as z.infer<typeof GenerateStructuredSocialPostInputSchema>);
}

const prompt = ai.definePrompt({
  name: 'generateStructuredSocialPostPrompt',
  input: {schema: GenerateStructuredSocialPostInputSchema},
  output: {schema: SinglePostVersionSchema }, // Output a single post version
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `
You are an expert Social Media Content Specialist for Merry Maids Canada.
Your task is to generate the TEXTUAL components and layout suggestions for a social media post for the {{{platform}}} platform, based on the provided creative direction and initial topic idea.
You are NOT generating the image itself, but all the text that goes with it and on it, plus notes for how it should look.

CLIENT: {{{clientName}}} ({{{clientNiche}}})
BRAND INSTAGRAM (for style reference): {{#if brandInstagramFeedUrl}}{{{brandInstagramFeedUrl}}}{{else}}Not provided.{{/if}}
BRAND GUIDELINES SUMMARY: {{{brandGuidelinesSummary}}}

INPUTS FOR THIS POST:
- Initial Topic/Theme (KEY INPUT for HEADLINE): {{{initialTopicIdea}}}
- Calendar Context: {{#if calendarContext}}"{{{calendarContext}}}"{{else}}"None specified."{{/if}}
- Creative Direction (KEY INPUT - this contains image style, OVERLAY TEXT CONTENT IDEAS - headline/subheadline styles - and footer details):
  \`\`\`
  {{{creativeDirection}}}
  \`\`\`
{{#if creativeMode}}
IMPORTANT: You are in CREATIVE MODE. Your primary goal is to generate a FUN, ENGAGING, and TREND-AWARE post.
While considering the brand guidelines and creative direction, prioritize creativity, humor (if appropriate for Merry Maids), and current social media trends.
You can suggest more playful image copy, captions, and even slightly different layout ideas that are more dynamic or attention-grabbing.
If the provided 'Creative Direction' is very formal, try to inject fun into it or suggest a creative twist.
The rationale should explain how the creative approach aligns with engaging a wider audience or capitalizing on a trend.
Video concept ideas should also be more playful or trend-focused.
Layout tips might include more dynamic or unconventional ideas suitable for a trendy post.
{{else}}
You are in STANDARD MODE. Adhere closely to the provided 'Creative Direction' and 'Brand Guidelines Summary' to produce a professional, on-brand post.
{{/if}}

Your goal is to extract and refine the textual elements, adapting for creative mode if active.

SPECIFIC TEXTUAL COMPONENTS TO GENERATE FOR ONE POST VERSION:

1.  HEADLINE SUGGESTION (headline_suggestion):
    *   CRITICAL: Derive the main headline text PRIMARILY from the 'Initial Topic/Theme: {{{initialTopicIdea}}}'.
    *   Refer to the 'Overlay Text Content' section within 'Creative Direction' for style (e.g., "All Caps, Clean Sans Serif Font") and refine.
    *   If in Creative Mode, this could be a catchy or playful take on the topic.
    *   Ensure it's concise.

2.  SUBHEADLINE SUGGESTION (subheadline_suggestion):
    *   Craft a subheadline that complements the headline.
    *   Refer to the 'Overlay Text Content' section within 'Creative Direction' for style (e.g., "Handwritten/Script Style Font").
    *   If in Creative Mode, this could be a witty follow-up.

3.  MAIN IMAGE COPY (image_copy):
    *   Synthesize a concise text for the *main visual overlay* on the image by combining your generated headline_suggestion and subheadline_suggestion. (e.g., "SPRING CLEANING.\\nRefresh your home for the new season."). Keep it brief (max 10 words).

4.  CAPTION (caption):
    *   Write an engaging post caption. Structure: Hook -> Main Message (elaborating on the theme from initialTopicIdea and creativeDirection) -> Soft Call to Action.
    *   Use friendly, professional Canadian English. Use line breaks for readability.
    *   Include 3-5 relevant hashtags (e.g., #MerryMaidsCanada #HomeCleaning #SparklingClean #{{{initialTopicIdea}}} #[CityName]Clean if applicable).
    *   If in Creative Mode, the caption can be more informal, use more emojis (if brand allows), and incorporate trend-related language or calls to action (e.g., "Tag a friend who needs this!").

5.  ALT-TEXT (alt_text):
    *   Describe the *intended* visual elements, setting, and mood of the background image that an image generation AI *should create* based on the 'Image Style & Layout' part of the Creative Direction. Max 125 characters. (e.g., "A smiling Merry Maids professional in uniform cleaning a bright kitchen with spring flowers visible, promoting seasonal cleaning services.")
    *   If in Creative Mode, the mood might be more playful or energetic.

6.  FOOTER TEXT SUGGESTIONS:
    *   footer_left_text_suggestion: Extract or generate the multi-line text for the left side of the footer as described in the "Branding & Footer Section" of 'Creative Direction' (e.g., "Canadian owner.\\nCanadian team.\\nFor Canadian homes."). Use \\n for newlines.
    *   footer_right_slogan_suggestion: Extract or generate the slogan for the right side of the footer from the "Branding & Footer Section" of 'Creative Direction' (e.g., "Relax. It’s Done.®").

7.  RATIONALE (rationale):
    *   Briefly explain why your text suggestions align with the Initial Topic/Theme, Creative Direction, brand, and Creative Mode (if active).

8.  NOTES (notes object):
    *   notes.colour_hex: Suggest a primary brand color from brandGuidelinesSummary (e.g., #004C34).
    *   notes.font: Suggest a primary brand font from brandGuidelinesSummary (e.g., Proxima Nova Bold).
    *   notes.layout_tips: Provide key layout advice based on the Creative Direction. Crucially, include:
        *   Font style suggestions for headline (e.g., "Headline: Clean Sans Serif, ALL CAPS").
        *   Font style suggestions for subheadline (e.g., "Subheadline: Handwritten/Script style font").
        *   Mention any gradient ideas for text readability if specified in Creative Direction.
        *   Summarize footer layout if specified (e.g., "Footer: Left white bg, red text, maple leaf. Right green bg, white logo & slogan.").
        *   General tips like "Ensure text overlay has high contrast."
        *   If in Creative Mode, layout tips might include more dynamic or unconventional ideas.
    *   notes.headlineFontFamily, notes.headlineFontSize, notes.headlineColor: Suggest sensible defaults or derive from creative_direction for UI pre-fill.
    *   notes.subheadlineFontFamily, notes.subheadlineFontSize, notes.subheadlineColor: Suggest sensible defaults or derive from creative_direction for UI pre-fill.


9.  VIDEO CONCEPT IDEAS (video_concept_ideas, optional):
    *   If appropriate, 2-3 brief video concepts related to the theme. If in Creative Mode, these should be more playful or trend-focused.

Output ONLY ONE JSON object matching the defined SinglePostVersionSchema.
The headline_suggestion MUST be based on the 'Initial Topic/Theme: {{{initialTopicIdea}}}'.
`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }
});

const generateStructuredSocialPostFlow = ai.defineFlow(
  {
    name: 'generateStructuredSocialPostFlow',
    inputSchema: GenerateStructuredSocialPostInputSchema,
    outputSchema: SinglePostVersionSchema, // Expect a single post version
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI failed to generate structured social post data.");
    }
    
    // Directly return the single post version output
    const result: FullSocialPostOutput = {
      image_copy: output.image_copy,
      headline_suggestion: output.headline_suggestion,
      subheadline_suggestion: output.subheadline_suggestion,
      caption: output.caption,
      alt_text: output.alt_text,
      rationale: output.rationale,
      notes: {
        colour_hex: output.notes.colour_hex || clientDetails.brandGuidelines.colors[0] || '#004C34',
        font: output.notes.font || clientDetails.brandGuidelines.primaryFont || 'Arial',
        layout_tips: output.notes.layout_tips || 'Ensure text overlay has high contrast.',
        headlineFontFamily: output.notes.headlineFontFamily,
        headlineFontSize: output.notes.headlineFontSize,
        headlineColor: output.notes.headlineColor,
        subheadlineFontFamily: output.notes.subheadlineFontFamily,
        subheadlineFontSize: output.notes.subheadlineFontSize,
        subheadlineColor: output.notes.subheadlineColor,
      },
      footer_left_text_suggestion: output.footer_left_text_suggestion,
      footer_right_slogan_suggestion: output.footer_right_slogan_suggestion,
      video_concept_ideas: output.video_concept_ideas || [],
      theme: input.initialTopicIdea, 
      calendar_context: input.calendarContext,
      creative_direction: input.creativeDirection, 
    };
    return result;
  }
);

// Placeholder for clientDetails if not available in this scope
// In a real app, you might fetch this or have it passed in.
const clientDetails = {
  brandGuidelines: {
    colors: ["#004C34"],
    primaryFont: "Proxima Nova"
  }
};
