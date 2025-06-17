
'use server';
/**
 * @fileOverview An AI agent for analyzing an uploaded social media post image
 * and generating a descriptive "Creative Direction" based on it.
 *
 * - analyzeUploadedPost - Function to analyze the image and return a description.
 * - AnalyzeUploadedPostInput - Input type for the function.
 * - AnalyzeUploadedPostOutput - Output type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeUploadedPostInputSchema = z.object({
  imageDataUri: z.string().describe("The uploaded social media post image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type AnalyzeUploadedPostInput = z.infer<typeof AnalyzeUploadedPostInputSchema>;

const AnalyzeUploadedPostOutputSchema = z.object({
  creativeDirectionSuggestion: z.string().describe('A detailed textual description of the uploaded image, formatted to be suitable as "Creative Direction" for generating similar posts. It should cover visual style, layout, color scheme, mood, key objects, and any discernible textual themes or styles. Include sections like "Image Style & Layout:", "Overlay Text Content:", and "Branding & Footer Section:" if discernible elements are present.'),
});
export type AnalyzeUploadedPostOutput = z.infer<typeof AnalyzeUploadedPostOutputSchema>;

export async function analyzeUploadedPost(input: AnalyzeUploadedPostInput): Promise<AnalyzeUploadedPostOutput> {
  return analyzeUploadedPostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeUploadedPostPrompt',
  input: {schema: AnalyzeUploadedPostInputSchema},
  output: {schema: AnalyzeUploadedPostOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest', // This model supports multimodal input (image + text)
  prompt: `You are an expert visual analyst specializing in social media post design.
Analyze the provided social media post image ({{media url=imageDataUri}}).

Based on your analysis, generate a detailed textual "Creative Direction". This direction should enable another AI to create a *similar* new post. Your output must be a single string.

Structure your "Creative Direction" suggestion with the following sections if elements are discernible. If not, omit the section or state "Not clearly discernible."

1.  **Image Style & Layout:**
    *   Describe the overall visual style (e.g., photorealistic, illustrative, minimalist, vibrant).
    *   Describe the composition and layout (e.g., full-bleed background, centered subject, rule of thirds).
    *   Identify key subjects or objects and their arrangement.
    *   Describe the lighting, mood, and atmosphere (e.g., bright and airy, warm and welcoming, dramatic).
    *   Mention any notable props or settings.

2.  **Overlay Text Content (if visible and discernible):**
    *   Suggest a headline style and potential content based on the image.
    *   Suggest a subheadline style and potential content.
    *   Note any prominent fonts or text styles observed (e.g., "All Caps, Clean Sans Serif Font", "Handwritten/Script Style Font").
    *   Describe any text effects (e.g., gradients, shadows).

3.  **Branding & Footer Section (if visible and discernible):**
    *   Describe any visible logos, brand marks, or their typical placement.
    *   Describe any footer elements, like slogans or contact information, and their layout.

Your goal is to provide a comprehensive textual blueprint that captures the essence of the uploaded image's design, suitable for guiding the creation of new, similar posts.

Creative Direction Suggestion:
`,
});

const analyzeUploadedPostFlow = ai.defineFlow(
  {
    name: 'analyzeUploadedPostFlow',
    inputSchema: AnalyzeUploadedPostInputSchema,
    outputSchema: AnalyzeUploadedPostOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to analyze the uploaded image.');
    }
    return output;
  }
);
