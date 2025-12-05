import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files from /static
app.use(express.static(path.join(__dirname, "static")));

// Default route → load the correct index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "static", "index.html"));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Frontend running at http://localhost:${PORT}`);
});

