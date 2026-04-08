"use client";

import { useState, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { updateSubmissionStatus } from "../../actions/update-submission-status";
import { deleteSubmission } from "../../actions/delete-submission";
import { ChevronDown, DollarSign, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { SubmissionStatus } from "@/lib/submissions";
import { submissionLineTotal } from "@/lib/submissions";

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

type Submission = {
  id: string;
  created_at: string;
  employee_full_name: string;
  store_name?: string;
  client_full_name: string;
  client_account_number?: string;
  client_city: string;
  device_imei: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  brand_name: string;
  model_name: string;
  memory: string;
  condition: string;
  price: number;
  quantity: number;
  status: SubmissionStatus;
};

type SubmissionsTableProps = {
  submissions: Submission[];
};

const statusOptions = [
  { value: "unprocessed", label: "Non traité", color: "unprocessed" },
  { value: "label_sent", label: "Étiquette envoyé", color: "label_sent" },
  { value: "paid", label: "Reçu et paiement envoyé", color: "paid" },
  { value: "cancelled", label: "Annulé", color: "cancelled" },
] as const satisfies ReadonlyArray<{
  value: SubmissionStatus;
  label: string;
  color: Extract<BadgeVariant, SubmissionStatus>;
}>;

function getStatusBadge(status: string) {
  const normalized = status.toLowerCase();
  const statusOption = statusOptions.find((s) => s.value === normalized);
  if (!statusOption) {
    return <Badge variant="unprocessed">{status || "Non traité"}</Badge>;
  }
  return <Badge variant={statusOption.color}>{statusOption.label}</Badge>;
}

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

export function SubmissionsTable({ submissions: initialSubmissions }: SubmissionsTableProps) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    }

    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  async function handleStatusChange(submissionId: string, newStatus: SubmissionStatus) {
    setIsUpdating(submissionId);
    const result = await updateSubmissionStatus({
      submissionId,
      status: newStatus,
    });

    if (result.success) {
      setSubmissions(
        submissions.map((s) =>
          s.id === submissionId ? { ...s, status: newStatus } : s
        )
      );
    } else {
      alert(result.error || "Erreur lors de la mise à jour du statut");
    }

    setIsUpdating(null);
    setOpenDropdown(null);
  }

  async function handleSendPayment(submissionId: string) {
    setIsUpdating(submissionId);
    
    // Animation visuelle
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const result = await updateSubmissionStatus({
      submissionId,
      status: "paid",
    });

    if (result.success) {
      setSubmissions(
        submissions.map((s) =>
          s.id === submissionId ? { ...s, status: "paid" } : s
        )
      );
    } else {
      alert(result.error || "Erreur lors de la mise à jour du statut");
    }

    setIsUpdating(null);
  }

  async function handleDeleteSubmission(submissionId: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer définitivement cette soumission ? Cette action est irréversible et supprimera également toutes les photos associées.")) {
      return;
    }

    setIsDeleting(submissionId);
    
    const result = await deleteSubmission(submissionId);

    if (result.success) {
      setSubmissions(submissions.filter((s) => s.id !== submissionId));
      alert("Soumission supprimée avec succès");
    } else {
      alert(result.error || "Erreur lors de la suppression");
    }

    setIsDeleting(null);
  }

  return (
    <div className="rounded-card border border-foreground/10 bg-background shadow-soft">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Date</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Appareil</TableHead>
            <TableHead>Capacité</TableHead>
            <TableHead>État</TableHead>
            <TableHead className="text-center">Qté</TableHead>
            <TableHead className="text-right">Prix</TableHead>
            <TableHead className="text-center">Statut</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-foreground/50">
                Aucune demande pour le moment
              </TableCell>
            </TableRow>
          ) : (
            submissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell className="font-medium">
                  {formatDate(submission.created_at)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">
                      {submission.client_full_name || submission.customer_name}
                    </span>
                    {submission.employee_full_name ? (
                      <span className="text-sm text-foreground/60">
                        Employé : {submission.employee_full_name}
                      </span>
                    ) : null}
                    {submission.store_name ? (
                      <span className="text-sm text-foreground/60">
                        Magasin : {submission.store_name}
                      </span>
                    ) : null}
                    {submission.client_account_number ? (
                      <span className="text-sm text-foreground/60">
                        Compte :{" "}
                        <span className="font-mono">{submission.client_account_number}</span>
                      </span>
                    ) : null}
                    <span className="text-sm text-foreground/60">
                      {submission.customer_phone}
                      {submission.client_city ? ` · ${submission.client_city}` : ""}
                    </span>
                    {submission.device_imei ? (
                      <span className="font-mono text-xs text-foreground/50">
                        IMEI : {submission.device_imei}
                      </span>
                    ) : null}
                    {submission.customer_email ? (
                      <span className="text-sm text-foreground/50">{submission.customer_email}</span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {submission.brand_name} {submission.model_name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{submission.memory}</TableCell>
                <TableCell>{submission.condition}</TableCell>
                <TableCell className="text-center">{submission.quantity}</TableCell>
                <TableCell className="text-right">
                  <span className="font-(family-name:--font-playfair) text-lg font-light text-brand-primary">
                    {submissionLineTotal(
                      submission.price,
                      submission.quantity,
                    ).toFixed(2)}
                    $
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(submission.status)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() =>
                        setOpenDropdown(
                          openDropdown === submission.id ? null : submission.id
                        )
                      }
                      disabled={isUpdating === submission.id}
                      className="flex items-center gap-2 rounded-card border-2 border-foreground/10 bg-background px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-brand-primary hover:bg-brand-primary/5 disabled:opacity-50"
                    >
                      <span>Changer</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          openDropdown === submission.id ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {openDropdown === submission.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute right-0 top-full z-50 mt-2 w-48 rounded-card border border-foreground/10 bg-background shadow-lg"
                        >
                          <div className="p-2">
                            {statusOptions
                              .filter((option) => option.value !== submission.status)
                              .map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() =>
                                    handleStatusChange(submission.id, option.value)
                                  }
                                  className="w-full rounded-card px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary"
                                >
                                  {option.label}
                                </button>
                              ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {submission.status === "label_sent" && (
                    <motion.button
                      onClick={() => handleSendPayment(submission.id)}
                      disabled={isUpdating === submission.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-card bg-green-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-green-600 disabled:opacity-50"
                    >
                      <DollarSign className="h-4 w-4" />
                      {isUpdating === submission.id ? "Envoi..." : "Envoyer Paiement"}
                    </motion.button>
                  )}
                  
                  <motion.button
                    onClick={() => handleDeleteSubmission(submission.id)}
                    disabled={isDeleting === submission.id || isUpdating === submission.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-card border-2 border-red-500 bg-background px-4 py-2 text-sm font-medium text-red-500 transition-all hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeleting === submission.id ? "Suppression..." : "Supprimer définitivement"}
                  </motion.button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
