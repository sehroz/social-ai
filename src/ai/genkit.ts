import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// import {openAI} from '@genkit-ai/openai'; // Ensure OpenAI plugin is imported - Commented out due to install issues

export const ai = genkit({
  plugins: [
    googleAI(),
    // openAI() // Add the OpenAI plugin - Commented out
  ],
  // You might want to set a default model, or specify it in each call.
  // For now, we'll specify it in the flow.
  // model: 'googleai/gemini-2.0-flash', // Example default if you still use Google AI for other things
});
