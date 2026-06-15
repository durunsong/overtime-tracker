"use client";

import { useState } from "react";
import { Bot, Copy, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthPicker } from "@/components/ui/month-picker";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentMonth } from "@/lib/date/month";

const examples = [
  "我这个月加班多少小时？",
  "哪一天加班最多？",
  "我的考勤有什么异常？",
  "帮我生成正式一点的月报总结。",
];

export function AiAssistant() {
  const [month, setMonth] = useState(() => getCurrentMonth());
  const [question, setQuestion] = useState(examples[0]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask() {
    setLoading(true);
    setAnswer("");

    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, question }),
    });

    if (!response.ok || !response.body) {
      const result = await response.json().catch(() => null);
      setLoading(false);
      toast.error(result?.error ?? "AI 请求失败");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        setAnswer((current) => current + chunk);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI 回复中断，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
      <Card>
        <CardHeader>
          <CardTitle>AI 分析助手</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MonthPicker
            aria-label="选择 AI 分析月份"
            value={month}
            onChange={setMonth}
          />
          <Textarea value={question} onChange={(event) => setQuestion(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            {examples.map((item) => (
              <Button key={item} variant="secondary" size="sm" onClick={() => setQuestion(item)}>
                {item}
              </Button>
            ))}
          </div>
          <Button onClick={ask} disabled={loading}>
            <Send className="h-4 w-4" /> {loading ? "分析中" : "发送"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-cyan-200" /> 分析结果
          </CardTitle>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void navigator.clipboard.writeText(answer);
              toast.success("已复制");
            }}
          >
            <Copy className="h-4 w-4" /> 复制
          </Button>
        </CardHeader>
        <CardContent>
          <div className="scrollbar-hidden h-[584px] overflow-y-auto rounded-lg border border-white/10 bg-slate-950/50 p-5 text-sm leading-7 text-slate-300">
            {answer ? (
              <MarkdownAnswer content={answer} />
            ) : (
              <p className="text-slate-500">
                AI 只会基于数据库中的真实考勤记录回答；没有数据时会明确说明无法分析。
              </p>
            )}
            {loading ? <AiThinking text="AI 正在整理考勤数据，请稍等。" /> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AiThinking({ text }: { text: string }) {
  return (
    <div className="ai-thinking mt-4" aria-live="polite" aria-label={text}>
      <span className="ai-thinking__icon" aria-hidden="true" />
      <span className="ai-thinking__text">
        {text}
        <span className="ai-thinking__dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </span>
    </div>
  );
}

export function MarkdownAnswer({ content }: { content: string }) {
  return (
    <div className="space-y-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-semibold text-white">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold text-white">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold text-white">{children}</h3>,
          p: ({ children }) => <p className="leading-7 text-slate-300">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5 text-slate-300">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5 text-slate-300">{children}</ol>,
          li: ({ children }) => <li className="leading-7 marker:text-cyan-200">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-cyan-200/60 pl-4 text-slate-300">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-100">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-auto rounded-lg border border-white/10 bg-slate-950 p-4">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-white/10 bg-white/[0.06] px-3 py-2 text-white">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-white/10 px-3 py-2 text-slate-300">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
