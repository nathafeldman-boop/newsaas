// Compose l'email de candidature envoyé depuis le Gmail de l'étudiant :
// la lettre dans le corps, le CV en pièce jointe. Format RFC 2822 brut,
// envoyé tel quel par sendGmailMessage.

function encodeHeader(value: string): string {
  // Accents dans l'objet ou le nom : encodage RFC 2047 en UTF-8.
  return /^[\x20-\x7e]*$/.test(value) ? value : `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function wrapBase64(data: Buffer): string {
  return (data.toString("base64").match(/.{1,76}/g) ?? []).join("\r\n");
}

export function buildApplicationEmail({
  fromName,
  fromEmail,
  to,
  subject,
  body,
  attachment,
}: {
  fromName: string | null;
  fromEmail: string;
  to: string;
  subject: string;
  body: string;
  attachment: { filename: string; contentType: string; data: Buffer } | null;
}): string {
  const boundary = `stageio_${crypto.randomUUID().replace(/-/g, "")}`;
  const from = fromName ? `${encodeHeader(fromName)} <${fromEmail}>` : fromEmail;
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(Buffer.from(body.replace(/\r?\n/g, "\r\n"), "utf8")),
  ];
  if (attachment) {
    // Nom de fichier encodé comme le fait Gmail lui-même (RFC 2047) : lu
    // correctement par tous les clients mail, accents compris.
    const filename = encodeHeader(attachment.filename.replace(/["\\\r\n]+/g, " ").trim() || "CV");
    lines.push(
      `--${boundary}`,
      `Content-Type: ${attachment.contentType}; name="${filename}"`,
      `Content-Disposition: attachment; filename="${filename}"`,
      "Content-Transfer-Encoding: base64",
      "",
      wrapBase64(attachment.data),
    );
  }
  lines.push(`--${boundary}--`, "");
  return lines.join("\r\n");
}
