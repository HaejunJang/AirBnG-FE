import { httpAuth } from "./http";

export const getJimTypes = () => httpAuth.get("/jimtypes");