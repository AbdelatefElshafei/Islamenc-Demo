
async function measure(url, label) {
    const start = Date.now();
    try {
        const response = await fetch(url);
        await response.json();
        const duration = Date.now() - start;
        console.log(`${label}: ${duration}ms`);
        return duration;
    } catch (e) {
        console.log(`${label}: FAILED (${e.message})`);
        return null;
    }
}

async function runBenchmark() {
    console.log("--- Starting Benchmark ---");
    const endpoints = [
        { url: "http://localhost:4000/api/books/with-languages", label: "Books List" },
        { url: "http://localhost:4000/api/quran/surahs", label: "Quran List" },
        { url: "http://localhost:4000/api/cards/list", label: "Cards List" },
        { url: "http://localhost:4000/api/search?q=الله", label: "Search (Arabic)" },
        { url: "http://localhost:4000/api/search?q=allah", label: "Search (English)" }
    ];

    for (const ep of endpoints) {
        let total = 0;
        let count = 5;
        for (let i = 0; i < count; i++) {
            const d = await measure(ep.url, `${ep.label} [${i+1}]`);
            if (d !== null) total += d;
        }
        console.log(`Average ${ep.label}: ${total / count}ms`);
        console.log("-----------------------");
    }
}

runBenchmark();
