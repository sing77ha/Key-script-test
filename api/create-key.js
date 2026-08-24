const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method Not Allowed"
        });
    }

    try {
        const url = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url) {
            return res.status(500).json({
                success: false,
                step: "environment",
                message: "SUPABASE_URL is missing"
            });
        }

        if (!serviceKey) {
            return res.status(500).json({
                success: false,
                step: "environment",
                message: "SUPABASE_SERVICE_ROLE_KEY is missing"
            });
        }

        const supabase = createClient(url, serviceKey);

        const testKey =
            "TEST-" +
            Math.random().toString(36).substring(2, 10).toUpperCase();

        const { data, error } = await supabase
            .from("keys")
            .insert({
                keys: testKey,
                active: true
            })
            .select("id, keys, active")
            .single();

        if (error) {
            console.error("SUPABASE ERROR:", error);

            return res.status(500).json({
                success: false,
                step: "supabase",
                message: error.message,
                code: error.code
            });
        }

        return res.status(200).json({
            success: true,
            step: "insert",
            data
        });

    } catch (error) {
        console.error("FUNCTION ERROR:", error);

        return res.status(500).json({
            success: false,
            step: "function",
            message: error.message
        });
    }
};
