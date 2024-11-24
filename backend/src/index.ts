import express from "express"
import UserRoute from "./routes/user"
import WorkerRoute from "./routes/worker"
import cors from "cors"
const app = express();

app.use(express.json());
app.use(cors());
app.use("/v1/user", UserRoute);
app.use("/v1/worker", WorkerRoute);


if(app.listen(3000))
{
    console.log("server start")
}


