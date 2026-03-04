const run = async () => {
    try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/students/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                nis: "123123",
                password: "password123"
            })
        });

        console.log("Status:", res.status);
        const body = await res.text();
        console.log("Body:", body);
    } catch (err) {
        console.error("Fetch failed:", err);
    }
};
run();
