/**
 * PushNotification Utility: Native Browser/Windows System Notifications.
 */

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.warn("This browser does not support system notifications.");
    return false;
  }

  if (Notification.permission === "granted") return true;

  const permission = await Notification.requestPermission();
  return permission === "granted";
};

export const showPushNotification = async (title: string, options?: NotificationOptions) => {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: '/logo.png',
      ...options
    });
  } else if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification(title, {
        icon: '/logo.png',
        ...options
      });
    }
  }
};
