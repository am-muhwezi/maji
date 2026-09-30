import type { Metadata } from "next";
import { Page } from "./page-client";

export const metadata: Metadata = { title: "Daily Log" };

export default function Route() {
  return <Page />;
}
