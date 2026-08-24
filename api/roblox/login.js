const crypto = require("crypto");

module.exports = async (req, res) => {
    if (req.method !== "GET") {
        return res.status(405).send("Method Not Allowed");
    }

    const clientId = process.env.ROBLOX_CLIENT_ID;
    const redirectUri = process.env.ROBLOX_REDIRECT_URI;

    if (!clientId || !redirectUri) {
        return res.status(500).send(
            "Roblox OAuth environment variables are missing"
        );
    }

    const state = crypto.randomBytes(24).toString("hex");

    res.setHeader(
        "Set-Cookie",
        `roblox_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
    );

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid profile",
        state
    });

    res.redirect(
        `https://apis.roblox.com/oauth/v1/authorize?${params.toString()}`
    );
};
