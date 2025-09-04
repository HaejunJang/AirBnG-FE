import { httpPublic } from "./http";


export const getNotification = () => {

    return httpPublic.get("/page/notification");
};