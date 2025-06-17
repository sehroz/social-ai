
'use server';
/**
 * @fileOverview AI-powered copy generation for social media posts.
 *
 * - generateSocialMediaPostCopy - A function that handles the generation of social media post copy.
 * - GenerateSocialMediaPostCopyInput - The input type for the generateSocialMediaPostCopy function.
 * - GenerateSocialMediaPostCopyOutput - The return type for the generateSocialMediaPostCopy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSocialMediaPostCopyInputSchema = z.object({
  clientId: z.string().describe('The ID of the client.'),
  topic: z.string().describe('The approved topic for the social media post.'),
  brandGuidelines: z.string().describe('The brand guidelines for the client.'),
  tone: z.string().describe('The desired tone of the social media post.'),
  wordLimit: z.number().describe('The word limit for the social media post.'),
});
export type GenerateSocialMediaPostCopyInput = z.infer<typeof GenerateSocialMediaPostCopyInputSchema>;

const GenerateSocialMediaPostCopyOutputSchema = z.object({
  copy: z.string().describe('The generated social media post copy.'),
});
export type GenerateSocialMediaPostCopyOutput = z.infer<typeof GenerateSocialMediaPostCopyOutputSchema>;

export async function generateSocialMediaPostCopy(input: GenerateSocialMediaPostCopyInput): Promise<GenerateSocialMediaPostCopyOutput> {
  return generateSocialMediaPostCopyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSocialMediaPostCopyPrompt',
  input: {schema: GenerateSocialMediaPostCopyInputSchema},
  output: {schema: GenerateSocialMediaPostCopyOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest', // Added model specification
  prompt: `Write a social media post copy for the following client:

Client ID: {{{clientId}}}
Topic: {{{topic}}}
Brand Guidelines: {{{brandGuidelines}}}
Tone: {{{tone}}}
Word Limit: {{{wordLimit}}}

Copy:`,
});

const generateSocialMediaPostCopyFlow = ai.defineFlow(
  {
    name: 'generateSocialMediaPostCopyFlow',
    inputSchema: GenerateSocialMediaPostCopyInputSchema,
    outputSchema: GenerateSocialMediaPostCopyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

