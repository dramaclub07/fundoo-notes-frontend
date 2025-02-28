document.addEventListener("DOMContentLoaded", () => {
    const emailInput = document.getElementById("emailInput");
    const sendOtpBtn = document.getElementById("sendOtpBtn");
    const emailError = document.getElementById("emailError");
    const emailSuccess = document.getElementById("emailSuccess");

    const otpInput = document.getElementById("otpInput");
    const verifyOtpBtn = document.getElementById("verifyOtpBtn");
    const otpError = document.getElementById("otpError");
    const otpSuccess = document.getElementById("otpSuccess");

    const newPassword = document.getElementById("newPassword");
    const confirmPassword = document.getElementById("confirmPassword");
    const resetPasswordBtn = document.getElementById("resetPasswordBtn");
    const passwordError = document.getElementById("passwordError");
    const passwordSuccess = document.getElementById("passwordSuccess");

    const step1 = document.getElementById("step1");
    const step2 = document.getElementById("step2");
    const step3 = document.getElementById("step3");

    let userEmail = "";
    let userId = null; // Store userId from verification

    // Step 1: Send OTP
    sendOtpBtn.addEventListener("click", async () => {
        const email = emailInput.value.trim();
        if (!validateEmail(email)) {
            emailError.textContent = "Invalid email format!";
            emailError.style.display = "block";
            return;
        }

        emailError.style.display = "none";
        sendOtpBtn.disabled = true;
        sendOtpBtn.textContent = "Sending...";

        try {
            const response = await fetch("http://localhost:3000/api/v1/forgetpassword", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user: { email } }),
            });
            const data = await response.json();
            console.log("API Response (Send OTP):", data);

            if (data.success === true) {
                userEmail = email;
                emailSuccess.textContent = data.message || "OTP is being processed and will be sent shortly.";
                emailSuccess.style.display = "block";
                sendOtpBtn.textContent = "OTP Sent";
                setTimeout(() => {
                    step1.style.display = "none";
                    step2.style.display = "block";
                }, 1000);
            } else {
                emailError.textContent = data.errors || "Failed to send OTP.";
                emailError.style.display = "block";
                sendOtpBtn.disabled = false;
                sendOtpBtn.textContent = "Send OTP";
            }
        } catch (error) {
            emailError.textContent = "Server error. Please try again.";
            emailError.style.display = "block";
            sendOtpBtn.disabled = false;
            sendOtpBtn.textContent = "Send OTP";
            console.error("Error sending OTP:", error);
        }
    });

    // Step 2: Verify OTP
    verifyOtpBtn.addEventListener("click", async () => {
        const otp = otpInput.value.trim();
        if (!otp) {
            otpError.textContent = "Please enter the OTP.";
            otpError.style.display = "block";
            return;
        }

        otpError.style.display = "none";
        verifyOtpBtn.disabled = true;
        verifyOtpBtn.textContent = "Verifying...";

        try {
            const response = await fetch("http://localhost:3000/api/v1/verify_otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: userEmail, otp }),
            });
            const data = await response.json();
            console.log("API Response (Verify OTP):", data);

            if (data.success === true) {
                otpSuccess.textContent = data.message || "OTP Verified!";
                otpSuccess.style.display = "block";
                userId = data.user.id; // Store userId from verification response
                setTimeout(() => {
                    step2.style.display = "none";
                    step3.style.display = "block";
                }, 1000);
            } else {
                otpError.textContent = data.errors || "Invalid or expired OTP.";
                otpError.style.display = "block";
                verifyOtpBtn.disabled = false;
                verifyOtpBtn.textContent = "Verify OTP";
            }
        } catch (error) {
            otpError.textContent = "Server error. Please try again.";
            otpError.style.display = "block";
            verifyOtpBtn.disabled = false;
            verifyOtpBtn.textContent = "Verify OTP";
            console.error("Error verifying OTP:", error);
        }
    });

    // Step 3: Reset Password
    resetPasswordBtn.addEventListener("click", async () => {
        const newPass = newPassword.value.trim();
        const confirmPass = confirmPassword.value.trim();

        if (newPass.length < 8) {
            passwordError.textContent = "Password must be at least 8 characters.";
            passwordError.style.display = "block";
            return;
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}/.test(newPass)) {
            passwordError.textContent = "Password must include lowercase, uppercase, number, and special character.";
            passwordError.style.display = "block";
            return;
        }
        if (newPass !== confirmPass) {
            passwordError.textContent = "Passwords do not match.";
            passwordError.style.display = "block";
            return;
        }

        passwordError.style.display = "none";
        resetPasswordBtn.disabled = true;
        resetPasswordBtn.textContent = "Resetting...";

        try {
            if (!userId) {
                throw new Error("User ID not available. Please verify OTP again.");
            }

            // Reset password using the stored userId
            const response = await fetch(`http://localhost:3000/api/v1/resetpassword/${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ otp: otpInput.value.trim(), new_password: newPass }),
            });
            const data = await response.json();
            console.log("API Response (Reset Password):", data);

            if (data.success === true) {
                passwordSuccess.textContent = data.message || "Password reset successfully!";
                passwordSuccess.style.display = "block";
                resetPasswordBtn.textContent = "Reset Done";
                setTimeout(() => {
                    window.location.href = "fundooLogin.html";
                }, 1500);
            } else {
                passwordError.textContent = data.errors || "Failed to reset password.";
                passwordError.style.display = "block";
                resetPasswordBtn.disabled = false;
                resetPasswordBtn.textContent = "Reset Password";
            }
        } catch (error) {
            passwordError.textContent = `Server error or invalid user data. Please try again. Details: ${error.message}`;
            passwordError.style.display = "block";
            resetPasswordBtn.disabled = false;
            resetPasswordBtn.textContent = "Reset Password";
            console.error("Error resetting password:", error);
        }
    });

    // Helper function to validate email
    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
});