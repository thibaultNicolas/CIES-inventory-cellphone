import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ALLOWED_ROLES = ["employee", "admin", "super_admin"] as const;

function printUsage(): void {
  console.log(`
Usage (recommandé — pas d’ambiguïté sur le mot de passe) :
  npm run create-admin -- \\
    --email vous@example.com \\
    --password 'VotreMotDePasse' \\
    [--name "Prénom Nom"] \\
    [--role employee|admin|super_admin]

Forme positionnelle (l’argument 2 = mot de passe uniquement ; l’argument 3 = nom affiché, pas un 2e mot de passe) :
  npm run create-admin -- <email> <password> [nom_affichage] [role]

Exemple positionnel :
  npm run create-admin -- admin@example.com 'SecretLong123!' "Jean Dupont" super_admin
`);
}

function normalizeRole(roleArg: string): string {
  const r = roleArg.toLowerCase();
  if ((ALLOWED_ROLES as readonly string[]).includes(r)) return r;
  console.warn(`⚠️ Rôle inconnu "${roleArg}", utilisation de super_admin.`);
  return "super_admin";
}

function parseArgs(argv: string[]): {
  email: string;
  password: string;
  name: string | null;
  role: string;
} | null {
  const usesFlags = argv.some((a) => a === "--email" || a === "--password");
  if (usesFlags) {
    let email = "";
    let password = "";
    let name: string | null = null;
    let role = "super_admin";
    for (let i = 0; i < argv.length; i++) {
      const a = argv[i];
      if (a === "--email") {
        email = (argv[++i] ?? "").trim().toLowerCase();
      } else if (a === "--password") {
        password = argv[++i] ?? "";
      } else if (a === "--name") {
        const v = argv[++i];
        name = v != null && v !== "" ? v : null;
      } else if (a === "--role") {
        role = normalizeRole(argv[++i] ?? "super_admin");
      } else if (a.startsWith("--")) {
        console.error(`❌ Option inconnue : ${a}`);
        printUsage();
        return null;
      } else {
        console.error(`❌ En mode --email/--password, ne pas passer d’arguments seuls : ${a}`);
        printUsage();
        return null;
      }
    }
    if (!email || !password) {
      console.error("❌ --email et --password sont obligatoires.");
      printUsage();
      return null;
    }
    return { email, password, name, role };
  }

  if (argv.length < 2) {
    printUsage();
    return null;
  }

  const email = argv[0].trim().toLowerCase();
  const password = argv[1];
  const name = argv[2] || null;
  const role = normalizeRole(argv[3] || "super_admin");

  return { email, password, name, role };
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variables d'environnement manquantes:");
  console.error("   - NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅" : "❌");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✅" : "❌");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed) {
    process.exit(1);
  }

  const { email, password, name, role } = parsed;

  if (password.length < 8) {
    console.error("❌ Le mot de passe doit contenir au moins 8 caractères.");
    process.exit(1);
  }

  console.log("🔐 Création du compte…");
  console.log(`   Email: ${email}`);
  console.log(`   Rôle (app_metadata): ${role}`);
  console.log(`   Nom affiché: ${name || "(aucun)"}`);

  // Check whether the email already exists
  const { data: existingUser } = await supabase
    .from("admin_users")
    .select("id, email")
    .eq("email", email)
    .single();

  if (existingUser) {
    console.error(`❌ Un compte avec l'email ${email} existe déjà.`);
    process.exit(1);
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
    user_metadata: { name: name || "" },
  });

  if (authError || !authData.user) {
    console.error("❌ Erreur lors de la création Auth:", authError?.message);
    process.exit(1);
  }

  // Create the admin mapping row
  const { data: newUser, error } = await supabase
    .from("admin_users")
    .insert({
      id: authData.user.id,
      email,
      password_hash: "managed-by-supabase-auth",
      name,
    })
    .select("id, email, name")
    .single();

  if (error) {
    await supabase.auth.admin.deleteUser(authData.user.id).catch(() => undefined);
    console.error("❌ Erreur lors de la création:", error.message);
    process.exit(1);
  }

  console.log("✅ Compte admin créé avec succès!");
  console.log(`   ID: ${newUser.id}`);
  console.log(`   Email: ${newUser.email}`);
  if (newUser.name) {
    console.log(`   Nom: ${newUser.name}`);
  }
  console.log("\n💡 Vous pouvez maintenant vous connecter à /login");
}

createAdminUser().catch((error) => {
  console.error("❌ Erreur inattendue:", error);
  process.exit(1);
});
