// Retourne le token Blob, en tolérant un préfixe éventuel choisi lors de la
// connexion du store (ex. MONPREFIXE_BLOB_READ_WRITE_TOKEN).
export function getBlobToken(): string | undefined {
    if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
    const key = Object.keys(process.env).find((k) => k.endsWith("BLOB_READ_WRITE_TOKEN"));
    return key ? process.env[key] : undefined;
}
