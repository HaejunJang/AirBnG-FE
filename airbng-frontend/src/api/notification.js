import { httpPublic, httpAuth } from "./http";


export const getNotification = () => {

    return httpPublic.get("/page/notification");
};

export const hasUnreadAlarm = async () => {
    return httpPublic.get("/api/alarms/unread");
};
