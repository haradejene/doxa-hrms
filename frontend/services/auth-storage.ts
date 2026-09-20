export function clearLocalAuth() {
  try {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  } finally {
    document.cookie = "auth_token=; path=/; max-age=0";
    document.cookie = "user=; path=/; max-age=0";
  }
}
