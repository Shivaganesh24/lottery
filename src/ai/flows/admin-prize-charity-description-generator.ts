'use server';
/**
 * @fileOverview This file implements a Genkit flow to generate engaging descriptions for either monthly draw prizes or charity initiatives.
 *
 * - generatePrizeCharityDescription - A function that handles the content generation process.
 * - AdminPrizeCharityDescriptionGeneratorInput - The input type for the generatePrizeCharityDescription function.
 * - AdminPrizeCharityDescriptionGeneratorOutput - The return type for the generatePrizeCharityDescription function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AdminPrizeCharityDescriptionGeneratorInputSchema = z.discriminatedUnion(
  'contentType',
  [
    z.object({
      contentType: z.literal('prize').describe('Specifies that the content type is a prize.'),
      prizeName: z.string().describe('The name of the prize.'),
      value: z.string().describe('The estimated monetary value of the prize (e.g., "$500", "£100").'),
      keyFeatures: z.array(z.string()).describe('A list of key features or highlights of the prize.'),
    }),
    z.object({
      contentType: z.literal('charity').describe('Specifies that the content type is a charity initiative.'),
      charityName: z.string().describe('The name of the charity.'),
      mission: z.string().describe('A short description of the charity\'s mission.'),
      impactExamples: z.array(z.string()).describe('Examples of the charity\'s impact or how donations are used.'),
    }),
  ]
);

export type AdminPrizeCharityDescriptionGeneratorInput = z.infer<
  typeof AdminPrizeCharityDescriptionGeneratorInputSchema
>;

const AdminPrizeCharityDescriptionGeneratorOutputSchema = z.object({
  description: z.string().describe('An engaging and compelling description for the prize or charity initiative.'),
});

export type AdminPrizeCharityDescriptionGeneratorOutput = z.infer<
  typeof AdminPrizeCharityDescriptionGeneratorOutputSchema
>;

export async function generatePrizeCharityDescription(
  input: AdminPrizeCharityDescriptionGeneratorInput
): Promise<AdminPrizeCharityDescriptionGeneratorOutput> {
  return adminPrizeCharityDescriptionGeneratorFlow(input);
}

const adminPrizeCharityDescriptionGeneratorPrompt = ai.definePrompt({
  name: 'adminPrizeCharityDescriptionGeneratorPrompt',
  input: { schema: AdminPrizeCharityDescriptionGeneratorInputSchema },
  output: { schema: AdminPrizeCharityDescriptionGeneratorOutputSchema },
  prompt: `You are an expert copywriter specialized in creating engaging and compelling descriptions for marketing materials. You need to create a description for either a prize or a charity initiative.

Instructions:
- Write a description that is concise, impactful, and appeals to a broad audience.
- Highlight the most important aspects to make the prize desirable or the charity initiative meaningful.
- Ensure the tone is appropriate for the content type (exciting for prizes, heartfelt and inspiring for charities).
- The output should be a single, well-structured paragraph or a few short, punchy paragraphs.

{{#if (eq contentType 'prize')}}
Content Type: Prize
Prize Name: {{{prizeName}}}
Estimated Value: {{{value}}}
Key Features:
{{#each keyFeatures}}- {{{this}}}\n{{/each}}

Generate an exciting and appealing description for this prize, emphasizing its value and what makes it special. Focus on encouraging participation in the draw.

{{else if (eq contentType 'charity')}}
Content Type: Charity Initiative
Charity Name: {{{charityName}}}
Mission: {{{mission}}}
Impact Examples:
{{#each impactExamples}}- {{{this}}}\n{{/each}}

Generate a heartfelt and inspiring description for this charity initiative, explaining its mission and the impact contributions can make. Focus on encouraging donations and participation.
{{/if}}
`,
});

const adminPrizeCharityDescriptionGeneratorFlow = ai.defineFlow(
  {
    name: 'adminPrizeCharityDescriptionGeneratorFlow',
    inputSchema: AdminPrizeCharityDescriptionGeneratorInputSchema,
    outputSchema: AdminPrizeCharityDescriptionGeneratorOutputSchema,
  },
  async (input) => {
    const { output } = await adminPrizeCharityDescriptionGeneratorPrompt(input);
    return output!;
  }
);
