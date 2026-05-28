import { LandingPage } from "@/components/landing/landing-page";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  return <LandingPage user={user} />;
}
