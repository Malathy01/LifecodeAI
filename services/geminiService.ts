
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Verdict } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeMedicalClaim = async (input: string, imageData?: string): Promise<Verdict> => {
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    Analyze the following medical claim: "${input}"
    
    Roles:
    1. Verify if the claim is scientifically accurate.
    2. Extract and define complex medical terminology mentioned.
    3. Provide a confidence score (0-100).
    4. List 2-3 related medical ingredients or claims that could educate the user further.
    5. Count supporting studies found via search.

    Rules for terminology: Wrap complex terms in the summary like this: [Term: Definition].
    
    Return the response strictly in the following JSON format.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      status: { type: Type.STRING, description: "One of: TRUE, FALSE, PARTIAL, MISLEADING, UNVERIFIED" },
      summary: { type: Type.STRING, description: "Detailed scientific explanation with [term: definition] tags." },
      confidenceScore: { type: Type.NUMBER },
      evidenceCount: { type: Type.NUMBER },
      sources: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            url: { type: Type.STRING }
          }
        }
      },
      definitions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            term: { type: Type.STRING },
            explanation: { type: Type.STRING }
          }
        }
      },
      relatedClaims: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    },
    required: ["status", "summary", "confidenceScore", "evidenceCount", "sources", "definitions", "relatedClaims"]
  };

  const contents: any[] = [{ text: prompt }];
  if (imageData) {
    contents.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageData.split(',')[1]
      }
    });
  }

  const result = await ai.models.generateContent({
    model,
    contents: { parts: contents },
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      tools: [{ googleSearch: {} }]
    }
  });

  const responseJson = JSON.parse(result.text || '{}');
  
  // Extract real search grounding URLs if available
  const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const searchSources = groundingChunks
    .filter((chunk: any) => chunk.web)
    .map((chunk: any) => ({
      title: chunk.web.title || 'Medical Source',
      url: chunk.web.uri
    }));

  return {
    claim: input,
    ...responseJson,
    sources: searchSources.length > 0 ? searchSources : responseJson.sources
  };
};
