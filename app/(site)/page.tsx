import { headers } from "next/headers";
import HomePage from "./home-page";
import { originFromRequestHeaders } from "@/lib/embed";

export default async function Page() {
  const h = await headers();
  const requestOrigin = originFromRequestHeaders(
    h.get("x-forwarded-host") ?? h.get("host"),
    h.get("x-forwarded-proto"),
  );

  return <HomePage requestOrigin={requestOrigin} />;
}
