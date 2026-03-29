import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("incident_logs")
      .select(
        "id, incident_date, description, affected_count, measures_taken, status, created_at, updated_at, created_by"
      )
      .order("incident_date", { ascending: false });

    if (error) {
      console.error("Erreur lors de la récupération des incidents:", error);
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
