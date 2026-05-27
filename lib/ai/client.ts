import { createOpenAI } from "@ai-sdk/openai";
import { generateText, streamText, type StreamTextOnFinishCallback, type ToolSet } from "ai";

export function isAiConfigured() {
  return Boolean(process.env.AI_API_KEY && process.env.AI_BASE_URL && process.env.AI_MODEL);
}

export function getAiLanguageModel() {
  if (!isAiConfigured()) {
    throw new Error("AI 服务未配置，请设置 AI_BASE_URL、AI_API_KEY 和 AI_MODEL");
  }

  const provider = createOpenAI({
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_BASE_URL,
  });

  return provider(process.env.AI_MODEL as string);
}

export async function generateAiText(prompt: string) {
  const result = await generateText({
    model: getAiLanguageModel(),
    prompt,
    temperature: 0.2,
  });

  return result.text;
}

export function streamAiText(
  prompt: string,
  options?: { onFinish?: StreamTextOnFinishCallback<ToolSet> },
) {
  return streamText({
    model: getAiLanguageModel(),
    prompt,
    temperature: 0.2,
    onFinish: options?.onFinish,
  });
}
