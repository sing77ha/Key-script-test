const claimButton = document.getElementById("claimButton");
const result = document.getElementById("result");

function showResult(message) {
    result.textContent = message;
    result.classList.remove("hidden");
}

claimButton.addEventListener("click", async () => {

    claimButton.disabled = true;
    claimButton.textContent = "⏳ Checking...";

    showResult("กำลังเตรียมระบบรับ Key...");

    try {

        /*
         * ขั้นตอนนี้เป็นหน้าเตรียมระบบ
         *
         * เราจะเชื่อมกับ /api/create-key
         * หลังจากตั้งค่า Supabase เสร็จ
         *
         * ไม่สร้าง Key ฝั่ง Browser
         * เพื่อไม่ให้ผู้ใช้แก้ JavaScript
         * แล้วสร้าง Key เองได้
         */

        await new Promise(resolve => setTimeout(resolve, 1000));

        showResult(
            "ระบบพร้อมแล้ว แต่ยังต้องตั้งค่า Key Database ก่อน"
        );

    } catch (error) {

        showResult(
            "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
        );

    } finally {

        claimButton.disabled = false;
        claimButton.textContent = "🔑 Claim Key";

    }
});
