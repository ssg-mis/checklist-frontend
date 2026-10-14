import jsPDF from "jspdf";
import { getPendingDelegationReportApi } from "../redux/api/dashboardApi";

const COLORS = {
  navy: [30, 41, 59],
  slate: [51, 65, 85],
  red: [185, 28, 28],
  amber: [180, 83, 9],
  amberDark: [120, 53, 15],
  gray: [107, 114, 128],
};

function buildUserSummary(tasks) {
  const byName = new Map();
  for (const t of tasks) {
    const names = (t.assigned_to || "").split(",").map((n) => n.trim()).filter(Boolean);
    const nameList = names.length > 0 ? names : [t.assigned_to || "Unknown"];
    for (const name of nameList) {
      if (!byName.has(name)) byName.set(name, { name, pendingTasks: 0, totalExtends: 0 });
      const entry = byName.get(name);
      entry.pendingTasks += 1;
      entry.totalExtends += Number(t.times_extended) || 0;
    }
  }
  return Array.from(byName.values()).sort((a, b) => b.pendingTasks - a.pendingTasks);
}

function drawStatCard(doc, x, y, width, height, label, value, subLabel, bg) {
  doc.setFillColor(...bg);
  doc.roundedRect(x, y, width, height, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont(undefined, "normal");
  doc.text(label.toUpperCase(), x + 3.5, y + 6.5);
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text(String(value), x + 3.5, y + 14);
  doc.setFontSize(7);
  doc.setFont(undefined, "normal");
  doc.text(subLabel, x + 3.5, y + 19.5);
}

export async function exportPendingDelegationReport() {
  const tasks = await getPendingDelegationReportApi();
  const users = buildUserSummary(tasks);
  const totalExtends = tasks.reduce((sum, t) => sum + (Number(t.times_extended) || 0), 0);
  const generatedOn = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-");

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const bottomLimit = pageHeight - 14;
  const contentWidth = pageWidth - marginX * 2;

  let y = 0;

  function newPage() {
    doc.addPage("a4", "portrait");
    return 16;
  }

  function ensureSpace(needed) {
    if (y + needed > bottomLimit) {
      y = newPage();
    }
  }

  function drawWrapped(text, x, width, size, font, color, lineHeight) {
    doc.setFontSize(size);
    doc.setFont(undefined, font);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, width);
    for (const line of lines) {
      if (y + lineHeight > bottomLimit) {
        y = newPage();
        doc.setFontSize(size);
        doc.setFont(undefined, font);
        doc.setTextColor(...color);
      }
      doc.text(line, x, y);
      y += lineHeight;
    }
  }

  // ---- Header ----
  y = 18;
  doc.setTextColor(...COLORS.navy);
  doc.setFontSize(17);
  doc.setFont(undefined, "bold");
  doc.text("Delegation Report — Pending Tasks", marginX, y);
  y += 7;

  doc.setFontSize(9.5);
  doc.setFont(undefined, "normal");
  doc.setTextColor(75, 85, 99);
  doc.text("All delegation tasks currently pending, as of report generation", marginX, y);
  y += 5;

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Generated on ${generatedOn} · No date filter applied (current snapshot)`, marginX, y);
  y += 4;

  doc.setDrawColor(...COLORS.navy);
  doc.setLineWidth(0.5);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 5;

  // ---- Stat cards ----
  const cardGap = 4;
  const cardWidth = (contentWidth - cardGap * 2) / 3;
  const cardHeight = 21;

  drawStatCard(doc, marginX, y, cardWidth, cardHeight, "Total Pending", tasks.length, "as of today", COLORS.red);
  drawStatCard(doc, marginX + cardWidth + cardGap, y, cardWidth, cardHeight, "Total Extends", totalExtends, "on these pending tasks", COLORS.amber);
  drawStatCard(doc, marginX + (cardWidth + cardGap) * 2, y, cardWidth, cardHeight, "People Involved", users.length, "with pending tasks", COLORS.navy);
  y += cardHeight + 8;

  // ---- User-Wise Summary (grouped cards per task) ----
  doc.setFontSize(12.5);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...COLORS.navy);
  doc.text("User-Wise Summary", marginX, y);
  y += 7;

  const tasksByUser = new Map();
  for (const t of tasks) {
    const names = (t.assigned_to || "").split(",").map((n) => n.trim()).filter(Boolean);
    const nameList = names.length > 0 ? names : [t.assigned_to || "Unknown"];
    for (const name of nameList) {
      if (!tasksByUser.has(name)) tasksByUser.set(name, []);
      tasksByUser.get(name).push(t);
    }
  }

  for (const u of users) {
    ensureSpace(14);

    doc.setFillColor(241, 245, 249);
    doc.rect(marginX, y - 4.5, contentWidth, 7, "F");
    doc.setFontSize(10.5);
    doc.setFont(undefined, "bold");
    doc.setTextColor(...COLORS.navy);
    doc.text(u.name, marginX + 2, y);

    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.setTextColor(...COLORS.gray);
    doc.text(`Pending: ${u.pendingTasks}    Extends: ${u.totalExtends}`, pageWidth - marginX - 2, y, { align: "right" });
    y += 6.5;

    const userTasks = tasksByUser.get(u.name) || [];
    for (const t of userTasks) {
      ensureSpace(10);

      // Meta line: Task ID | Status | Target | Submit | Extends
      doc.setFontSize(8.3);
      doc.setFont(undefined, "bold");
      doc.setTextColor(...COLORS.navy);
      let x = marginX + 2;
      const seg = (text, color, bold) => {
        doc.setFont(undefined, bold ? "bold" : "normal");
        doc.setTextColor(...color);
        doc.text(text, x, y);
        x += doc.getTextWidth(text);
      };
      seg(`Task #${t.task_id}`, COLORS.navy, true);
      seg("   Status: ", COLORS.gray, false);
      seg(t.status, t.status === "extend" ? COLORS.red : COLORS.gray, true);
      seg("   Target: ", COLORS.gray, false);
      seg(t.target_date || "-", COLORS.slate, false);
      seg("   Submit: ", COLORS.gray, false);
      seg(t.submit_date || "-", COLORS.slate, false);
      seg("   Extends: ", COLORS.gray, false);
      seg(String(t.times_extended), Number(t.times_extended) > 0 ? COLORS.amber : COLORS.gray, true);
      y += 4.6;

      // Task description
      doc.setFontSize(8);
      doc.setFont(undefined, "bold");
      doc.setTextColor(...COLORS.slate);
      ensureSpace(3.6);
      doc.text("Task:", marginX + 2, y);
      y += 3.6;
      drawWrapped(t.task_description || "-", marginX + 4, contentWidth - 4, 8, "normal", COLORS.slate, 3.6);
      y += 1;

      // Remarks
      const remarksText = t.remarks && t.remarks.trim() !== "" ? t.remarks.trim() : "-";
      doc.setFontSize(8);
      doc.setFont(undefined, "bold");
      doc.setTextColor(...COLORS.slate);
      ensureSpace(3.6);
      doc.text("Remarks:", marginX + 2, y);
      y += 3.6;
      drawWrapped(remarksText, marginX + 4, contentWidth - 4, 8, "normal", [71, 85, 105], 3.6);
      y += 1;

      // Admin Remarks (only if present)
      if (t.adminremarks && t.adminremarks.trim() !== "") {
        doc.setFontSize(8);
        doc.setFont(undefined, "bold");
        doc.setTextColor(...COLORS.amberDark);
        ensureSpace(3.6);
        doc.text("Admin Remarks:", marginX + 2, y);
        y += 3.6;
        drawWrapped(t.adminremarks.trim(), marginX + 4, contentWidth - 4, 8, "italic", COLORS.amberDark, 3.6);
        y += 1;
      }

      // Divider
      ensureSpace(4);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 5;
    }

    y += 2;
  }

  const generatedOnFile = new Date().toISOString().split("T")[0];
  doc.save(`Delegation_Report_Pending_Tasks_${generatedOnFile}.pdf`);
}
