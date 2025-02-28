    document.addEventListener("DOMContentLoaded", function () {
        const passwordInput = document.querySelector("#floatingPassword");
        const togglePassword = document.querySelector("#togglePassword");
        const eyeIcon = togglePassword.querySelector("i");
        const rememberMeCheckbox = document.querySelector("#rememberMe");
        const emailInput = document.querySelector("#floatingInput");

        // Check local storage for remembered email
        if (localStorage.getItem("rememberedEmail")) {
            emailInput.value = localStorage.getItem("rememberedEmail");
            rememberMeCheckbox.checked = true;
        }

        togglePassword.addEventListener("click", function () {
            passwordInput.type = "text";
            eyeIcon.classList.remove("bi-eye");
            eyeIcon.classList.add("bi-eye-slash");
            
            setTimeout(() => {
                passwordInput.type = "password";
                eyeIcon.classList.remove("bi-eye-slash");
                eyeIcon.classList.add("bi-eye");
            }, 2000); // Revert after 2 seconds
        });

        document.getElementById("fundoo-login-form").addEventListener("submit", function (event) {
            event.preventDefault();
            const email = emailInput.value;
            const password = passwordInput.value;

            if (!email || !password) {
                alert("Please enter both email and password.");
                return;
            }

            if (rememberMeCheckbox.checked) {
                localStorage.setItem("rememberedEmail", email);
            } else {
                localStorage.removeItem("rememberedEmail");
            }

            fetch("http://localhost:3000/api/v1/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.token) {
                    localStorage.setItem("jwtToken", data.token);
                    alert("Login successful!");
                    window.location.href = "../pages/fundooDashboard.html";
                } else {
                    alert("Login failed: " + (data.error || "Invalid credentials"));
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert("Something went wrong. Please try again.");
            });
        });
    });
