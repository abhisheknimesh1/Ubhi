# Ubhi transactional emails

Nine ready-to-send templates, one per moment a letter should go out.
Designed to feel like everything else Ubhi makes: a cream letter on
parchment, letterpress-ochre double border, a wax seal, Georgia serif,
signed by hand. Every template is self-contained HTML with inline styles
(email clients strip `<style>` blocks) and renders single-column on phones.

## When each one sends

| # | Template | Trigger | Sent to |
|---|----------|---------|---------|
| 1 | `order-confirmation.html` | `POST /api/orders` succeeds (or Stripe webhook `paid`) | buyer |
| 2 | `order-shipped.html` | admin marks the order **Shipped** | buyer |
| 3 | `booking-confirmation.html` | `POST /api/bookings` succeeds | guest |
| 4 | `snail-welcome.html` | `POST /api/subscribers` succeeds (non-gift) | new member |
| 5 | `snail-dispatch.html` | admin completes the monthly **post run** | every active member |
| 6 | `gift-for-you.html` | a gift subscription is placed (recipient email given) | gift recipient |
| 7 | `gift-ending-soon.html` | 14 days before a gift term's last letter | gift recipient |
| 8 | `newsletter-welcome.html` | `POST /api/updates` (email-list signup) | subscriber |
| 9 | `contact-received.html` | `POST /api/contact` | the person who wrote |

Stripe sends its own **payment receipts** automatically — no template needed.

## Placeholders

The mailer fills `{{double_braced}}` tokens with plain string replacement
(`html.replace(/{{name}}/g, value)`). Escape user values before injection.

Common: `{{name}}` `{{email}}`
Orders: `{{orderRef}}` `{{itemsRows}}`* `{{subtotal}}` `{{shipping}}` `{{total}}` `{{addressLines}}`†
Bookings: `{{workshopTitle}}` `{{sessionDate}}` `{{place}}` `{{spaces}}` `{{price}}`
Snail Mail: `{{plan}}` `{{firstPostMonth}}` `{{monthLabel}}` `{{lettersLeft}}`
Gifts: `{{giftFrom}}` `{{giftMessage}}` `{{months}}` `{{endMonth}}`

\* `{{itemsRows}}` expects pre-rendered rows:
`<tr><td style="padding:6px 0;border-bottom:1px dotted #d8cbb0;">Name</td><td align="center">× 2</td><td align="right">£36</td></tr>`
† `{{addressLines}}` expects lines joined with `<br>`.

## Wiring (when SMTP is configured)

```js
const fs = require("fs");
const path = require("path");
const { sendMail } = require("../services/mailer");

function renderEmail(template, vars) {
  let html = fs.readFileSync(path.join(__dirname, template), "utf8");
  for (const [k, v] of Object.entries(vars)) html = html.split(`{{${k}}}`).join(v ?? "");
  return html;
}
// e.g. in routes/orders.js after insert:
// sendMail({ to: row.customer_email, subject: `Your Ubhi order ${row.order_ref} is received ✉`,
//            html: renderEmail("order-confirmation.html", { name, orderRef, itemsRows, ... }) });
```

Subject lines live at the top of each template in an HTML comment.
