import { useState, useEffect } from 'react';
import TableComponent from './components/TableComponent';
import InputFields from './components/InputFields';
import './App.css';

const numberFormatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
});

function formatNumber(num) {
    return numberFormatter.format(num);
}

const App = () => {
    const [interestRate, setInterestRate] = useState(5);
    const [investmentReturnRate, setInvestmentReturnRate] = useState(10);
    const [tableData, setTableData] = useState(() =>
        generateData(interestRate, investmentReturnRate, 500, 300, 0)
    );
    const [targetNestEgg, setTargetNestEgg] = useState(5000000);
    const [age, setAge] = useState(38);
    const [recalcTrigger, setRecalcTrigger] = useState(0); // New state to trigger recalculation

    useEffect(() => {
        recalculateData();
    }, [interestRate, investmentReturnRate, targetNestEgg, recalcTrigger]); // Added recalcTrigger here

    const recalculateData = () => {
        let updatedData = [...tableData];
        updatedData = recalculateFromIndex(
            updatedData,
            0,
            interestRate,
            investmentReturnRate
        );
        updatedData = ensureNestEgg(
            targetNestEgg,
            updatedData,
            interestRate,
            investmentReturnRate,
            recalculateFromIndex
        );
        setTableData(updatedData);
    };

    const handleInterestRateChange = (e) =>
        setInterestRate(parseFloat(e.target.value));
    const handleInvestmentReturnRateChange = (e) =>
        setInvestmentReturnRate(parseFloat(e.target.value));
    const handleTargetNestEggChange = (e) =>
        setTargetNestEgg(parseFloat(e.target.value));
    const handleAgeChange = (e) => setAge(parseFloat(e.target.value));

    function recalculateFromIndex(
        data,
        startIndex,
        interestRate,
        investmentReturnRate
    ) {
        let runningTotalSavings =
            startIndex === 0 ? 0 : data[startIndex - 1].totalSavings;
        let runningTotalInvestments =
            startIndex === 0 ? 0 : data[startIndex - 1].totalInvestments;

        console.log(`Recalculation started from index: ${startIndex}`);

        for (let i = startIndex; i < data.length; i++) {
            const entry = data[i];

            if (i > 0) {
                runningTotalSavings += data[i - 1].interestReturn;
                runningTotalInvestments += data[i - 1].investmentReturn;
            }

            runningTotalSavings += entry.depositSavings - entry.withdrawals;
            runningTotalInvestments += entry.depositInvestments;

            if (runningTotalSavings < 0) {
                runningTotalInvestments += runningTotalSavings;
                runningTotalSavings = 0;
            }

            runningTotalInvestments = Math.max(0, runningTotalInvestments);

            const interestReturn =
                runningTotalSavings * (interestRate / 12 / 100);
            const investmentReturn =
                runningTotalInvestments * (investmentReturnRate / 12 / 100);

            data[i] = {
                ...entry,
                totalSavings: runningTotalSavings,
                totalInvestments: runningTotalInvestments,
                interestReturn,
                investmentReturn,
                totalSaved: runningTotalSavings + runningTotalInvestments,
                grandTotal:
                    runningTotalSavings +
                    runningTotalInvestments +
                    interestReturn +
                    investmentReturn,
                commentary: entry.commentary,
            };
        }

        return data;
    }

    const handleFieldChange = (index, field, value) => {
        console.log(
            `Field change - Index: ${index}, Field: ${field}, Value: ${value}`
        );

        setTableData((currentData) => {
            const newData = [...currentData];
            console.log('Before update:', newData[index]);

            newData[index] = { ...newData[index], [field]: parseFloat(value) };

            if (
                [
                    'withdrawals',
                    'depositSavings',
                    'depositInvestments',
                ].includes(field)
            ) {
                for (let i = index + 1; i < newData.length; i++) {
                    newData[i] = { ...newData[i], [field]: parseFloat(value) };
                }
            }

            console.log('After field update:', newData[index]);
            const updatedData = recalculateFromIndex(
                newData,
                index,
                interestRate,
                investmentReturnRate
            );

            console.log('After recalculation:', updatedData);

            return updatedData;
        });

        setRecalcTrigger((prev) => prev + 1);
    };

    // const handleFieldChange = (index, field, value) => {
    //     console.log(
    //         `Field change - Index: ${index}, Field: ${field}, Value: ${value}`
    //     );

    //     setTableData((currentData) => {
    //         const newData = [...currentData];
    //         console.log('Before update:', newData[index]);

    //         newData[index] = { ...newData[index], [field]: parseFloat(value) };

    //         if (
    //             field === 'withdrawals' ||
    //             field === 'depositSavings' ||
    //             field === 'depositInvestments'
    //         ) {
    //             for (let i = index + 1; i < newData.length; i++) {
    //                 newData[i] = { ...newData[i], [field]: parseFloat(value) };
    //             }
    //         }

    //         console.log('After field update:', newData[index]);

    //         const updatedData = recalculateFromIndex(
    //             newData,
    //             index,
    //             interestRate,
    //             investmentReturnRate
    //         );
    //         console.log('After recalculation:', updatedData);

    //         return updatedData;
    //     });
    // };

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

    return (
        <div className="App">
            <InputFields
                interestRate={interestRate}
                investmentReturnRate={investmentReturnRate}
                targetNestEgg={targetNestEgg}
                age={age}
                handleInterestRateChange={handleInterestRateChange}
                handleInvestmentReturnRateChange={
                    handleInvestmentReturnRateChange
                }
                handleTargetNestEggChange={handleTargetNestEggChange}
                handleAgeChange={handleAgeChange}
            />
            <TableComponent
                data={formattedTableData}
                onFieldChange={handleFieldChange}
            />
        </div>
    );
};

function generateData() {
    const today = new Date();
    const currentMonth =
        today.toLocaleString('default', { month: 'long' }) +
        ' ' +
        today.getFullYear();

    return [
        {
            month: currentMonth,
            depositSavings: 100, // Set default deposit for savings
            depositInvestments: 100, // Set default deposit for investments
            withdrawals: 0,
            totalSavings: 0,
            totalInvestments: 0,
            totalSaved: 0,
            interestReturn: 0,
            investmentReturn: 0,
            grandTotal: 0,
            commentary: '',
        },
    ];
}

function getNextMonth(currentMonth) {
    const dateParts = currentMonth.split(' ');
    const month = dateParts[0];
    const year = parseInt(dateParts[1], 10);

    const date = new Date(`${month} 1, ${year}`);
    date.setMonth(date.getMonth() + 1);
    return (
        date.toLocaleString('default', { month: 'long' }) +
        ' ' +
        date.getFullYear()
    );
}

function ensureNestEgg(
    target,
    data,
    interestRate,
    investmentReturnRate,
    recalculate
) {
    let lastTotal = data.length ? data[data.length - 1].grandTotal : 0;
    let iterations = 0;
    // Check if we need to remove excess rows or add new ones based on the target
    if (lastTotal >= target) {
        // If grand total exceeds or meets the target, check if excess rows need removal
        while (lastTotal >= target && data.length > 1) {
            data.pop(); // Remove the last row
            lastTotal = data[data.length - 1].grandTotal; // Update the last total
        }
    } else {
        while (lastTotal < target && iterations < 1000) {
            const newEntry = {
                month: getNextMonth(data[data.length - 1].month),
                depositSavings: data[data.length - 1].depositSavings, // Inherit last value
                depositInvestments: data[data.length - 1].depositInvestments, // Inherit last value
                withdrawals: data[data.length - 1].withdrawals, // Inherit last value
                totalSavings: 0,
                totalInvestments: 0,
                totalSaved: 0,
                interestReturn: 0,
                investmentReturn: 0,
                grandTotal: 0,
                commentary: '',
            };
            data = [...data, newEntry];
            data = recalculate(
                data,
                data.length - 1,
                interestRate,
                investmentReturnRate
            );
            lastTotal = data[data.length - 1].grandTotal;
            iterations++;
        }
    }
    console.log(
        `Iteration stopped at ${iterations} iterations. Target was ${lastTotal >= target ? 'met' : 'not met'}.`
    );
    return data;
}

export default App;
