import { redirect } from "next/navigation";

export default function DemoPage() {
  // The whole site is the demo; keep /demo as a compatibility route.
  redirect("/");
}
