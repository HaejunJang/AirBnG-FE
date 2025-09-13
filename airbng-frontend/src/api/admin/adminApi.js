import { httpAuth } from "./http";
import {httpPublic} from "../http";

export const getAdminFirstPage = () => httpAuth.get("/admin");

export const getPendingLockerPage = (lockerReviewId) =>
    httpAuth.get(`/admin/lockers/pendingLockers/${lockerReviewId}`);

export const getApprovedLockerPage = (lockerReviewId) =>
    httpAuth.get(`/admin/lockers/approvedLockers/${lockerReviewId}`);

export const getRejectedLockerPage = (lockerReviewId) =>
    httpAuth.get(`/admin/lockers/rejectedLockers/${lockerReviewId}`);