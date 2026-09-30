import type { Metadata } from "next";
import { Page } from "./page-client";

export const metadata: Metadata = { title: "Reports" };

export default function Route() {
  return <Page />;
}
