"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  UserPlus,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSafeCallbackUrl } from "@/lib/auth/callback-url";
import { isPasswordPolicySatisfied, passwordPolicyDescription } from "@/lib/auth/password-policy";
import { cn } from "@/lib/utils";

type ApiResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

type ResetResult = {
  resetUrl: string;
  token: string;
  expiresAt: string;
} | null;

type AuthMode = "login" | "register";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const result = await postJson("/api/auth/login", { email, password });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "登录失败");
      return;
    }

    toast.success("登录成功");
    router.push(getSafeCallbackUrl(callbackUrl));
    router.refresh();
  }

  return (
    <AuthPanel
      mode="login"
      eyebrow="Account access"
      title="登录 Overtime Tracker"
      subtitle="使用邮箱和密码进入工作台，继续处理考勤导入、加班统计和月报分析。"
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="邮箱" htmlFor="login-email">
          <Input
            id="login-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            required
          />
        </Field>
        <Field label="密码" htmlFor="login-password">
          <PasswordInput
            id="login-password"
            value={password}
            onChange={setPassword}
            name="password"
            autoComplete="current-password"
            placeholder="请输入账号密码"
            required
          />
        </Field>
        <SubmitButton loading={loading} label="登录" icon={ArrowRight} />
      </form>
      <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
        <Link className="hover:text-cyan-100" href="/auth/forgot-password">
          忘记密码
        </Link>
        <Link className="hover:text-cyan-100" href="/auth/register">
          注册账号
        </Link>
      </div>
    </AuthPanel>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isPasswordPolicySatisfied(password)) {
      toast.error(passwordPolicyDescription);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    const result = await postJson("/api/auth/register", { name, email, password });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "注册失败");
      return;
    }

    toast.success("账号已创建");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthPanel
      mode="register"
      eyebrow="Create account"
      title="注册账号"
      subtitle="如果邮箱已存在且还未设置密码，系统会自动绑定原有考勤数据。"
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="姓名" htmlFor="register-name">
          <Input
            id="register-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            name="name"
            autoComplete="name"
            placeholder="用于月报和账号展示"
            required
          />
        </Field>
        <Field label="邮箱" htmlFor="register-email">
          <Input
            id="register-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            required
          />
        </Field>
        <Field label="密码" htmlFor="register-password">
          <PasswordInput
            id="register-password"
            value={password}
            onChange={setPassword}
            name="password"
            autoComplete="new-password"
            placeholder="至少 8 位，包含字母和数字"
            required
          />
        </Field>
        <PasswordStrengthMeter password={password} />
        <Field label="确认密码" htmlFor="register-confirm-password" error={passwordMismatch ? "两次输入的密码不一致" : undefined}>
          <PasswordInput
            id="register-confirm-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="再次输入密码"
            required
          />
        </Field>
        <SubmitButton loading={loading} label="注册并进入" icon={UserPlus} />
      </form>
      <p className="mt-5 text-sm text-slate-400">
        已有账号？{" "}
        <Link className="text-cyan-100 hover:text-cyan-50" href="/auth/login">
          去登录
        </Link>
      </p>
    </AuthPanel>
  );
}

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [resetUrl, setResetUrl] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const result = await postJson<ResetResult>("/api/auth/forgot-password", { email });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "生成重置链接失败");
      return;
    }

    if (result.data?.resetUrl) {
      setResetUrl(result.data.resetUrl);
      toast.success("已生成重置链接");
      return;
    }

    setResetUrl("");
    toast.info(result.message ?? "如果邮箱存在，系统会生成重置链接");
  }

  return (
    <AuthPanel
      eyebrow="Password recovery"
      title="找回密码"
      subtitle="当前版本会生成本地一次性重置链接，方便开发和内网部署场景排障。"
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="注册邮箱" htmlFor="forgot-email">
          <Input
            id="forgot-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            required
          />
        </Field>
        <SubmitButton loading={loading} label="生成重置链接" icon={Mail} />
      </form>
      {resetUrl ? (
        <motion.div
          className="mt-5 rounded-md border border-cyan-200/20 bg-cyan-200/8 p-3 text-sm text-slate-200"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-slate-400">重置链接</p>
          <Link className="mt-2 block break-all text-cyan-100 hover:text-cyan-50" href={resetUrl}>
            {resetUrl}
          </Link>
        </motion.div>
      ) : null}
      <BackToLogin />
    </AuthPanel>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      toast.error("缺少重置令牌，请重新生成重置链接");
      return;
    }

    if (!isPasswordPolicySatisfied(password)) {
      toast.error(passwordPolicyDescription);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    const result = await postJson("/api/auth/reset-password", { token, password });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "重置密码失败");
      return;
    }

    toast.success("密码已重置");
    router.push("/auth/login");
  }

  return (
    <AuthPanel
      eyebrow="Reset password"
      title="重置密码"
      subtitle="重置成功后历史登录态会失效，请使用新密码重新登录。"
    >
      {!token ? (
        <InlineNotice message="当前链接缺少重置令牌，请回到找回密码页面重新生成。" />
      ) : null}
      <form onSubmit={submit} className="space-y-4">
        <Field label="重置令牌" htmlFor="reset-token">
          <Input id="reset-token" value={token} readOnly aria-label="重置令牌" />
        </Field>
        <Field label="新密码" htmlFor="reset-password">
          <PasswordInput
            id="reset-password"
            value={password}
            onChange={setPassword}
            name="password"
            autoComplete="new-password"
            placeholder="至少 8 位，包含字母和数字"
            required
          />
        </Field>
        <PasswordStrengthMeter password={password} />
        <Field label="确认新密码" htmlFor="reset-confirm-password" error={passwordMismatch ? "两次输入的密码不一致" : undefined}>
          <PasswordInput
            id="reset-confirm-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="再次输入新密码"
            required
          />
        </Field>
        <SubmitButton loading={loading} label="确认重置" icon={KeyRound} />
      </form>
      <BackToLogin />
    </AuthPanel>
  );
}

export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isPasswordPolicySatisfied(newPassword)) {
      toast.error(passwordPolicyDescription);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("两次输入的新密码不一致");
      return;
    }

    setLoading(true);
    const result = await postJson("/api/auth/change-password", {
      currentPassword,
      newPassword,
    });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "修改密码失败");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("密码已更新");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>修改密码</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 md:max-w-xl">
          <Field label="当前密码" htmlFor="current-password">
            <PasswordInput
              id="current-password"
              value={currentPassword}
              onChange={setCurrentPassword}
              name="currentPassword"
              autoComplete="current-password"
              placeholder="请输入当前密码"
              required
            />
          </Field>
          <Field label="新密码" htmlFor="new-password">
            <PasswordInput
              id="new-password"
              value={newPassword}
              onChange={setNewPassword}
              name="newPassword"
              autoComplete="new-password"
              placeholder="至少 8 位，包含字母和数字"
              required
            />
          </Field>
          <PasswordStrengthMeter password={newPassword} />
          <Field label="确认新密码" htmlFor="confirm-new-password" error={passwordMismatch ? "两次输入的新密码不一致" : undefined}>
            <PasswordInput
              id="confirm-new-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="再次输入新密码"
              required
            />
          </Field>
          <Button disabled={loading} className="w-fit">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            保存新密码
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AuthPanel({
  eyebrow,
  title,
  subtitle,
  mode,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  mode?: AuthMode;
  children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }}>
      <div className="pr-24">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm leading-7 text-slate-300">{subtitle}</p>
      </div>
      {mode ? <AuthModeSwitch active={mode} /> : null}
      <div className="mt-6">{children}</div>
    </motion.div>
  );
}

function AuthModeSwitch({ active }: { active: AuthMode }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-1 rounded-md border border-white/10 bg-slate-950/46 p-1 text-sm">
      <Link
        href="/auth/login"
        className={cn(
          "rounded px-3 py-2 text-center transition",
          active === "login" ? "bg-cyan-300 text-slate-950 shadow-[0_0_18px_rgba(103,232,249,0.22)]" : "text-slate-400 hover:text-white",
        )}
      >
        登录
      </Link>
      <Link
        href="/auth/register"
        className={cn(
          "rounded px-3 py-2 text-center transition",
          active === "register" ? "bg-cyan-300 text-slate-950 shadow-[0_0_18px_rgba(103,232,249,0.22)]" : "text-slate-400 hover:text-white",
        )}
      >
        注册
      </Link>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2" htmlFor={htmlFor}>
      <span className="text-sm font-medium text-slate-200">{label}</span>
      {children}
      {error ? <span className="text-xs text-rose-300">{error}</span> : null}
    </label>
  );
}

function PasswordInput({
  value,
  onChange,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const inputType = visible ? "text" : "password";

  return (
    <div className="relative">
      <Input
        {...props}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={inputType}
        className={cn("pr-11", className)}
      />
      <button
        type="button"
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-slate-500 transition hover:bg-white/8 hover:text-cyan-100"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "隐藏密码" : "显示密码"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function SubmitButton({
  loading,
  label,
  icon: Icon,
}: {
  loading: boolean;
  label: string;
  icon: typeof ArrowRight;
}) {
  return (
    <Button disabled={loading} className="h-11 w-full">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {label}
    </Button>
  );
}

function InlineNotice({ message }: { message: string }) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-md border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-50">
      <AlertCircle className="mt-0.5 h-4 w-4 text-amber-200" />
      <p className="leading-6">{message}</p>
    </div>
  );
}

function BackToLogin() {
  return (
    <p className="mt-5 text-sm text-slate-400">
      想起来了？{" "}
      <Link className="text-cyan-100 hover:text-cyan-50" href="/auth/login">
        返回登录
      </Link>
    </p>
  );
}

async function postJson<T = unknown>(url: string, body: Record<string, string>) {
  let result: ApiResult<T>;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    result = await response.json();
  } catch {
    return { success: false, error: "请求失败，请检查本地服务" } satisfies ApiResult<T>;
  }
  return result;
}
