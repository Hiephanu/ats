import { createServerExpress } from "./app";
import apiRouter from "./api/index";
import { prisma } from "../libs/prisma";

const PORT = process.env.MATCH_PORT || 3001;
const app = createServerExpress();

// Connect DB & Start Server
async function bootstrap() {
  try {
    await prisma.$connect();
    console.log("Start database successfully!");

    app.use("/api", apiRouter);

    app.listen(PORT, () => {
      console.log(`🚀 Match App is flying at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ App vấp cỏ rồi:", error);
    process.exit(1);
  }
}

bootstrap();