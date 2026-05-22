-- Source de vérité paiement : commission_paid (= « Commission payée »). Aligner legacy.
UPDATE submissions
SET commission_paid = true, status = 'paid'
WHERE status = 'paid'
  AND (commission_paid IS NULL OR commission_paid = false);

UPDATE submissions
SET commission_paid = false
WHERE status IN ('unprocessed', 'label_sent', 'cancelled')
  AND commission_paid = true;
