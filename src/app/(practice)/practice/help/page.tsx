import type { Metadata } from "next";
import { HelpCenter } from "@/components/practice/help-center";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.practice.help.title };

export default function HelpPage() {
  return <HelpCenter />;
}
