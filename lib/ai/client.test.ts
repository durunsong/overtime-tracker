import { afterEach, describe, expect, it } from "vitest";
import { getAiLanguageModel, getAiProviderConfig, getAiVisionLanguageModel, isAiConfigured } from "./client";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("AI provider config", () => {
  it("reads provider, base URL, API key and model from AI_* environment variables", () => {
    process.env.AI_PROVIDER = "deepseek";
    process.env.AI_API_KEY = "test-key";
    process.env.AI_BASE_URL = "https://api.deepseek.com";
    process.env.AI_MODEL = "deepseek-v4-flash";

    expect(isAiConfigured()).toBe(true);
    expect(getAiProviderConfig()).toEqual({
      provider: "deepseek",
      apiKey: "test-key",
      baseURL: "https://api.deepseek.com",
      model: "deepseek-v4-flash",
      visionModel: "deepseek-v4-flash",
    });
  });

  it("prefers AI_VISION_MODEL for screenshot recognition", () => {
    process.env.AI_PROVIDER = "zhipu";
    process.env.AI_API_KEY = "test-key";
    process.env.AI_BASE_URL = "https://open.bigmodel.cn/api/paas/v4/";
    process.env.AI_MODEL = "glm-4-flash";
    process.env.AI_VISION_MODEL = "glm-4v-flash";

    expect(getAiProviderConfig().visionModel).toBe("glm-4v-flash");
    expect(getAiVisionLanguageModel().modelId).toBe("glm-4v-flash");
  });

  it("defaults provider name without changing the configured endpoint or model", () => {
    delete process.env.AI_PROVIDER;
    process.env.AI_API_KEY = "test-key";
    process.env.AI_BASE_URL = "https://custom.example.com/v1";
    process.env.AI_MODEL = "custom-model";

    expect(isAiConfigured()).toBe(true);
    expect(getAiProviderConfig()).toEqual({
      provider: "openai-compatible",
      apiKey: "test-key",
      baseURL: "https://custom.example.com/v1",
      model: "custom-model",
      visionModel: "custom-model",
    });
  });

  it("requires complete AI_* variables instead of using hardcoded defaults", () => {
    delete process.env.AI_API_KEY;
    process.env.AI_BASE_URL = "https://api.deepseek.com";
    process.env.AI_MODEL = "deepseek-v4-flash";

    expect(isAiConfigured()).toBe(false);
    expect(() => getAiProviderConfig()).toThrow("AI_BASE_URL、AI_API_KEY 和 AI_MODEL");
  });

  it("uses the OpenAI chat completions model for compatible providers", () => {
    process.env.AI_PROVIDER = "deepseek";
    process.env.AI_API_KEY = "test-key";
    process.env.AI_BASE_URL = "https://api.deepseek.com";
    process.env.AI_MODEL = "deepseek-v4-flash";

    expect(getAiLanguageModel().provider).toBe("openai.chat");
  });
});
