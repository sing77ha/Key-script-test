const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method Not Allowed"
        });
    }

    if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({
            success: false,
            message: "Supabase environment variables are missing"
        });
    }

    try {
        const supabase = createClient(
            supabaseUrl,
            serviceRoleKey
        );

        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        function randomPart(length) {
            let result = "";

            for (let i = 0; i < length; i++) {
                result += chars[
                    Math.floor(Math.random() * chars.length)
                ];
            }

            return result;
        }

        const newKey =
            `SKY-${randomPart(5)}-${randomPart(5)}-${randomPart(5)}`;

        const { data, error } = await supabase
            .from("keys")
            .insert({
                key: newKey,
                active: true
            })
            .select("id, active, key, expires_at, roblox_user_id, created_at")
            .single();

        if (error) {
            console.error("Supabase error:", error);

            return res.status(500).json({
                success: false,
                message: error.message,
                code: error.code
            });
        }

        return res.status(200).json({
            success: true,
            key: data.key,
            active: data.active,
            expires_at: data.expires_at,
            roblox_user_id: data.roblox_user_id,
            created_at: data.created_at
        });

    } catch (error) {
        console.error("Function error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
