import { Router } from "express";
import { chatRouter } from "./chat.routes.js";
import { profilesRouter } from "./profiles.routes.js";
import { sessionRouter } from "./session.routes.js";
import { userRouter } from "./user.routes.js";

const mainRouter = Router();

mainRouter.use(userRouter);
mainRouter.use(profilesRouter);
mainRouter.use(chatRouter);
mainRouter.use("/sessions", sessionRouter);

export default mainRouter;
