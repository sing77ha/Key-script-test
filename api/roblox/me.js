const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            message: "Method Not Allowed"
        });
    }

    const cookies = req.headers.cookie || "";

    const sessionCookie = cookies
        .split(";")
        .map(v => v.trim())
        .find(v => v.startsWith("roblox_session="));

    if (!sessionCookie) {
        return res.status(401).json({
            success: false,
            loggedIn: false,
            message: "Not logged in"
        });
    }

    const sessionToken = decodeURIComponent(
        sessionCookie.substring("roblox_session=".length)
    );

    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
        .from("roblox_sessions")
        .select("roblox_user_id, roblox_username, expires_at")
        .eq("session_token", sessionToken)
        .maybeSingle();

    if (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Database error"
        });
    }

    if (!data) {
        return res.status(401).json({
            success: false,
            loggedIn: false,
            message: "Invalid session"
        });
    }

    if (new Date(data.expires_at) <= new Date()) {
        return res.status(401).json({
            success: false,
            loggedIn: false,
            message: "Session expired"
        });
    }

    return res.status(200).json({
        success: true,
        loggedIn: true,
        robloxUserId: data.roblox_user_id,
        username: data.roblox_username
    });
};
