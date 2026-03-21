/**
 * HubSpot CRM push: syncs approved extraction data to HubSpot.
 * - Searches/creates contacts by email
 * - Creates or updates deals
 * - Logs note with call summary
 * - Handles token refresh on 401
 */
import { decrypt } from "@/lib/crypto";
import type { ExtractionData } from "@/components/ReviewCard";

const HUBSPOT_API_BASE = "https://api.hubapi.com";
const HUBSPOT_TOKEN_URL = `${HUBSPOT_API_BASE}/oauth/v1/token`;

// Association type IDs (HubSpot default)
const CONTACT_TO_DEAL = 3;
const NOTE_TO_DEAL = 214;
const NOTE_TO_CONTACT = 202;

export type HubSpotConnection = {
  id: string;
  accessToken: string;
  refreshToken: string | null;
};

export type PushResult = {
  success: boolean;
  contactIds: string[];
  dealId: string | null;
  noteId: string | null;
  error?: string;
};

/**
 * Refresh HubSpot access token. Returns new tokens.
 */
export async function refreshHubSpotToken(
  refreshToken: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken?: string }> {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("HUBSPOT_CLIENT_ID and HUBSPOT_CLIENT_SECRET must be set");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    refresh_token: refreshToken,
  });

  const res = await fetch(HUBSPOT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HubSpot token refresh failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
  };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}

async function hubspotFetch(
  path: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${HUBSPOT_API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return res;
}

/**
 * Search for a contact by email. Returns contact id or null.
 */
async function searchContactByEmail(
  accessToken: string,
  email: string
): Promise<string | null> {
  const res = await hubspotFetch("/crm/v3/objects/contacts/search", accessToken, {
    method: "POST",
    body: JSON.stringify({
      filterGroups: [
        {
          filters: [
            {
              propertyName: "email",
              operator: "EQ",
              value: email,
            },
          ],
        },
      ],
      properties: ["email"],
    }),
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    const err = await res.text();
    throw new Error(`HubSpot contact search failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { results?: { id: string }[] };
  const first = data.results?.[0];
  return first ? first.id : null;
}

/**
 * Create a contact. Returns new contact id.
 */
async function createContact(
  accessToken: string,
  props: { email?: string; firstname?: string; lastname?: string; jobtitle?: string; company?: string }
): Promise<string> {
  const properties: Record<string, string> = {};
  if (props.email) properties.email = props.email;
  if (props.firstname) properties.firstname = props.firstname;
  if (props.lastname) properties.lastname = props.lastname;
  if (props.jobtitle) properties.jobtitle = props.jobtitle;
  if (props.company) properties.company = props.company;

  if (!properties.email && !properties.firstname && !properties.lastname) {
    throw new Error("Contact must have at least email, firstname, or lastname");
  }

  const res = await hubspotFetch("/crm/v3/objects/contacts", accessToken, {
    method: "POST",
    body: JSON.stringify({ properties }),
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    const err = await res.text();
    throw new Error(`HubSpot create contact failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { id: string };
  return data.id;
}

/**
 * Create a deal. Returns new deal id.
 */
async function createDeal(
  accessToken: string,
  props: { dealname?: string; amount?: string; dealstage?: string; closedate?: string },
  associations?: { toObjectType: string; toObjectId: string }[]
): Promise<string> {
  const properties: Record<string, string> = {};
  if (props.dealname) properties.dealname = props.dealname;
  if (props.amount) properties.amount = props.amount;
  if (props.dealstage) properties.dealstage = props.dealstage;
  if (props.closedate) properties.closedate = props.closedate;

  if (!properties.dealname) properties.dealname = "Deal from SalesSync";

  const body: { properties: Record<string, string>; associations?: object[] } = {
    properties,
  };

  if (associations?.length) {
    body.associations = associations.map((a) => ({
      to: { id: a.toObjectId },
      types: [
        {
          associationCategory: "HUBSPOT_DEFINED",
          associationTypeId: a.toObjectType === "contacts" ? CONTACT_TO_DEAL : 0,
        },
      ],
    }));
  }

  const res = await hubspotFetch("/crm/v3/objects/deals", accessToken, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    const err = await res.text();
    throw new Error(`HubSpot create deal failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { id: string };
  return data.id;
}

/**
 * Create a note and associate with deal/contacts.
 */
async function createNote(
  accessToken: string,
  body: string,
  associations: { toObjectType: string; toObjectId: string }[]
): Promise<string> {
  if (!associations.length) {
    throw new Error("Note must have at least one association");
  }

  const res = await hubspotFetch("/crm/v3/objects/notes", accessToken, {
    method: "POST",
    body: JSON.stringify({
      properties: {
        hs_timestamp: new Date().toISOString(),
        hs_note_body: body,
      },
      associations: associations.map((a) => ({
        to: { id: a.toObjectId },
        types: [
          {
            associationCategory: "HUBSPOT_DEFINED",
            associationTypeId: a.toObjectType === "deals" ? NOTE_TO_DEAL : NOTE_TO_CONTACT,
          },
        ],
      })),
    }),
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    const err = await res.text();
    throw new Error(`HubSpot create note failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { id: string };
  return data.id;
}

/**
 * Map extraction stageChange to HubSpot dealstage. Uses common stage IDs.
 * Default pipeline dealstage values vary; we use "appointmentscheduled" as a safe default.
 */
function mapDealStage(stageChange: string | null | undefined): string {
  if (!stageChange?.trim()) return "appointmentscheduled";
  const lower = stageChange.toLowerCase();
  if (lower.includes("qualif") || lower.includes("lead")) return "appointmentscheduled";
  if (lower.includes("proposal") || lower.includes("quote")) return "presentationscheduled";
  if (lower.includes("negotiat")) return "negotiations/review";
  if (lower.includes("won") || lower.includes("close")) return "closedwon";
  if (lower.includes("lost")) return "closedlost";
  return "appointmentscheduled";
}

/**
 * Push approved extraction to HubSpot.
 * Handles token refresh on 401 and retries once.
 */
export async function pushExtractionToHubSpot(
  connection: HubSpotConnection,
  extraction: ExtractionData,
  redirectUri: string,
  onTokenUpdate?: (accessToken: string, refreshToken?: string) => Promise<void>
): Promise<PushResult> {
  let accessToken = decrypt(connection.accessToken);
  let refreshToken = connection.refreshToken ? decrypt(connection.refreshToken) : null;

  const run = async (): Promise<PushResult> => {
    const contactIds: string[] = [];
    const contacts = extraction.contacts ?? [];

    // Resolve or create contacts
    for (const c of contacts) {
      const email = (c as { email?: string }).email?.trim();
      const name = (c as { name?: string }).name?.trim() ?? "";
      const [firstname, ...rest] = name.split(/\s+/);
      const lastname = rest.join(" ") || undefined;
      const role = (c as { role?: string }).role?.trim();
      const company = (c as { company?: string }).company?.trim();

      // HubSpot requires at least one of: email, firstname, lastname
      const hasIdentifier = email || firstname || lastname;
      if (!hasIdentifier) continue;

      let contactId: string | null = null;
      if (email) {
        contactId = await searchContactByEmail(accessToken, email);
      }
      if (!contactId) {
        contactId = await createContact(accessToken, {
          email: email ?? undefined,
          firstname: firstname || company || "Contact",
          lastname: lastname || undefined,
          jobtitle: role || undefined,
          company: company || undefined,
        });
      }
      if (contactId) contactIds.push(contactId);
    }

    // Create deal
    const dealInfo = extraction.dealInfo ?? {};
    const value = (dealInfo.value ?? "").toString().trim();
    const closeDate = (dealInfo.closeDate ?? "").toString().trim();
    const stageChange = (dealInfo.stageChange ?? "").toString().trim();
    const dealName = `Deal - ${contactIds.length ? "contacts" : "extraction"} ${new Date().toISOString().split("T")[0]}`;
    const dealstage = mapDealStage(stageChange || undefined);

    const dealProps: Record<string, string> = {
      dealname: dealName,
      dealstage,
    };
    if (value) dealProps.amount = value;
    if (closeDate) {
      try {
        const d = new Date(closeDate);
        dealProps.closedate = d.toISOString();
      } catch {
        dealProps.closedate = closeDate;
      }
    }

    const dealAssociations = contactIds.slice(0, 10).map((id) => ({
      toObjectType: "contacts" as const,
      toObjectId: id,
    }));

    const dealId = await createDeal(accessToken, dealProps, dealAssociations);

    // Create note with summary
    const summary = extraction.summary?.trim() || "Call logged from SalesSync.";
    const sentiment = extraction.sentiment?.trim();
    const noteBody = [summary]
      .concat(sentiment ? [`Sentiment: ${sentiment}`] : [])
      .concat((extraction.objections ?? []).length ? [`Objections: ${(extraction.objections ?? []).join(", ")}`] : [])
      .join("\n\n");

    const noteAssociations = [{ toObjectType: "deals", toObjectId: dealId }];
    for (const cid of contactIds.slice(0, 5)) {
      noteAssociations.push({ toObjectType: "contacts", toObjectId: cid });
    }
    const noteId = await createNote(accessToken, noteBody, noteAssociations);

    return { success: true, contactIds, dealId, noteId };
  };

  try {
    return await run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "UNAUTHORIZED" && refreshToken && onTokenUpdate) {
      const tokens = await refreshHubSpotToken(refreshToken, redirectUri);
      const { encrypt } = await import("@/lib/crypto");
      await onTokenUpdate(encrypt(tokens.accessToken), tokens.refreshToken ? encrypt(tokens.refreshToken) : undefined);
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken ?? refreshToken;
      return run();
    }
    return {
      success: false,
      contactIds: [],
      dealId: null,
      noteId: null,
      error: msg,
    };
  }
}
