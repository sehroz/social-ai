
import { NextResponse, type NextRequest } from 'next/server';
import openai from '@/lib/openai-client';
import type { ImagesResponse } from 'openai/resources/images.mjs';

interface GenerateImageRequestBody {
  imageCopyText: string; // Fallback for thematic inspiration if specific directions are missing
  backgroundImageUrl?: string; // data URI for potential reference
  logoUrl?: string; // data URI for potential reference
  platform?: string;
  designSpecifications?: { // This will come from the 'creative_direction' field of the ContentRequest
    imageStyleAndLayout?: string;
  };
  renderTextDirectly?: boolean;
}

export async function POST(request: NextRequest) {
  const body: GenerateImageRequestBody = await request.json();

  const { imageCopyText, backgroundImageUrl, logoUrl, platform = 'Instagram', designSpecifications, renderTextDirectly = false } = body;

  if (!designSpecifications?.imageStyleAndLayout && !imageCopyText) {
    return NextResponse.json({ error: 'Detailed design specifications (imageStyleAndLayout) or at least image copy text are required.' }, { status: 400 });
  }

  let detailedPrompt = "";

  // Base instructions based on whether text rendering is requested
  let basePromptInstructionForScene = "";
  if (renderTextDirectly) {
    basePromptInstructionForScene = `Generate an Instagram image (1024x1024 pixels, photorealistic, HD quality, natural style) for Merry Maids Canada.
The image should be a visually stunning composition.
**CRITICAL INSTRUCTION: Attempt to render the specified headline, subheading, and other text elements described in the creative direction directly onto the image.**
Pay close attention to font style descriptions (e.g., 'All Caps, Clean Sans Serif Font' for headlines, 'Handwritten/Script Style Font' for subheadings) if provided.
The visual style, layout, and thematic elements of the image should be derived from and perfectly complement the following creative direction:`;
  } else {
    basePromptInstructionForScene = `Generate an Instagram background image (1024x1024 pixels, photorealistic, HD quality, natural style) for Merry Maids Canada.
The image should be a visually stunning backdrop for the specific text elements (like headlines, subheadings) and branding described.
Focus on creating the scene and atmosphere that complements the described text and branding.
**CRITICAL INSTRUCTION: Generate ONLY the background image. DO NOT attempt to render or draw ANY text (headlines, subheadings, slogans, footer text, etc.) or any logos directly onto the image itself.**
The visual style, layout, and thematic elements of the image should be derived from and perfectly complement the following creative direction:`;
  }

  // Primary prompt construction using designSpecifications if available
  if (designSpecifications?.imageStyleAndLayout) {
    detailedPrompt = `${basePromptInstructionForScene}
---
${designSpecifications.imageStyleAndLayout}
---
Ensure the image is bright, airy, modern, exceptionally clean, and inviting, with natural-looking light. The image must look like a real photograph.
Avoid: Cluttered or messy scenes, dark visuals, unprofessional elements, distorted figures, or cartoonish/artificial styles if not explicitly requested.`;
    if (!renderTextDirectly) {
        // This instruction for logo was previously inside the 'else' for designSpecifications
        // detailedPrompt += ` DO NOT attempt to render any logos directly onto the image itself unless explicitly part of the text elements described.`;
        // The critical instruction already covers not rendering logos.
    }
  } else {
    // Fallback if no specific design specs are provided, use imageCopyText for theme
    detailedPrompt = `Create a polished, high-quality promotional social media ${renderTextDirectly ? 'image' : 'background image'} (1024x1024 pixels, photorealistic, HD quality, natural style) for Merry Maids Canada, themed around "${imageCopyText}". `;
    detailedPrompt += "The image should feature a modern, exceptionally clean, bright, airy, and inviting home environment (e.g., sparkling kitchen, pristine bathroom, tidy living room) with natural-looking light. ";
    detailedPrompt += "The overall mood should be one of relief, satisfaction, and the pleasure of a beautifully maintained home. ";
    detailedPrompt += `\nPlatform: ${platform}. Target Audience: Canadian homeowners. `;

    if (renderTextDirectly) {
      detailedPrompt += `\n\n**CRITICAL INSTRUCTION: Attempt to render the theme text "${imageCopyText}" prominently and aesthetically on the image.** Focus on legibility and style.`;
    } else {
      detailedPrompt += "\n\n**CRITICAL INSTRUCTION: Generate ONLY the background image. DO NOT attempt to render or draw ANY text (headlines, subheadings, slogans, footer text, etc.) or any logos directly onto the image itself.** ";
    }
    detailedPrompt += "Focus solely on creating the visual scene. ";
    detailedPrompt += "\nAvoid: Cluttered or messy scenes, dark or dingy visuals, unprofessional looking elements, distorted or unrealistic human figures or features, any cartoonish, illustrated, or overly artificial styles unless text rendering is enabled and the style fits. The image needs to look like a real photograph and be aspirational. ";
    if (!renderTextDirectly) {
        detailedPrompt += " Any rendering of text on the image should be avoided.";
    }
  }

  // Add textual hints for uploaded background or logo, if provided, and if not rendering text directly (as DALL-E handles those elements poorly)
  if (!renderTextDirectly) {
    if (backgroundImageUrl) {
      detailedPrompt += `\nFor additional thematic context, the generated image should be thematically consistent and harmonious with a user-provided background concept.`;
    }
    if (logoUrl) {
      detailedPrompt += `\nThe generated scene should also be designed to stylistically and thematically complement the Merry Maids brand identity (which might be hinted at by a provided logo concept). DO NOT attempt to render the logo itself onto the image.`;
    }
  }


  try {
    const response: ImagesResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: detailedPrompt,
      n: 1,
      size: "1024x1024", // Standard DALL-E 3 square size
      quality: "hd", // For finer details and greater consistency
      style: "natural", // For more natural, less hyper-real looking images
      response_format: "b64_json",
    });

    const imageBase64 = response.data[0]?.b64_json;

    if (!imageBase64) {
      throw new Error('Image generation failed to return base64 data.');
    }
    const imageUrl = `data:image/png;base64,${imageBase64}`;

    return NextResponse.json({ imageUrl });

  } catch (error: any) {
    console.error('Error generating image with OpenAI:', error);
    let errorMessage = "Failed to generate image";
    if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error.message;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
