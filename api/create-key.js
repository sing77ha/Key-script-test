const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const cooldown = new Map();
const COOLDOWN_MS = 60 * 1000;

function generateKey() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let key = "SKY-";

    for (let i = 0; i < 16; i++) {
        if (i === 4 || i === 9 || i === 14) {
            key += "-";
        }

        key += chars[Math.floor(Math.random() * chars.length)];
    }

    return key;
}

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method Not Allowed"
        });
    }

    try {
        const ip =
            req.headers["x-forwarded-for"]?.split(",")[0] ||
            req.socket?.remoteAddress ||
            "unknown";

        const now = Date.now();
        const lastClaim = cooldown.get(ip);

        if (lastClaim && now - lastClaim < COOLDOWN_MS) {
            const remaining = Math.ceil(
                (COOLDOWN_MS - (now - lastClaim)) / 1000
            );

            return res.status(429).json({
                success: false,
                message: `กรุณารอ ${remaining} วินาที`
            });
        }

        const key = generateKey();

        const { data, error } = await supabase
            .from("keys")
            .insert({
                key: key,
                status: "unused"
            })
            .select("key")
            .single();

        if (error) {
            console.error(error);

            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        cooldown.set(ip, now);

        return res.status(200).json({
            success: true,
            key: data.key
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
