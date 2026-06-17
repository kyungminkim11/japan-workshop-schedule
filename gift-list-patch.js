(function () {
  "use strict";
  if (window.__workshopGiftListPatchInstalled) return;
  window.__workshopGiftListPatchInstalled = true;

  const DEFAULT_GIFTS = [
    {
      id: "gift-krewrap",
      text: "NEW 크레랩",
      jpName: "NEWクレラップ",
      category: "생활용품",
      icon: "▰",
      accent: "#ef4444",
      description: "일본 크레하의 식품용 랩입니다. 밀착력이 좋고 상자 커터로 잘 잘리는 제품이라 실용적인 생활용품 선물로 많이 찾습니다.",
      price: "약 ¥280~500",
      stores: ["돈키호테", "마츠모토키요시", "스기약국", "이온·라이프 등 대형마트"],
      availability: "상시 판매 제품",
      searchQuery: "NEWクレラップ 30cm 50m",
      officialUrl: "https://kurelife.jp/products/newkrewrap/",
      imageUrl: "https://kurelife.jp/assets/img/products/newkrewrap/index_new/lineup_banner.png",
      aliases: ["크레랩", "쿠레랩", "newクレラップ"]
    },
    {
      id: "gift-jelly-grape",
      text: "오리히로 곤약젤리 포도",
      jpName: "ぷるんと蒟蒻ゼリー グレープ",
      category: "간식",
      icon: "●",
      accent: "#7c3aed",
      description: "한입 파우치형 곤약젤리입니다. 포도 과즙 맛과 탱글한 식감이 특징이며 휴대하기 편합니다.",
      price: "약 ¥140~250",
      stores: ["돈키호테", "드러그스토어", "요도바시 식품 코너", "슈퍼마켓"],
      availability: "점포별 맛 재고 차이 있음",
      searchQuery: "オリヒロ ぷるんと蒟蒻ゼリー グレープ 6個",
      officialUrl: "https://health.orihiro.com/jelly/",
      aliases: ["곤약젤리 포도", "오리히로 포도", "그레이프 곤약젤리"]
    },
    {
      id: "gift-jelly-peach",
      text: "오리히로 곤약젤리 백도",
      jpName: "ぷるんと蒟蒻ゼリー 白桃",
      category: "간식",
      icon: "●",
      accent: "#fb7185",
      description: "부드러운 백도 향이 나는 곤약젤리입니다. 포도맛과 함께 묶어서 사기 좋은 무난한 인기 맛입니다.",
      price: "약 ¥140~250",
      stores: ["돈키호테", "드러그스토어", "요도바시 식품 코너", "슈퍼마켓"],
      availability: "점포별 맛 재고 차이 있음",
      searchQuery: "オリヒロ ぷるんと蒟蒻ゼリー 白桃",
      officialUrl: "https://health.orihiro.com/product/detail/index.php?id=528",
      imageUrl: "https://health.orihiro.com/images_up/lineup/300x270/4571157252872.jpg",
      aliases: ["곤약젤리 백도", "곤약젤리 복숭아", "오리히로 백도", "오리히로 복숭아"]
    },
    {
      id: "gift-yangnyeom-ramen",
      text: "양념치킨맛 치킨라면",
      jpName: "チキンラーメン ヤンニョム味",
      category: "라면",
      icon: "▣",
      accent: "#f97316",
      description: "달고 매콤한 양념치킨 소스를 응용한 컵라면 계열입니다. 닛신 한정 제품은 현재 재고가 드물어 비슷한 한국식 매운 라면으로 대체할 수 있습니다.",
      price: "정확한 제품 ¥270 전후 · 대체품 ¥150~350",
      stores: ["돈키호테", "신오쿠보 한국광장", "서울시장", "대형 편의점·마트"],
      availability: "정확한 한정판은 판매 종료·재고 희박",
      searchQuery: "チキンラーメン ヤンニョム味",
      officialUrl: "https://www.nissin.com/jp/products/brands/chickenramen/",
      aliases: ["양념치킨 라면", "양념 치킨라면", "치킨라면 양념"]
    },
    {
      id: "gift-strawberry-mochi",
      text: "편의점 딸기 모찌",
      jpName: "いちご大福・いちご餅",
      category: "냉장 디저트",
      icon: "●",
      accent: "#e11d48",
      description: "생딸기 대복 또는 딸기 크림·딸기 우유 계열 찹쌀 디저트입니다. 시즌과 점포에 따라 제품이 자주 바뀝니다.",
      price: "약 ¥200~430",
      stores: ["세븐일레븐", "로손", "패밀리마트", "백화점 식품관"],
      availability: "계절·점포 한정, 귀국 직전 구매 추천",
      searchQuery: "コンビニ いちご大福",
      officialUrl: "https://www.sej.co.jp/products/sweets/",
      aliases: ["딸기 모찌", "딸기모찌", "딸기 대복", "이치고 다이후쿠"]
    },
    {
      id: "gift-pudding",
      text: "일본 편의점 푸딩",
      jpName: "コンビニプリン",
      category: "냉장 디저트",
      icon: "◆",
      accent: "#d97706",
      description: "달걀과 캐러멜 풍미가 강한 일본식 푸딩입니다. 단단한 레트로 타입과 부드러운 생푸딩 중 매장에서 골라 살 수 있습니다.",
      price: "약 ¥150~350",
      stores: ["로손", "세븐일레븐", "패밀리마트", "슈퍼마켓"],
      availability: "상시 판매, 냉장 보관 필요",
      searchQuery: "コンビニ プリン 人気",
      officialUrl: "https://www.lawson.co.jp/recommend/original/dessert/",
      aliases: ["푸딩", "일본 푸딩", "편의점푸딩"]
    },
    {
      id: "gift-nagano-bear",
      text: "농담곰 굿즈",
      jpName: "ナガノのくま グッズ",
      category: "캐릭터 굿즈",
      icon: "●",
      accent: "#a16207",
      description: "나가노 작가의 곰 캐릭터 굿즈입니다. 작은 스티커부터 마스코트, 인형, 파우치까지 선택 폭이 넓습니다.",
      price: "스티커 약 ¥550 · 마스코트 약 ¥1,430~1,870",
      stores: ["나가노 마켓 GINZA", "나가노 마켓 온라인", "캐릭터 팝업스토어"],
      availability: "인기 디자인은 조기 품절 가능",
      searchQuery: "ナガノのくま マスコット",
      officialUrl: "https://nagano-market.jp/collections/kuma",
      imageUrl: "https://nagano-market.jp/cdn/shop/files/4571609358152_1_41823c70-e3b4-449d-9cc6-b12f4408f252.jpg?v=1744689633&width=800",
      aliases: ["농담곰", "나가노 곰", "나가노의 곰"]
    },
    {
      id: "gift-chiikawa",
      text: "치이카와 굿즈",
      jpName: "ちいかわ グッズ",
      category: "캐릭터 굿즈",
      icon: "○",
      accent: "#0ea5e9",
      description: "치이카와·하치와레·우사기 등의 마스코트, 키링, 파우치, 문구류입니다. 매장마다 한정 상품과 재고가 다릅니다.",
      price: "소품 약 ¥550~1,000 · 마스코트 약 ¥1,500~2,500",
      stores: ["치이카와랜드 도쿄역", "하라주쿠점", "스카이트리점", "나가노 마켓 GINZA"],
      availability: "인기 캐릭터·신상품 품절 가능",
      searchQuery: "ちいかわランド 東京 グッズ",
      officialUrl: "https://chiikawamarket.jp/",
      aliases: ["치이카와", "하치와레", "우사기 굿즈"]
    },
    {
      id: "gift-cat-goods",
      text: "고양이 관련 물건",
      jpName: "猫グッズ",
      category: "잡화",
      icon: "△",
      accent: "#475569",
      description: "고양이 캐릭터 파우치, 양말, 키링, 문구, 주방용품 등입니다. 작은 소품을 고르면 짐 부담도 적습니다.",
      price: "다이소 ¥110~550 · 로프트·핸즈 약 ¥500~3,000",
      stores: ["LOFT", "Hands", "Village Vanguard", "3COINS", "다이소"],
      availability: "종류가 많아 현장에서 디자인 선택",
      searchQuery: "東京 猫グッズ ロフト ハンズ",
      officialUrl: "https://www.loft.co.jp/",
      aliases: ["고양이 굿즈", "고양이 물건", "냥이 굿즈"]
    }
  ];

  const originalNormalizeState = typeof normalizeState === "function" ? normalizeState : null;
  const originalCollectTimelineItems = typeof collectTimelineItems === "function" ? collectTimelineItems : null;

  function cleanKey(value) {
    return String(value || "").toLocaleLowerCase("ko-KR").replace(/[\s\-_/·・()\[\]{}.,!?~'\"「」『』]/g, "");
  }
  function isDefaultGift(item) { return DEFAULT_GIFTS.some((gift) => gift.id === item?.id); }
  function giftPhotoItemId(itemOrId) {
    const id = typeof itemOrId === "string" ? itemOrId : itemOrId?.id;
    return `gift:${String(id || "").slice(0, 27)}`.slice(0, 32);
  }
  function giftPhotos(itemOrId) {
    const mediaId = giftPhotoItemId(itemOrId);
    return (Array.isArray(photos) ? photos : []).filter((photo) => (photo.itemId || photo.item_id) === mediaId);
  }
  function matchExisting(defaultGift, source) {
    const defaultKeys = [defaultGift.text, defaultGift.jpName, ...(defaultGift.aliases || [])].map(cleanKey).filter(Boolean);
    return source.find((item) => {
      if (item?.id === defaultGift.id) return true;
      const itemKey = cleanKey(item?.text || item?.name);
      return itemKey && defaultKeys.some((key) => itemKey === key || itemKey.includes(key) || key.includes(itemKey));
    });
  }
  function normalizeGiftItem(item, fallback = {}) {
    const id = safeText(item?.id || fallback.id || makeId("g")).slice(0, 27) || makeId("g").slice(0, 27);
    return {
      ...fallback,
      ...item,
      id,
      text: safeText(item?.text || item?.name || fallback.text || "선물 항목").slice(0, 100),
      jpName: safeText(item?.jpName || fallback.jpName).slice(0, 120),
      category: safeText(item?.category || fallback.category || "기타").slice(0, 40),
      description: safeText(item?.description || fallback.description || "추가로 등록한 선물 항목입니다.").slice(0, 600),
      price: safeText(item?.price || fallback.price || "가격 확인 필요").slice(0, 120),
      stores: Array.isArray(item?.stores) && item.stores.length ? item.stores.map((store) => safeText(store).slice(0, 80)).filter(Boolean).slice(0, 8) : [...(fallback.stores || ["구매처 확인 필요"])],
      availability: safeText(item?.availability || fallback.availability || "재고 확인 필요").slice(0, 120),
      searchQuery: safeText(item?.searchQuery || fallback.searchQuery || item?.text || fallback.text).slice(0, 160),
      officialUrl: safeText(item?.officialUrl || fallback.officialUrl).slice(0, 500),
      imageUrl: safeText(item?.imageUrl || fallback.imageUrl).slice(0, 500),
      icon: safeText(item?.icon || fallback.icon || "□").slice(0, 4),
      accent: /^#[0-9a-f]{6}$/i.test(item?.accent || "") ? item.accent : (fallback.accent || "#0f766e"),
      aliases: Array.isArray(item?.aliases) ? item.aliases.slice(0, 12) : [...(fallback.aliases || [])],
      done: Boolean(item?.done),
      purchasedAt: item?.done ? safeText(item?.purchasedAt || item?.updatedAt || fallback.purchasedAt || nowIso()) : "",
      purchaseNote: safeText(item?.purchaseNote || item?.note || fallback.purchaseNote).slice(0, 300),
      actualStore: safeText(item?.actualStore || fallback.actualStore).slice(0, 100),
      actualPrice: safeText(item?.actualPrice || fallback.actualPrice).slice(0, 60),
      updatedAt: safeText(item?.updatedAt || fallback.updatedAt || nowIso())
    };
  }
  function normalizeGiftList(items) {
    const source = Array.isArray(items) ? items : [];
    const matched = new Set();
    const defaults = DEFAULT_GIFTS.map((gift) => {
      const existing = matchExisting(gift, source);
      if (existing) matched.add(existing);
      return normalizeGiftItem(existing || {}, gift);
    });
    const custom = source
      .filter((item) => !matched.has(item) && !DEFAULT_GIFTS.some((gift) => gift.id === item?.id))
      .map((item) => normalizeGiftItem(item));
    return [...defaults, ...custom].slice(0, 80);
  }

  if (originalNormalizeState) {
    normalizeState = function (incoming = {}) {
      originalNormalizeState(incoming);
      state.girlfriendRequests = normalizeGiftList(incoming.girlfriendRequests || state.girlfriendRequests);
    };
  }

  function makeArtData(item) {
    const title = String(item.text || "선물").replace(/[<>&]/g, "").slice(0, 18);
    const subtitle = String(item.jpName || item.category || "GIFT LIST").replace(/[<>&]/g, "").slice(0, 28);
    const accent = item.accent || "#0f766e";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="520" viewBox="0 0 720 520"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${accent}" stop-opacity=".18"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><rect width="720" height="520" rx="42" fill="#fffaf6"/><rect x="24" y="24" width="672" height="472" rx="34" fill="url(#g)" stroke="${accent}" stroke-opacity=".25" stroke-width="3"/><circle cx="360" cy="205" r="112" fill="${accent}" opacity=".12"/><rect x="250" y="112" width="220" height="188" rx="36" fill="#fff" stroke="${accent}" stroke-width="6"/><text x="360" y="224" text-anchor="middle" font-family="sans-serif" font-size="92" font-weight="800" fill="${accent}">${item.icon || "□"}</text><text x="360" y="375" text-anchor="middle" font-family="sans-serif" font-size="38" font-weight="800" fill="#1f2937">${title}</text><text x="360" y="420" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="600" fill="#6b7280">${subtitle}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function installGiftStyle() {
    if (document.getElementById("giftListPatchStyle")) return;
    const style = document.createElement("style");
    style.id = "giftListPatchStyle";
    style.textContent = `
      #girlfriendPanel{overflow:hidden}.gift-summary{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;margin:4px 0 16px;padding:14px;border:1px solid var(--line);border-radius:14px;background:linear-gradient(135deg,#fff,#fff7ed)}
      .gift-summary strong{display:block;font-size:18px;margin-bottom:5px}.gift-summary p{margin:0;color:var(--muted);font-size:13px;line-height:1.55}.gift-progress-ring{min-width:76px;text-align:center;border-radius:999px;background:#0f766e;color:#fff;padding:12px 10px;font-weight:900}
      .gift-filter-row{display:flex;gap:7px;overflow:auto;padding:0 0 12px;scrollbar-width:none}.gift-filter-row::-webkit-scrollbar{display:none}.gift-filter-row button{white-space:nowrap}.gift-filter-row button.active{background:#0f766e;color:#fff;border-color:#0f766e}
      .gift-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.gift-card{display:flex;flex-direction:column;min-width:0;border:1px solid var(--line);border-radius:17px;background:#fff;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,.05)}.gift-card.done{border-color:#5eead4;background:#f0fdfa}.gift-card.done .gift-image img{filter:saturate(.82)}
      .gift-image{position:relative;aspect-ratio:16/10;background:#f8fafc;overflow:hidden}.gift-image img{width:100%;height:100%;object-fit:contain;display:block;padding:10px;box-sizing:border-box}.gift-status{position:absolute;top:10px;right:10px;display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:6px 9px;background:rgba(255,255,255,.94);box-shadow:0 3px 10px rgba(15,23,42,.12);font-size:12px;font-weight:900}.gift-status.done{background:#0f766e;color:#fff}
      .gift-card-body{display:flex;flex-direction:column;gap:11px;padding:14px;flex:1}.gift-title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:9px}.gift-title-row h3{font-size:17px;margin:0 0 3px;line-height:1.35}.gift-jp-name{display:block;color:var(--muted);font-size:11px;line-height:1.45}.gift-category{flex:none;border-radius:999px;padding:5px 8px;background:#f1f5f9;color:#475569;font-size:11px;font-weight:800}
      .gift-description{margin:0;color:#475569;font-size:13px;line-height:1.62}.gift-facts{display:grid;gap:8px}.gift-fact{display:grid;grid-template-columns:70px 1fr;gap:8px;font-size:12px;line-height:1.5}.gift-fact strong{color:#334155}.gift-fact span{color:#64748b}.gift-store-tags{display:flex;flex-wrap:wrap;gap:5px}.gift-store-tags span{border:1px solid #e2e8f0;border-radius:999px;padding:4px 7px;background:#f8fafc;color:#475569;font-size:11px}.gift-link-row{display:flex;flex-wrap:wrap;gap:7px}.gift-link-row a{font-size:12px}
      .gift-admin-box{display:grid;gap:9px;border-top:1px dashed var(--line);padding-top:11px}.gift-purchase-toggle{display:flex;align-items:center;gap:9px;padding:10px 11px;border:1px solid #cbd5e1;border-radius:11px;background:#f8fafc;font-size:13px;font-weight:900}.gift-purchase-toggle input{width:20px;height:20px;accent-color:#0f766e}.gift-purchase-fields{display:grid;grid-template-columns:1fr 1fr;gap:7px}.gift-purchase-fields input{min-width:0}.gift-purchase-fields textarea{grid-column:1/-1;min-height:68px}
      .gift-proof-section{display:grid;gap:8px}.gift-proof-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.gift-proof-head strong{font-size:13px}.gift-proof-head small{color:var(--muted)}.gift-proof-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.gift-proof-card{position:relative;aspect-ratio:1;border-radius:10px;overflow:hidden;background:#e2e8f0}.gift-proof-card img{display:block;width:100%;height:100%;object-fit:cover}.gift-proof-card button{position:absolute;top:4px;right:4px;padding:4px 7px;background:rgba(255,255,255,.94);font-size:10px}.gift-upload-label{display:flex;align-items:center;justify-content:center;gap:7px;border:1px dashed #94a3b8;border-radius:11px;padding:10px;background:#f8fafc;color:#334155;font-size:12px;font-weight:900;cursor:pointer}.gift-upload-label input{display:none}.gift-message{min-height:18px;margin:0;font-size:12px}.gift-empty{grid-column:1/-1;padding:24px;text-align:center;color:var(--muted)}.gift-custom-remove{align-self:flex-end}.gift-sync-note{margin:12px 0 0;color:var(--muted);font-size:11px;line-height:1.55}
      @media(max-width:760px){.gift-grid{grid-template-columns:1fr}.gift-summary{grid-template-columns:1fr auto}.gift-fact{grid-template-columns:64px 1fr}.gift-purchase-fields{grid-template-columns:1fr}.gift-purchase-fields textarea{grid-column:auto}}@media(max-width:420px){.gift-card-body{padding:12px}.gift-proof-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.gift-summary{padding:12px}.gift-progress-ring{min-width:66px}}
    `;
    document.head.appendChild(style);
  }

  let activeGiftFilter = "all";
  function setGiftMessage(card, message, tone = "") {
    const el = card?.querySelector("[data-gift-message]");
    if (!el) return;
    el.textContent = message || "";
    el.className = `gift-message ${tone}`.trim();
  }
  async function saveGiftFields(item, card) {
    if (role !== "admin") return;
    item.actualStore = safeText(card.querySelector("[data-gift-store]")?.value).slice(0, 100);
    item.actualPrice = safeText(card.querySelector("[data-gift-price]")?.value).slice(0, 60);
    item.purchaseNote = safeText(card.querySelector("[data-gift-note]")?.value).slice(0, 300);
    item.updatedAt = nowIso();
    try {
      setGiftMessage(card, "구매 정보를 저장하는 중입니다...");
      await saveState();
      setGiftMessage(card, "구매 정보를 저장했습니다.", "success");
      if (typeof flash === "function") flash("선물 정보 저장 완료");
    } catch (error) { setGiftMessage(card, error.message, "error"); }
  }
  async function toggleGift(item, checked, card) {
    if (role !== "admin") return;
    const before = { done: item.done, purchasedAt: item.purchasedAt, updatedAt: item.updatedAt };
    item.done = Boolean(checked);
    item.purchasedAt = item.done ? nowIso() : "";
    item.updatedAt = nowIso();
    try {
      setGiftMessage(card, "구매 상태를 저장하는 중입니다...");
      await saveState();
      render();
      if (typeof flash === "function") flash(item.done ? "구매 완료 처리" : "구매 전으로 변경");
    } catch (error) {
      Object.assign(item, before);
      renderGirlfriend();
      alert(error.message);
    }
  }
  async function uploadGiftProof(item, files, card) {
    if (role !== "admin") return;
    const list = Array.from(files || []);
    if (!list.length) return;
    try {
      setGiftMessage(card, `${list.length}장 업로드 중입니다...`);
      for (const file of list) {
        const dataUrl = await resizeImage(file);
        const result = await rpc("workshop_add_photo", {
          p_token: token,
          p_item_id: giftPhotoItemId(item),
          p_file_name: file.name || "gift-proof.jpg",
          p_mime_type: "image/jpeg",
          p_data_url: dataUrl,
          p_shared_with_family: false,
          p_shared_with_girlfriend: true
        });
        if (!result?.ok) throw new Error(result?.message || "구매 인증사진 업로드 실패");
        photos.push(result.photo);
      }
      if (!item.done) {
        item.done = true;
        item.purchasedAt = nowIso();
        item.updatedAt = nowIso();
        await saveState();
      }
      render();
      if (typeof flash === "function") flash("구매 인증사진 업로드 완료");
    } catch (error) { setGiftMessage(card, error.message, "error"); }
  }
  async function deleteGiftProof(photoId) {
    if (role !== "admin" || !photoId || !confirm("이 구매 인증사진을 삭제할까요?")) return;
    try {
      const result = await rpc("workshop_delete_photo", { p_token: token, p_photo_id: photoId });
      if (!result?.ok) throw new Error(result?.message || "사진 삭제 실패");
      photos = photos.filter((photo) => photo.id !== photoId);
      render();
    } catch (error) { alert(error.message); }
  }
  async function deleteCustomGift(item) {
    if (role !== "admin" || isDefaultGift(item) || !confirm(`${item.text}\n\n이 항목을 삭제할까요?`)) return;
    try {
      for (const photo of giftPhotos(item)) {
        const result = await rpc("workshop_delete_photo", { p_token: token, p_photo_id: photo.id });
        if (!result?.ok) throw new Error(result?.message || "첨부 사진 삭제 실패");
        photos = photos.filter((entry) => entry.id !== photo.id);
      }
      state.girlfriendRequests = state.girlfriendRequests.filter((entry) => entry.id !== item.id);
      await saveState();
      render();
    } catch (error) { alert(error.message); }
  }
  function createLink(label, url) {
    const link = document.createElement("a");
    link.className = "ghost small";
    link.href = url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = label;
    return link;
  }
  function renderProofGrid(container, item) {
    const rows = giftPhotos(item);
    if (!rows.length) return;
    const grid = document.createElement("div");
    grid.className = "gift-proof-grid";
    rows.forEach((photo) => {
      const card = document.createElement("div");
      card.className = "gift-proof-card";
      const link = document.createElement("a");
      link.href = photo.dataUrl || photo.data_url;
      link.target = "_blank";
      link.rel = "noreferrer";
      const img = document.createElement("img");
      img.src = photo.dataUrl || photo.data_url;
      img.alt = photo.fileName || photo.file_name || `${item.text} 구매 인증사진`;
      img.loading = "lazy";
      link.appendChild(img);
      card.appendChild(link);
      if (role === "admin") {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "ghost danger";
        remove.textContent = "삭제";
        remove.onclick = () => deleteGiftProof(photo.id);
        card.appendChild(remove);
      }
      grid.appendChild(card);
    });
    container.appendChild(grid);
  }
  function renderGiftCard(item) {
    const card = document.createElement("article");
    card.className = `gift-card ${item.done ? "done" : ""}`.trim();
    card.dataset.giftId = item.id;
    const imageBox = document.createElement("div");
    imageBox.className = "gift-image";
    const image = document.createElement("img");
    const fallback = makeArtData(item);
    image.src = item.imageUrl || fallback;
    image.alt = `${item.text} 대표 이미지`;
    image.loading = "lazy";
    image.onerror = () => { if (image.src !== fallback) image.src = fallback; };
    const status = document.createElement("span");
    status.className = `gift-status ${item.done ? "done" : ""}`.trim();
    status.textContent = item.done ? "✓ 구매 완료" : "구매 전";
    imageBox.append(image, status);
    const body = document.createElement("div");
    body.className = "gift-card-body";
    const titleRow = document.createElement("div");
    titleRow.className = "gift-title-row";
    const titleBox = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = item.text;
    const jpName = document.createElement("span");
    jpName.className = "gift-jp-name";
    jpName.textContent = item.jpName || "";
    titleBox.append(title, jpName);
    const category = document.createElement("span");
    category.className = "gift-category";
    category.textContent = item.category;
    titleRow.append(titleBox, category);
    const description = document.createElement("p");
    description.className = "gift-description";
    description.textContent = item.description;
    const facts = document.createElement("div");
    facts.className = "gift-facts";
    const priceFact = document.createElement("div");
    priceFact.className = "gift-fact";
    priceFact.innerHTML = `<strong>대략 가격</strong><span></span>`;
    priceFact.querySelector("span").textContent = item.price;
    const stockFact = document.createElement("div");
    stockFact.className = "gift-fact";
    stockFact.innerHTML = `<strong>구매 팁</strong><span></span>`;
    stockFact.querySelector("span").textContent = item.availability;
    const storeFact = document.createElement("div");
    storeFact.className = "gift-fact";
    const storeTitle = document.createElement("strong");
    storeTitle.textContent = "구매처";
    const storeTags = document.createElement("div");
    storeTags.className = "gift-store-tags";
    item.stores.forEach((store) => { const tag = document.createElement("span"); tag.textContent = store; storeTags.appendChild(tag); });
    storeFact.append(storeTitle, storeTags);
    facts.append(priceFact, stockFact, storeFact);
    const links = document.createElement("div");
    links.className = "gift-link-row";
    const mapSearch = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.searchQuery || item.text)}`;
    links.appendChild(createLink("지도에서 찾기", mapSearch));
    if (item.officialUrl) links.appendChild(createLink("제품·공식 정보", item.officialUrl));
    body.append(titleRow, description, facts, links);
    const proof = document.createElement("section");
    proof.className = "gift-proof-section";
    const proofHead = document.createElement("div");
    proofHead.className = "gift-proof-head";
    const proofTitle = document.createElement("strong");
    proofTitle.textContent = "구매 인증사진";
    const proofCount = document.createElement("small");
    proofCount.textContent = `${giftPhotos(item).length}장`;
    proofHead.append(proofTitle, proofCount);
    proof.appendChild(proofHead);
    renderProofGrid(proof, item);
    if (!giftPhotos(item).length) {
      const empty = document.createElement("small");
      empty.className = "muted";
      empty.textContent = item.done ? "구매 완료로 표시됐지만 인증사진은 아직 없습니다." : "구매 후 사진을 올리면 여자친구 계정에서도 확인할 수 있습니다.";
      proof.appendChild(empty);
    }
    body.appendChild(proof);
    if (role === "admin") {
      const admin = document.createElement("div");
      admin.className = "gift-admin-box";
      const toggle = document.createElement("label");
      toggle.className = "gift-purchase-toggle";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = Boolean(item.done);
      checkbox.onchange = () => toggleGift(item, checkbox.checked, card);
      const toggleText = document.createElement("span");
      toggleText.textContent = item.done ? `구매 완료${item.purchasedAt ? ` · ${new Date(item.purchasedAt).toLocaleDateString("ko-KR")}` : ""}` : "구매 완료로 표시";
      toggle.append(checkbox, toggleText);
      const fields = document.createElement("div");
      fields.className = "gift-purchase-fields";
      const store = document.createElement("input");
      store.dataset.giftStore = "";
      store.placeholder = "실제 구매처 (선택)";
      store.value = item.actualStore || "";
      const price = document.createElement("input");
      price.dataset.giftPrice = "";
      price.placeholder = "실제 가격 (예: ¥398)";
      price.value = item.actualPrice || "";
      const note = document.createElement("textarea");
      note.dataset.giftNote = "";
      note.placeholder = "색상·맛·대체품 등 구매 메모 (선택)";
      note.value = item.purchaseNote || "";
      fields.append(store, price, note);
      const actions = document.createElement("div");
      actions.className = "button-row";
      const save = document.createElement("button");
      save.type = "button";
      save.className = "ghost small";
      save.textContent = "구매 정보 저장";
      save.onclick = () => saveGiftFields(item, card);
      const upload = document.createElement("label");
      upload.className = "gift-upload-label";
      upload.textContent = "＋ 구매 인증사진 첨부";
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.multiple = true;
      input.onchange = async () => { await uploadGiftProof(item, input.files, card); input.value = ""; };
      upload.appendChild(input);
      actions.append(save, upload);
      if (!isDefaultGift(item)) {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "ghost danger small gift-custom-remove";
        remove.textContent = "항목 삭제";
        remove.onclick = () => deleteCustomGift(item);
        actions.appendChild(remove);
      }
      const message = document.createElement("p");
      message.className = "gift-message";
      message.dataset.giftMessage = "";
      admin.append(toggle, fields, actions, message);
      body.appendChild(admin);
    }
    card.append(imageBox, body);
    return card;
  }

  renderGirlfriend = function () {
    const panel = document.getElementById("girlfriendPanel");
    const list = document.getElementById("girlfriendList");
    if (!panel || !list) return;
    state.girlfriendRequests = normalizeGiftList(state.girlfriendRequests);
    list.className = "gift-grid";
    list.replaceChildren();
    let summary = panel.querySelector(".gift-summary");
    if (!summary) {
      summary = document.createElement("div");
      summary.className = "gift-summary";
      panel.insertBefore(summary, list);
    }
    const total = state.girlfriendRequests.length;
    const done = state.girlfriendRequests.filter((item) => item.done).length;
    const percent = total ? Math.round(done / total * 100) : 0;
    summary.innerHTML = `<div><strong>선물 구매 진행 ${done}/${total}</strong><p>각 제품의 대표 이미지, 구매처, 예상 가격과 인증사진을 한 카드에서 관리합니다.</p></div><div class="gift-progress-ring">${percent}%</div>`;
    let filters = panel.querySelector(".gift-filter-row");
    if (!filters) {
      filters = document.createElement("div");
      filters.className = "gift-filter-row";
      panel.insertBefore(filters, list);
    }
    filters.replaceChildren();
    [["all", `전체 ${total}`], ["todo", `구매 전 ${total - done}`], ["done", `구매 완료 ${done}`]].forEach(([key, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `ghost small ${activeGiftFilter === key ? "active" : ""}`.trim();
      button.textContent = label;
      button.onclick = () => { activeGiftFilter = key; renderGirlfriend(); };
      filters.appendChild(button);
    });
    const visible = state.girlfriendRequests.filter((item) => activeGiftFilter === "all" || (activeGiftFilter === "done" ? item.done : !item.done));
    if (!visible.length) {
      const empty = document.createElement("div");
      empty.className = "gift-empty";
      empty.textContent = activeGiftFilter === "done" ? "아직 구매 완료된 선물이 없습니다." : "남은 구매 항목이 없습니다. 임무 완료입니다.";
      list.appendChild(empty);
    } else visible.forEach((item) => list.appendChild(renderGiftCard(item)));
    let note = panel.querySelector(".gift-sync-note");
    if (!note) {
      note = document.createElement("p");
      note.className = "gift-sync-note";
      panel.appendChild(note);
    }
    note.textContent = role === "admin" ? "구매 상태와 인증사진은 Supabase에 저장되며 여자친구 계정에 바로 공유됩니다. 가족 계정에는 표시하지 않습니다." : "구매 상태와 인증사진은 관리자가 업데이트하면 이 화면에 동기화됩니다.";
  };

  if (originalCollectTimelineItems) {
    collectTimelineItems = function () {
      const items = originalCollectTimelineItems();
      items.forEach((entry) => {
        if (entry.type !== "사진") return;
        const photo = (photos || []).find((item) => (item.dataUrl || item.data_url) === entry.image);
        const photoItemId = photo?.itemId || photo?.item_id || "";
        if (!photoItemId.startsWith("gift:")) return;
        const gift = (state.girlfriendRequests || []).find((item) => giftPhotoItemId(item) === photoItemId);
        if (gift) {
          entry.type = "선물 인증";
          entry.title = `${gift.text} 구매 인증`;
          entry.text = gift.actualStore || gift.price || "여자친구 부탁 선물";
        }
      });
      return items;
    };
  }

  const form = document.getElementById("girlfriendAddForm");
  if (form) {
    form.onsubmit = async (event) => {
      event.preventDefault();
      if (role !== "admin") return;
      const input = document.getElementById("girlfriendAddInput");
      const text = safeText(input?.value).slice(0, 100);
      if (!text) return;
      const item = normalizeGiftItem({ id: makeId("g").slice(0, 27), text, description: "직접 추가한 부탁 선물입니다. 구매처와 가격은 현장에서 확인해주세요.", price: "가격 확인 필요", stores: ["구매처 확인 필요"], availability: "재고 확인 필요", done: false, updatedAt: nowIso() });
      state.girlfriendRequests = normalizeGiftList([...(state.girlfriendRequests || []), item]);
      input.value = "";
      try { await saveState(); render(); } catch (error) { alert(error.message); }
    };
  }

  installGiftStyle();
  if (typeof state !== "undefined") state.girlfriendRequests = normalizeGiftList(state.girlfriendRequests);
  if (typeof renderGirlfriend === "function") renderGirlfriend();
})();
