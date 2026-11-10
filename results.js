
/* ===== FORMAT CURRENCY ===== */

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}


/* ===== PDF CURRENCY FORMAT ===== */

function formatPdfCurrency(value) {
  return "Rp " + Number(value).toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}


/* ===== BUILD AMORTIZATION SCHEDULE ===== */

function buildAmortizationSchedule(result) {
  const schedule = [];

  let remainingBalance = result.principal;

  // ===== MONTH 0: INITIAL LOAN =====
  schedule.push({
    month: 0,
    principalPayment: 0,
    interest: 0,
    annuity: 0,
    remainingBalance: remainingBalance
  });

  // ===== MONTH 1 UNTIL LAST MONTH =====
  for (
    let month = 1;
    month <= result.loanPeriod;
    month++
  ) {
    const interest =
      remainingBalance * result.monthlyRate;

    let principalPayment =
      result.monthlyPayment - interest;

    let annuity = result.monthlyPayment;

    if (month === result.loanPeriod) {
      principalPayment = remainingBalance;
      annuity = principalPayment + interest;
      remainingBalance = 0;
    } else {
      remainingBalance -= principalPayment;
    }

    if (Math.abs(remainingBalance) < 0.01) {
      remainingBalance = 0;
    }

    schedule.push({
      month: month,
      principalPayment: principalPayment,
      interest: interest,
      annuity: annuity,
      remainingBalance: Math.max(remainingBalance, 0)
    });
  }

  return schedule;
}

/* ===== DISPLAY ANNUITY RESULTS ===== */

function displayAnnuityResults() {
  const savedResult =
    localStorage.getItem("annuityResult");

  const resultsSection =
    document.querySelector(".results-section");

  if (!savedResult) {
    resultsSection.innerHTML = `
      <div class="no-result">
        <h2>No Calculation<br>
        Found 𐔌՞. .՞𐦯</h2>

        <p>Please calculate an annuity first.</p>

        <a
          href="#calculate"
          class="back-btn no-result-btn"
          data-page="calculate">
          Go To Calculator ꕤ
        </a>
      </div>
    `;

    return;
  }

  const result = JSON.parse(savedResult);

  /* ===== RESTORE RESULTS LAYOUT ===== */

  if (!document.querySelector("#amortization-body")) {
    resultsSection.innerHTML = `
      <div class="results-header">
        <h3>
          Here is your complete monthly payment schedule ૮₍ ´ ꒳ ₎ა
        </h3>
      </div>

      <div class="table-container">
        <table class="amortization-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Principal Payment (Rp)</th>
              <th>Interest Payment (Rp)</th>
              <th>Annuity (Rp)</th>
              <th>Remaining Balance (Rp)</th>
            </tr>
          </thead>

          <tbody id="amortization-body"></tbody>
        </table>
      </div>

      <div class="results-total">
        <div>
          <span>Total Payment</span>
          <strong id="result-total-payment">-</strong>
        </div>

        <div>
          <span>Total Interest</span>
          <strong id="result-total-interest">-</strong>
        </div>
      </div>

      <button
        type="button"
        class="download-pdf-btn"
        id="download-pdf">
        ↓ Download PDF
      </button>

      <a
        href="#calculate"
        class="back-btn"
        id="calculate-again"
        data-page="calculate">
        Calculate Again ꕤ
      </a>
    `;
  }

  /* ===== DISPLAY TOTALS ===== */

  document.querySelector(
    "#result-total-payment"
  ).textContent = formatCurrency(result.totalPayment);

  document.querySelector(
    "#result-total-interest"
  ).textContent = formatCurrency(result.totalInterest);

  /* ===== DISPLAY TABLE ===== */

  const tableBody =
    document.querySelector("#amortization-body");

  const schedule =
    buildAmortizationSchedule(result);

  tableBody.innerHTML = schedule.map(function (row) {
    return `
      <tr>
        <td>${row.month}</td>
        <td>${formatCurrency(row.principalPayment)}</td>
        <td>${formatCurrency(row.interest)}</td>
        <td>${formatCurrency(row.annuity)}</td>
        <td>${formatCurrency(row.remainingBalance)}</td>
      </tr>
    `;
  }).join("");
}


/* ===== DOWNLOAD PDF REPORT ===== */

function downloadAnnuityPDF() {
  const savedResult =
    localStorage.getItem("annuityResult");

  if (!savedResult) {
    showPopup(
      "OOPS!",
      "Please calculate an annuity first."
    );
    return;
  }

  if (
    !window.jspdf ||
    typeof window.jspdf.jsPDF !== "function"
  ) {
    showPopup(
      "PDF UNAVAILABLE",
      "Please check your internet connection and try again."
    );
    return;
  }

  const result = JSON.parse(savedResult);

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const pageWidth =
    doc.internal.pageSize.getWidth();

  const schedule =
    buildAmortizationSchedule(result);

  const today =
    new Date().toLocaleDateString("id-ID");

  /* ===== REPORT HEADER ===== */

  doc.setFillColor(111, 78, 55);
  doc.rect(0, 0, pageWidth, 35, "F");

  doc.setTextColor(255, 250, 245);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);

  doc.text(
    "ANNUITY CALCULATION REPORT",
    14,
    15
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text(
    "Annuity Calculator",
    14,
    23
  );

  doc.text(
    "Report date: " + today,
    pageWidth - 14,
    23,
    { align: "right" }
  );

  /* ===== LOAN INFORMATION ===== */

  doc.setTextColor(60, 45, 35);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);

  doc.text("LOAN INFORMATION", 14, 45);

  doc.autoTable({
    startY: 49,

    head: [[
      "Loan Amount",
      "Interest Rate",
      "Rate Period",
      "Loan Period",
      "Monthly Rate"
    ]],

    body: [[
      formatPdfCurrency(result.principal),
      result.rate + "%",
      result.ratePeriod + " month(s)",
      result.loanPeriod + " month(s)",
      (result.monthlyRate * 100).toLocaleString(
        "id-ID",
        { maximumFractionDigits: 6 }
      ) + "%"
    ]],

    theme: "grid",

    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 4,
      textColor: [60, 45, 35],
      lineColor: [230, 215, 205],
      lineWidth: 0.2
    },

    headStyles: {
      fillColor: [111, 78, 55],
      textColor: [255, 250, 245],
      fontStyle: "bold"
    },

    alternateRowStyles: {
      fillColor: [255, 250, 245]
    },

    margin: {
      left: 14,
      right: 14
    }
  });

  /* ===== PAYMENT SUMMARY ===== */

  let summaryY =
    doc.lastAutoTable.finalY + 12;

  if (summaryY > 165) {
    doc.addPage();
    summaryY = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(60, 45, 35);

  doc.text("PAYMENT SUMMARY", 14, summaryY);

  doc.autoTable({
    startY: summaryY + 4,

    head: [[
      "Total Payment",
      "Total Interest",
      "Principal Amount"
    ]],

    body: [[
      formatPdfCurrency(result.totalPayment),
      formatPdfCurrency(result.totalInterest),
      formatPdfCurrency(result.principal)
    ]],

    theme: "grid",

    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 5,
      textColor: [60, 45, 35],
      lineColor: [230, 215, 205],
      lineWidth: 0.2
    },

    headStyles: {
      fillColor: [247, 218, 217],
      textColor: [78, 53, 38],
      fontStyle: "bold"
    },

    margin: {
      left: 14,
      right: 14
    }
  });

  /* ===== MONTHLY PAYMENT SCHEDULE ===== */

  let scheduleY =
    doc.lastAutoTable.finalY + 12;

  if (scheduleY > 175) {
    doc.addPage();
    scheduleY = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(60, 45, 35);

  doc.text(
    "MONTHLY AMORTIZATION SCHEDULE",
    14,
    scheduleY
  );

  const tableRows = schedule.map(function (row) {
    return [
      String(row.month),
      formatPdfCurrency(row.principalPayment),
      formatPdfCurrency(row.interest),
      formatPdfCurrency(row.annuity),
      formatPdfCurrency(row.remainingBalance)
    ];
  });

  doc.autoTable({
    startY: scheduleY + 5,

    head: [[
      "Month",
      "Principal Payment",
      "Interest Payment",
      "Annuity Payment",
      "Remaining Balance"
    ]],

    body: tableRows,

    theme: "grid",

    showHead: "everyPage",

    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [60, 45, 35],
      lineColor: [230, 215, 205],
      lineWidth: 0.15,
      overflow: "linebreak"
    },

    headStyles: {
      fillColor: [111, 78, 55],
      textColor: [255, 250, 245],
      fontStyle: "bold",
      halign: "center"
    },

    alternateRowStyles: {
      fillColor: [255, 250, 245]
    },

    columnStyles: {
      0: { halign: "center", cellWidth: 18 },
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" }
    },

    margin: {
      top: 15,
      left: 14,
      right: 14,
      bottom: 18
    }
  });

  /* ===== PAGE NUMBERS ===== */

  const pageCount =
    doc.internal.getNumberOfPages();

  for (
    let page = 1;
    page <= pageCount;
    page++
  ) {
    doc.setPage(page);

    const pageHeight =
      doc.internal.pageSize.getHeight();

    doc.setDrawColor(230, 215, 205);
    doc.line(
      14,
      pageHeight - 12,
      pageWidth - 14,
      pageHeight - 12
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(130, 110, 95);

    doc.text(
      "Annuity Calculator",
      14,
      pageHeight - 7
    );

    doc.text(
      "Page " + page + " of " + pageCount,
      pageWidth - 14,
      pageHeight - 7,
      { align: "right" }
    );
  }

  /* ===== SAVE FILE ===== */

  doc.save("Annuity-Calculation-Report.pdf");
}


/* ===== DOWNLOAD BUTTON EVENT ===== */

document.addEventListener("click", function (event) {
  const downloadButton =
    event.target.closest("#download-pdf");

  if (!downloadButton) return;

  downloadAnnuityPDF();
});


/* ===== CALCULATE AGAIN: RESET EVERYTHING ===== */

document.addEventListener("click", function (event) {
  const calculateAgain =
    event.target.closest("#calculate-again");

  if (!calculateAgain) return;

  event.preventDefault();

  localStorage.removeItem("annuityResult");

  document.querySelector("#principal").value = "";
  document.querySelector("#rate").value = "";
  document.querySelector("#period").value = "";

  document.querySelector("#rate-period").selectedIndex = 0;

  displayAnnuityResults();

  showPage("calculate");

  history.replaceState(null, "", "#calculate");
});


/* ===== INITIAL RESULTS ===== */

displayAnnuityResults();
