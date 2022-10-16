/**
 * 分发所有奖励
 */
import {
    SigningStargateClient
} from "@cosmjs/stargate";
import KeplrSignerProvider from "../signed/KeplrSignerProvider";
import { chainsList } from "../../config/chains";
import { toBase64 } from '@cosmjs/encoding';
import { distList } from "../../config/distributes";
import GasFeeUtil from "../GasFeeUtil";
import { coins } from '@cosmjs/launchpad'
import axios from "axios";
import SigningKeplerEthermintClient from "./SigningKeplerEthermintClient";
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';

export default class DistributeAll {

    async distributeAll() {
        // 遍历循环chainslist，并且await distribute
        for (let chain of chainsList) {
            console.log(`distribute ${chain.chainId} start`);
            await this.distribute(chain)
        }
    }

    async distribute(chain) {
        // 获取签名对象
        let keplr = new KeplrSignerProvider(window.keplr);
        chain = new GasFeeUtil().getGasPriceStep(chain);
        await keplr.connect(chain);
        const signer = await keplr.getSigner(chain);
        const accounts = await signer.getAccounts();
        let fromAdd = accounts[0].address;
        let client = await SigningStargateClient.connectWithSigner(
            chain.rpc,
            signer
        );
        // 计算发送金额
        let balance = await client.getBalance(accounts[0].address, chain.stakeCurrency.coinMinimalDenom);
        let amount = (balance.amount / Math.pow(10, chain.stakeCurrency.coinDecimals)).toFixed(3);
        let ditObj = distList[chain.chainId];
        if (!ditObj) {
            return;
        }
        let sendNumber = (amount - ditObj.remainMin).toFixed(3) * Math.pow(10, chain.stakeCurrency.coinDecimals);
        let sendAddr = ditObj.sendAddr;
        if (sendNumber < 0) {
            console.log(`余额不足, distribute ${chain.chainId} end`);
            return;
        }
        // 开始构建传输信息
        const fee = new GasFeeUtil().getFee(ditObj.gas, chain.gasPrice);
        let ops = [];
        ops.push({
            typeUrl: "/cosmos.bank.v1beta1.MsgSend",
            value: {
                fromAddress: fromAdd,
                toAddress: sendAddr,
                amount: coins(sendNumber, chain.stakeCurrency.coinMinimalDenom)
            },
        });

        // 获取交易序列信息
        let res = await axios.get(`${chain.rest}/cosmos/auth/v1beta1/accounts/${fromAdd}`, {headers: {
            'Access-Control-Allow-Origin': true,
          }});
        let account = {};
        if (res.status !== 200) {
            return;
        }
        let { accountNumber, sequence } = this.extractAccountNumberAndSequence(res.data);
        account.accountNumber = accountNumber;
        account.sequence = sequence;
        const signerData = {
            accountNumber: account.accountNumber,
            sequence: account.sequence,
            chainId: chain.chainId,
        };
        let bodyBytes = await this.sign(chain.chainId, fromAdd, ops, fee, '', signerData);
        if (!bodyBytes) {
            return;
        }
        // 广播交易
        let result = await this.broadcastTx(bodyBytes, chain);
        console.log(result);
    }

    extractAccountNumberAndSequence(ret) {
        let { account } = ret
        if (account && account.base_vesting_account) { // vesting account
            account = account.base_vesting_account.base_account
        } else if (account && account.base_account) { // evmos based account
            account = account.base_account
        }
        const accountNumber = account.account_number
        const sequence = account.sequence || 0

        return {
            accountNumber,
            sequence,
        }
    }

    async sign(chainId, signerAddress, messages, fee, memo, signerData) {
        let client
        if (!window.getOfflineSigner || !window.keplr) {
            throw new Error('Please install keplr extension')
        }
        await window.keplr.enable(chainId)
        const signer = window.getOfflineSigner(chainId)
        if (this.isEvmosBasedChain(chainId)) {
            client = await SigningKeplerEthermintClient.offline(signer)
        } else {
            client = await SigningStargateClient.offline(signer)
        }
        const addr = signerAddress
        return await client.sign(addr, messages, fee, memo, signerData)
    }

    async broadcastTx(bodyBytes, chain) {
        const txbytes = bodyBytes.authInfoBytes ? TxRaw.encode(bodyBytes).finish() : bodyBytes
        const txString = toBase64(txbytes)
        const txRaw = {
            tx_bytes: txString,
            mode: 'BROADCAST_MODE_SYNC',
        }
        return axios.post(`${chain.rest}/cosmos/tx/v1beta1/txs`, txRaw, chain.id).then(res => {
            if (res.code && res.code !== 0) {
                throw new Error(res.message)
            }
            if (res.tx_response && res.tx_response.code !== 0) {
                throw new Error(res.tx_response.raw_log)
            }
            if (res.data.tx_response.code === 0) {
                console.log('chainId', chain.chainId, 'send success txHash', res.data.tx_response.txhash)
            } else {
                console.log('chainId', chain.chainId, 'Failed to send tx:', res.data.tx_response.log || res.data.tx_response.raw_log)
            }
            console.log(`distribute ${chain.chainId} end`)
            return res
        })
    }

    isEvmosBasedChain(chainId) {
        const re = /[_]{1}[\d]{4}[\\-]{1}[\d]+$/g
        return re.test(chainId)
    }

}