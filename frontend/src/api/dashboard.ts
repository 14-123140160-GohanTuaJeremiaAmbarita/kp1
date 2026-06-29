export async function getDashboardStats() {
  const res = await fetch("http://localhost:3000/api/dashboard/stats");
  return res.json();
}