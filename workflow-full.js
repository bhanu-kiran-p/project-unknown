const LOG_DATA = {
  log1: "login OK user-bhanu src 192.168.1.50",
  log2: "proxy DENY src=10.4.0.2 dst=185.22.1.9 port=8080 reason=blacklist",
  log3: "login OK user- src 999.999.999.999",
  log4: "WAF_BLOCK rule=SQLI src=10.9.9.2 uri=/login",
  log5: "login OK user-asha src 10.0.0.5",
  log6: "login OK user- src"
};
// known = matches an existing pattern and passes validation
// unknown = no pattern matches yet -> goes through the AI recovery loop
// invalid = matches a pattern but fails post-normalization validation
const LOG_TYPES = ["known", "unknown", "invalid", "unknown", "known", "invalid"];

const STEP_DELAY = 2500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function populateLogs() {
  for (let i = 1; i <= 6; i++) {
    const input = document.getElementById(`log${i}`);
    if (input) input.value = LOG_DATA[`log${i}`];
    const badge = document.getElementById(`status${i}`);
    if (badge) {
      const t = LOG_TYPES[i - 1];
      badge.innerText = t;
      badge.className = `status-badge badge-${t}`;
    }
  }
}

const ALL_NODE_IDS = ["source", "ingestion", "rawlog", "broker", "normalization",
  "failedq", "alert-green", "common", "storing", "dashboard",
  "unknownq", "trigger", "drain3", "debert", "ollama", "alert-red", "pattern"];
const ALL_DIAMOND_IDS = ["decision", "valid", "autovalid"];
const ALL_LINE_IDS = ["l-source-ingestion", "l-ingestion-rawlog", "l-ingestion-broker", "l-broker-decision",
  "l-decision-unknown", "l-decision-normalization", "l-normalization-valid", "l-valid-failedq", "l-valid-common",
  "l-failedq-alert", "l-common-storing", "l-storing-dashboard", "l-unknownq-trigger", "l-trigger-drain3",
  "l-drain3-debert", "l-debert-ollama", "l-ollama-autovalid", "l-autovalid-red", "l-autovalid-pattern",
  "l-loop-decision", "l-loop-broker", "l-unknownq-loop"];
const BODY_IDS = ["drain3-body", "debert-body", "ollama-body", "pattern-body", "common-body", "alert-green-body", "alert-red-body"];
const BODY_DEFAULTS = {
  "drain3-body": "Extracts dynamic fields",
  "debert-body": "Identifies extracted fields",
  "ollama-body": "Creates new pattern"
};

function resetAll() {
  ALL_NODE_IDS.forEach((id) => document.getElementById(id)?.classList.remove("active", "error", "pending-ai"));
  ALL_DIAMOND_IDS.forEach((id) => document.getElementById(id)?.classList.remove("active", "error"));
  ALL_LINE_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) { el.classList.remove("lit"); el.setAttribute("marker-end", "url(#arrow)"); }
  });
  BODY_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerText = BODY_DEFAULTS[id] || "";
  });
}

function lightNode(id, cls = "active") {
  document.getElementById(id)?.classList.add(cls);
}
function litLine(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("lit");
  el.setAttribute("marker-end", "url(#arrow-lit)");
}
function setBody(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

async function runStep(step) {
  if (step.line) litLine(step.line);
  if (step.node) lightNode(step.node, step.cls || "active");
  if (step.body) setBody(step.body, step.text);
  await sleep(STEP_DELAY);
}

function parseLog(raw) {
  const userMatch = raw.match(/user-(\w*)/);
  const ipMatch = raw.match(/src[= ]([\d.]+)/);
  return { user: userMatch ? userMatch[1] : "?", src_ip: ipMatch ? ipMatch[1] : "?" };
}

async function runKnown(raw) {
  const fields = parseLog(raw);
  await runStep({ line: "l-source-ingestion", node: "source" });
  await runStep({ line: "l-ingestion-rawlog", node: "ingestion" });
  lightNode("rawlog");
  await runStep({ line: "l-ingestion-broker" });
  await runStep({ line: "l-broker-decision", node: "broker" });
  await runStep({ line: "l-decision-normalization", node: "decision" });
  await runStep({ line: "l-normalization-valid", node: "normalization" });
  await runStep({ node: "valid" });
  await runStep({
    line: "l-valid-common", node: "common",
    body: "common-body",
    text: JSON.stringify({ class: "Authentication", actor: { user: { name: fields.user } }, src_endpoint: { ip: fields.src_ip } }, null, 2)
  });
  await runStep({ line: "l-common-storing", node: "storing" });
  await runStep({ line: "l-storing-dashboard", node: "dashboard" });
}

async function runInvalid(raw) {
  await runStep({ line: "l-source-ingestion", node: "source" });
  await runStep({ line: "l-ingestion-rawlog", node: "ingestion" });
  lightNode("rawlog");
  await runStep({ line: "l-ingestion-broker" });
  await runStep({ line: "l-broker-decision", node: "broker" });
  await runStep({ line: "l-decision-normalization", node: "decision" });
  await runStep({ line: "l-normalization-valid", node: "normalization" });
  await runStep({ node: "valid", cls: "error" });
  await runStep({
    line: "l-valid-failedq", node: "failedq",
  });
  await runStep({
    line: "l-failedq-alert", node: "alert-green",
    body: "alert-green-body", text: "Schema validation failed - fields missing or malformed. Routed to failed DLQ."
  });
}

async function runUnknown(raw) {
  await runStep({ line: "l-source-ingestion", node: "source" });
  await runStep({ line: "l-ingestion-rawlog", node: "ingestion" });
  lightNode("rawlog");
  await runStep({ line: "l-ingestion-broker" });
  await runStep({ line: "l-broker-decision", node: "broker" });
  await runStep({ node: "decision", cls: "error" });
  await runStep({ line: "l-decision-unknown", node: "unknownq" });
  await runStep({ line: "l-unknownq-trigger", node: "trigger" });
  await runStep({
    line: "l-trigger-drain3", node: "drain3",
    body: "drain3-body", text: "Template: <*> src=<*> dst=<*>"
  });
  await runStep({
    line: "l-drain3-debert", node: "debert",
    body: "debert-body", text: "Predicted class: Network activity (confidence 0.91)"
  });
  await runStep({
    line: "l-debert-ollama", node: "ollama",
    body: "ollama-body", text: "regex: (?P<action>\\w+) src=(?P<src_ip>\\S+)"
  });
  await runStep({ line: "l-ollama-autovalid", node: "autovalid" });
  await runStep({
    line: "l-autovalid-pattern", node: "pattern",
    body: "pattern-body", text: "Sandbox match rate 0.93 - approved and added to registry"
  });

  litLine("l-loop-decision");
  await sleep(STEP_DELAY);
  litLine("l-loop-broker");
  litLine("l-unknownq-loop");
  await sleep(STEP_DELAY);
  
  lightNode("decision");
  document.getElementById("decision")?.classList.remove("error");
  await sleep(STEP_DELAY);

  await runStep({ line: "l-decision-normalization", node: "normalization" });
  await runStep({ node: "valid" });
  await runStep({
    line: "l-valid-common", node: "common",
    body: "common-body", text: "Reprocessed via fast path - pattern learned, no AI call needed next time."
  });
  await runStep({ line: "l-common-storing", node: "storing" });
  await runStep({ line: "l-storing-dashboard", node: "dashboard" });
}

document.addEventListener("DOMContentLoaded", () => {
  populateLogs();
  const runBtn = document.getElementById("run-btn");
  if (!runBtn) return;

  runBtn.addEventListener("click", async () => {
    const input = document.getElementById("select-log");
    const n = input ? parseInt(input.value, 10) : null;
    if (!n || n < 1 || n > 6) {
      alert("Please select a valid log number (1-6).");
      return;
    }
    resetAll();
    const raw = LOG_DATA[`log${n}`];
    const type = LOG_TYPES[n - 1];
    runBtn.disabled = true;
    if (type === "known") await runKnown(raw);
    else if (type === "invalid") await runInvalid(raw);
    else await runUnknown(raw);
    runBtn.disabled = false;
  });
});
