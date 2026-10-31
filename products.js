/* LAREL product catalogue: Supabase is the source of truth.
   Existing storefront pages continue using window.LAREL_PRODUCTS in the same format. */
/* LAREL shared product catalog
   Add or edit products here to update Shop.html and Tshirt.html.
   Keep each product ID unique, e.g. "tshirt2".
*/
window.LAREL_PRODUCTS_FALLBACK = {
  "tshirt1": {
    title: "Find Your North – Compass Signature T-Shirt",
    shopImage: "https://i.ibb.co/wNSndt3s/mockup-4.png",
    tag: "New Drop",
    price: 499,
    oldPrice: 999,
    category: "tshirts",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: {
      "White": { code: "#ffffff", images: ["https://i.ibb.co/wNSndt3s/mockup-4.png", "https://i.ibb.co/2041mShv/mockup-2.png", "https://i.ibb.co/RprVDQJ5/mockup-3.png", "https://i.ibb.co/Fb57hSPr/mockup-1.png", "https://i.ibb.co/8nvRdzfT/mockup-5.png", "https://i.ibb.co/cXtMF8zR/Screenshot-2026-10-22-213835.png"] },
      "Grey": { code: "#C0C4C8", images: ["https://i.ibb.co/kgcbsZ7y/mockup-6.png", "https://i.ibb.co/pB842f91/mockup-3.png", "https://i.ibb.co/vvhGWBGX/mockup-4.png", "https://i.ibb.co/svvzKNKs/mockup-5.png", "https://i.ibb.co/k2KyNv0g/mockup-2.png", "https://i.ibb.co/pGVHF6K/Screenshot-2026-10-22-214344.png"] },
      "Lavender": { code: "#E6E6FA", images: ["https://i.ibb.co/TsjxPXn/mockup-4.png", "https://i.ibb.co/LhkKjVZ5/mockup-1.png", "https://i.ibb.co/k6wCGLt0/mockup-2.png", "https://i.ibb.co/C5qf8S8w/mockup-3.png", "https://i.ibb.co/sdyT6vZK/mockup-5.png", "https://i.ibb.co/bMdRNVXs/Screenshot-2026-10-22-220425.png"] },
      "Mint": { code: "#3EB489", images: ["https://i.ibb.co/VcTqhwMk/mockup-1.png", "https://i.ibb.co/vvm8GcZG/mockup-2.png", "https://i.ibb.co/WNSfVQ1R/mockup-3.png", "https://i.ibb.co/zH2YkyM1/mockup-4.png", "https://i.ibb.co/ZRgrG1zq/mockup-5.png", "https://i.ibb.co/G3by0d9c/Screenshot-2026-10-22-220642.png"] }
    }
  },
  "tshirt2": {
    title: "TEST PRODUCT – Product System Check",
    shopImage: "https://i.ibb.co/wNSndt3s/mockup-4.png",
    tag: "Testing",
    price: 299,
    oldPrice: 499,
    category: "tshirts",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: {
      "Black": { code: "#171717", images: ["https://i.ibb.co/wNSndt3s/mockup-4.png"] }
    }
  }
};


(function () {
  const SUPABASE_URL = "https://gghpenzosdqudtqhpekp.supabase.co";
  const SUPABASE_KEY = "sb_publishable_LgOR6E51qGFLRcIecWqA3w_kHHoGtVa";

  const colorCodes = {
    black: "#171717", white: "#ffffff", grey: "#C0C4C8", gray: "#C0C4C8",
    red: "#dc2626", blue: "#2563eb", navy: "#172554", green: "#16a34a",
    mint: "#3EB489", lavender: "#E6E6FA", pink: "#ec4899", yellow: "#eab308",
    beige: "#d6c2a1", brown: "#783f04"
  };

  function normalizeProduct(row) {
    const images = Array.isArray(row.images) ? row.images.filter(Boolean) : [];
    const mainImage = images[0] || "";
    const colorNames = Array.isArray(row.colors) ? row.colors : [];
    const sizes = Array.isArray(row.sizes) ? row.sizes : [];
    const colors = {};
    colorNames.forEach((entry) => {
      const name = typeof entry === "string" ? entry : (entry && entry.name) || "";
      if (!name) return;
      const code = (entry && typeof entry === "object" && entry.code) ||
        colorCodes[name.toLowerCase()] || "#888888";
      const colorImages = (entry && typeof entry === "object" && Array.isArray(entry.images) && entry.images.length)
        ? entry.images : (images.length ? images : []);
      colors[name] = { code, images: colorImages };
    });

    if (!Object.keys(colors).length) {
      colors["Default"] = { code: "#888888", images };
    }

    return {
      title: row.title || "LAREL Product",
      shopImage: mainImage,
      tag: row.tag || "",
      price: Number(row.price || 0),
      oldPrice: row.old_price == null ? 0 : Number(row.old_price),
      category: row.category || "other",
      sizes,
      colors,
      description: row.description || "",
      stock: Number(row.stock || 0)
    };
  }

  window.LAREL_PRODUCTS_READY = (async function () {
    try {
      if (!window.supabase || !window.supabase.createClient) {
        throw new Error("Supabase library did not load.");
      }
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data, error } = await client
        .from("products")
        .select("product_id,title,category,price,old_price,stock,images,description,sizes,colors,is_active,tag")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const liveProducts = {};
      (data || []).forEach((row) => {
        if (row.product_id) liveProducts[row.product_id] = normalizeProduct(row);
      });

      window.LAREL_PRODUCTS = liveProducts;
      console.info("LAREL products loaded from Supabase:", Object.keys(liveProducts).length);
      return liveProducts;
    } catch (error) {
      console.error("LAREL Supabase product load failed:", error);
      window.LAREL_PRODUCTS = window.LAREL_PRODUCTS_FALLBACK || {};
      return window.LAREL_PRODUCTS;
    }
  })();
})();
