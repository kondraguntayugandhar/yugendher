async function run() {
  try {
    const res = await fetch('https://generativelanguage.googleapis.com');
    console.log(res.status);
  } catch (e) {
    console.error("Fetch Error:", e.message);
    if (e.cause) console.error("Cause:", e.cause.message, e.cause.code);
  }
}
run();
