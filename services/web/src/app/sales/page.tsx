import type { Metadata } from "next";
import { Page } from "./page-client";

export const metadata: Metadata = { title: "Sales" };

export default function Route() {
  return <Page />;
}
