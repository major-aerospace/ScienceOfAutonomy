// Canvas-based takeaway card generator for Reels/Shorts/Stories.
// Produces a downloadable PNG with the lesson hook + takeaway + hashtags
// laid out in the Science of Autonomy "Apple-grade" minimalist style.

const PALETTE = {
  bg: "#0A0A0A",
  ink: "#FFFFFF",
  accent: "#0047FF",
  mute: "#8E8E93",
  rule: "#1F1F1F",
};

const FORMATS = {
  square: { w: 1080, h: 1080, label: "1080 × 1080 · Square" },
  vertical: { w: 1080, h: 1920, label: "1080 × 1920 · Reels / Shorts" },
};

function wrap(ctx, text, maxWidth) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawText(ctx, text, x, y, maxW, lineH) {
  const lines = wrap(ctx, text, maxW);
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * lineH);
  }
  return y + lines.length * lineH;
}

function drawNoise(ctx, w, h, alpha = 0.05) {
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = Math.round(alpha * 255);
  }
  ctx.putImageData(img, 0, 0);
}

export function renderTakeawayCard({ format = "square", lessonTitle, clip, trackId }) {
  const fmt = FORMATS[format] || FORMATS.square;
  const canvas = document.createElement("canvas");
  canvas.width = fmt.w;
  canvas.height = fmt.h;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, fmt.w, fmt.h);

  // Subtle film-grain
  drawNoise(ctx, fmt.w, fmt.h, 0.04);

  // Accent corner bar
  ctx.fillStyle = PALETTE.accent;
  ctx.fillRect(80, 80, 12, 96);

  const pad = 80;
  const innerW = fmt.w - pad * 2;

  // Header label
  ctx.fillStyle = PALETTE.accent;
  ctx.font = "700 26px 'Outfit', sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText("SCIENCE OF AUTONOMY · TAKEAWAY", 120, 86);

  // Hook (the giant headline)
  ctx.fillStyle = PALETTE.ink;
  const hookSize = fmt.h >= 1700 ? 110 : 86;
  ctx.font = `900 ${hookSize}px 'Outfit', sans-serif`;
  const hookStart = fmt.h >= 1700 ? 360 : 240;
  const afterHook = drawText(ctx, clip?.hook || lessonTitle || "", pad, hookStart, innerW, hookSize * 1.05);

  // Thin rule
  ctx.fillStyle = PALETTE.rule;
  ctx.fillRect(pad, afterHook + 40, innerW, 2);

  // Body / takeaway
  ctx.fillStyle = PALETTE.ink;
  const bodySize = fmt.h >= 1700 ? 44 : 36;
  ctx.font = `400 ${bodySize}px 'Outfit', sans-serif`;
  const bodyY = afterHook + 90;
  const afterBody = drawText(ctx, clip?.takeaway || clip?.coreIdea || "", pad, bodyY, innerW, bodySize * 1.35);

  // Hashtags
  ctx.fillStyle = PALETTE.mute;
  ctx.font = "500 24px 'Outfit', sans-serif";
  const tags = (clip?.hashtags || []).join("  ");
  drawText(ctx, tags, pad, afterBody + 60, innerW, 32);

  // Footer brand
  ctx.fillStyle = PALETTE.mute;
  ctx.font = "700 22px 'Outfit', sans-serif";
  const footY = fmt.h - 80;
  ctx.fillText("SCIENCEOFAUTONOMY.APP", pad, footY);
  ctx.textAlign = "right";
  ctx.fillText((trackId || "").replace("track-", "").toUpperCase(), fmt.w - pad, footY);
  ctx.textAlign = "left";

  return canvas;
}

export function downloadCard({ format = "square", lessonId, lessonTitle, clip, trackId }) {
  const canvas = renderTakeawayCard({ format, lessonTitle, clip, trackId });
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `${lessonId}_${format}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export const CARD_FORMATS = FORMATS;
