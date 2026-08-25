const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method Not Allowed"
        });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({
            success: false,
            message: "Supabase environment variables are missing"
        });
    }

    try {
        // -------------------------
        // อ่าน Session Cookie
        // -------------------------

        const cookies = req.headers.cookie || "";

        const sessionCookie = cookies
            .split(";")
            .map(v => v.trim())
            .find(v => v.startsWith("roblox_session="));

        if (!sessionCookie) {
            return res.status(401).json({
                success: false,
                message: "กรุณา Login Roblox ก่อน"
            });
        }

        const sessionToken = decodeURIComponent(
            sessionCookie.substring("roblox_session=".length)
        );

        const supabase = createClient(
            supabaseUrl,
            serviceRoleKey
        );

        // -------------------------
        // ตรวจ Session
        // -------------------------

        const { data: session, error: sessionError } =
            await supabase
                .from("roblox_sessions")
                .select(
                    "roblox_user_id, roblox_username, expires_at"
                )
                .eq("session_token", sessionToken)
                .maybeSingle();

        if (sessionError) {
            console.error("Session error:", sessionError);

            return res.status(500).json({
                success: false,
                message: "ไม่สามารถตรวจสอบ Session ได้"
            });
        }

        if (!session) {
            return res.status(401).json({
                success: false,
                message: "Session ไม่ถูกต้อง กรุณา Login ใหม่"
            });
        }

        // -------------------------
        // ตรวจ Session หมดอายุ
        // -------------------------

        if (new Date(session.expires_at) <= new Date()) {
            return res.status(401).json({
                success: false,
                message: "Session หมดอายุ กรุณา Login ใหม่"
            });
        }

        const robloxUserId = String(
            session.roblox_user_id
        );

        // -------------------------
        // ตรวจว่าเคย Claim แล้วหรือยัง
        // -------------------------

        const { data: existingKey, error: existingError } =
            await supabase
                .from("keys")
                .select(
                    "id, active, key, expires_at, roblox_user_id, created_at"
                )
                .eq("roblox_user_id", robloxUserId)
                .maybeSingle();

        if (existingError) {
            console.error(
                "Existing key check error:",
                existingError
            );

            return res.status(500).json({
                success: false,
                message: "ไม่สามารถตรวจสอบ Key เดิมได้"
            });
        }

        if (existingKey) {
            return res.status(409).json({
                success: false,
                alreadyClaimed: true,
                message: "บัญชี Roblox นี้รับ Key ไปแล้ว",
                key: existingKey.key
            });
        }

        // -------------------------
        // สร้าง Key ใหม่
        // -------------------------

        const chars =
            "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        function randomPart(length) {
            let result = "";

            for (let i = 0; i < length; i++) {
                result += chars[
                    Math.floor(
                        Math.random() * chars.length
                    )
                ];
            }

            return result;
        }

        const newKey =
            `SKY-${randomPart(5)}-${randomPart(5)}-${randomPart(5)}`;

        // -------------------------
        // บันทึก Key + Roblox User ID
        // -------------------------

        const { data, error } = await supabase
            .from("keys")
            .insert({
                key: newKey,
                active: true,
                roblox_user_id: robloxUserId
            })
            .select(
                "id, active, key, expires_at, roblox_user_id, created_at"
            )
            .single();

        if (error) {
            console.error("Create key error:", error);

            // UNIQUE constraint
            // ป้องกันกรณี Claim พร้อมกัน
            if (error.code === "23505") {
                return res.status(409).json({
                    success: false,
                    alreadyClaimed: true,
                    message: "บัญชี Roblox นี้รับ Key ไปแล้ว"
                });
            }

            return res.status(500).json({
                success: false,
                message: error.message,
                code: error.code
            });
        }

        // -------------------------
        // สำเร็จ
        // -------------------------

        return res.status(200).json({
            success: true,
            message: "สร้าง Key สำเร็จ",
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
