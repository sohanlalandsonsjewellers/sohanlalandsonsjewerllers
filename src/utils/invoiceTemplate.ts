export default function invoiceHTML({ shop, bill }: any) {

const items=
Array.isArray(bill.items)
? bill.items
:[];

const ITEMS_PER_PAGE=15;

const subtotal=
items.reduce(
(sum:any,it:any)=>
sum+
(
Number(it.price||0)*
Number(it.qty||0)
),
0
);

const discount=
Number(
bill.discount||0
);

const gst=
Number(
bill.gstAmount||0
);

const shipping=
Number(
bill.shippingCharge||0
);

const net=
Number(
bill.netAmount||0
);

function numberToWords(num:number){

const ones=[
"",
"One","Two","Three","Four",
"Five","Six","Seven","Eight",
"Nine","Ten","Eleven",
"Twelve","Thirteen",
"Fourteen","Fifteen",
"Sixteen","Seventeen",
"Eighteen","Nineteen"
];

const tens=[
"",
"",
"Twenty",
"Thirty",
"Forty",
"Fifty",
"Sixty",
"Seventy",
"Eighty",
"Ninety"
];

function convert(n:number):string{

if(n<20) return ones[n];

if(n<100)
return tens[Math.floor(n/10)]
+" "+ones[n%10];

if(n<1000)
return ones[Math.floor(n/100)]
+" Hundred "+
convert(n%100);

if(n<100000)
return convert(
Math.floor(n/1000)
)+" Thousand "+
convert(n%1000);

if(n<10000000)
return convert(
Math.floor(n/100000)
)+" Lakh "+
convert(n%100000);

return "";

}

return convert(
Math.floor(num)
)+" Rupees Only";

}

const amountWords=
numberToWords(net);

const pages=[];

for(
let i=0;
i<items.length;
i+=ITEMS_PER_PAGE
){

pages.push(
items.slice(
i,
i+ITEMS_PER_PAGE
)
);

}

function header(){

return `

<div class="top">

<div class="shop">

${shop.name}

</div>

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

INVOICE

</div>

<div class="flex">

<div class="box">

<div class="title">

Bill To

</div>

<div><b>Customer:</b> ${bill.customerName}</div>

<div><b>Phone:</b> ${bill.customerPhone}</div>

<div><b>Address:</b> ${bill.customerAddress}</div>

<div><b>Pincode:</b> ${bill.customerPincode}</div>

</div>

<div class="box">

<div class="title">

Invoice Details

</div>

<div><b>Invoice:</b> ${bill.invoiceNo}</div>

<div><b>Bill:</b> ${bill.billNo}</div>

<div><b>Date:</b>

${new Date(
bill.created_at
).toLocaleString()}

</div>

<div><b>Status:</b> Accepted</div>

</div>

</div>

`;

}

function footer(
pageNo:number,
totalPages:number
){

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

const htmlPages=

pages.map(
(pageItems:any,pageIndex:number)=>{

const rows=
pageItems.map(
(it:any,i:number)=>`

<tr>

<td>

${
pageIndex*
ITEMS_PER_PAGE+
i+
1
}

</td>

<td>

${it.name}

</td>

<td>

${it.qty}

</td>

<td>

₹${Number(
it.price
).toFixed(2)}

</td>

<td>

₹${(
Number(it.price)*
Number(it.qty)
).toFixed(2)}

</td>

</tr>

`
).join("");

const lastPage=
pageIndex===
pages.length-1;

return `

<div class="page">

${header()}

<table>

<thead>

<tr>

<th>#</th>
<th>ITEM</th>
<th>QTY</th>
<th>PRICE</th>
<th>AMOUNT</th>

</tr>

</thead>

<tbody>

${rows}

</tbody>

</table>

${
lastPage ?

`

<div class="summary">

<div class="words">

<h3>

Amount In Words

</h3>

${amountWords}

</div>

<div class="totals">

<div>Subtotal ₹${subtotal}</div>

<div>Discount ₹${discount}</div>

<div>GST ₹${gst}</div>

<div>Shipping ₹${shipping}</div>

<h2>

Net ₹${net}

</h2>

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

:

""

}

${footer(
pageIndex+1,
pages.length
)}

</div>

`;

}

).join("");

return `

<html>

<head>

<style>

body{

margin:0;

font-family:Arial;

background:#fafafa;

}

.page{

width:800px;

margin:auto;

padding:20px;

border:2px solid #d4a64f;

background:white;

margin-bottom:20px;

page-break-after:always;

position:relative;

min-height:1120px;

box-shadow:
0 3px 12px rgba(
0,
0,
0,
0.05
);

}

.top{

text-align:center;

padding-bottom:12px;

border-bottom:
2px solid #d4a64f;

}

.shop{

font-size:28px;

font-weight:bold;

color:#4b0000;

}

.tag{

font-size:13px;

color:#c49028;

letter-spacing:1px;

}

.gst{

font-size:12px;

margin-top:4px;

}

.contact{

display:flex;

justify-content:center;

gap:20px;

font-size:10px;

margin-top:8px;

}

.invoice{

font-size:40px;

font-weight:bold;

margin:15px 0;

text-align:center;

color:#4b0000;

}

.flex{

display:flex;

gap:12px;

}

.box{

flex:1;

border:1px solid #d4a64f;

padding:14px;

border-radius:10px;

background:#fffdfa;

font-size:12px;

}

.title{

font-size:18px;

font-weight:bold;

margin-bottom:10px;

color:#4b0000;

}

table{

width:100%;

border-collapse:collapse;

margin-top:18px;

}

th{

background:#4b0000;

color:white;

padding:10px;

}

td{

border:1px solid #eee;

padding:8px;

text-align:center;

font-size:12px;

}

.summary{

display:flex;

gap:20px;

margin-top:20px;

}

.words{

flex:1;

border:1px solid #d4a64f;

padding:14px;

border-radius:10px;

background:#fffdfa;

}

.totals{

width:250px;

border:1px solid #d4a64f;

padding:14px;

border-radius:10px;

background:#fffdfa;

}

.thank{

font-size:30px;

margin-top:30px;

text-align:center;

font-style:italic;

font-weight:600;

color:#6b1b1b;

}

.thank:after{

content:"";

display:block;

width:180px;

height:2px;

background:#d4a64f;

margin:12px auto;

}

.footerArea{

display:flex;

gap:20px;

margin-top:25px;

}

.footerCard{

flex:1;

border:1px solid #d4a64f;

padding:18px;

border-radius:12px;

background:
linear-gradient(
180deg,
#fffdf9,
#fff7ea
);

box-shadow:
0 2px 8px rgba(
0,
0,
0,
0.05
);

}

.footerTitle{

font-size:17px;

font-weight:bold;

margin-bottom:12px;

padding-bottom:10px;

border-bottom:
1px solid #ead5a2;

color:#4b0000;

}

.footerItem{

font-size:12px;

line-height:1.8;

}

.pageFooter{

position:absolute;

left:20px;

right:20px;

bottom:20px;

display:grid;

grid-template-columns:
1fr
1fr
1fr;

align-items:center;

border-top:
2px solid #d4a64f;

padding-top:10px;

font-size:12px;

}

.footerLeft{

text-align:left;

}

.footerCenter{

text-align:center;

font-weight:bold;

}

.footerRight{

text-align:right;

}

</style>

</head>

<body>

${htmlPages}

</body>

</html>

`;

}