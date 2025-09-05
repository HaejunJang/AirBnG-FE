import { httpPublic, httpAuth } from "./http";


export const getNotification = () => {

    return httpPublic.get("/page/notification");
};