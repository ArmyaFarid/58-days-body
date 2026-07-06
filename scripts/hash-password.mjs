import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
    console.error('Usage : npm run hash-password "TonMotDePasse"');
    process.exit(1);
}

// Le hash bcrypt contient des "$" qui perturbent les fichiers .env (expansion de
// variables). On l'encode en base64 : la valeur ne contient alors que des
// caractères sûrs, portable en local comme sur Vercel.
const hash = bcrypt.hashSync(password, 10);
const b64 = Buffer.from(hash, "utf8").toString("base64");

console.log("\nColle cette valeur dans AUTH_PASSWORD_HASH_B64 :\n");
console.log(b64);
console.log("");
