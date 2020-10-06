import mongoose from "mongoose";
import app from "./app";

mongoose.connect(
  process.env.MONGO_URI || "mongodb://0.0.0.0:27017/graphl-blog-microservice",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const PORT = process.env.PORT || 4000;

app.listen(PORT).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
