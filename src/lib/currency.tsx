"use client";

import React, { createContext, useContext, useState } from "react";

export interface CurrencyConfig {
    code: string;
    symbol: string;
    name: string;
    rate: number; // vs USD
}

export const currencies: CurrencyConfig[] = [
    { code: "USD", symbol: "$", name: "US Dollar", rate: 1 },
    { code: "PKR", symbol: "Rs", name: "Pakistani Rupee", rate: 278.5 },
    { code: "EUR", symbol: "€", name: "Euro", rate: 0.92 },
    { code: "GBP", symbol: "£", name: "British Pound", rate: 0.79 },
    { code: "AED", symbol: "د.إ", name: "UAE Dirham", rate: 3.67 },
    { code: "SAR", symbol: "﷼", name: "Saudi Riyal", rate: 3.75 },
];

interface CurrencyContextType {
    currency: CurrencyConfig;
    setCurrency: (code: string) => void;
    convert: (amountUSD: number) => number;
    format: (amountUSD: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
    currency: currencies[0],
    setCurrency: () => { },
    convert: (a) => a,
    format: (a) => `$${a.toFixed(2)}`,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrencyState] = useState<CurrencyConfig>(currencies[0]);

    const setCurrency = (code: string) => {
        const found = currencies.find((c) => c.code === code);
        if (found) {
            setCurrencyState(found);
            localStorage.setItem("erp-currency", code);
        }
    };

    // Load from localStorage on mount
    React.useEffect(() => {
        const stored = localStorage.getItem("erp-currency");
        if (stored) setCurrency(stored);
    }, []);

    const convert = (amountUSD: number) => amountUSD * currency.rate;

    const format = (amountUSD: number) => {
        const converted = convert(amountUSD);
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency.code,
            minimumFractionDigits: 0,
            maximumFractionDigits: currency.rate > 10 ? 0 : 2,
        }).format(converted);
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, convert, format }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    return useContext(CurrencyContext);
}
