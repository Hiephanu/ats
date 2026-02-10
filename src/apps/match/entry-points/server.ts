import matchingRouter from "./api/index";

const app = createServer();
const PORT = process.env.MATCH_PORT || 3001;

app.use("/matching", matchingRouter);

app.listen(PORT, () => {
  console.log(`🚀 Match App is flying at http://localhost:${PORT}`);
});