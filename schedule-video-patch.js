(function () {
  function mediaSource(media) {
    return media && (media.dataUrl || media.data_url || media.url) || "";
  }

  function mediaMime(media) {
    return String(media && (media.mimeType || media.mime_type) || "");
  }

  function isVideo(media) {
    return mediaMime(media).startsWith("video/") || String(mediaSource(media)).startsWith("data:video/");
  }

  function installStyle() {
    if (document.getElementById("scheduleVideoPatchStyle")) return;
    const style = document.createElement("style");
    style.id = "scheduleVideoPatchStyle";
    style.textContent = `
      .photo-card video,
      .timeline-card video {
        display: block;
        width: 100%;
        max-height: 520px;
        border-radius: 10px;
        background: #000;
        object-fit: contain;
      }
      .photo-card video { aspect-ratio: 1 / 1; }
      .timeline-card video { margin-top: 10px; }
    `;
    document.head.appendChild(style);
  }

  function install() {
    if (window.__workshopScheduleVideoPatch) return true;
    if (typeof renderPhotos !== "function" || typeof renderTimelineCard !== "function" || typeof render !== "function") return false;

    installStyle();

    renderPhotos = function (wrap, item) {
      const sec = document.createElement("section");
      sec.className = "mini-section";
      sec.innerHTML = `<h4>${role === "admin" ? "사진·영상" : "공유 사진·영상"}</h4>`;
      const rows = (photos || []).filter((media) => (media.itemId || media.item_id) === item.id);

      if (!rows.length) {
        sec.innerHTML += `<p class="muted">${role === "admin" ? "아직 업로드한 사진이나 영상이 없습니다." : "공유된 사진이나 영상이 없습니다."}</p>`;
      } else {
        const grid = document.createElement("div");
        grid.className = "photos";
        rows.forEach((media) => {
          const src = mediaSource(media);
          if (!src) return;
          const card = document.createElement("div");
          card.className = "photo-card";

          if (isVideo(media)) {
            const video = document.createElement("video");
            video.src = src;
            video.controls = true;
            video.playsInline = true;
            video.preload = "metadata";
            card.appendChild(video);
          } else {
            const img = document.createElement("img");
            img.src = src;
            img.alt = media.fileName || media.file_name || "워크샵 사진";
            img.loading = "lazy";
            card.appendChild(img);
          }

          if (role === "admin") {
            const meta = document.createElement("small");
            const kind = isVideo(media) ? "영상" : "사진";
            meta.textContent = `${kind} · ${media.sharedWithFamily || media.shared_with_family ? "가족공유" : "가족숨김"} · ${media.sharedWithGirlfriend || media.shared_with_girlfriend ? "여친공유" : "여친숨김"}`;
            const del = document.createElement("button");
            del.className = "ghost";
            del.type = "button";
            del.textContent = "삭제";
            del.onclick = () => deletePhoto(media.id);
            card.append(meta, del);
          }
          grid.appendChild(card);
        });
        sec.appendChild(grid);
      }
      wrap.appendChild(sec);
    };

    const oldTimelineCard = renderTimelineCard;
    renderTimelineCard = function (box, item, compact = false) {
      const before = box.children.length;
      const result = oldTimelineCard.apply(this, arguments);
      if (!compact && item && String(item.image || "").startsWith("data:video/")) {
        const card = box.children[before] || box.lastElementChild;
        const image = card && card.querySelector("img");
        if (image) {
          const video = document.createElement("video");
          video.src = item.image;
          video.controls = true;
          video.playsInline = true;
          video.preload = "metadata";
          image.replaceWith(video);
        }
      }
      return result;
    };

    window.__workshopScheduleVideoPatch = true;
    setTimeout(() => { if (typeof render === "function") render(); }, 0);
    return true;
  }

  if (!install()) {
    const timer = setInterval(() => { if (install()) clearInterval(timer); }, 100);
    setTimeout(() => clearInterval(timer), 15000);
  }
})();
