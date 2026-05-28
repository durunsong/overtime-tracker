import type { Metadata } from "next";
import Forbidden from "@/app/forbidden";

export const metadata: Metadata = {
  title: "访问受限",
  robots: { index: false, follow: false },
};

export default Forbidden;
