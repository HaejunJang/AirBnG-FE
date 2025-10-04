import { httpPublic, httpAuth } from "./http";


export const getNotification = () => {

    return httpPublic.get("/page/notification");
};

export const hasUnreadAlarm = async () => {
    return httpPublic.get("/alarms/unread",{ withCredentials: true });
};

export const hasreadAlarm = async () => {
    return httpPublic.get("/alarms/read",{ withCredentials: true });
};