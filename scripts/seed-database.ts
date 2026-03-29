import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables:");
  console.error("   - NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅" : "❌");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✅" : "❌");
  console.error("\nMake sure .env.local exists with these variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

type RawDevice = {
  marque: string;
  model: string;
  condition: string;
  memoire: string;
  prix: number;
  image: string;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function downloadAndUploadImage(
  imageUrl: string,
  fileName: string
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to download: ${imageUrl}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "image/png";

    const { data, error } = await supabase.storage
      .from("device-images")
      .upload(fileName, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error(`Upload error for ${fileName}:`, error.message);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("device-images").getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error(`Error processing ${imageUrl}:`, error);
    return null;
  }
}

async function seed() {
  console.log("🌱 Starting database seed...\n");

  const dataPath = path.join(process.cwd(), "data.json");
  const rawData: RawDevice[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  console.log(`📊 Found ${rawData.length} entries in data.json\n`);

  const brandsMap = new Map<string, string>();
  const uniqueBrands = [...new Set(rawData.map((d) => d.marque))];

  console.log("📦 Inserting brands...");
  for (const brandName of uniqueBrands) {
    const slug = slugify(brandName);
    const displayName = brandName.charAt(0).toUpperCase() + brandName.slice(1);

    const { data, error } = await supabase
      .from("brands")
      .upsert({ name: displayName, slug }, { onConflict: "slug" })
      .select("id")
      .single();

    if (error) {
      console.error(`Error inserting brand ${brandName}:`, error);
      continue;
    }

    brandsMap.set(brandName, data.id);
    console.log(`  ✅ ${displayName}`);
  }

  const modelsMap = new Map<string, string>();
  const uniqueModels = new Map<string, { brand: string; image: string }>();

  for (const device of rawData) {
    const key = `${device.marque}-${device.model}`;
    if (!uniqueModels.has(key)) {
      uniqueModels.set(key, { brand: device.marque, image: device.image });
    }
  }

  console.log(`\n📱 Inserting ${uniqueModels.size} models and downloading images...`);

  let imageCount = 0;
  for (const [key, { brand, image }] of uniqueModels) {
    const modelName = key.replace(`${brand}-`, "");
    const brandId = brandsMap.get(brand);
    if (!brandId) continue;

    const slug = slugify(modelName);
    const fileName = `${slugify(brand)}/${slug}.png`;

    console.log(`  📥 Downloading image for ${brand} ${modelName}...`);
    const uploadedUrl = await downloadAndUploadImage(image, fileName);
    imageCount++;

    const { data, error } = await supabase
      .from("models")
      .upsert(
        {
          brand_id: brandId,
          name: modelName,
          slug,
          image_url: uploadedUrl || image,
        },
        { onConflict: "brand_id,slug" }
      )
      .select("id")
      .single();

    if (error) {
      console.error(`Error inserting model ${modelName}:`, error);
      continue;
    }

    modelsMap.set(key, data.id);

    if (imageCount % 10 === 0) {
      console.log(`  📊 Progress: ${imageCount}/${uniqueModels.size} images processed`);
    }
  }

  console.log(`\n💰 Inserting prices...`);
  
  const priceMap = new Map<string, {
    model_id: string;
    condition: string;
    memory: string;
    price: number;
  }>();

  for (const device of rawData) {
    const key = `${device.marque}-${device.model}`;
    const modelId = modelsMap.get(key);
    if (!modelId) continue;

    const uniqueKey = `${modelId}-${device.condition}-${device.memoire}`;
    
    if (!priceMap.has(uniqueKey)) {
      priceMap.set(uniqueKey, {
        model_id: modelId,
        condition: device.condition,
        memory: device.memoire,
        price: Number(device.prix),
      });
    } else {
      const existing = priceMap.get(uniqueKey)!;
      if (Number(device.prix) > existing.price) {
        existing.price = Number(device.prix);
      }
    }
  }

  const priceBatches = Array.from(priceMap.values());
  console.log(`  📊 Found ${priceBatches.length} unique price entries to insert`);

  const batchSize = 100;
  let insertedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < priceBatches.length; i += batchSize) {
    const batch = priceBatches.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from("prices")
      .upsert(batch, { 
        onConflict: "model_id,condition,memory",
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error(`  ❌ Error inserting price batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      errorCount++;
      
      for (const priceEntry of batch) {
        const { error: singleError } = await supabase
          .from("prices")
          .upsert(priceEntry, { onConflict: "model_id,condition,memory" });
        
        if (singleError) {
          console.error(`    ❌ Failed to insert: ${priceEntry.model_id} - ${priceEntry.condition} - ${priceEntry.memory}`, singleError.message);
        } else {
          insertedCount++;
        }
      }
    } else {
      insertedCount += batch.length;
    }

    if ((i + batchSize) % 500 === 0 || i + batchSize >= priceBatches.length) {
      console.log(
        `  📊 Progress: ${Math.min(i + batchSize, priceBatches.length)}/${priceBatches.length} processed (${insertedCount} inserted, ${errorCount} errors)`
      );
    }
  }

  console.log(`  ✅ Successfully inserted ${insertedCount} price entries`);

  console.log("\n🎉 Database seeded successfully!");
  console.log(`   - ${uniqueBrands.length} brands`);
  console.log(`   - ${uniqueModels.size} models`);
  console.log(`   - ${priceBatches.length} price entries`);
  console.log(`   - ${imageCount} images uploaded to Supabase Storage`);
}

seed().catch(console.error);
