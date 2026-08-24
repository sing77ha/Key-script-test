export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      valid: false,
      error: "Method not allowed"
    });
  }

  try {
    const { key, userId } = req.body || {};

    if (!key) {
      return res.status(400).json({
        valid: false,
        error: "Missing key"
      });
    }

    const normalizedKey = key.trim().toUpperCase();

    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/keys?select=key,expires_at,active,roblox_user_id&key=eq.${encodeURIComponent(normalizedKey)}&limit=1`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization:
            `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );

    if (!response.ok) {
      return res.status(500).json({
        valid: false,
        error: "Database request failed"
      });
    }

    const rows = await response.json();
    const record = rows[0];

    if (!record || record.active !== true) {
      return res.status(200).json({
        valid: false,
        error: "Invalid key"
      });
    }

    if (
      record.expires_at &&
      new Date(record.expires_at) <= new Date()
    ) {
      return res.status(200).json({
        valid: false,
        error: "Key expired"
      });
    }

    if (
      record.roblox_user_id &&
      userId &&
      String(record.roblox_user_id) !== String(userId)
    ) {
      return res.status(200).json({
        valid: false,
        error: "Key is bound to another user"
      });
    }

    return res.status(200).json({
      valid: true,
      expiresAt: record.expires_at || null
    });

  } catch (error) {
    return res.status(500).json({
      valid: false,
      error: "Server error"
    });
  }
}
