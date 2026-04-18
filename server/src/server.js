const dotenv = require("dotenv");

dotenv.config();

const app = require("./app");
const connectDB = require("./config/db");
const { initPostgres } = require("./config/postgres");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await initPostgres();

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
