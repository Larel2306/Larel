# LAREL Product Image Library

Store product images in this folder using this structure:

```
assets/
  products/
    tshirts/
      tshirt1/
        white/
          01.webp
          02.webp
        grey/
          01.webp
    hoodies/
      hoodie1/
        black/
          01.webp
    sweatshirts/
    bottomwear/
    polos/
```

## Naming rules
- One folder per product ID (match the ID used in `products.js`).
- One subfolder per colour (use lowercase names).
- Name gallery images in display order: `01.webp`, `02.webp`, `03.webp`.
- Use original, sharp source images; export web-ready WebP copies without visibly reducing quality.
- Keep the first image as the main/shop image.
- When adding images, update the matching product entry in `products.js` to use the GitHub Pages URL:
  `https://larel2306.github.io/Larel/assets/products/<category>/<product-id>/<colour>/01.webp`

Do not delete old image URLs until the replacement images have been uploaded and checked on the live site.
