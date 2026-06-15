// Streak reminder notifications via Capacitor Local Notifications.
// On web this is a no-op (push notifications require a separate web-push setup).
// On Android (Capacitor wrapper), this schedules a daily 19:00 local reminder.

async function getPlugin() {
  try {
    const mod = await import(/* webpackIgnore: true */ "@capacitor/local-notifications");
    return mod.LocalNotifications;
  } catch {
    return null;
  }
}

export async function ensureStreakReminderScheduled() {
  const LN = await getPlugin();
  if (!LN) return false;
  try {
    const perm = await LN.requestPermissions();
    if (perm.display !== "granted") return false;
    const pending = await LN.getPending();
    if ((pending?.notifications || []).some((n) => n.id === 7771)) return true;
    const at = new Date();
    at.setHours(19, 0, 0, 0);
    if (at < new Date()) at.setDate(at.getDate() + 1);
    await LN.schedule({
      notifications: [
        {
          id: 7771,
          title: "Don't break your streak",
          body: "One lesson keeps it alive.",
          schedule: { at, repeats: true, every: "day" },
          smallIcon: "ic_stat_icon_config_sample",
        },
      ],
    });
    return true;
  } catch {
    return false;
  }
}

export async function cancelStreakReminder() {
  const LN = await getPlugin();
  if (!LN) return;
  try { await LN.cancel({ notifications: [{ id: 7771 }] }); } catch {}
}
