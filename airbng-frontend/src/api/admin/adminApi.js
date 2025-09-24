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
    console.log('🚀 getStorageSales API 호출:', { lockerType, startDate, endDate});

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

// export const getStorageSales = async ({ lockerType, startDate, endDate, page = 0, size = 10 }) => {
//     console.log('🚀 getStorageSales API 호출:', { lockerType, startDate, endDate });
//
//     const response = await httpAuth.get("/admin/sales/storage", {
//         params: {
//             lockerType: lockerType || null,
//             startDate,
//             endDate,
//             page,
//             size
//         },
//     });
//
//     const salesData = response.data; // 실제 데이터 구조에 따라 수정 필요
//     console.log('📊 백엔드 응답 데이터 확인:', salesData.map(item => ({
//         date: item.aggregatedDate,
//         type: item.lockerType,
//         sales: item.totalSales,
//         count: item.totalCount
//     })));
//
//     return response;
// };