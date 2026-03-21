import { DeepgramClient } from "@deepgram/sdk";

export function createDeepgramClient() {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) throw new Error("Missing DEEPGRAM_API_KEY");
  return new DeepgramClient({ apiKey: key });
}
