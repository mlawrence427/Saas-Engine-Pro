// backend/src/server.ts
import app from "./app";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`SaaS Engine Pro backend listening on port ${PORT}`);
});


