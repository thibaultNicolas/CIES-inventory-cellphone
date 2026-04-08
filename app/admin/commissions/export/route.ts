import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-server";
import type { SubmissionRow } from "@/lib/submissions";
import { normalizeSubmissionRow, submissionLineTotal } from "@/lib/submissions";
import { applyCommissionFilters } from "@/lib/commission-filters";

function esc(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function sanitizeSpreadsheetCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  return /^[=+\-@]/.test(s) ? `'${s}` : s;
}

function formatCsvDate(input: string): string {
  const match = input.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/,
  );
  if (match) {
    return `${match[1]} ${match[2]}`;
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") === "all" ? "all" : "filtered";
  const commissionPaid = url.searchParams.get("commissionPaid") ?? "all";
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  const employee = url.searchParams.get("employee") ?? "";
  const store = url.searchParams.get("store") ?? "";

  const supabase = createAdminClient();
  const pageSize = 1000;
  const filename =
    scope === "all"
      ? `commissions-all-${new Date().toISOString().slice(0, 10)}.csv`
      : `commissions-filtered-${new Date().toISOString().slice(0, 10)}.csv`;

  const header =
    [
      "Date transaction",
      "ID commande",
      "ID transaction",
      "Employe",
      "Magasin",
      "Client",
      "Marque",
      "Modele",
      "Memoire",
      "Etat",
      "Quantite",
      "Prix unitaire",
      "Montant rachat",
      "Commission employe",
      "Commission gerant",
      "Commission proprio",
      "Commission totale",
      "Statut",
      "Commission payee",
    ].join(",") + "\n";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(new TextEncoder().encode(header));

        for (let page = 0; ; page += 1) {
          const start = page * pageSize;
          const end = start + pageSize - 1;
          let q = supabase
            .from("submissions")
            .select(
              "id,request_group_id,created_at,status,employee_full_name,store_name,client_full_name,customer_name,brand_name,model_name,memory,condition,price,quantity,commission_paid,commission_employee,commission_manager,commission_owner",
            )
            .order("created_at", { ascending: false })
            .range(start, end);

          if (scope === "filtered") {
            q = applyCommissionFilters(q, {
              fromDate: from,
              toDate: to,
              commissionPaid:
                commissionPaid === "paid" || commissionPaid === "unpaid"
                  ? commissionPaid
                  : "all",
              employeeFullName: employee,
              storeName: store,
            });
          }

          const { data, error } = await q;
          if (error) {
            throw new Error(error.message);
          }

          const batch = (data || []) as SubmissionRow[];
          if (batch.length === 0) break;

          let chunk = "";
          for (const row of batch) {
            const s = normalizeSubmissionRow(row);
            const lineTotal = submissionLineTotal(s.price, s.quantity);
            const cEmployee = Number(s.commission_employee ?? 0);
            const cManager = Number(s.commission_manager ?? 0);
            const cOwner = Number(s.commission_owner ?? 0);
            const cTotal = cEmployee + cManager + cOwner;

            chunk +=
              [
                esc(formatCsvDate(s.created_at)),
                esc(sanitizeSpreadsheetCell(s.request_group_id ?? s.id)),
                esc(sanitizeSpreadsheetCell(s.id)),
                esc(sanitizeSpreadsheetCell(s.employee_full_name)),
                esc(sanitizeSpreadsheetCell(s.store_name)),
                esc(sanitizeSpreadsheetCell(s.client_full_name || s.customer_name)),
                esc(sanitizeSpreadsheetCell(s.brand_name)),
                esc(sanitizeSpreadsheetCell(s.model_name)),
                esc(sanitizeSpreadsheetCell(s.memory)),
                esc(sanitizeSpreadsheetCell(s.condition)),
                esc(s.quantity),
                esc(s.price.toFixed(2)),
                esc(lineTotal.toFixed(2)),
                esc(cEmployee.toFixed(2)),
                esc(cManager.toFixed(2)),
                esc(cOwner.toFixed(2)),
                esc(cTotal.toFixed(2)),
                esc(sanitizeSpreadsheetCell(s.status)),
                esc(s.commission_paid ? "Oui" : "Non"),
              ].join(",") + "\n";
          }

          controller.enqueue(new TextEncoder().encode(chunk));
          if (batch.length < pageSize) break;
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
