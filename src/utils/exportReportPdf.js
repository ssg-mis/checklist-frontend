import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getReportSummaryApi, getReportDetailApi } from "../redux/api/dashboardApi";

const COLORS = {
  navy: [30, 41, 59],
  green: [22, 101, 52],
  greenBg: [220, 252, 231],
  red: [185, 28, 28],
  redBg: [254, 226, 226],
  gray: [107, 114, 128],
  headerBg: [30, 41, 59],
};

const formatDisplayDate = (isoDate) => {
  const [year, month, day] = isoDate.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-");
};

const drawStatCard = (doc, x, y, width, height, label, value, subLabel, bg, textColor) => {
  doc.setFillColor(...bg);
  doc.roundedRect(x, y, width, height, 1, 1, "F");
  doc.setTextColor(...textColor);
  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  doc.text(label.toUpperCase(), x + 4, y + 7);
  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text(String(value), x + 4, y + 16);
  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  doc.text(subLabel, x + 4, y + 22);
};

export async function exportDateRangeReport({ type, startDate, endDate }) {
  const [summary, detail] = await Promise.all([
    getReportSummaryApi(type, startDate, endDate),
    getReportDetailApi(type, startDate, endDate),
  ]);

  const typeLabel = type === "checklist" ? "Checklist" : "Delegation";
  const fromLabel = formatDisplayDate(startDate);
  const toLabel = formatDisplayDate(endDate);
  const rangeLabel = `${fromLabel} to ${toLabel}`;
  const generatedOn = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;

  // ---- Header ----
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(20);
  doc.setFont(undefined, "bold");
  doc.text(`${typeLabel} Report — ${rangeLabel}`, marginX, 18);

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.setTextColor(75, 85, 99);
  doc.text(`All ${type} tasks with start date from ${rangeLabel}`, marginX, 25);

  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Generated on ${generatedOn} · Filter: task start date within ${rangeLabel}`, marginX, 30);

  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.6);
  doc.line(marginX, 34, pageWidth - marginX, 34);

  // ---- Stat cards ----
  const { overview, users } = summary;
  const cardGap = 4;
  const cardWidth = (pageWidth - marginX * 2 - cardGap * 2) / 3;
  const cardY = 38;
  const cardHeight = 24;

  drawStatCard(
    doc, marginX, cardY, cardWidth, cardHeight,
    "Total Tasks", overview.totalTasks, "100%",
    COLORS.navy, [255, 255, 255]
  );
  drawStatCard(
    doc, marginX + cardWidth + cardGap, cardY, cardWidth, cardHeight,
    "Completed", overview.completedTasks,
    overview.totalTasks > 0 ? `${((overview.completedTasks / overview.totalTasks) * 100).toFixed(1)}% of total` : "0% of total",
    COLORS.green, [255, 255, 255]
  );
  drawStatCard(
    doc, marginX + (cardWidth + cardGap) * 2, cardY, cardWidth, cardHeight,
    "Total Pending", overview.pendingTasks,
    overview.totalTasks > 0 ? `${((overview.pendingTasks / overview.totalTasks) * 100).toFixed(1)}% of total` : "0% of total",
    COLORS.red, [255, 255, 255]
  );

  // ---- User-Wise Summary ----
  let cursorY = cardY + cardHeight + 10;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text(`User-Wise Summary (${rangeLabel})`, marginX, cursorY);
  cursorY += 4;

  const summaryBody = users.map((u, idx) => [
    idx + 1,
    u.name,
    u.totalTasks,
    u.completedTasks,
    u.pendingTasks,
    u.onTime,
    u.onTimePercent === null ? "-" : `${u.onTimePercent.toFixed(1)}%`,
    u.delayed,
    u.avgDelayDays === null ? "-" : u.avgDelayDays.toFixed(1),
    u.pendingTillDate,
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [[
      "#", "Name", "Total Tasks", "Completed", "Pending", "On-Time",
      "On-Time %", "Delayed", "Avg Delay (Days)", "Total Pending Till Date",
    ]],
    body: summaryBody,
    styles: { fontSize: 7.5, cellPadding: 1.8 },
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 8 },
      4: { halign: "center" },
      9: { halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      if (data.column.index === 4 && Number(data.cell.raw) > 0) {
        data.cell.styles.textColor = COLORS.red;
        data.cell.styles.fontStyle = "bold";
      }
      if (data.column.index === 6) {
        const raw = data.cell.raw;
        if (raw !== "-") {
          const pct = parseFloat(raw);
          data.cell.styles.textColor = pct >= 50 ? COLORS.green : COLORS.red;
          data.cell.styles.fontStyle = "bold";
        }
      }
      if (data.column.index === 9) {
        data.cell.styles.textColor = COLORS.red;
        data.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: marginX, right: marginX },
  });

  cursorY = doc.lastAutoTable.finalY + 3;
  doc.setFontSize(7);
  doc.setFont(undefined, "normal");
  doc.setTextColor(...COLORS.gray);
  const legendLine1 = `On-Time % = completed tasks submitted on/before their start date, as a share of completed tasks in ${rangeLabel}. Avg Delay = average days late, for tasks completed after their start date.`;
  const legendLine2 = `Total Pending Till Date = all-time pending tasks for that person (not limited to ${rangeLabel}), as of report generation.`;
  doc.text(legendLine1, marginX, cursorY, { maxWidth: pageWidth - marginX * 2 });
  doc.text(legendLine2, marginX, cursorY + 3.5, { maxWidth: pageWidth - marginX * 2 });

  // ---- Task-Wise Detail ----
  cursorY += 12;
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(`Task-Wise Detail (${rangeLabel})`, marginX, cursorY);
  cursorY += 4;

  const detailBody = detail.map((t, idx) => [
    idx + 1,
    t.task_id,
    t.department || "",
    t.given_by || "",
    t.assigned_to || "",
    t.task_description || "",
    t.frequency || "",
    t.start_date || "",
    t.submission_date || "",
    t.status,
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [[
      "#", "Task ID", "Department", "Given By", "Assigned To",
      "Task Description", "Frequency", "Start Date", "Submission Date", "Status",
    ]],
    body: detailBody,
    styles: { fontSize: 7, cellPadding: 1.6, overflow: "linebreak" },
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 8 },
      5: { cellWidth: "auto" },
    },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      if (data.column.index === 9) {
        data.cell.styles.textColor = data.cell.raw === "Completed" ? COLORS.green : COLORS.red;
        data.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: marginX, right: marginX },
  });

  const fileName = `${typeLabel}_Report_${startDate}_to_${endDate}.pdf`;
  doc.save(fileName);
}
