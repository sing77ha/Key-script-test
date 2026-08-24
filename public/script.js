const claimButton = document.getElementById("claimButton");
const result = document.getElementById("result");

claimButton.addEventListener("click", async () => {
    claimButton.disabled = true;
    result.textContent = "กำลังสร้าง Key...";

    try {
        const response = await fetch("/api/create-key", {
            method: "POST"
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "สร้าง Key ไม่สำเร็จ");
        }

        result.textContent = `✅ Key: ${data.key}`;

    } catch (error) {
        console.error(error);
        result.textContent = "❌ สร้าง Key ไม่สำเร็จ";
    }

    claimButton.disabled = false;
});
