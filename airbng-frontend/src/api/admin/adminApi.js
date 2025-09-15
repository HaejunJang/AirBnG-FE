import { httpAuth } from "./http";

export const getAdminFirstPage = () => httpAuth.get("/admin");