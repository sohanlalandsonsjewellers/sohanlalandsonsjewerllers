import path from "path";
import fs from "fs";

export default function invoiceHTML({ shop, bill }: any) {

  const items = Array.isArray(bill.items)
    ? bill.items
    : [];

  const subtotal = Number(
    bill.totalAmount || 0
  );

  const discount = Number(
    bill.discount || 0
  );

  // ==========================
  // LOAD LOGO FROM PUBLIC
  // ==========================

  const logoPath = path.resolve(
    process.cwd(),
    "public",
    "Shop.jpg"
  );

  let logoUrl = "";

  try {

    const imageBuffer =
      fs.readFileSync(logoPath);

    logoUrl =
      `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;

  } catch {

    console.log(
      "Shop logo not found:",
      logoPath
    );

  }

  const rows = items.map(
    (it: any, i: number) => `
<tr>

<td>${i + 1}</td>

<td>${it.name}</td>

<td>${it.qty}</td>

<td>₹${it.price}</td>

<td>₹${it.price * it.qty}</td>

</tr>
`
  ).join("");

  return `

<html>

<head>

<meta charset="UTF-8"/>

<style>

body{

font-family:Arial;

margin:0;

padding:0;

}

.container{

width:800px;

margin:auto;

border:5px solid gold;

padding:20px;

box-sizing:border-box;

}

.header{

text-align:center;

border-bottom:3px solid gold;

padding-bottom:15px;

}

.header img{

width:120px;

height:auto;

margin-bottom:10px;

}

h1{

color:maroon;

margin:0;

}

table{

width:100%;

border-collapse:collapse;

margin-top:20px;

}

th{

background:maroon;

color:gold;

}

th,td{

border:1px solid #ddd;

padding:8px;

font-size:12px;

}

.total{

margin-top:20px;

text-align:right;

}

.net{

font-size:20px;

font-weight:bold;

}

.info{

display:flex;

justify-content:space-between;

margin-top:20px;

}

</style>

</head>

<body>

<div class="container">

<div class="header">

${logoUrl
      ? `<img src="${logoUrl}" />`
      : ""
    }

<h1>

Sohan Lal & Sons Jewellers

</h1>

<div>

GSTIN: ${shop.gst}

</div>

</div>


<div class="info">

<div>

Invoice:
${bill.invoiceNo}

<br/>

Date:
${new Date(
      bill.created_at
    ).toLocaleString()}

</div>

<div>

Customer:
${bill.customerName}

<br/>

Phone:
${bill.customerPhone}

</div>

</div>


<table>

<tr>

<th>#</th>

<th>Item</th>

<th>Qty</th>

<th>Price</th>

<th>Amount</th>

</tr>

${rows}

</table>


<div class="total">
  <div>Price: ₹${bill.adminPrice || 0}</div>
  <div>GST: ₹${bill.gstAmount}</div>
  <div> Discount:₹${discount}</div>
  <div>Shipping: ₹${bill.shippingCharge || 0}</div>
  <div class="net">Net Amount: ₹${bill.netAmount.toFixed(2)} </div>

</div>

</div>

</body>

</html>

`;

}