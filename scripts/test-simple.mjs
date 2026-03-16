const url = "https://wnxsfpukosmhuuusnnyv.supabase.co";
console.log("Starting simple fetch test...");

async function run() {
  try {
    console.log("Fetching URL:", url);
    const res = await fetch(url);
    console.log("Response status:", res.status);
    const text = await res.text();
    console.log("Response body snippet:", text.substring(0, 50));
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}

run();
