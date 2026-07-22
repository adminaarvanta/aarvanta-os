/** Escape text for OpenSRS OPS XML item values. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type OpsValue = string | number | OpsAssoc | OpsList;

export type OpsAssoc = { type: "assoc"; value: Record<string, OpsValue> };
export type OpsList = { type: "list"; value: OpsValue[] };

export function assoc(value: Record<string, OpsValue>): OpsAssoc {
  return { type: "assoc", value };
}

export function list(value: OpsValue[]): OpsList {
  return { type: "list", value };
}

function serializeValue(value: OpsValue): string {
  if (typeof value === "string" || typeof value === "number") {
    return escapeXml(String(value));
  }
  if (value.type === "assoc") {
    return serializeAssoc(value.value);
  }
  return `<dt_array>${value.value
    .map((item, index) => `<item key="${index}">${serializeValue(item)}</item>`)
    .join("")}</dt_array>`;
}

function serializeAssoc(entries: Record<string, OpsValue>): string {
  return `<dt_assoc>${Object.entries(entries)
    .map(([key, value]) => `<item key="${escapeXml(key)}">${serializeValue(value)}</item>`)
    .join("")}</dt_assoc>`;
}

/** Build a full OPS_envelope XCP request body. */
export function buildOpsEnvelope(input: {
  action: string;
  object: string;
  attributes: Record<string, OpsValue>;
}): string {
  const payload = assoc({
    protocol: "XCP",
    action: input.action,
    object: input.object,
    attributes: assoc(input.attributes),
  });

  return `<?xml version='1.0' encoding='UTF-8' standalone='no'?>
<!DOCTYPE OPS_envelope SYSTEM 'ops.dtd'>
<OPS_envelope>
<header>
<version>0.9</version>
</header>
<body>
<data_block>
${serializeAssoc(payload.value)}
</data_block>
</body>
</OPS_envelope>`;
}

/** Extract a flat `<item key="x">value</item>` (non-nested) from XML. */
export function extractItem(xml: string, key: string): string | undefined {
  const re = new RegExp(
    `<item key="${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">([^<]*)</item>`,
    "i"
  );
  const match = xml.match(re);
  return match?.[1]?.trim();
}

/** Extract attributes section as a map of simple string values. */
export function extractAttributes(xml: string): Record<string, string> {
  const attrsMatch = xml.match(
    /<item key="attributes">\s*<dt_assoc>([\s\S]*?)<\/dt_assoc>\s*<\/item>/i
  );
  if (!attrsMatch) return {};

  const block = attrsMatch[1];
  const out: Record<string, string> = {};
  const itemRe = /<item key="([^"]+)">([^<]*)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(block)) !== null) {
    // Skip nested complex values (empty or "undef")
    if (m[2].includes("<")) continue;
    out[m[1]] = m[2].trim();
  }
  return out;
}

export type OpsReply = {
  isSuccess: boolean;
  responseCode: string;
  responseText: string;
  attributes: Record<string, string>;
};

export function parseOpsReply(xml: string): OpsReply {
  const isSuccessRaw = extractItem(xml, "is_success") ?? "0";
  return {
    isSuccess: isSuccessRaw === "1",
    responseCode: extractItem(xml, "response_code") ?? "",
    responseText: extractItem(xml, "response_text") ?? "",
    attributes: extractAttributes(xml),
  };
}
