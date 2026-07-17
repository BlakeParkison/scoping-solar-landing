const PRIVATE_BETA_VERSION = "0.12.0-cross-device-confirmation-r2";
const PRIVATE_BETA_SIGNUP_ENDPOINT = "/api/trial/signup";

function privateBetaRequestId() {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
  return `signup_${random}`.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 160);
}

function privateBetaValue(form, name) {
  return String(form.elements.namedItem(name)?.value || "").trim();
}

const privateBetaForm = document.getElementById("privateBetaSignupForm");
if (privateBetaForm) {
  const status = document.getElementById("privateBetaStatus");
  const submit = document.getElementById("privateBetaSubmit");
  const verification = document.getElementById("privateBetaVerification");
  const accessCodeField = privateBetaForm.elements.namedItem("privateBetaAccessCode");
  const passwordField = privateBetaForm.elements.namedItem("password");
  const confirmPasswordField = privateBetaForm.elements.namedItem("confirmPassword");
  let submitting = false;

  const showVerificationStage = () => {
    if (accessCodeField) accessCodeField.value = "";
    if (passwordField) passwordField.value = "";
    if (confirmPasswordField) confirmPasswordField.value = "";
    privateBetaForm.hidden = true;
    verification.hidden = false;
    verification.focus?.();
  };

  if (new URLSearchParams(window.location.search).get("stage") === "verify") {
    showVerificationStage();
  }

  privateBetaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting || !privateBetaForm.reportValidity()) return;

    const password = String(passwordField?.value || "");
    const confirmPassword = String(confirmPasswordField?.value || "");
    if (password !== confirmPassword) {
      if (status) status.textContent = "Password confirmation does not match.";
      confirmPasswordField?.focus();
      return;
    }

    const request = {
      privateBetaAccessCode: String(accessCodeField?.value || "").trim(),
      firstName: privateBetaValue(privateBetaForm, "firstName"),
      lastName: privateBetaValue(privateBetaForm, "lastName"),
      companyName: privateBetaValue(privateBetaForm, "companyName"),
      email: privateBetaValue(privateBetaForm, "email").toLowerCase(),
      password,
      termsAccepted: privateBetaForm.elements.namedItem("termsAccepted")?.checked === true,
      privacyAccepted: privateBetaForm.elements.namedItem("privacyAccepted")?.checked === true,
      idempotencyKey: privateBetaRequestId()
    };
    if (accessCodeField) accessCodeField.value = "";

    submitting = true;
    submit.disabled = true;
    if (status) status.textContent = "Starting your private beta request...";
    try {
      const requestBody = JSON.stringify(request);
      request.privateBetaAccessCode = "";
      request.password = "";
      const response = await fetch(PRIVATE_BETA_SIGNUP_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: requestBody
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || "Unable to start the private beta trial. Check your invitation details and try again.");
      if (passwordField) passwordField.value = "";
      if (confirmPasswordField) confirmPasswordField.value = "";
      showVerificationStage();
      history.replaceState(null, document.title, "/start-free-trial?stage=verify");
    } catch (error) {
      if (passwordField) passwordField.value = "";
      if (confirmPasswordField) confirmPasswordField.value = "";
      if (status) status.textContent = error.message || "Unable to start the private beta trial. Check your invitation details and try again.";
      accessCodeField?.focus();
    } finally {
      submitting = false;
      submit.disabled = false;
    }
  });
}

void PRIVATE_BETA_VERSION;
