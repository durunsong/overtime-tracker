import { createOpenAI } from "@ai-sdk/openai";
import { generateText, streamText, type StreamTextOnFinishCallback, type ToolSet } from "ai";

export type AiProviderConfig = {
  provider: string;
  apiKey: string;
  baseURL: string;
  model: string;
};

export function isAiConfigured() {
  return Boolean(readEnv("AI_BASE_URL") && readEnv("AI_API_KEY") && readEnv("AI_MODEL"));
}

export function getAiProviderConfig(): AiProviderConfig {
  const baseURL = readEnv("AI_BASE_URL");
  const apiKey = readEnv("AI_API_KEY");
  const model = readEnv("AI_MODEL");

  if (!baseURL || !apiKey || !model) {
    throw new Error("AI 服务未配置，请设置 AI_BASE_URL、AI_API_KEY 和 AI_MODEL");
  }

  return {
    provider: readEnv("AI_PROVIDER") ?? "openai-compatible",
    apiKey,
    baseURL,
    model,
  };
}

export function getAiLanguageModel() {
  const config = getAiProviderConfig();

  const provider = createOpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });

  return provider.chat(config.model);
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

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}
