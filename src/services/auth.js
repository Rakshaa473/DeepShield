const DEMO_SESSION_KEY = "deepshield-demo-session";

export const DEMO_USER = {
  uid: "demo-user",
  displayName: "Demo User",
  email: "demo@deepshield.app",
  accountType: "Demo Account",
};

export function startDemoSession() {
  if (typeof window !== "undefined") {
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(DEMO_USER));
  }
}

export function getDemoSession() {
  if (typeof window === "undefined") return null;

  try {
    const storedUser = JSON.parse(localStorage.getItem(DEMO_SESSION_KEY) || "null");
    return storedUser?.uid === DEMO_USER.uid ? storedUser : null;
  } catch {
    return null;
  }
}

export function endDemoSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(DEMO_SESSION_KEY);
  }
}

export function isDemoUser(user) {
  return user?.uid === DEMO_USER.uid;
}
