"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase-server";
import {
  createClickShipShipment,
  getClickShipConfigStatus,
  parseCanadianAddressForClickShip,
  persistClickShipStateToSubmissions,
} from "@/lib/clickship";

type SubmitRachatDevice = {
  modelId: string;
  brandId: string;
  modelName: string;
  brandName: string;
  condition: string;
  memory: string;
  price: number;
  /** Nombre d’unités (défaut 1). Prix = prix unitaire. */
  quantity?: number;
  devicePhotos: string[];
};

function clampSubmissionQuantity(raw: unknown): number {
  const n =
    typeof raw === "number" && Number.isFinite(raw)
      ? Math.floor(raw)
      : typeof raw === "string" && raw.trim() !== "" && Number.isFinite(Number(raw))
        ? Math.floor(Number(raw))
        : 1;
  return n >= 1 ? Math.min(999, n) : 1;
}

type Locale = "fr" | "en";

type SubmitRachatData = {
  requestGroupId?: string;
  totalPayout?: number;
  devices?: SubmitRachatDevice[];
  modelId?: string;
  brandId?: string;
  modelName?: string;
  brandName?: string;
  condition?: string;
  memory?: string;
  price?: number;
  quantity?: number;
  devicePhotos?: string[];
  /** `store` = formulaire magasin (employé, client, ville, IMEI). `legacy` = courriel + adresse complète. */
  contactMode?: "store" | "legacy";
  employeeFullName?: string;
  clientFullName?: string;
  clientPhone?: string;
  clientCity?: string;
  deviceImei?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  withInsurance?: boolean;
  insuranceFee?: number;
  /** Locale for bordereau / messages (fr/en). Defaults to "fr". */
  locale?: Locale;
};

type ResolvedContact =
  | {
      ok: true;
      employee_full_name: string;
      client_full_name: string;
      client_city: string;
      device_imei: string;
      customer_name: string;
      customer_email: string;
      customer_phone: string;
      customer_address: string;
      clickShipFormattedAddress: string;
    }
  | { ok: false; error: string };

function resolveSubmitContact(data: SubmitRachatData): ResolvedContact {
  const lang: Locale = data.locale === "en" ? "en" : "fr";
  const missing =
    lang === "en"
      ? "Please fill in all required fields."
      : "Veuillez remplir tous les champs obligatoires.";

  if (data.contactMode === "store") {
    const employee_full_name = (data.employeeFullName ?? "").trim();
    const client_full_name = (data.clientFullName ?? "").trim();
    const client_phone = (data.clientPhone ?? "").trim();
    const client_city = (data.clientCity ?? "").trim();
    const device_imei = (data.deviceImei ?? "").trim();
    if (
      !employee_full_name ||
      !client_full_name ||
      !client_phone ||
      !client_city ||
      !device_imei
    ) {
      return { ok: false, error: missing };
    }
    return {
      ok: true,
      employee_full_name,
      client_full_name,
      client_city,
      device_imei,
      customer_name: client_full_name,
      customer_email: "",
      customer_phone: client_phone,
      customer_address: client_city,
      clickShipFormattedAddress: "",
    };
  }

  const customer_name = (data.customerName ?? "").trim();
  const customer_email = (data.customerEmail ?? "").trim();
  const customer_phone = (data.customerPhone ?? "").trim();
  const customer_address = (data.customerAddress ?? "").trim();
  if (!customer_name || !customer_email || !customer_phone || !customer_address) {
    return { ok: false, error: missing };
  }
  return {
    ok: true,
    employee_full_name: "",
    client_full_name: customer_name,
    client_city: customer_address,
    device_imei: "",
    customer_name,
    customer_email,
    customer_phone,
    customer_address,
    clickShipFormattedAddress: customer_address,
  };
}

export async function submitRachat(data: SubmitRachatData) {
  const supabase = createAdminClient();

  const devices: SubmitRachatDevice[] = data.devices?.length
    ? data.devices
    : data.modelId &&
        data.brandId &&
        data.modelName &&
        data.brandName &&
        data.condition &&
        data.memory &&
        typeof data.price === "number"
      ? [
          {
            modelId: data.modelId,
            brandId: data.brandId,
            modelName: data.modelName,
            brandName: data.brandName,
            condition: data.condition,
            memory: data.memory,
            price: data.price,
            quantity: clampSubmissionQuantity(data.quantity),
            devicePhotos: data.devicePhotos || [],
          },
        ]
      : [];

  if (devices.length === 0) {
    return { success: false, error: "No devices to submit", id: null };
  }

  const contact = resolveSubmitContact(data);
  if (!contact.ok) {
    return { success: false, error: contact.error, id: null };
  }

  const requestGroupId = data.requestGroupId || crypto.randomUUID();
  const withInsurance = data.withInsurance === true;
  const insuranceFee =
    withInsurance &&
    typeof data.insuranceFee === "number" &&
    Number.isFinite(data.insuranceFee)
      ? Math.max(0, data.insuranceFee)
      : 0;

  const payloadsWithInsurance = devices.map((device) => ({
    request_group_id: requestGroupId,
    model_id: device.modelId,
    brand_id: device.brandId,
    model_name: device.modelName,
    brand_name: device.brandName,
    condition: device.condition,
    memory: device.memory,
    price: device.price,
    quantity: clampSubmissionQuantity(device.quantity),
    employee_full_name: contact.employee_full_name,
    client_full_name: contact.client_full_name,
    client_city: contact.client_city,
    device_imei: contact.device_imei,
    customer_name: contact.customer_name,
    customer_email: contact.customer_email || null,
    customer_phone: contact.customer_phone,
    customer_address: contact.customer_address || null,
    device_photos: device.devicePhotos,
    with_insurance: withInsurance,
    insurance_fee: insuranceFee,
    status: "unprocessed",
  }));

  let submissions: { id: string; created_at: string }[] | null = null;
  let error: { message: string } | null = null;

  let insertPayloads: Record<string, unknown>[] = payloadsWithInsurance.map((p) => ({
    ...p,
  }));

  const runInsert = () =>
    supabase.from("submissions").insert(insertPayloads).select("id, created_at");

  const firstInsert = await runInsert();
  submissions = firstInsert.data;
  error = firstInsert.error;

  if (error) {
    const msg = error.message;
    if (msg.includes("request_group_id") && devices.length > 1) {
      return {
        success: false,
        id: null,
        error:
          "Votre base de données ne supporte pas `request_group_id`, donc on ne peut pas regrouper plusieurs appareils dans une seule commande. " +
          "Appliquez les migrations Supabase (`supabase/migrations/`, notamment `request_group_id`) ou mettez à jour le schéma dans le SQL Editor, puis réessayez.",
      };
    }

    insertPayloads = payloadsWithInsurance.map((payload) => {
      const nextPayload = { ...payload } as Record<string, unknown>;
      if (
        /employee_full_name|client_full_name|client_city|device_imei/i.test(msg) &&
        /does not exist/i.test(msg)
      ) {
        delete nextPayload.employee_full_name;
        delete nextPayload.client_full_name;
        delete nextPayload.client_city;
        delete nextPayload.device_imei;
      }
      if (/quantity/i.test(msg) && /does not exist/i.test(msg)) {
        delete nextPayload.quantity;
      }
      if (msg.includes("request_group_id")) {
        delete nextPayload.request_group_id;
      }
      if (msg.includes("with_insurance") || msg.includes("insurance_fee")) {
        delete nextPayload.with_insurance;
        delete nextPayload.insurance_fee;
      }
      return nextPayload;
    });

    const secondInsert = await runInsert();
    submissions = secondInsert.data;
    error = secondInsert.error;
  }

  if (error) {
    const msg = error.message;
    const canDropRequestGroup = msg.includes("request_group_id");
    const canDropInsurance =
      msg.includes("with_insurance") || msg.includes("insurance_fee");
    const canDropQuantity = /quantity/i.test(msg) && /does not exist/i.test(msg);
    const canDropTradeIn =
      /employee_full_name|client_full_name|client_city|device_imei/i.test(msg) &&
      /does not exist/i.test(msg);

    if (canDropRequestGroup || canDropInsurance || canDropQuantity || canDropTradeIn) {
      if (canDropRequestGroup && devices.length > 1) {
        return {
          success: false,
          id: null,
          error:
            "Votre base de données ne supporte pas `request_group_id`, donc on ne peut pas regrouper plusieurs appareils dans une seule commande. " +
            "Appliquez les migrations Supabase (`supabase/migrations/`, notamment `request_group_id`) ou mettez à jour le schéma dans le SQL Editor, puis réessayez.",
        };
      }

      const fallbackPayloads = payloadsWithInsurance.map((payload) => {
        const nextPayload = { ...payload } as Record<string, unknown>;
        if (canDropRequestGroup) {
          delete nextPayload.request_group_id;
        }
        if (canDropInsurance) {
          delete nextPayload.with_insurance;
          delete nextPayload.insurance_fee;
        }
        if (canDropQuantity) {
          delete nextPayload.quantity;
        }
        if (canDropTradeIn) {
          delete nextPayload.employee_full_name;
          delete nextPayload.client_full_name;
          delete nextPayload.client_city;
          delete nextPayload.device_imei;
        }
        return nextPayload;
      });

      const fallbackInsert = await supabase
        .from("submissions")
        .insert(fallbackPayloads)
        .select("id, created_at");

      submissions = fallbackInsert.data;
      error = fallbackInsert.error;
    }
  }

  if (error) {
    console.error("Error creating submission:", error);
    return {
      success: false,
      error:
        error.message +
        " (Si des colonnes manquent, appliquez les migrations dans `supabase/migrations/` ou rechargez le schéma Supabase.)",
      id: null,
    };
  }

  if (!submissions?.length) {
    return { success: false, error: "Submission was not created", id: null };
  }
  const firstSubmissionId = submissions[0].id;

  const clickShipFormatted = contact.clickShipFormattedAddress.trim();
  const parsedCanadian =
    clickShipFormatted.length > 0
      ? parseCanadianAddressForClickShip(clickShipFormatted)
      : null;

  let clickShipShipmentId: string | null = null;

  try {
    const clickShip = getClickShipConfigStatus();
    if (clickShip.enabled && parsedCanadian) {
      const shipment = await createClickShipShipment({
        uniqueId: requestGroupId,
        orderReference: requestGroupId.slice(0, 8).toUpperCase(),
        devicesCount: devices.reduce(
          (sum, d) => sum + clampSubmissionQuantity(d.quantity),
          0,
        ),
        customer: {
          name: contact.client_full_name || contact.customer_name,
          email:
            contact.customer_email.trim() || "noreply@achetetoncell.ca",
          phone: contact.customer_phone,
          formattedAddress: clickShipFormatted,
        },
      });

      if (!shipment?.shipmentId) {
        throw new Error(
          "ClickShip booking succeeded but shipment id is missing",
        );
      }

      clickShipShipmentId = shipment.shipmentId;

      await persistClickShipStateToSubmissions({
        requestGroupId,
        submissionIds: submissions.map((s) => s.id),
        shipmentId: clickShipShipmentId,
        trackingNumber: shipment.trackingNumber ?? null,
        trackingUrl: shipment.trackingUrl ?? null,
        shippingLabelUrl: null,
        shippingLabelStatus: "not_requested",
        shippingLabelError: null,
      });
    }
  } catch (clickShipError) {
    console.error("Error creating ClickShip shipment:", clickShipError);

    try {
      await supabase
        .from("submissions")
        .delete()
        .in(
          "id",
          submissions.map((s) => s.id),
        );
    } catch (rollbackError) {
      console.error(
        "Failed to roll back submissions after ClickShip error:",
        rollbackError,
      );
    }

    const lang: Locale = data.locale === "en" ? "en" : "fr";
    const msg =
      clickShipError instanceof Error &&
      clickShipError.message === "CLICKSHIP_CANADA_ONLY_ADDRESS_REQUIRED"
        ? lang === "en"
          ? "Invalid address: please provide a complete Canadian address (including postal code) and select an autocomplete suggestion if available."
          : "Adresse invalide : merci d’entrer une adresse canadienne complète (incluant le code postal) et de sélectionner une suggestion d’autocomplétion si possible."
        : clickShipError instanceof Error &&
            clickShipError.message === "CLICKSHIP_NO_RATES_FOUND_FOR_ROUTE"
          ? lang === "en"
            ? "No shipping rate found for this route with the configured carriers. Please try again later."
            : "Aucun tarif d’expédition n’a été trouvé pour cette route avec les transporteurs configurés. Veuillez réessayer plus tard."
          : lang === "en"
            ? "Unable to create the shipment with Freightcom. Please try again in a few minutes."
            : "Impossible de créer l'envoi avec Freightcom. Veuillez réessayer dans quelques minutes.";
    return { success: false, error: msg, id: null };
  }

  revalidatePath("/");
  revalidatePath("/en");
  return {
    success: true,
    id: firstSubmissionId,
    ids: submissions.map((row) => row.id),
    requestGroupId,
    error: null,
  };
}
