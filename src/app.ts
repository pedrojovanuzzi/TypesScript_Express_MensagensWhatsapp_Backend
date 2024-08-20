import express from "express";
import  router from "./routes/routes";
import cors from "cors";
import path from "path";

const app = express();

app.use(cors());

app.use(express.static(path.join(__dirname, '../frontend/build')));

app.use(express.json());

app.use('/', router);

export default app;