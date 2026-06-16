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

export function getAiLanguageModel(config = getAiProviderConfig()) {
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

export function isZhipuCompatibleConfig(config: Pick<AiProviderConfig, "provider" | "baseURL">) {
  const provider = config.provider.toLowerCase();
  const baseURL = config.baseURL.toLowerCase();

  return (
    provider.includes("zhipu") ||
    provider.includes("bigmodel") ||
    provider.includes("z.ai") ||
    baseURL.includes("bigmodel.cn") ||
    baseURL.includes("z.ai")
  );
}

export function resolveChatCompletionsUrl(baseURL: string) {
  const url = new URL(baseURL);
  const pathname = url.pathname.replace(/\/+$/, "");

  if (pathname.endsWith("/chat/completions")) {
    return url.toString();
  }

  if ((url.hostname.includes("bigmodel.cn") || url.hostname.includes("z.ai")) && pathname === "") {
    url.pathname = "/api/paas/v4/chat/completions";
    return url.toString();
  }

  url.pathname = `${pathname}/chat/completions`;
  return url.toString();
}
