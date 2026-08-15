export default function invoiceHTML({ shop, bill }: any) {
  const items = Array.isArray(bill.items) ? bill.items : [];

  const ITEMS_PER_PAGE = 15;

  const subtotal = items.reduce(
    (sum: number, it: any) =>
      sum +
      Number(it.price || 0) * Number(it.qty || 0),
    0
  );

  const discount = Number(bill.discount || 0);
  const gst = Number(bill.gstAmount || 0);
  const shipping = Number(bill.shippingCharge || 0);
  const net = Number(bill.netAmount || 0);

  const discountPercent =
    subtotal > 0
      ? Number(((discount / subtotal) * 100).toFixed(2))
      : 0;

  function numberToWords(num: number) {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];

    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    function convert(n: number): string {
      if (n === 0) return "";

      if (n < 20) {
        return ones[n];
      }

      if (n < 100) {
        return (
          tens[Math.floor(n / 10)] +
          (n % 10 ? " " + ones[n % 10] : "")
        );
      }

      if (n < 1000) {
        return (
          ones[Math.floor(n / 100)] +
          " Hundred" +
          (n % 100 ? " " + convert(n % 100) : "")
        );
      }

      if (n < 100000) {
        return (
          convert(Math.floor(n / 1000)) +
          " Thousand" +
          (n % 1000 ? " " + convert(n % 1000) : "")
        );
      }

      if (n < 10000000) {
        return (
          convert(Math.floor(n / 100000)) +
          " Lakh" +
          (n % 100000 ? " " + convert(n % 100000) : "")
        );
      }

      return "";
    }

    return convert(Math.floor(num)) + " Rupees Only";
  }

  const amountWords = numberToWords(net);
  const pages: any[][] = [];

  for (
    let i = 0;
    i < items.length;
    i += ITEMS_PER_PAGE
  ) {
    pages.push(items.slice(i, i + ITEMS_PER_PAGE));
  }

  // Make sure at least one page exists.
  if (pages.length === 0) {
    pages.push([]);
  }

  // ==============================
  // HEADER
  // ==============================

  function header() {
    return `
      <div class="top">
        <div class="shop">${shop.name}</div>

        <div class="tag">
          Luxury Jewellery Showroom
        </div>

        <div class="gst">
          GSTIN : ${shop.gst}
        </div>

        <div class="contact">
          <div>📍 ${shop.address}</div>
          <div>📞 ${shop.phone}</div>
          <div>✉️ ${shop.email}</div>
        </div>
      </div>

      <div class="invoice">
        <h5>INVOICE</h5>
      </div>

      <div class="flex">

        <div class="box">
          <div class="title">Bill To</div>

          <div>
            <b>Customer:</b>
            ${bill.customerName || "Walk-in"}
          </div>

          <div>
            <b>Phone:</b>
            ${bill.customerPhone || "—"}
          </div>

          <div class="addressRow">
          <b>Address:</b>
          <span>
            ${String(bill.customerAddress || "—").replace(
              /Uttar Pradesh/gi,
              "Uttar\u00A0Pradesh"
            )}
          </span>
        </div>

          <div>
            <b>Pincode:</b>
            ${bill.customerPincode || "—"}
          </div>
        </div>

        <div class="box">

          <div class="title">
            Invoice Details
          </div>

          <div>
            <b>Invoice:</b>
            ${bill.invoiceNo || "—"}
          </div>

          <div>
            <b>Bill:</b>
            ${bill.billNo || "—"}
          </div>

          <div>
            <b>Date:</b>
            ${
              bill.created_at
                ? new Date(
                    bill.created_at
                  ).toLocaleString("en-IN")
                : "—"
            }
          </div>

          <div>
            <b>Status:</b>
            Accepted
          </div>

        </div>

      </div>
    `;
  }

  // ==============================
  // FOOTER
  // ==============================

  function footer(
    pageNo: number,
    totalPages: number
  ) {
    return `
      <div class="pageFooter">

        <div class="footerLeft">
          🌐 Website Here
        </div>

        <div class="footerCenter">
          Page ${pageNo} of ${totalPages}
        </div>

        <div class="footerRight">
          Authorised Signatory
        </div>

      </div>
    `;
  }

  // ==============================
  // GENERATE PAGES
  // ==============================

  const htmlPages = pages
    .map(
      (pageItems: any[], pageIndex: number) => {

        const rows = pageItems
          .map(
            (it: any, i: number) => {

              const itemAmount =
                Number(it.price || 0) *
                Number(it.qty || 0);

              const category =
                String(it.category || "").trim();

              const hsn =
                String(it.hsnCode || "").trim();

              const finalHsn =
                hsn ||
                (
                  category
                    .toLowerCase()
                    .includes("1gram")
                    ? "7117"
                    : "7113"
                );

              return `
                <tr>

                  <td class="serial">
                    ${pageIndex * ITEMS_PER_PAGE + i + 1}
                  </td>

                  <td class="itemName">
                    ${it.name || "—"}
                  </td>

                  <td>
                    ${category || "—"}
                  </td>

                  <td>
                    ${finalHsn}
                  </td>

                  <td>
                    ${Number(it.qty || 0)}
                  </td>

                  <td class="money">
                    ₹${Number(it.price || 0).toFixed(2)}
                  </td>

                  <td class="money">
                    ₹${itemAmount.toFixed(2)}
                  </td>

                </tr>
              `;
            }
          )
          .join("");

        const lastPage =
          pageIndex === pages.length - 1;

        return `
          <div class="page">

            ${header()}

            <table>

              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>ITEM</th>
                  <th>CATEGORY</th>
                  <th>HSN/SAC</th>
                  <th>QTY</th>
                  <th>PRICE</th>
                  <th>AMOUNT</th>
                </tr>
              </thead>

              <tbody>
                ${
                  rows ||
                  `
                    <tr>
                      <td colspan="7">
                        No items
                      </td>
                    </tr>
                  `
                }
              </tbody>

            </table>

            ${
              lastPage
                ? `
                  <div class="summary">

                    <div class="words">

                      <h3>
                        Amount In Words
                      </h3>

                      <div class="amountWords">
                        ${amountWords}
                      </div>

                    </div>

                    <div class="totals">

                      <div class="totalRow">
                        <span>Subtotal</span>
                        <strong>
                          ₹${subtotal.toFixed(2)}
                        </strong>
                      </div>

                      ${
                        discount > 0
                          ? `
                            <div class="totalRow discountRow">
                              <span>
                                Discount
                                (${discountPercent}% OFF)
                              </span>

                              <strong>
                                -₹${discount.toFixed(2)}
                              </strong>
                            </div>
                          `
                          : `
                            <div class="totalRow">
                              <span>
                                Discount
                              </span>

                              <strong>
                                ₹0.00
                              </strong>
                            </div>
                          `
                      }

                      <div class="totalRow">
                        <span>GST</span>
                        <strong>
                          ₹${gst.toFixed(2)}
                        </strong>
                      </div>

                      <div class="totalRow">
                        <span>Shipping</span>
                        <strong>
                          ₹${shipping.toFixed(2)}
                        </strong>
                      </div>

                      <div class="netRow">
                        <span>Net Amount</span>
                        <strong>
                          ₹${net.toFixed(2)}
                        </strong>
                      </div>

                    </div>

                  </div>

                  <div class="thank">
                    Thank You For Your Business
                  </div>

                  <div class="footerArea">

                    <div class="footerCard">

                      <div class="footerTitle">
                        Terms & Conditions
                      </div>

                      <div class="footerItem">
                        • Goods once sold will not be taken back
                      </div>

                      <div class="footerItem">
                        • No exchange policy applicable
                      </div>

                      <div class="footerItem">
                        • Disputes subject to Maharajganj jurisdiction
                      </div>

                    </div>

                    <div class="footerCard">

                      <div class="footerTitle">
                        Payment Information
                      </div>

                      <div class="footerItem">
                        Branch : ${shop.bankBranch}
                      </div>

                      <div class="footerItem">
                        Bank : ${shop.bankName}
                      </div>

                      <div class="footerItem">
                        A/C : ${shop.bankAccount}
                      </div>

                      <div class="footerItem">
                        IFSC : ${shop.ifsc}
                      </div>

                    </div>

                  </div>
                `
                : ""
            }

            ${footer(
              pageIndex + 1,
              pages.length
            )}

          </div>
        `;
      }
    )
    .join("");

  // ==============================
  // FINAL HTML
  // ==============================

  return `
    <!DOCTYPE html>

    <html>

      <head>

        <meta charset="UTF-8" />

        <style>

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, Helvetica, sans-serif;
            background: #f4f4f4;
            color: #171717;
          }

          body {
            padding: 0;
          }

          .page {
            width: 800px;
            max-width: 100%;
            min-height: 1120px;

            margin: 0 auto 20px auto;

            padding: 20px;

            border: 2px solid #d4a64f;

            background: #ffffff;

            position: relative;

            overflow: hidden;

            page-break-after: always;
          }

          .page:last-child {
            page-break-after: auto;
          }

          .top {
            text-align: center;
            padding-bottom: 10px;
            border-bottom: 2px solid #d4a64f;
          }

          .shop {
            font-size: 28px;
            line-height: 1.2;
            font-weight: 700;
            color: #4b0000;
          }

          .tag {
            margin-top: 3px;
            font-size: 13px;
            color: #c49028;
            letter-spacing: 1px;
          }

          .gst {
            margin-top: 5px;
            font-size: 12px;
            font-weight: 600;
          }

          .contact {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px 20px;
            margin-top: 8px;
            font-size: 10px;
            line-height: 1.4;
          }

          .invoice {
            text-align: center;
            margin: 8px 0 10px;
          }

          .invoice h5 {
            margin: 0;
            padding: 0;
            font-size: 38px;
            line-height: 1;
            font-weight: 800;
            color: #4b0000;
          }

          .flex {
            display: flex;
            gap: 12px;
            width: 100%;
          }

          .box {
            flex: 1;
            min-width: 0;
            border: 1px solid #d4a64f;
            padding: 12px;
            border-radius: 9px;
            background: #fffdfa;
            font-size: 11px;
            line-height: 1.6;
          }

          .box div {
            word-break: normal;
            overflow-wrap: break-word;
          }

          .addressRow {
            display: flex;
            align-items: flex-start;
            gap: 5px;
          }

          .addressRow b {
            white-space: nowrap;
            flex-shrink: 0;
          }

          .addressRow span {
            flex: 1;
            min-width: 0;
            white-space: normal;
            word-break: normal;
            overflow-wrap: break-word;
          }

          .title {
            margin-bottom: 7px;
            font-size: 16px;
            line-height: 1.2;
            font-weight: 700;
            color: #4b0000;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-top: 16px;
            border: 1px solid #d4a64f;
          }

          th {
            padding: 9px 5px;
            background: #4b0000;
            color: #f4d38a;
            border: 1px solid #d4a64f;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            text-align: center;
          }

          td {
            padding: 8px 5px;
            border: 1px solid #d4a64f;
            font-size: 10px;
            text-align: center;
            vertical-align: middle;
            word-break: break-word;
            overflow-wrap: anywhere;
          }

          th:nth-child(1),
          td:nth-child(1) {
            width: 7%;
          }

          th:nth-child(2),
          td:nth-child(2) {
            width: 19%;
          }

          th:nth-child(3),
          td:nth-child(3) {
            width: 19%;
          }

          th:nth-child(4),
          td:nth-child(4) {
            width: 14%;
          }

          th:nth-child(5),
          td:nth-child(5) {
            width: 8%;
          }

          th:nth-child(6),
          td:nth-child(6) {
            width: 16%;
          }

          th:nth-child(7),
          td:nth-child(7) {
            width: 17%;
          }

          .itemName {
            font-weight: 600;
          }

          .money {
            white-space: nowrap;
          }

          .summary {
            display: flex;
            align-items: stretch;
            gap: 16px;
            width: 100%;
            margin-top: 18px;
          }

          .words {
            flex: 1;
            min-width: 0;
            border: 1px solid #d4a64f;
            padding: 14px;
            border-radius: 9px;
            background: #fffdfa;
          }

          .words h3 {
            margin: 0 0 14px;
            font-size: 17px;
            color: #4b0000;
          }

          .amountWords {
            font-size: 12px;
            line-height: 1.6;
          }

          .totals {
            width: 270px;
            flex-shrink: 0;
            border: 1px solid #d4a64f;
            padding: 13px;
            border-radius: 9px;
            background: #fffdfa;
          }

          .totalRow {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            padding: 5px 0;
            font-size: 12px;
          }

          .totalRow span {
            min-width: 0;
          }

          .totalRow strong {
            white-space: nowrap;
          }

          .discountRow {
            color: #16821b;
          }

          .netRow {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            margin-top: 8px;
            padding-top: 10px;
            border-top: 2px solid #d4a64f;
            font-size: 17px;
            font-weight: 800;
            color: #4b0000;
          }

          .netRow strong {
            white-space: nowrap;
          }

          .thank {
            margin-top: 24px;
            text-align: center;
            font-size: 24px;
            font-style: italic;
            font-weight: 600;
            color: #6b1b1b;
          }

          .thank:after {
            content: "";
            display: block;
            width: 150px;
            height: 2px;
            background: #d4a64f;
            margin: 10px auto;
          }

          .footerArea {
            display: flex;
            gap: 16px;
            margin-top: 20px;
          }

          .footerCard {
            flex: 1;
            min-width: 0;
            border: 1px solid #d4a64f;
            padding: 14px;
            border-radius: 9px;
            background: #fffdf9;
          }

          .footerTitle {
            margin-bottom: 9px;
            padding-bottom: 7px;
            border-bottom: 1px solid #ead5a2;
            font-size: 14px;
            font-weight: 700;
            color: #4b0000;
          }

          .footerItem {
            font-size: 10px;
            line-height: 1.7;
          }

          .pageFooter {
            position: absolute;
            left: 20px;
            right: 20px;
            bottom: 16px;

            display: grid;
            grid-template-columns: 1fr 1fr 1fr;

            align-items: center;

            border-top: 2px solid #d4a64f;

            padding-top: 8px;

            font-size: 10px;
          }

          .footerLeft {
            text-align: left;
          }

          .footerCenter {
            text-align: center;
            font-weight: 700;
          }

          .footerRight {
            text-align: right;
          }

          @media print {

            html,
            body {
              background: #ffffff;
            }

            .page {
              margin: 0;
              box-shadow: none;
            }

          }

        </style>

      </head>

      <body>

        ${htmlPages}

      </body>

    </html>
  `;
}