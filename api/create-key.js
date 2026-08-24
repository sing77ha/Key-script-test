const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminSecret = process.env.ADMIN_SECRET;

function generateKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "SKY-";

  for (let i = 0; i < 16; i++) {
    if (i === 4 || i === 9 || i === 14) {
      result += "-";
    }

    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method Not Allowed"
    });
  }

  try {
    if (!supabaseUrl || !serviceRoleKey || !adminSecret) {
      return res.status(500).json({
        success: false,
        message: "Server environment is not configured"
      });
    }

    const providedSecret = req.headers["x-admin-secret"];

    if (!providedSecret || providedSecret !== adminSecret) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    let newKey;
    let exists = true;

    while (exists) {
      newKey = generateKey();

      const { data, error } = await supabase
        .from("keys")
        .select("key")
        .eq("key", newKey)
        .limit(1);

      if (error) throw error;

      exists = data && data.length > 0;
    }

    const { data, error } = await supabase
      .from("keys")
      .insert({
        key: newKey,
        status: "unused"
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      key: data.key
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create key"
    });
  }
};
