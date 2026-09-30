import type { Metadata } from "next";
import { Page } from "./page-client";

export const metadata: Metadata = { title: "Expenses" };

export default function Route() {
  return <Page />;
}
