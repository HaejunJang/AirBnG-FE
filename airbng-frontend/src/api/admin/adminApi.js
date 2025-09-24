import { httpAuth } from "../http";

export const getAdminFirstPage = () => httpAuth.get("/admin");

export const getPeriodSales = ({ startDate, endDate, page = 0, size = 10 }) => {
    return httpAuth.get("/admin/sales/period", {
        params: {
            startDate,
            endDate,
            page,
            size
        },
    });
};

export const getStorageSales = ({ lockerType, startDate, endDate, page = 0, size = 10 }) => {
    return httpAuth.get("/admin/sales/storage", {
        params: {
            lockerType: lockerType || null,
            startDate,
            endDate,
            page,
            size
        },
    });
};