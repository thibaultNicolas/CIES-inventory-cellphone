"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge, type BadgeProps } from "@/components/ui/badge";
// Note: createAdminClient is server-only, so the client must use an API route.
import { AlertTriangle, CheckCircle, XCircle, type LucideIcon } from "lucide-react";

type IncidentLog = {
  id: string;
  incident_date: string;
  description: string;
  affected_count: number;
  measures_taken: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type BadgeVariant = NonNullable<BadgeProps["variant"]>;
type IncidentStatus = "open" | "resolved" | "closed";

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusBadge(status: string) {
  const statusConfig = {
    open: { label: "Ouvert", color: "pending" as BadgeVariant, icon: AlertTriangle },
    resolved: { label: "Résolu", color: "received" as BadgeVariant, icon: CheckCircle },
    closed: { label: "Fermé", color: "paid" as BadgeVariant, icon: XCircle },
  } satisfies Record<
    IncidentStatus,
    { label: string; color: BadgeVariant; icon: LucideIcon }
  >;

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
  const Icon = config.icon;

  return (
    <Badge variant={config.color} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export function IncidentLogsTable() {
  const [incidents, setIncidents] = useState<IncidentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchIncidents() {
      try {
        const response = await fetch("/api/incidents");
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération");
        }
        const { data } = await response.json();
        setIncidents(data || []);
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchIncidents();
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-card border border-foreground/10 bg-background p-8 text-center text-foreground/50">
        Chargement...
      </div>
    );
  }

  return (
    <div className="rounded-card border border-foreground/10 bg-background shadow-soft overflow-x-auto">
      <div className="border-b border-foreground/10 p-4 sm:p-6">
        <h2 className="text-lg font-medium text-brand-dark sm:text-xl">
          Registre des Incidents de Confidentialité
        </h2>
        <p className="mt-2 text-sm text-foreground/60">
          Conforme à la Loi 25 du Québec - Documentation de tout accès non autorisé aux données
        </p>
      </div>
      <Table className="min-w-[700px]">
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap px-3 sm:px-6">Date de l'incident</TableHead>
            <TableHead className="px-3 sm:px-6">Description</TableHead>
            <TableHead className="text-center px-3 sm:px-6">Personnes touchées</TableHead>
            <TableHead className="px-3 sm:px-6">Mesures prises</TableHead>
            <TableHead className="text-center px-3 sm:px-6">Statut</TableHead>
            <TableHead className="whitespace-nowrap px-3 sm:px-6">Date de création</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 px-3 py-8 text-center text-foreground/50 sm:px-6">
                Aucun incident enregistré
              </TableCell>
            </TableRow>
          ) : (
            incidents.map((incident) => (
              <TableRow key={incident.id}>
                <TableCell className="whitespace-nowrap px-3 py-3 font-medium sm:px-6 sm:py-4">
                  {formatDate(incident.incident_date)}
                </TableCell>
                <TableCell className="max-w-md px-3 py-3 sm:px-6 sm:py-4">
                  <p className="text-sm leading-relaxed">{incident.description}</p>
                </TableCell>
                <TableCell className="text-center px-3 py-3 sm:px-6 sm:py-4">
                  <span className="font-medium">{incident.affected_count}</span>
                </TableCell>
                <TableCell className="max-w-md px-3 py-3 sm:px-6 sm:py-4">
                  <p className="text-sm text-foreground/70">
                    {incident.measures_taken || "Non spécifié"}
                  </p>
                </TableCell>
                <TableCell className="text-center px-3 py-3 sm:px-6 sm:py-4">
                  {getStatusBadge(incident.status)}
                </TableCell>
                <TableCell className="whitespace-nowrap px-3 py-3 text-sm text-foreground/60 sm:px-6 sm:py-4">
                  {formatDate(incident.created_at)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
