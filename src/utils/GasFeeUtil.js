import _ from 'lodash'
import { multiply, ceil, bignumber, format, floor } from 'mathjs'

import {
    defaultRegistryTypes as defaultStargateTypes,
    GasPrice,
    coin as _coin
} from "@cosmjs/stargate";


export default function GasFeeUtil() {

    function calculateFee(gasLimit, gasPrice) {
        const processedGasPrice = typeof gasPrice === "string" ? GasPrice.fromString(gasPrice) : gasPrice;
        const { denom, amount: gasPriceAmount } = processedGasPrice;
        const amount = ceil(bignumber(multiply(bignumber(gasPriceAmount.toString()), bignumber(gasLimit.toString()))));
        return {
            amount: [coin(amount, denom)],
            gas: gasLimit.toString()
        };
    }

    function getFee(gas, gasPrice) {
        if (!gas)
            gas = 200000;
        return calculateFee(gas, gasPrice);
    }

    function coin(amount, denom) {
        return _coin(format(floor(amount), { notation: 'fixed' }), denom)
    }

    function getGasPriceStep(chain) {
        // 拷贝一份chain
        let chainCopy = _.cloneDeep(chain);
        if (chain.gasPrice) {
            chainCopy.gasPriceAmount = GasPrice.fromString(chain.gasPrice).amount.toString();
            chainCopy.gasPriceStep = chain.gasPriceStep || {
                "low": multiply(chainCopy.gasPriceAmount, 0.5),
                "average": multiply(chainCopy.gasPriceAmount, 1),
                "high": multiply(chainCopy.gasPriceAmount, 2)
            }
        }
        return chainCopy;
    }

    return {
        getFee,
        getGasPriceStep
    }

}
