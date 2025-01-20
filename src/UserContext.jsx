import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';
import { getUserRef } from './utils/getUserRef';
import {
    fetchUserSettingsFromFirestore,
    saveUserSettingsToFirestore,
    fetchTableDataFromFirestore,
} from './utils/userServices';
import { formatNumber, formatMonth } from './utils/formatUtils';
import { recalculateAllData } from './utils/recalculateAllData';

const defaultUserSettings = {
    interestRate: 5,
    investmentReturnRate: 10,
    targetNestEgg: 100000,
    dateOfBirth: null,
};

export const UserContext = createContext({
    userSettings: defaultUserSettings,
    setuserSettings: () => {},

    loading: true,
    setLoading: () => {},

    rawTableData: [],
    setRawTableData: () => {},

    tableData: [],
    setTableData: () => {},

    formattedTableData: [],
    setFormattedTableData, 
    updateFormattedData: () => {},

    slothMapData: [],
});

export const UserContextProvider = ({ children }) => {
    const currentUser = useContext(AuthContext);

    const [userSettings, setUserSettings] = useState(defaultUserSettings);

    const [loading, setLoading] = useState(false);

    const [rawTableData, setRawTableData] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [formattedTableData, setFormattedTableData] = useState([]);

    const [slothMapData, setSlothMapData] = useState([]);

    const [goals, setGoals] = useState({});

    async function initData() {
        try {
            const fetchedSettings = await fetchUserSettingsFromFirestore(currentUser);
            
            if (fetchedSettings) {
                setUserSettings(fetchedSettings);
            } else {
                await saveUserSettingsToFirestore(currentUser, defaultUserSettings);
                setuserSettings({
                    ...defaultUserSettings,
                    email: currentUser.email,
                });
            }

            const loadedTableData = await fetchTableDataFromFirestore(currentUser);
            setRawTableData(loadedTableData);

            const transformedData = transformData(loadedTableData);
            
            updateFormattedData(transformedData);
        } catch (err) {
            console.error('initData failed', err);
        } finally {
            setLoading(false);
        }
    }

    const transformData = (rawData) => {
        const data = recalculateAllData(
            rawData,
            userInputs,
            goals,
            userSettings,
        );

        setTableData(data);
        return data;
    };

    const processDataForSlothMap = (data) => {
        const today = new Date();
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

        const nodes = [];
        for (let i = 0; i < data.length; i++) {
            const current = data[i];

            if (!current.month) {
                console.warn(
                    `Entry at index ${i} is missing 'month':`,
                    current
                );
                continue;
            }

            if (current.month < currentMonth) {
                continue;
            }

            const previous = data[i - 1] || {};

            if (
                current.depositInvestments !== previous.depositInvestments ||
                current.depositSavings !== previous.depositSavings
            ) {
                nodes.push({
                    id: current.id || i,
                    type: 'rect',
                    text: `Save £${current.depositSavings} in savings; Save £${current.depositInvestments} in investments`,
                    date: formatMonth(current.month),
                    grandTotal: current.grandTotal,
                });
            }

            if (current.goal) {
                nodes.push({
                    id: current.rowKey,
                    type: 'circle',
                    text: `${current.goal.name} for £${formatNumber(current.goal.amount)}`,
                    date: formatMonth(current.month),
                    grandTotal: current.grandTotal,
                });
            }
        }
        return nodes;
    };

    const updateFormattedData = (data) => {
        const formatted = data.map((entry) => ({
            ...entry,
            interestReturnFormatted: formatNumber(entry.interestReturn),
            investmentReturnFormatted: formatNumber(entry.investmentReturn),
            totalSavingsFormatted: formatNumber(entry.totalSavings),
            totalInvestmentsFormatted: formatNumber(entry.totalInvestments),
            grandTotalFormatted: formatNumber(entry.grandTotal),
        }));

        setFormattedTableData(formatted);

        const mapData = processDataForSlothMap(formatted);
        setSlothMapData(mapData);
    };

    useEffect(() => {
        if (currentUser) {
            initData();
        }
    }, [currentUser]);

    const value = useMemo(() => {
        return {
            userSettings,
            setuserSettings,

            loading,
            setLoading,

            rawTableData,
            setRawTableData,

            tableData,
            setTableData,

            formattedTableData,
            setFormattedTableData,
            updateFormattedData,

            slothMapData,
        };
    }, [
        userSettings,
        loading,
        rawTableData,
        tableData,
        formattedTableData,
        slothMapData,
    ]);

    return (
        <UserContext.Provider value={value}>{children}</UserContext.Provider>
    );
};
