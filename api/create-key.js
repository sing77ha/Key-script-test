const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateKey() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    const part = (length) => {
        let result = "";

        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }

        return result;
    };

    return `SKY-${part(5)}-${part(5)}-${part(5)}`;
}

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method Not Allowed"
        });
    }

    try {
        // สร้าง Key
        let newKey;
        let exists = true;

        // ป้องกัน Key ซ้ำ
        while (exists) {
            newKey = generateKey();

            const { data, error } = await supabase
                .from("keys")
                .select("id")
                .eq("keys", newKey)
                .limit(1);

            if (error) {
                console.error("Check key error:", error);

                return res.status(500).json({
                    success: false,
                    message: "Database error while checking key"
                });
            }

            exists = data && data.length > 0;
        }

        // บันทึก Key
        const { data, error } = await supabase
            .from("keys")
            .insert({
                keys: newKey,
                active: true
            })
            .select("id, keys, active, expires_at, roblox_user_id, created_at")
            .single();

        if (error) {
            console.error("Insert key error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to save key"
            });
        }

        return res.status(200).json({
            success: true,
            key: data.keys,
            active: data.active,
            expires_at: data.expires_at,
            created_at: data.created_at
        });

    } catch (error) {
        console.error("Create key error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
