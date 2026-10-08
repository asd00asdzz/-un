window.catalogImageUrl = (url) => {
  const parsedUrl = new URL(url, document.baseURI);
  if (!["drive.google.com", "docs.google.com"].includes(parsedUrl.hostname)) {
    return url;
  }

  const fileId = parsedUrl.pathname.match(/\/file\/d\/([^/]+)/)?.[1]
    || parsedUrl.pathname.match(/\/d\/([^/]+)/)?.[1]
    || parsedUrl.searchParams.get("id");
  if (!fileId) return url;

  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1200`;
};

window.catalogVideoUrl = (url) => {
  const parsedUrl = new URL(url, document.baseURI);
  if (!["drive.google.com", "docs.google.com"].includes(parsedUrl.hostname)) {
    return url;
  }

  const fileId = parsedUrl.pathname.match(/\/file\/d\/([^/]+)/)?.[1]
    || parsedUrl.pathname.match(/\/d\/([^/]+)/)?.[1]
    || parsedUrl.searchParams.get("id");
  if (!fileId) return url;

  return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
};

let forestCaptureInProgress = false;

window.showCatalogImage = (url, alt) => {
  let dialog = document.querySelector("#catalog-image-dialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "catalog-image-dialog";
    dialog.className = "catalog-image-dialog";

    const closeButton = document.createElement("button");
    closeButton.className = "catalog-image-dialog-close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "ปิดรูปสินค้า");
    closeButton.textContent = "×";
    closeButton.addEventListener("click", () => dialog.close());

    const image = document.createElement("img");
    image.className = "catalog-image-dialog-photo";
    dialog.append(closeButton, image);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    document.body.append(dialog);
  }

  const image = dialog.querySelector(".catalog-image-dialog-photo");
  image.src = window.catalogImageUrl(url);
  image.alt = alt;
  dialog.showModal();
};

window.carryProductToContact = async (card, contact) => {
  if (forestCaptureInProgress) return;
  if (!(card instanceof HTMLElement) || !(contact instanceof HTMLElement)) {
    throw new TypeError("ต้องระบุการ์ดสินค้าและส่วนติดต่อร้าน");
  }
  forestCaptureInProgress = true;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const origin = card.getBoundingClientRect();
  const flightCard = card.cloneNode(true);
  flightCard.classList.add("forest-capture-card");
  Object.assign(flightCard.style, {
    left: `${origin.left}px`,
    top: `${origin.top}px`,
    width: `${origin.width}px`,
    height: `${origin.height}px`
  });
  document.body.append(flightCard);

  const bite = document.createElement("div");
  bite.className = "forest-bite";
  bite.setAttribute("aria-hidden", "true");
  bite.innerHTML = '<svg viewBox="0 0 220 180"><defs><linearGradient id="forest-jaw" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d9edaa"/><stop offset=".48" stop-color="#7d9d55"/><stop offset="1" stop-color="#385d46"/></linearGradient></defs><path class="forest-upper-jaw" d="M18 48 Q48 6 104 25 Q151 37 202 20 Q187 77 131 88 Q73 100 18 48Z" fill="url(#forest-jaw)" stroke="#294438" stroke-width="7" stroke-linejoin="round"/><path class="forest-lower-jaw" d="M18 132 Q57 83 112 96 Q166 108 202 157 Q145 143 103 158 Q51 174 18 132Z" fill="url(#forest-jaw)" stroke="#294438" stroke-width="7" stroke-linejoin="round"/><path d="M76 79l10 20 13-18 11 21 14-20 11 18" fill="#fff4d5" stroke="#506c4b" stroke-width="4" stroke-linejoin="round"/><path d="M73 112l12-18 12 19 12-18 13 20 12-18" fill="#fff4d5" stroke="#506c4b" stroke-width="4" stroke-linejoin="round"/><path d="M29 42Q16 17 4 14M35 138Q14 160 4 164" fill="none" stroke="#9eb66c" stroke-width="9" stroke-linecap="round"/></svg>';
  document.body.append(bite);

  const startX = origin.left + origin.width / 2;
  const startY = origin.top + origin.height / 2;
  const biteSize = Math.min(250, Math.max(150, window.innerWidth * 0.2));
  bite.style.left = `${startX}px`;
  bite.style.top = `${startY}px`;
  bite.style.width = `${biteSize}px`;
  bite.style.height = `${biteSize * 0.82}px`;

  try {
    card.classList.add("is-grabbed");
    contact.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
    await new Promise((resolve) => window.setTimeout(resolve, reducedMotion ? 120 : 850));
    const destination = contact.getBoundingClientRect();
    const deltaX = destination.left + destination.width / 2 - startX;
    const deltaY = destination.top + destination.height / 2 - startY;
    const animationDuration = reducedMotion ? 900 : 1700;
    const biteTravel = bite.animate([
      { transform: "translate(-50%, -50%) scale(.15) rotate(-18deg)", opacity: 0 },
      { transform: "translate(-50%, -50%) scale(1) rotate(0)", opacity: 1, offset: .18 },
      { transform: "translate(-50%, -50%) scale(1.04)", opacity: 1, offset: .3 },
      { transform: "translate(-50%, -50%) scale(.88)", opacity: 1, offset: .42 },
      { transform: `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(.32) rotate(14deg)`, opacity: .85 }
    ], { duration: animationDuration, easing: "cubic-bezier(.2,.72,.23,1)", fill: "forwards" });
    const cardTravel = flightCard.animate([
      { transform: "translate(0, 0) scale(1)", opacity: 1, offset: 0 },
      { transform: "translate(0, 0) scale(.9)", opacity: 1, offset: .28 },
      { transform: `translate(${deltaX}px, ${deltaY}px) scale(.12) rotate(12deg)`, opacity: .08 }
    ], { duration: animationDuration, easing: "cubic-bezier(.2,.72,.23,1)", fill: "forwards" });
    await Promise.all([biteTravel.finished, cardTravel.finished]);

    contact.classList.remove("is-forest-destination");
    void contact.offsetWidth;
    contact.classList.add("is-forest-destination");
    window.setTimeout(() => contact.classList.remove("is-forest-destination"), 900);
  } finally {
    flightCard.remove();
    bite.remove();
    card.classList.remove("is-grabbed");
    forestCaptureInProgress = false;
  }
};

window.contactProductOnLine = async (card, contact, product) => {
  if (!product || typeof product.title !== "string" || typeof product.image !== "string") {
    throw new TypeError("ต้องระบุชื่อและรูปลิงก์ของสินค้า");
  }
  if (forestCaptureInProgress) return;

  const lineUrl = "https://line.me/R/ti/p/%40634lfegy";

  try {
    await window.carryProductToContact(card, contact);
    let dialog = document.querySelector("#line-product-contact-dialog");
    if (!dialog) {
      const style = document.createElement("style");
      style.textContent = `
        .line-product-contact-dialog { width: min(92vw, 440px); margin: auto; padding: 30px; border: 1px solid #e5e5e5; border-radius: 22px; background: #fff; color: #1b1b1b; box-shadow: 0 24px 80px rgba(0,0,0,.3); font-family: inherit; }
        .line-product-contact-dialog::backdrop { background: rgba(15,15,15,.68); backdrop-filter: blur(4px); }
        .line-product-contact-dialog h2 { margin: 0 36px 10px 0; font-size: 22px; }
        .line-product-contact-dialog p { margin: 0 0 12px; color: #555; line-height: 1.7; }
        .line-product-contact-message-text { display: block; width: 100%; min-height: 108px; margin: 0 0 20px; padding: 12px; resize: vertical; border: 1px solid #ddd; border-radius: 12px; background: #f7f7f7; color: #333; font: inherit; line-height: 1.55; }
        .line-product-contact-actions { display: flex; align-items: center; gap: 12px; }
        .line-product-contact-open { display: inline-flex; min-height: 46px; align-items: center; justify-content: center; padding: 0 20px; border-radius: 999px; background: #06c755; color: #fff; font-weight: 800; text-decoration: none; }
        .line-product-contact-close { display: inline-flex; min-height: 44px; align-items: center; padding: 0 16px; border: 1px solid #ddd; border-radius: 999px; background: #fff; color: #333; cursor: pointer; }
        @media (max-width: 480px) { .line-product-contact-dialog { padding: 25px 20px; } }
      `;
      document.head.append(style);

      dialog = document.createElement("dialog");
      dialog.id = "line-product-contact-dialog";
      dialog.className = "line-product-contact-dialog";
      dialog.setAttribute("aria-labelledby", "line-product-contact-title");

      const heading = document.createElement("h2");
      heading.id = "line-product-contact-title";
      heading.textContent = "เอฟเฟกต์สินค้าเสร็จแล้ว";
      const message = document.createElement("p");
      message.className = "line-product-contact-message";
      message.textContent = "แตะปุ่มด้านล่างเพื่อเปิด LINE @634lfegy หากเป็นเพื่อนกับร้านแล้วจะเข้าห้องแชต หากยังไม่ได้เป็นเพื่อนให้กดเพิ่มเพื่อนก่อน";
      const messageText = document.createElement("textarea");
      messageText.className = "line-product-contact-message-text";
      messageText.readOnly = true;
      messageText.setAttribute("aria-label", "ข้อความและลิงก์รูปสินค้าสำหรับส่งใน LINE");
      const actions = document.createElement("div");
      actions.className = "line-product-contact-actions";
      const openLink = document.createElement("a");
      openLink.className = "line-product-contact-open";
      openLink.textContent = "เปิดแชต LINE @634lfegy";
      const closeButton = document.createElement("button");
      closeButton.className = "line-product-contact-close";
      closeButton.type = "button";
      closeButton.textContent = "ปิด";
      closeButton.addEventListener("click", () => dialog.close());

      actions.append(openLink, closeButton);
      dialog.append(heading, message, messageText, actions);
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
      document.body.append(dialog);
    }

    dialog.querySelector(".line-product-contact-message-text").value =
      `สนใจสินค้า: ${product.title}\nรูปสินค้า: ${product.image}`;
    const openLink = dialog.querySelector(".line-product-contact-open");
    openLink.href = lineUrl;
    openLink.removeAttribute("target");
    dialog.showModal();
  } catch (error) {
    console.error("เปิดแชต LINE เพื่อสอบถามสินค้าไม่สำเร็จ", error);
    window.alert("เปิดแชต LINE ไม่สำเร็จ กรุณาลองกดสอบถามอีกครั้ง");
  }
};

window.catalogProducts = [
  {
    category: "spearguns",
    image: "https://drive.google.com/file/d/1R252nlWhDnkUO0BEVrrzQNml-lRgN-rG/view?usp=sharing",
    alt: "หน้าไม้ยิงปลาด้ามไม้ ภาพสินค้าจริง มุมด้านหน้า",
    title: "หน้าไม้ยิงปลาด้ามไม้",
    description: "ภาพสินค้าจริงมุมด้านหน้า สอบถามรุ่น ขนาด และราคาได้กับทางร้าน",
    tag: "ภาพสินค้าจริง"
  },
  {
    category: "spearguns",
    image: "https://drive.google.com/file/d/14T13_c_RQ-k5QZxlT6NerKMCprAGbyMw/view?usp=sharing",
    alt: "หน้าไม้ยิงปลาด้ามไม้ ภาพสินค้าจริง มุมด้านข้าง",
    title: "หน้าไม้ยิงปลาด้ามไม้ - มุมด้านข้าง",
    description: "ภาพถ่ายอีกมุมของสินค้า สอบถามรายละเอียดและสต็อกก่อนสั่งซื้อ",
    tag: "อีกมุม"
  },
  {
    category: "spearguns",
    image: "https://drive.google.com/file/d/1hUE4lRXRVcX1bIVJwT1ZeVNgLb9MEozr/view?usp=sharing",
    alt: "หน้าไม้ยิงปลาด้ามไม้ ภาพรายละเอียดสินค้า",
    title: "หน้าไม้ยิงปลาด้ามไม้ - รายละเอียด",
    description: "ดูรายละเอียดสินค้าและอุปกรณ์ที่รวมในชุดได้จากภาพ",
    tag: "รายละเอียด"
  },
  {
    category: "spearguns",
    image: "https://drive.google.com/file/d/1qaJ-Gagi0gRFHxWUmTBJc3Tc4LEZrnKJ/view?usp=sharing",
    alt: "ภาพโปรโมชันหน้าไม้ยิงปลา TK Gun",
    title: "หน้าไม้ยิงปลา TK Gun",
    description: "ภาพแนะนำสินค้า สอบถามรุ่น ราคา และรายละเอียดเพิ่มเติมกับทางร้าน"
  },
  {
    category: "spearguns",
    image: "https://drive.google.com/file/d/1EpuRbU96m6snaD3v2bs5wxuQTTXqpQsx/view?usp=sharing",
    alt: "ภาพโปรโมชันหน้าไม้และอุปกรณ์ยิงปลา",
    title: "หน้าไม้และอุปกรณ์ยิงปลา",
    description: "สอบถามรายละเอียดชุดสินค้าและอุปกรณ์ที่มีในสต็อก"
  },
{
    category: "spearguns",
    image: "https://drive.google.com/file/d/1vnTHkBTvMggjKdreU3LOL2DQFx6TgG1K/view?usp=sharing",
    alt: "ภาพโปรโมชันหน้าไม้และอุปกรณ์ยิงปลา",
    title: "หน้าไม้และอุปกรณ์ยิงปลา",
    description: "สอบถามรายละเอียดชุดสินค้าและอุปกรณ์ที่มีในสต็อก"
  },
  {
    category: "shafts",
    image: "https://drive.google.com/file/d/1vnTHkBTvMggjKdreU3LOL2DQFx6TgG1K/view?usp=sharing",
    alt: "ภาพรายละเอียดหน้าไม้และอุปกรณ์",
    title: "ลูกดอกและปลายลูกดอก",
    description: "แจ้งรุ่นหน้าไม้และขนาดที่ต้องการเพื่อเช็กสินค้ากับร้าน"
  },
  {
    category: "shafts",
    image: "speargun-wood-side.jpg",
    alt: "ภาพหน้าไม้ยิงปลาและชุดสาย",
    title: "สายและยางหน้าไม้",
    description: "ตรวจสอบชนิดและความเข้ากันได้กับหน้าไม้แต่ละรุ่น"
  },
  {
    category: "accessories",
    image: "Gemini_Generated_Image_vr6nhqvr6nhqvr6n.jpg",
    alt: "ภาพตัวอย่างอุปกรณ์สำหรับลงน้ำ",
    title: "หน้ากากและอุปกรณ์ดำน้ำ",
    description: "เลือกอุปกรณ์ให้พอดีและเหมาะกับการใช้งานทางน้ำ"
  },
  {
    category: "accessories",
    image: "speargun-wood-front.jpg",
    alt: "หน้าไม้ยิงปลาและอุปกรณ์เสริม",
    title: "กระเป๋าและอุปกรณ์จัดเก็บ",
    description: "สอบถามรูปแบบและขนาดอุปกรณ์เสริมที่มีในร้าน"
  },
  {
    category: "accessories",
    image: "speargun-wood-side.jpg",
    alt: "ภาพอุปกรณ์หน้าไม้ยิงปลา",
    title: "อุปกรณ์ดูแลหน้าไม้",
    description: "สอบถามวิธีดูแลและสินค้าเสริมที่เหมาะกับอุปกรณ์"
  }
];
