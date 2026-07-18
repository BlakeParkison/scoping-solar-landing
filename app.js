const LANDING_VERSION = "0.12.0-private-beta-r1";
console.log(`Scoping Solar Landing v${LANDING_VERSION} loaded`);
const canvas = document.getElementById("heroCanvas");
const context = canvas.getContext("2d");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ACCESS_REQUEST_STORAGE = "scopingSolarAccessRequestsV1";

function sizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(canvas.offsetWidth * ratio);
  canvas.height = Math.floor(canvas.offsetHeight * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawScene(time = 0) {
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;
  context.clearRect(0, 0, width, height);

  const horizon = height * 0.58;
  context.fillStyle = "#07101d";
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(117, 215, 255, 0.12)";
  context.lineWidth = 1;
  for (let x = -80; x < width + 80; x += 88) {
    context.beginPath();
    context.moveTo(x, horizon);
    context.lineTo(x + width * 0.22, height);
    context.stroke();
  }
  for (let y = horizon; y < height + 60; y += 42) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y + (height - y) * 0.24);
    context.stroke();
  }

  const roofY = height * 0.72;
  context.fillStyle = "rgba(16, 35, 58, 0.88)";
  context.beginPath();
  context.moveTo(width * 0.46, roofY - 120);
  context.lineTo(width, roofY - 22);
  context.lineTo(width, height);
  context.lineTo(width * 0.28, height);
  context.closePath();
  context.fill();

  context.strokeStyle = "rgba(247, 183, 51, 0.34)";
  context.lineWidth = 2;
  for (let i = 0; i < 6; i += 1) {
    const y = roofY - 78 + i * 30;
    context.beginPath();
    context.moveTo(width * 0.52 + i * 16, y);
    context.lineTo(width * 0.98, y + 82);
    context.stroke();
  }

  context.strokeStyle = "rgba(66, 211, 146, 0.36)";
  context.lineWidth = 3;
  const pulse = prefersReducedMotion ? 0.5 : (Math.sin(time / 700) + 1) / 2;
  context.beginPath();
  context.moveTo(width * 0.58, roofY - 50);
  context.bezierCurveTo(width * 0.66, roofY - 150, width * 0.78, roofY - 90, width * 0.88, roofY - 176);
  context.stroke();

  context.fillStyle = `rgba(247, 183, 51, ${0.62 + pulse * 0.24})`;
  context.beginPath();
  context.arc(width * 0.88, roofY - 176, 7, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "rgba(117, 215, 255, 0.16)";
  context.fillRect(width * 0.63, roofY - 42, 154, 86);
  context.strokeStyle = "rgba(117, 215, 255, 0.34)";
  context.strokeRect(width * 0.63, roofY - 42, 154, 86);
}

function animate(time) {
  drawScene(time);
  if (!prefersReducedMotion) {
    requestAnimationFrame(animate);
  }
}

document.querySelectorAll("[data-scroll]").forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  });
});

function savedAccessRequests() {
  try {
    return JSON.parse(localStorage.getItem(ACCESS_REQUEST_STORAGE)) || [];
  } catch {
    return [];
  }
}

function saveAccessRequest(request) {
  const requests = savedAccessRequests();
  requests.unshift(request);
  localStorage.setItem(ACCESS_REQUEST_STORAGE, JSON.stringify(requests.slice(0, 50)));
}

function betaRequestMailto(request) {
  const body = [
    "New Scoping Solar beta access request:",
    "",
    `Name: ${request.name}`,
    `Company: ${request.company}`,
    `Email: ${request.email}`,
    `Role / Interest: ${request.role}`,
    "",
    "Message:",
    request.message || "(No message provided)",
    "",
    "Note: This was submitted from the static landing page placeholder form."
  ].join("\n");

  return `mailto:BlakeParkison@outlook.com?subject=${encodeURIComponent("Scoping Solar Beta Access Request")}&body=${encodeURIComponent(body)}`;
}

const accessForm = document.getElementById("accessRequestForm");
if (accessForm) {
  const status = document.getElementById("accessFormStatus");

  accessForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!accessForm.reportValidity()) return;

    const data = new FormData(accessForm);
    const request = {
      id: `request_${Date.now()}`,
      createdAt: new Date().toISOString(),
      name: String(data.get("name") || "").trim(),
      company: String(data.get("company") || "").trim(),
      email: String(data.get("email") || "").trim(),
      role: String(data.get("role") || "").trim(),
      message: String(data.get("message") || "").trim()
    };

    saveAccessRequest(request);
    if (status) {
      status.textContent = "Request captured locally for this browser and your email app should open next. App access is not granted automatically.";
    }

    window.location.href = betaRequestMailto(request);
    accessForm.reset();
  });
}

// Future backend integration: submit the request to an API, store it in a database,
// and expose an owner/admin approval queue before granting beta app access.
window.addEventListener("resize", () => {
  sizeCanvas();
  drawScene();
});

sizeCanvas();
animate(0);
