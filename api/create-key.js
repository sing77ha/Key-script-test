export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    // ตรวจ Admin Secret
    if (
        req.headers.authorization !==
        `Bearer ${process.env.ADMIN_SECRET}`
    ) {
        return res.status(401).json({
            error: "Unauthorized"
        });
    }

    try {
        const body = req.body || {};

        const days = Math.max(
            1,
            Math.min(Number(body.days) || 1, 365)
        );

        const chars =
            "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        function randomPart() {
            let result = "";

            for (let i = 0; i < 5; i++) {
                result += chars[
                    Math.floor(
                        Math.random() * chars.length
                    )
                ];
            }

            return result;
        }

        const key =
            `ZH-${randomPart()}-${randomPart()}-${randomPart()}`;

        const expiresAt =
            new Date(
                Date.now() + days * 86400000
            ).toISOString();

        const response = await fetch(
            `${process.env.SUPABASE_URL}/rest/v1/keys`,
            {
                method: "POST",

                headers: {
                    apikey:
                        process.env.SUPABASE_SERVICE_ROLE_KEY,

                    Authorization:
                        `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,

                    "Content-Type":
                        "application/json",

                    Prefer:
                        "return=representation"
                },

                body: JSON.stringify({
                    key: key,
                    expires_at: expiresAt,
                    active: true
                })
            }
        );

        if (!response.ok) {
            return res.status(500).json({
                error: "Could not create key"
            });
        }

        return res.status(200).json({
            success: true,
            key: key,
            expiresAt: expiresAt
        });

    } catch (error) {

        return res.status(500).json({
            error: "Server error"
        });
    }
}
