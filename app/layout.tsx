import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coached by Dre | Strength Coaching",
  description:
    "Personal strength coaching built around your goals, schedule, and real progress. Start your coaching conversation with Dre.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body>{children}</body></html>;
}
