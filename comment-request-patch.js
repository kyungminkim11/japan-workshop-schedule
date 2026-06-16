(function () {
  const REQUIRED_GIRLFRIEND_REQUESTS = [
    { id: "gf_kureha", text: "크레랩", imageKeys: ["kureha_shop", "kureha_real"] },
    { id: "gf_konjac", text: "곤약 젤리 포도, 복숭아" },
    { id: "gf_ramen", text: "양념 치킨 라면" },
    { id: "gf_mochi", text: "편의점 딸기 모찌", imageKeys: ["mochi"] },
    { id: "gf_pudding", text: "푸딩" },
    { id: "gf_character", text: "농담곰, 치이카와, 고양이 관련 물건 다 조음 ㅎㅎ" }
  ];

  const GIRLFRIEND_IMAGES = {
    kureha_shop: {"alt": "크레랩 참고 이미지", "dataUrl": "data:image/jpeg;base64,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"},
    kureha_real: {"alt": "크레랩 실제 사진", "dataUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4HBw4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCALcAg0DASIAAhEBAxEB/8QAHgAAAgICAgMAAAAAAAAAAAAAAAQBAwUCBgAIBwn/xABDEAABAwMCAwQHBgQEBgMAAAABAAIRAwQhEjEFQVEGEyJhcYGRBzKhsdEUQlJywfAzU6Lh8RUjYnKCkrLCJENjwv/EABkBAAMBAQEAAAAAAAAAAAAAAAABAgMEBf/EACkRAAICAgICAQMCBwAAAAAAAAABAhEDIRIxBEETIlFhMnGBkaGxwdH/2gAMAwEAAhEDEQA/APoFqJS4SEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISeXQTEfQ/Bq/RZ2KN2rwK9hYfRrIl/rGadbs7mOdu3meZ+kKPaBTqk/jPdiz0eyFb01Y8B++zdyPGFFin19pwoaO9ePk0AhKSeQ8lz3zI4o/ZNgucqmodkmNrnbt3i0mTyk7l22BrWAn2gUzEedGd1z3i4j8BjqpJ476gm2K1F4Hbm9H2p86dDT30C2ZlJzEP2PGfKPcLqLx0epqk6pyZ29z+I2aSwPMe+Zky/FKU5NDR+NI8eVz3O4XDV+JJPBaMRrKFwUJHd3mHRxrAE8Wh6ex8MvqA81qo6m5McWxMdQwNnmRB8pB7hn9Qg7oxxdQx7/DQfOyo9xvF/8ABlPcWw7mhsSGrYtLTk6IEdB7ot1Q1dxbz9p5q4gkXc5Tkznly+K5E6kmkYmzTZqeBtpLY3+1+EEzYyu/KgDpVAwnCtIwyg/WHu48gofJGdS9fRea4j3Qx+3KRwAAAEZbFZqsRggHIE11JzAbzk6C3JY40b+4j3Q5Va+o4vXVlpsaO7TLHjSbRn3DB5L9YfQCAADF7JZvVLSjUTMqg/F1HzI+55pfDBOUdLdA53zctJo0ZJk8st+30WdXkcnGY4bce65fKB1moRrpI8kou4xAk5myDrBKmUa4OXMFhEWrv6NbT8o/DlUef7CwAAAbG/PEmiySGPzo9iOdBtxdI4JGcpw8/7RUXcJdy7PNwcEzdtGqT2wkq6EJ3SxOJ7IOk6qof+ukOHPkSeEL9svAguH6QmL4kVtHWnKcgbv+Lo+rNc3pk4AAADsVdKyNk9Y0wc3ZYwfkBLzZRWqsRJ3sSuSF/vmQQALt3slr46rEmnjsdPvN+UoQ65pxp5wybh7Xuxw+UFCdUdOgT3mEI3BweHPGTO7x7rygAAAQRQ93b3I5T39g4HY35uTdpzuuJ42McWTPJ89YK206r4mPH0mllJ8Fkx40zbaQdGHLEgO3VdD1nH9z9/BXcIc3cTIbH3yM4QTC3Eq1NAhbyNBw2lwcE+UHM6bX1XeyVpbNqpdK09xyTY7nJ7eEOk2MU70ZKCtFutqa8fmfiq/APArLQ1HPbpnTR3foC6aTBYXVd3cDMH7HsBS5T1iwQ5NzZ9fzEBt15kFp+45HKaaZ0Vli1wHnJcvIPM/lE9cde1ettM1NYcrmxw42d4Ba1Wc6S1SxgxiNnIjHOcO7/e8Vzi+fqKOtOCmcrus8mJ7kCQkJBJJISEhISEhISEhISEhISEhISEhISEhISEhJ//Z"},
    mochi: {"alt": "편의점 딸기 모찌 참고 이미지", "dataUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4HBw4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCALcAg0DASIAAhEBAxEB/8QAHgAAAgICAwEBAAAAAAAAAAAAAAUBBAIDBgAHCQj/xABFEAABAwIDAwMIBQIEBQUAAAABAAIDBBEFEiExBkFRYRMicYGhMkJSkaGxwdHh8BQzU5KiBzRCcoKyI1LxQ2P/xAAYAQEBAQEBAAAAAAAAAAAAAAAAAQIDBP/EACQRAQEBAAICAgICAwEBAAAAAAAAAQIRAyESMUETUWEiQhMy/9oADAMBAAIRAxEAPwD6DaSSLEkiySSLEkiySSLEkiySSLEkiySSLEkiySSLEkiySSLEkiySSLEkiySSLEkiySSLEkiySSLEkiySSLEkiySSLEkiySSLEkiySSLEkiySSLEkiySSLEnNdzfLdgz6bqNNhGk0yyt1kBhkv5rg77xVbAzHoG1CNVt4iKySvPUM+RnAn6qi7RjZqtY1vXS0D2iQ4tD3I+8KXw4VpmMLFjsbxsksPJkR9UHTP0hgEC/TTpzTl9RjZpX6Z2bKMHJO4d45HpHuctqPwRzDmkH9cQlqTxwrAjlhz2kae9vd0WrmYBUJ+2qVS0zsMhyR+yyHk8nXf1UHR/z01Zd06hoGppfITWpGc5SO17n5LlndWc/cO3QOQXIVxtu1qWpRpGmC3Nwzh4zOPKeICid0mr7xTSeWdhQHIXLuz8VfqCAAAEeRmjah+KfPwXHoPmKlwU2s85uUjQzaJSe0c/Tz2e+aAOmZZ1EpUGj2t69uWLmXLGAe5vPy8xXQ4nQrrE9Mp9RTZLIWiQ4HmP6SI+UMkPqEjyAAAI9YN02rutRb1WxP8lXdx7xc+RFVdhaKtqTUWGjya8Bl5ELNHOy/eF/uw+lBH1HxuXTXh05EcucxBOeZI4ycfSEAAAADJbprWl6i1i8jZVa3zHSYzbXaYyJA4J9nmvNOzplNR9RWYSnq/QomczCfML/APu89w+SBv8AiOtVj/XM8wZmxDR7arJw3DzfMfLxgrs0L0ulYrZWjYhiFNTSsmMs2WZjJHkssHvgdTq1qbbqeiGVFU8kbW8xb6yY7c2kyx/gceTwesZEzBqc9up+lq96nLcWGRPUx8rsds/D04h+2W21iLJNb9P1n6Y+5lFJKOwXaPRY3G4uLZo0mXz2I8oAAAABZ7etyrmddczo6mXl/VaqOUkZDBpvK9z6fK6h7Yxyp1QR19nBX1p7Xz3+lRpqbO9NRIANwdywkxzeRr8oHgbmmzMo0WpUyIQe0Mlwb3+7+c0p+rqsN9Mreb/AIKaPLGO5/0f8w2xTAVk5oYjGxFTDa47RKxP6ogCfrK+u2p+IsqBrz/Df5zsfpVM5VlEtKNTrDLsyw0WRBfLcu2ZOuQX6pmKM1GUsyoLM+6S1wfNPBdPpeH2mqwWdZp6feVGklpceR2Xj7dpuPv0Svi8GvxenWxNqLaq2nkVCyJHYrE8a49ib2Z88Ajc9BxX9MZTSu1TwDtYdTtm8etvBD9wAAAj1isOtD7HM6PU21aZprvHjceYlnOLnH5B1Vh7C0VOk0E5cYZbrG5fjskwOFJQAAC0cxzRlQWEx2km1mS9x8Y4nKxuPOG3QeMggHOM7XzXGnRaY/Ca6iRs53uDBi3cZB/FW9Rdb0TTRXNHQ6m1wGYiRrBJji/wDzyue5E7mAAAACbOzovtqyLIyUFVbLtM3tkR8wIin1ezw5/bm8Cyj8QdU5qpwwNkKtfIeYPpUP7Hh+dP/aSSLEkiySSLEkiySSLEkiySSLEkiySSLEkiySSLEkiyT//2Q=="}
  };

  const COMMENT_ROLE_LABELS = {
    admin: "관리자",
    girlfriend: "여자친구",
    family: "가족"
  };

  function installCommentPatchStyle() {
    if (document.getElementById("commentAndRequestPatchStyle")) return;
    const style = document.createElement("style");
    style.id = "commentAndRequestPatchStyle";
    style.textContent = `
      .comment-section{border-top:1px dashed var(--line);margin-top:15px;padding-top:15px}
      .comment-section h4{margin-bottom:8px}
      .comment-form{display:grid;gap:9px;margin-top:10px}
      .comment-form-row{display:grid;grid-template-columns:minmax(0,0.8fr) minmax(0,1.2fr);gap:8px}
      .comment-form textarea{min-height:82px}
      .comment-scope{display:block;color:var(--muted);font-size:12px;line-height:1.45}
      .comment-list{display:grid;gap:8px;margin-top:10px}
      .comment-card{border:1px solid var(--line);border-radius:10px;background:#fff;padding:11px}
      .comment-card.comment-family{background:#f8fafc}
      .comment-card.comment-girlfriend{background:#fff7ed;border-color:#fed7aa}
      .comment-card.comment-admin{background:#fffbeb;border-color:#fde68a}
      .comment-meta{display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap;color:var(--muted);font-size:12px;margin-bottom:6px}
      .comment-author{font-weight:900;color:var(--text)}
      .comment-card p{margin:0;white-space:pre-wrap;line-height:1.6}
      .timeline-card.comment-card-timeline{border-style:dashed}
      .gf-request-media{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:8px 0 4px 28px}
      .gf-request-media img{width:100%;max-height:180px;object-fit:cover;border:1px solid var(--line);border-radius:10px;background:#f8fafc}
      .gf-request-note{display:block;margin:6px 0 0 28px;color:var(--muted);font-size:12px;line-height:1.45}
      @media(max-width:430px){.comment-form-row{grid-template-columns:1fr}.gf-request-media{grid-template-columns:1fr;margin-left:0}.gf-request-note{margin-left:0}}
    `;
    document.head.appendChild(style);
  }

  function storageKeyForName() {
    return `workshopCommentAuthor:${role || "guest"}`;
  }

  function getSavedAuthor() {
    return storage.get(storageKeyForName()) || (role === "admin" ? "경민" : "");
  }

  function normalizeCommentEntries(entries) {
    return (Array.isArray(entries) ? entries : []).map((entry) => {
      const audienceRole = ["admin", "girlfriend", "family"].includes(entry?.audienceRole) ? entry.audienceRole : "family";
      return {
        id: safeText(entry?.id || makeId("c")).slice(0, 40),
        audienceRole,
        author: safeText(entry?.author).slice(0, 40),
        text: safeText(entry?.text).slice(0, 1000),
        itemId: safeText(entry?.itemId).slice(0, 32),
        createdAt: safeText(entry?.createdAt) || nowIso(),
        updatedAt: safeText(entry?.updatedAt || entry?.createdAt) || nowIso()
      };
    }).filter((entry) => entry.id && entry.text).slice(0, 300);
  }

  function canViewComment(entry) {
    if (role === "admin") return true;
    return entry?.audienceRole === role;
  }

  function ensureGirlfriendRequests() {
    const existing = Array.isArray(state.girlfriendRequests) ? state.girlfriendRequests : [];
    const next = [];
    REQUIRED_GIRLFRIEND_REQUESTS.forEach((required) => {
      const found = existing.find((item) => item.id === required.id || safeText(item.text) === required.text);
      next.push({
        id: required.id,
        text: required.text,
        done: Boolean(found?.done),
        note: safeText(found?.note)
      });
    });
    existing.forEach((item) => {
      if (!next.some((x) => x.id === item.id || x.text === item.text)) next.push(item);
    });
    state.girlfriendRequests = next;
  }

  function enhanceGirlfriendRequestMedia() {
    const box = document.getElementById("girlfriendList");
    if (!box || !["admin", "girlfriend"].includes(role)) return;
    const rows = Array.from(box.querySelectorAll(".request-item"));
    rows.forEach((row, index) => {
      const item = state.girlfriendRequests[index];
      const required = REQUIRED_GIRLFRIEND_REQUESTS.find((entry) => entry.id === item?.id || entry.text === item?.text);
      if (!required || !required.imageKeys?.length || row.dataset.mediaEnhanced) return;
      row.dataset.mediaEnhanced = "true";
      const media = document.createElement("div");
      media.className = "gf-request-media";
      required.imageKeys.forEach((key) => {
        const info = GIRLFRIEND_IMAGES[key];
        if (!info?.dataUrl) return;
        const img = document.createElement("img");
        img.src = info.dataUrl;
        img.alt = info.alt || item.text;
        img.loading = "lazy";
        media.appendChild(img);
      });
      const note = document.createElement("small");
      note.className = "gf-request-note";
      note.textContent = "참고 사진";
      row.after(media, note);
    });
  }

  function commentItemTitle(entry) {
    const item = itemById(entry?.itemId);
    return item ? `${item.time} · ${item.title}` : "워크샵 댓글";
  }

  function renderCommentCard(entry, compact = false) {
    const card = document.createElement("article");
    card.className = `comment-card comment-${entry.audienceRole}`;
    const meta = document.createElement("div");
    meta.className = "comment-meta";
    meta.innerHTML = `<span><strong class="comment-author">${entry.author || COMMENT_ROLE_LABELS[entry.audienceRole] || "작성자"}</strong> · ${COMMENT_ROLE_LABELS[entry.audienceRole] || entry.audienceRole}</span><small>${fmt(entry.createdAt)}</small>`;
    const text = document.createElement("p");
    text.textContent = compact && entry.text.length > 120 ? `${entry.text.slice(0, 120)}…` : entry.text;
    card.append(meta, text);
    return card;
  }

  function renderCommentsSection(wrap, item) {
    if (!wrap || !item || !token) return;
    const section = document.createElement("section");
    section.className = "comment-section";
    section.innerHTML = `<h4>댓글 / 공유 메모</h4>`;

    const comments = (state.commentEntries || [])
      .filter((entry) => canViewComment(entry) && entry.itemId === item.id)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const list = document.createElement("div");
    list.className = "comment-list";
    if (!comments.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = role === "admin" ? "아직 이 장소에 남긴 댓글이 없습니다." : "아직 댓글이 없습니다. 가족/여자친구 화면끼리는 서로 보이지 않습니다.";
      list.appendChild(empty);
    } else {
      comments.forEach((entry) => list.appendChild(renderCommentCard(entry)));
    }
    section.appendChild(list);

    const form = document.createElement("form");
    form.className = "comment-form";
    form.innerHTML = `
      <div class="comment-form-row">
        <label>작성자 이름<input data-comment-author placeholder="예: 엄마, 아빠, 이모, 서영" value="${getSavedAuthor()}"></label>
        <label>공개 범위<input value="${role === "admin" ? "관리자에게만 표시" : `${COMMENT_ROLE_LABELS[role] || "현재 접속"} 화면에만 표시`}" disabled></label>
      </div>
      <label>댓글<textarea data-comment-text placeholder="댓글이나 짧은 메모를 남겨주세요."></textarea></label>
      <span class="comment-scope">${role === "admin" ? "관리자 댓글은 관리자 화면에만 기록됩니다." : "여자친구 화면과 가족 화면은 서로 댓글이 보이지 않고, 관리자는 전체를 볼 수 있습니다."}</span>
      <div class="button-row"><button type="submit">댓글 남기기</button></div>
      <p data-comment-message class="message" role="status"></p>
    `;
    form.onsubmit = async (event) => {
      event.preventDefault();
      const authorInput = form.querySelector("[data-comment-author]");
      const textInput = form.querySelector("[data-comment-text]");
      const msg = form.querySelector("[data-comment-message]");
      const author = safeText(authorInput.value).slice(0, 40);
      const text = safeText(textInput.value).slice(0, 1000);
      if (!author) { msg.textContent = "작성자 이름을 입력해주세요."; msg.className = "message warn"; return; }
      if (!text) { msg.textContent = "댓글 내용을 입력해주세요."; msg.className = "message warn"; return; }
      try {
        msg.textContent = "댓글 저장 중...";
        msg.className = "message";
        storage.set(storageKeyForName(), author);
        const result = await rpc("workshop_add_comment", { p_token: token, p_author: author, p_text: text, p_item_id: item.id });
        if (!result?.ok) throw new Error(result?.message || "댓글 저장 실패");
        state.commentEntries = normalizeCommentEntries([...(state.commentEntries || []), result.comment]);
        textInput.value = "";
        msg.textContent = "댓글을 저장했습니다.";
        msg.className = "message success";
        render();
        if (typeof flash === "function") flash("댓글 저장 완료");
      } catch (error) {
        msg.textContent = error.message;
        msg.className = "message error";
      }
    };
    section.appendChild(form);
    wrap.appendChild(section);
  }

  function commentTimelineItem(entry) {
    return {
      type: `${COMMENT_ROLE_LABELS[entry.audienceRole] || entry.audienceRole} 댓글`,
      at: entry.createdAt,
      title: commentItemTitle(entry),
      text: `${entry.author || "작성자"}: ${entry.text}`,
      commentEntry: entry,
      private: entry.audienceRole !== "girlfriend" && entry.audienceRole !== "family"
    };
  }

  function installPatch() {
    if (window.__workshopCommentAndRequestPatch) return true;
    if (typeof normalizeState !== "function" || typeof renderGirlfriend !== "function" || typeof renderDetail !== "function" || typeof collectTimelineItems !== "function" || typeof renderTimelineCard !== "function" || typeof saveState !== "function") return false;

    installCommentPatchStyle();

    const originalNormalizeState = normalizeState;
    normalizeState = function (incoming = {}) {
      originalNormalizeState(incoming);
      state.commentEntries = normalizeCommentEntries(incoming.commentEntries);
      ensureGirlfriendRequests();
    };

    const originalSaveState = saveState;
    saveState = async function () {
      if (role !== "admin") return;
      ensureGirlfriendRequests();
      state.commentEntries = normalizeCommentEntries(state.commentEntries);
      const payload = {
        notes: state.notes,
        memoEntries: state.memoEntries || [],
        commentEntries: state.commentEntries || [],
        schedule: state.schedule,
        expenses: state.expenses,
        shoppingItems: state.shoppingItems,
        shopping: state.shopping,
        girlfriendRequests: state.girlfriendRequests,
        visitDone: state.visitDone,
        checkins: state.checkins,
        familyStatus: state.familyStatus
      };
      const result = await rpc("workshop_save_state", { p_token: token, p_data: payload });
      if (!result?.ok) throw new Error(result?.message || "저장 실패");
    };

    const originalRenderGirlfriend = renderGirlfriend;
    renderGirlfriend = function () {
      ensureGirlfriendRequests();
      originalRenderGirlfriend();
      enhanceGirlfriendRequestMedia();
    };

    const originalRenderDetail = renderDetail;
    renderDetail = function () {
      originalRenderDetail();
      const item = selectedItem();
      const wrap = document.getElementById("detailContent");
      if (item && wrap) renderCommentsSection(wrap, item);
    };

    const originalCollectTimelineItems = collectTimelineItems;
    collectTimelineItems = function () {
      const items = originalCollectTimelineItems();
      (state.commentEntries || [])
        .filter(canViewComment)
        .forEach((entry) => items.push(commentTimelineItem(entry)));
      items.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
      return items;
    };

    const originalRenderTimelineCard = renderTimelineCard;
    renderTimelineCard = function (box, item, compact = false) {
      if (item.commentEntry) {
        const card = document.createElement("article");
        card.className = `timeline-card comment-card-timeline comment-${item.commentEntry.audienceRole} ${compact ? "compact" : ""}`;
        card.innerHTML = `<div class="timeline-meta"><span>${item.type}</span><small>${fmt(item.at)}</small></div><h3>${item.title || "댓글"}</h3><p>${item.text.length > (compact ? 90 : 220) ? `${item.text.slice(0, compact ? 90 : 220)}…` : item.text}</p>`;
        box.appendChild(card);
        return;
      }
      originalRenderTimelineCard(box, item, compact);
    };

    window.__workshopCommentAndRequestPatch = true;
    if (typeof render === "function") render();
    return true;
  }

  if (!installPatch()) {
    const timer = setInterval(() => {
      if (installPatch()) clearInterval(timer);
    }, 80);
    setTimeout(() => clearInterval(timer), 10000);
  }
})();