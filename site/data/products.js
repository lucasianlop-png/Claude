/* Off the Binder — product list.
   Empty for now: the Products page shows "coming soon" until there is at least one item.
   To list a product, add an object like the example below. Price in AUD; purchase happens
   on the external platform (Etsy, Payhip, print-on-demand shop). No checkout on this site.

   {
     name: "Spec card template",
     price: 12,                        // AUD, number
     url: "https://payhip.com/b/XXXX", // external purchase link
     platform: "Payhip",               // shown on the button: "Buy on Payhip"
     image: "/assets/img/ill/daiquiri-800.webp",
     alt: "Describe the product image",
     blurb: "One line on what it is and who it's for.",
     affiliate: false                  // true only for affiliate links: shows a disclosure
   }
*/
window.OTB_PRODUCTS = [];
