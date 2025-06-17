
'use server';
/**
 * @fileOverview AI-powered image generation for social media posts using Gemini.
 *
 * - generateSocialMediaImage - A function that handles the generation of social media post images.
 * - GenerateSocialMediaImageInput - The input type for the generateSocialMediaImage function.
 * - GenerateSocialMediaImageOutput - The return type for the generateSocialMediaImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSocialMediaImageInputSchema = z.object({
  imageCopyText: z.string().describe('The core theme or text intended for the image, used for thematic inspiration. The AI should generate a background/scene, and if renderTextDirectly is true, attempt to render this text.'),
  backgroundImageUrl: z.string().optional().describe("Optional URL of a background image provided by the user (data URI). If present, the AI should try to create a scene consistent with this background's theme."),
  logoUrl: z.string().optional().describe("Optional URL of a logo provided by the user (data URI). If present, the AI should try to create a scene that stylistically complements this logo."),
  platform: z.string().optional().default('Instagram').describe('The social media platform for which the image is intended (e.g., Instagram).'),
  designSpecifications: z.object({
    imageStyleAndLayout: z.string().optional().describe('Detailed creative direction for the image style, layout, mood, and specific visual elements. This is the primary guide for the AI.'),
  }).optional().describe('Detailed design specifications from the creative_direction field.'),
  renderTextDirectly: z.boolean().optional().default(false).describe('If true, instruct the AI to attempt rendering the imageCopyText directly onto the image (experimental).'),
  baseImageDataUri: z.string().optional().describe("Optional Base64 data URI of an image to edit. If provided, imageCopyText acts as the editing prompt.")
});
export type GenerateSocialMediaImageInput = z.infer<typeof GenerateSocialMediaImageInputSchema>;

const GenerateSocialMediaImageOutputSchema = z.object({
 imageUrls: z.array(z.string().nullable()).length(2).describe('An array of two generated image URLs as data URI strings (e.g., "data:image/png;base64,..."). An element can be null if generation for that slot failed.'),
});
export type GenerateSocialMediaImageOutput = z.infer<typeof GenerateSocialMediaImageOutputSchema>;

export async function generateSocialMediaImage(input: GenerateSocialMediaImageInput): Promise<GenerateSocialMediaImageOutput> {
  return generateSocialMediaImageFlow(input);
}

const generateSocialMediaImageFlow = ai.defineFlow(
  {
    name: 'generateSocialMediaImageFlow',
    inputSchema: GenerateSocialMediaImageInputSchema,
    outputSchema: GenerateSocialMediaImageOutputSchema,
  },
  async (input) => {
    const { imageCopyText, backgroundImageUrl, logoUrl, platform = 'Instagram', designSpecifications, renderTextDirectly = false, baseImageDataUri } = input;
    console.log("Genkit: generateSocialMediaImage flow started with input:", JSON.stringify(input, null, 2).substring(0, 500)); // Log trimmed input

    let detailedPrompt = "";
    const baseSceneInstruction = `Generate an Instagram image (photorealistic, HD quality, natural style) for Merry Maids Canada. The image should be a visually stunning composition.`;

    let textRenderingInstruction = "";
    if (renderTextDirectly) {
      textRenderingInstruction = `**CRITICAL INSTRUCTION: Attempt to render the specified headline, subheading, and other text elements described in the creative direction directly onto the image.** Pay close attention to font style descriptions (e.g., 'All Caps, Clean Sans Serif Font' for headlines, 'Handwritten/Script Style Font' for subheadings) if provided. The primary text to render is: "${imageCopyText}".`;
    } else {
      textRenderingInstruction = `**CRITICAL INSTRUCTION: Generate ONLY the background image. DO NOT attempt to render or draw ANY text (headlines, subheadings, slogans, footer text, etc.) or any logos directly onto the image itself.** The image should serve as a backdrop for the text: "${imageCopyText}".`;
    }

    let designSpecPrompt = "";
    if (designSpecifications?.imageStyleAndLayout) {
      designSpecPrompt = `The visual style, layout, and thematic elements of the image should be derived from and perfectly complement the following creative direction:
---
${designSpecifications.imageStyleAndLayout}
---
This creative direction includes details on desired image style, specific scenes (e.g., 'tidy kitchen', 'living room with natural light'), props ('mop', 'seasonal greenery'), overall mood ('warm', 'welcoming'), and may also describe text elements that you should NOT render but use for thematic inspiration.
Ensure the image is bright, airy, modern, exceptionally clean, and inviting, with natural-looking light. The image must look like a real photograph.
Avoid: Cluttered or messy scenes, dark visuals, unprofessional elements, distorted figures, or cartoonish/artificial styles if not explicitly requested.`;
      if (designSpecifications.imageStyleAndLayout.includes("negative_keywords")) {
        designSpecPrompt += "\nAdhere strictly to any negative keywords provided in the creative direction to exclude unwanted elements."
      }
    } else {
      // Fallback if no specific design specs, use imageCopyText for theme
      designSpecPrompt = `The image should be themed around "${imageCopyText}". It should feature a modern, exceptionally clean, bright, airy, and inviting home environment (e.g., sparkling kitchen, pristine bathroom, tidy living room) with natural-looking light. The overall mood should be one of relief, satisfaction, and the pleasure of a beautifully maintained home.`;
    }
    
    detailedPrompt = `${baseSceneInstruction}
${textRenderingInstruction}
${designSpecPrompt}`;

    if (backgroundImageUrl && !renderTextDirectly) {
      detailedPrompt += `\nFor additional thematic context, the generated image should be thematically consistent and harmonious with a user-provided background concept.`;
    }
    if (logoUrl && !renderTextDirectly) {
      detailedPrompt += `\nThe generated scene should also be designed to stylistically and thematically complement the Merry Maids brand identity (which might be hinted at by a provided logo concept). DO NOT attempt to render the logo itself onto the image.`;
    }

    const geminiModel = 'googleai/gemini-2.0-flash-exp'; // Gemini model for image generation

    if (baseImageDataUri) {
        // This is an editing request
        console.log("Genkit: Performing image editing...");
        try {
            const { media } = await ai.generate({
                model: geminiModel,
                prompt: [ // Gemini expects an array for image editing
                    {text: imageCopyText}, // The editing instruction
                    {inlineData: {mimeType: 'image/png', data: baseImageDataUri.split(',')[1]}} // The base image
                ],
                config: {
                    responseModalities: ['TEXT', 'IMAGE'],
                },
            });
            if (!media || !media.url) {
                console.error('Genkit: Gemini image editing failed or returned no media URL.');
                return { imageUrls: [null, null] }; // Return nulls if editing fails
            }
            console.log("Genkit: Image editing successful. URL:", media.url ? media.url.substring(0,100) + "..." : "undefined");
            // For editing, we return the edited image in both slots to satisfy the schema, client will handle appropriately.
            return { imageUrls: [media.url, media.url] };
        } catch (error) {
            console.error('Genkit: Error during Gemini image editing:', error);
            return { imageUrls: [null, null] }; // Return nulls on error
        }
    } else {
        // This is an initial generation request for two options
        console.log("Genkit: Performing initial generation for two options...");
        let url1: string | null = null;
        let url2: string | null = null;

        try {
            console.log("Genkit: Generating image option 1 with prompt:", detailedPrompt.substring(0,200) + "...");
            const response1 = await ai.generate({
                model: geminiModel,
                prompt: detailedPrompt,
                config: { responseModalities: ['TEXT', 'IMAGE'] },
            });
            if (response1.media && response1.media.url) {
                url1 = response1.media.url;
                console.log("Genkit: Image URL 1:", url1.substring(0,100) + "...");
            } else {
                 console.error('Genkit: Gemini image generation (option 1) returned no media URL.');
            }
        } catch (error) {
            console.error('Genkit: Error generating image option 1:', error);
        }

        try {
            const prompt2 = detailedPrompt + "\nTry a slightly different artistic interpretation or angle.";
            console.log("Genkit: Generating image option 2 with modified prompt:", prompt2.substring(0,200) + "...");
            const response2 = await ai.generate({
                model: geminiModel,
                prompt: prompt2,
                config: { responseModalities: ['TEXT', 'IMAGE'] },
            });
            if (response2.media && response2.media.url) {
                url2 = response2.media.url;
                 console.log("Genkit: Image URL 2:", url2.substring(0,100) + "...");
            } else {
                console.error('Genkit: Gemini image generation (option 2) returned no media URL.');
            }
        } catch (error) {
            console.error('Genkit: Error generating image option 2:', error);
        }
        
        // Ensure the output matches the schema, even if one or both generations failed.
        return { imageUrls: [url1 || null, url2 || null] };
    }
  }
);

