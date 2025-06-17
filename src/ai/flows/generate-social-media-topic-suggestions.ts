// src/ai/flows/generate-social-media-topic-suggestions.ts
'use server';
/**
 * @fileOverview An AI agent for generating social media topic suggestions.
 *
 * - generateSocialMediaTopicSuggestions - A function that handles the topic suggestion generation process.
 * - GenerateSocialMediaTopicSuggestionsInput - The input type for the generateSocialMediaTopicSuggestions function.
 * - GenerateSocialMediaTopicSuggestionsOutput - The return type for the generateSocialMediaTopicSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSocialMediaTopicSuggestionsInputSchema = z.object({
  clientNiche: z.string().describe('The niche of the client, e.g., sustainable fashion.'),
  platform: z.string().describe('The social media platform (e.g., Instagram, Facebook, LinkedIn).'),
  initialTopicIdea: z.string().optional().describe('The initial topic idea or key message from the user.'),
  theme: z.string().optional().describe('The overall theme for the content request or campaign.'),
});
export type GenerateSocialMediaTopicSuggestionsInput = z.infer<typeof GenerateSocialMediaTopicSuggestionsInputSchema>;

const GenerateSocialMediaTopicSuggestionsOutputSchema = z.object({
  topicSuggestions: z.array(
    z.string().describe('A suggested social media topic.')
  ).describe('A list of social media topic suggestions.'),
});
export type GenerateSocialMediaTopicSuggestionsOutput = z.infer<typeof GenerateSocialMediaTopicSuggestionsOutputSchema>;

export async function generateSocialMediaTopicSuggestions(input: GenerateSocialMediaTopicSuggestionsInput): Promise<GenerateSocialMediaTopicSuggestionsOutput> {
  return generateSocialMediaTopicSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSocialMediaTopicSuggestionsPrompt',
  input: {schema: GenerateSocialMediaTopicSuggestionsInputSchema},
  output: {schema: GenerateSocialMediaTopicSuggestionsOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are a social media expert. Suggest engaging social media topics for a client in the {{{clientNiche}}} niche, targeting {{{platform}}}.
{{#if initialTopicIdea}}The user has provided an initial idea or key message: "{{initialTopicIdea}}". Build upon or relate to this.{{/if}}
{{#if theme}}The overall theme for this content is "{{theme}}".{{/if}}
Incorporate trending themes and viral potential. Return a list of engaging topics that will resonate with the target audience.
Return ONLY the topic suggestions in the output. No introductory text. No concluding text. Just the topic suggestions.

Example:
[
  "The Future of Sustainable Fashion",
  "Eco-Friendly Fashion Brands",
  "How to Shop Sustainably",
  "Sustainable Fashion Tips",
  "The Environmental Impact of Fast Fashion"
]

Do not include any additional text or formatting outside of the array.

Topic Suggestions:
`,
});

const generateSocialMediaTopicSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateSocialMediaTopicSuggestionsFlow',
    inputSchema: GenerateSocialMediaTopicSuggestionsInputSchema,
    outputSchema: GenerateSocialMediaTopicSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
