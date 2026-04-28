import { PATCH as updateExtraction } from "../route";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await request.json().catch(() => ({}));
  const patchRequest = new Request(request.url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "approve",
      rawJson: body.rawJson,
    }),
  });
  return updateExtraction(patchRequest, { params });
}
