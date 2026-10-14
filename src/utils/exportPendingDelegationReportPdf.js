import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getPendingDelegationReportApi } from "../redux/api/dashboardApi";

const COLORS = {
  navy: [30, 41, 59],
  red: [185, 28, 28],
  amber: [180, 83, 9],
  gray: [107, 114, 128],
  headerBg: [30, 41, 59],
  rowHeaderBg: [71, 85, 105],
};

function drawStatCard(doc, x, y, width, height, label, value, subLabel, bg) {
  doc.setFillColor(...bg);
  doc.roundedRect(x, y, width, height, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  doc.text(label.toUpperCase(), x + 4, y + 7);
  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text(String(value), x + 4, y + 16);
  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  doc.text(subLabel, x + 4, y + 22);
}

function buildUserSummary(tasks) {
  const byName = new Map();
  for (const t of tasks) {
    const names = (t.assigned_to || "")
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
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

export async function exportPendingDelegationReport() {
  const tasks = await getPendingDelegationReportApi();
  const users = buildUserSummary(tasks);
  const totalExtends = tasks.reduce((sum, t) => sum + (Number(t.times_extended) || 0), 0);
  const generatedOn = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-");

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 12;

  // ---- Header ----
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text("Delegation Report — Pending Tasks", marginX, 15);

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.setTextColor(75, 85, 99);
  doc.text("All delegation tasks currently pending, as of report generation", marginX, 21);

  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Generated on ${generatedOn} · No date filter applied (current snapshot)`, marginX, 26);

  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.6);
  doc.line(marginX, 29, pageWidth - marginX, 29);

  // ---- Stat cards ----
  const cardGap = 4;
  const cardWidth = (pageWidth - marginX * 2 - cardGap * 2) / 3;
  const cardY = 33;
  const cardHeight = 22;

  drawStatCard(doc, marginX, cardY, cardWidth, cardHeight, "Total Pending", tasks.length, "as of today", COLORS.red);
  drawStatCard(
    doc, marginX + cardWidth + cardGap, cardY, cardWidth, cardHeight,
    "Total Extends", totalExtends, "on these pending tasks", COLORS.amber
  );
  drawStatCard(
    doc, marginX + (cardWidth + cardGap) * 2, cardY, cardWidth, cardHeight,
    "People Involved", users.length, "with pending tasks", COLORS.navy
  );

  // ---- User-Wise Summary (grouped: each user's header + their own tasks) ----
  let cursorY = cardY + cardHeight + 9;
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("User-Wise Summary", marginX, cursorY);
  cursorY += 6;

  const tasksByUser = new Map();
  for (const t of tasks) {
    const names = (t.assigned_to || "")
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    const nameList = names.length > 0 ? names : [t.assigned_to || "Unknown"];
    for (const name of nameList) {
      if (!tasksByUser.has(name)) tasksByUser.set(name, []);
      tasksByUser.get(name).push(t);
    }
  }

  for (const u of users) {
    if (cursorY > pageHeight - 40) {
      doc.addPage("a4", "landscape");
      cursorY = 15;
    }

    doc.setFontSize(10.5);
    doc.setFont(undefined, "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(u.name, marginX, cursorY);

    doc.setFontSize(8.5);
    doc.setFont(undefined, "normal");
    doc.setTextColor(...COLORS.gray);
    doc.text(
      `Pending Tasks: ${u.pendingTasks}    Total Extends: ${u.totalExtends}`,
      marginX + 55, cursorY
    );
    cursorY += 3;

    const userTasks = tasksByUser.get(u.name) || [];
    const body = userTasks.map((t) => [
      t.task_id,
      t.task_description || "",
      t.remarks && t.remarks.trim() !== "" ? t.remarks : "-",
      t.status,
      t.target_date || "-",
      t.submit_date || "-",
      t.adminremarks && t.adminremarks.trim() !== "" ? t.adminremarks : "-",
      t.times_extended,
    ]);

    autoTable(doc, {
      startY: cursorY,
      head: [["Task ID", "Task", "Remarks", "Status", "Target Date", "Submit Date", "Admin Remarks", "Extends"]],
      body,
      styles: { fontSize: 7.3, cellPadding: 1.6, overflow: "linebreak", valign: "top" },
      headStyles: { fillColor: COLORS.rowHeaderBg, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 14 },
        1: { cellWidth: 48 },
        2: { cellWidth: 56 },
        3: { cellWidth: 15 },
        4: { cellWidth: 20 },
        5: { cellWidth: 18 },
        6: { cellWidth: 38 },
        7: { cellWidth: 16, halign: "center" },
      },
      didParseCell: (data) => {
        if (data.section !== "body") return;
        if (data.column.index === 3) {
          data.cell.styles.textColor = COLORS.red;
          data.cell.styles.fontStyle = "bold";
        }
        if (data.column.index === 7 && Number(data.cell.raw) > 0) {
          data.cell.styles.textColor = COLORS.amber;
          data.cell.styles.fontStyle = "bold";
        }
        if (data.column.index === 6 && data.cell.raw !== "-") {
          data.cell.styles.textColor = [120, 53, 15];
          data.cell.styles.fontStyle = "italic";
        }
      },
      margin: { left: marginX, right: marginX },
    });

    cursorY = doc.lastAutoTable.finalY + 7;
  }

  const generatedOnFile = new Date().toISOString().split("T")[0];
  doc.save(`Delegation_Report_Pending_Tasks_${generatedOnFile}.pdf`);
}
