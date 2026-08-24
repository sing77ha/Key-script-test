const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
    if (req.method !== "GET") {
        return res.status(405).send("Method Not Allowed");
    }

    const {
        code,
        state,
        error
    } = req.query;

    if (error) {
        return res.status(400).send(`Roblox OAuth error: ${error}`);
    }

    if (!code || !state) {
        return res.status(400).send("Missing OAuth code or state");
    }

    const cookies = req.headers.cookie || "";

    const stateCookie = cookies
        .split(";")
        .map(v => v.trim())
        .find(v => v.startsWith("roblox_oauth_state="));

    const savedState = stateCookie
        ? decodeURIComponent(stateCookie.split("=")[1])
        : null;

    if (!savedState || savedState !== state) {
        return res.status(403).send("Invalid OAuth state");
    }

    const clientId = process.env.ROBLOX_CLIENT_ID;
    const clientSecret = process.env.ROBLOX_CLIENT_SECRET;
    const redirectUri = process.env.ROBLOX_REDIRECT_URI;

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
        !clientId ||
        !clientSecret ||
        !redirectUri ||
        !supabaseUrl ||
        !serviceRoleKey
    ) {
        return res.status(500).send(
            "Required environment variables are missing"
        );
    }

    try {
        // แลก Authorization Code เป็น Access Token
        const tokenResponse = await fetch(
            "https://apis.roblox.com/oauth/v1/token",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    grant_type: "authorization_code",
                    code,
                    redirect_uri: redirectUri
                })
            }
        );

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok || !tokenData.access_token) {
            console.error("Roblox token error:", tokenData);

            return res.status(400).send(
                "Could not authenticate with Roblox"
            );
        }

        // ขอข้อมูล Roblox User
        const userResponse = await fetch(
            "https://apis.roblox.com/oauth/v1/userinfo",
            {
                headers: {
                    Authorization:
                        `Bearer ${tokenData.access_token}`
                }
            }
        );

        const userData = await userResponse.json();

        if (!userResponse.ok || !userData.sub) {
            console.error("Roblox userinfo error:", userData);

            return res.status(400).send(
                "Could not get Roblox account information"
            );
        }

        const robloxUserId = String(userData.sub);
        const robloxUsername =
            userData.preferred_username ||
            userData.name ||
            "";

        // สร้าง Session Token
        const sessionToken = crypto
            .randomBytes(32)
            .toString("hex");

        const expiresAt = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString();

        const supabase = createClient(
            supabaseUrl,
            serviceRoleKey
        );

        // บันทึก Session
        const { error: sessionError } = await supabase
            .from("roblox_sessions")
            .insert({
                session_token: sessionToken,
                roblox_user_id: robloxUserId,
                roblox_username: robloxUsername,
                expires_at: expiresAt
            });

        if (sessionError) {
            console.error("Session database error:", sessionError);

            return res.status(500).send(
                "Could not create login session"
            );
        }

        // ลบ OAuth state cookie
        res.setHeader("Set-Cookie", [
            "roblox_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
            `roblox_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`
        ]);

        // กลับไปหน้าเว็บ
        return res.redirect("/");
    } catch (err) {
        console.error("Roblox callback error:", err);

        return res.status(500).send(
            "Roblox authentication failed"
        );
    }
};
