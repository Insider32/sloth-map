import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import TableComponent from './components/TableComponent';
import InputFields from './components/InputFields';
import Authentication from './components/Auth';
import SlothMap from './components/SlothMap';
import { formatNumber } from './utils/formatUtils';
import useUserData from './utils/useUserData';
import {
    generateData,
    recalculateFromIndex,
    ensureNestEgg,
} from './utils/calculations';
import './App.css';

const App = () => {
    const {
        isLoggedIn,
        user,
        interestRate,
        setInterestRate,
        investmentReturnRate,
        setInvestmentReturnRate,
        targetNestEgg,
        setTargetNestEgg,
        age,
        setAge,
        manualChanges,
        setManualChanges,
        saveInputFields,
        saveTableData,
        logout,
    } = useUserData();

    const [tableData, setTableData] = useState(() => generateData(500, 300, 0));
    const [recalcTrigger, setRecalcTrigger] = useState(0);

    useEffect(() => {
        if (
            interestRate !== null &&
            investmentReturnRate !== null &&
            targetNestEgg !== null
        ) {
            setTableData(generateData(500, 300, 0));
        }
    }, [interestRate, investmentReturnRate, targetNestEgg]);

    useEffect(() => {
        recalculateData();
    }, [interestRate, investmentReturnRate, targetNestEgg, recalcTrigger]);

    useEffect(() => {
        if (Object.keys(manualChanges).length > 0) {
            recalculateData();
        }
    }, [manualChanges]);

    // const adjustGoals = (data) => {
    //     let updatedData = [...data];

    //     updatedData.forEach((entry, index) => {
    //         if (entry.withdrawals > 0 && entry.goal) {
    //             let withdrawalAmount = entry.withdrawals;
    //             let sufficientFundsIndex = index;

    //             while (
    //                 sufficientFundsIndex < updatedData.length &&
    //                 updatedData[sufficientFundsIndex].grandTotal <
    //                     withdrawalAmount
    //             ) {
    //                 sufficientFundsIndex++;
    //             }

    //             if (
    //                 sufficientFundsIndex !== index &&
    //                 sufficientFundsIndex < updatedData.length
    //             ) {
    //                 updatedData[sufficientFundsIndex].goal = entry.goal;
    //                 updatedData[sufficientFundsIndex].withdrawals =
    //                     entry.withdrawals;
    //                 updatedData[index].goal = null;
    //                 updatedData[index].withdrawals = 0;
    //             }
    //         }
    //     });

    //     return updatedData;
    // };

    const recalculateData = () => {
        let updatedData = [...tableData];

        updatedData = recalculateFromIndex(
            updatedData,
            0,
            interestRate,
            investmentReturnRate
        );

        for (const [monthId, changes] of Object.entries(manualChanges)) {
            const monthIndex = updatedData.findIndex((row) => {
                const [monthName, year] = row.month.split(' ');
                const monthNumber =
                    new Date(Date.parse(monthName + ' 1, 2000')).getMonth() + 1;
                const rowMonthId = `${year}-${String(monthNumber).padStart(2, '0')}`;
                return rowMonthId === monthId;
            });

            if (monthIndex !== -1) {
                for (const [field, value] of Object.entries(changes)) {
                    updatedData[monthIndex][field] = value;

                    if (
                        field === 'depositSavings' ||
                        field === 'depositInvestments'
                    ) {
                        for (
                            let i = monthIndex + 1;
                            i < updatedData.length;
                            i++
                        ) {
                            if (
                                (field === 'depositSavings' &&
                                    !updatedData[i].isTotalSavingsManual) ||
                                (field === 'depositInvestments' &&
                                    !updatedData[i].isTotalInvestmentsManual)
                            ) {
                                updatedData[i][field] = value;
                            }
                        }
                    }
                }

                if (
                    Object.prototype.hasOwnProperty.call(
                        changes,
                        'totalSavings'
                    )
                ) {
                    updatedData[monthIndex].isTotalSavingsManual = true;
                }
                if (
                    Object.prototype.hasOwnProperty.call(
                        changes,
                        'totalInvestments'
                    )
                ) {
                    updatedData[monthIndex].isTotalInvestmentsManual = true;
                }

                updatedData = recalculateFromIndex(
                    updatedData,
                    monthIndex,
                    interestRate,
                    investmentReturnRate
                );
            }
        }

        // updatedData = adjustGoals(updatedData);

        updatedData = ensureNestEgg(
            targetNestEgg,
            updatedData,
            interestRate,
            investmentReturnRate,
            recalculateFromIndex
        );

        setTableData(updatedData);
    };

    if (!isLoggedIn) {
        return <Authentication />;
    }

    const handleInterestRateChange = (e) =>
        setInterestRate(
            e.target.value === '' ? '' : parseFloat(e.target.value)
        );
    const handleInvestmentReturnRateChange = (e) =>
        setInvestmentReturnRate(
            e.target.value === '' ? '' : parseFloat(e.target.value)
        );
    const handleTargetNestEggChange = (e) =>
        setTargetNestEgg(
            e.target.value === '' ? '' : parseFloat(e.target.value)
        );
    const handleAgeChange = (e) =>
        setAge(e.target.value === '' ? '' : parseFloat(e.target.value));

    const handleFieldChange = (index, field, value, data) => {
        console.log(
            `handleFieldChange called for field: ${field} with value: ${value}`
        );

        let newData = data ? [...data] : [...tableData];
        let shouldRecalculate = false;

        if (field === 'totalSavings' || field === 'totalInvestments') {
            const newValue = parseFloat(value);
            console.log(`Parsed new value:`, parseFloat(value));
            console.log(
                `Current data at index ${index}:`,
                newData[index][field]
            );
            newData[index][field] = newValue;
            shouldRecalculate = true;
            if (field === 'totalSavings') {
                newData[index].isTotalSavingsManual = true;
            } else if (field === 'totalInvestments') {
                newData[index].isTotalInvestmentsManual = true;
            }
        } else if (field === 'withdrawals') {
            newData[index][field] = parseFloat(value);
            shouldRecalculate = true;
        } else if (field === 'goal') {
            newData[index][field] = value;
        } else {
            for (let i = index; i < newData.length; i++) {
                if (
                    (field === 'depositSavings' &&
                        !newData[i].isTotalSavingsManual) ||
                    (field === 'depositInvestments' &&
                        !newData[i].isTotalInvestmentsManual)
                ) {
                    newData[i][field] = parseFloat(value);
                }
            }
            shouldRecalculate = true;
        }

        if (shouldRecalculate) {
            newData = recalculateFromIndex(
                newData,
                index,
                interestRate,
                investmentReturnRate
            );
            console.log('After recalculation:', newData);
        } else {
            console.log('Data updated without recalculation:', newData);
        }

        setTableData(newData);

        setManualChanges((prevChanges) => {
            const newChanges = { ...prevChanges };
            const [monthName, year] = tableData[index].month.split(' ');
            const monthNumber =
                new Date(Date.parse(monthName + ' 1, 2000')).getMonth() + 1;
            const monthId = `${year}-${String(monthNumber).padStart(2, '0')}`;

            if (!newChanges[monthId]) {
                newChanges[monthId] = {};
            }

            newChanges[monthId][field] = value;

            return newChanges;
        });

        if (!data) {
            setRecalcTrigger((prev) => prev + 1);
            console.log('RecalcTrigger incremented');
        }

        return newData;
    };

    const handleSaveClick = async () => {
        console.log('Save button clicked');
        await saveInputFields();
        await saveTableData();
        setManualChanges({});
    };

    const formattedTableData = tableData.map((entry) => ({
        ...entry,
        interestReturnFormatted: formatNumber(entry.interestReturn),
        investmentReturnFormatted: formatNumber(entry.investmentReturn),
        totalDepositFormatted: formatNumber(
            entry.depositSavings + entry.depositInvestments
        ),
        totalSavingsFormatted: formatNumber(entry.totalSavings),
        totalInvestmentsFormatted: formatNumber(entry.totalInvestments),
        totalSavedFormatted: formatNumber(entry.totalSaved),
        grandTotalFormatted: formatNumber(entry.grandTotal),
    }));

    console.log('Formatted Table Data:', formattedTableData);

    const slothMapData = processDataForSlothMap(formattedTableData);

    const lastEntry = tableData[tableData.length - 1];
    const achieveNestEggBy = lastEntry ? lastEntry.month : 'TBC';

    console.log('Achieve nest egg by: ', achieveNestEggBy);

    return (
        <Router>
            <div className="App">
                <div className="top-nav">
                    <div className="welcome">
                        <h4>Welcome</h4>
                        <span>
                            {user && user.email
                                ? user.email
                                : 'No user logged in'}
                        </span>
                    </div>
                    <button type="button" onClick={handleSaveClick}>
                        Save
                    </button>
                    <Link to="/map">
                        <button type="button">Show Sloth Map</button>
                    </Link>
                    <button onClick={logout}>Log out</button>
                </div>
                <div className="content">
                    <Routes>
                        <Route
                            path="*"
                            element={<div>No match for this route</div>}
                        />
                        <Route
                            path="/map"
                            element={
                                <div className="slothmap-container">
                                    {' '}
                                    <SlothMap data={slothMapData} />
                                </div>
                            }
                        />
                        <Route
                            path="/"
                            element={
                                <>
                                    <InputFields
                                        interestRate={interestRate || ''}
                                        investmentReturnRate={
                                            investmentReturnRate || ''
                                        }
                                        targetNestEgg={targetNestEgg || ''}
                                        age={age || ''}
                                        handleInterestRateChange={
                                            handleInterestRateChange
                                        }
                                        handleInvestmentReturnRateChange={
                                            handleInvestmentReturnRateChange
                                        }
                                        handleTargetNestEggChange={
                                            handleTargetNestEggChange
                                        }
                                        handleAgeChange={handleAgeChange}
                                        achieveNestEggBy={achieveNestEggBy}
                                    />
                                    <TableComponent
                                        data={formattedTableData}
                                        onFieldChange={handleFieldChange}
                                    />
                                </>
                            }
                        />
                    </Routes>
                </div>
            </div>
        </Router>
    );
};

const processDataForSlothMap = (data) => {
    const nodes = [];
    for (let i = 0; i < data.length; i++) {
        const current = data[i];
        const previous = data[i - 1] || {};

        if (
            current.depositInvestments !== previous.depositInvestments ||
            current.depositSavings !== previous.depositSavings
        ) {
            nodes.push({
                id: current.month,
                type: 'rect',
                text: `Save £${current.depositSavings} in savings; Save £${current.depositInvestments} in investments`,
                date: current.month,
                grandTotal: current.grandTotal,
            });
        }
        if (current.withdrawals > 0) {
            nodes.push({
                id: current.month,
                type: 'circle',
                text: `${current.goal || 'Withdrawal'} for £${current.withdrawals}`,
                date: current.month,
                grandTotal: current.grandTotal,
            });
        }
    }
    return nodes;
};

export default App;
