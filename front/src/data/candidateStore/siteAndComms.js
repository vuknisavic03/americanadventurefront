// front/src/data/candidateStore/siteAndComms.js
// Sinhronizacija obaveštenja, FAQ-a i sadržaja sajta sa backendom

export async function saveAnnouncementWithBackend(announcement) {
  try {
    const res = await fetch("/api/public/portal-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "saveAnnouncement",
        payload: announcement,
      }),
    });
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      return await res.json();
    }
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function saveSiteContentWithBackend(itemKey, title, content) {
  try {
    const res = await fetch("/api/public/portal-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "saveSiteContent",
        payload: { itemKey, title, content },
      }),
    });
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      return await res.json();
    }
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function saveFaqWithBackend(items) {
  try {
    const res = await fetch("/api/public/portal-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "saveFaq",
        payload: { items },
      }),
    });
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      return await res.json();
    }
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}
