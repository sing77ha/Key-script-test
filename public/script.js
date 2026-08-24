const claimButton = document.getElementById("claimButton");
const result = document.getElementById("result");

function showResult(message) {
    result.textContent = message;
    result.classList.remove("hidden");
}

claimButton.addEventListener("click", async () => {
    claimButton.disabled = true;
    claimButton.textContent = "⏳ Creating...";

    showResult("กำลังสร้าง Key...");

    try {
        const response = await fetch("/api/create-key", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-admin-secret": "YOUR_ADMIN_SECRET"
            }
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to create key");
        }

        showResult(`✅ Key ของคุณคือ: ${data.key}`);

    } catch (error) {
        console.error(error);

        showResult(
            "❌ ไม่สามารถสร้าง Key ได้ กรุณาลองใหม่"
        );

    } finally {
        claimButton.disabled = false;
        claimButton.textContent = "🔑 Claim Key";
    }
});
