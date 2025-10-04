import { useState } from "react";
import { searchLockers } from "../api/lockerApi";

export const useLockers = () => {
    const [lockers, setLockers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchLockers = async ({ address, lockerName, jimTypeId }) => {
        setLoading(true);
        setError(null);

        try {
            const { data } = await searchLockers({ address, lockerName, jimTypeId });

            if (data.code === 3001 || !data.result?.lockers?.length) {
                setLockers([]);
                return;
            }
            setLockers(data.result.lockers);
        } catch (err) {
            setError(err.message);
            setLockers([]);
        } finally {
            setLoading(false);
        }
    };

    return { lockers, loading, error, fetchLockers };
};
