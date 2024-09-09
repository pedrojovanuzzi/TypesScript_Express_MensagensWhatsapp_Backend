import express from "express";
import  router from "./routes/routes";
import cors from "cors";
import path from "path";
import emailrouter from "./routes/email.routes";
import canaisrouter from "./routes/canais.routes";


const app = express();

app.use(cors());

app.use(express.static(path.join(__dirname, '../frontend/build')));

app.use(express.json());

app.use('/', router);
app.use('/email', emailrouter);
app.use('/canais', canaisrouter);

export default app;