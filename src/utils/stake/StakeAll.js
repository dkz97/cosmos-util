/**
 * 质押全部
 */
import {
    QueryClient, setupDistributionExtension, SigningStargateClient
} from "@cosmjs/stargate";
import KeplrSignerProvider from "../signed/KeplrSignerProvider";
import { chainsList } from "../../config/chains";
import { toBase64 } from '@cosmjs/encoding';
import { distList } from "../../config/stake";
import GasFeeUtil from "../GasFeeUtil";
import { coin } from '@cosmjs/launchpad'
import axios from "axios";
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import SigningKeplerEthermintClient from "../distribute/SigningKeplerEthermintClient";

export default class StakeAll {

    async stakeAll() {
        // 遍历循环chainslist，并且await distribute
        for (let chain of chainsList) {
            console.log(`stake ${chain.chainId} start`);
            await this.stake(chain)
        }
    }

    async stake(chain) {
        // 获取签名对象
        let keplr = new KeplrSignerProvider(window.keplr);
        chain = new GasFeeUtil().getGasPriceStep(chain);
        await keplr.connect(chain);
        const signer = await keplr.getSigner(chain);
        const accounts = await signer.getAccounts();
        let address = accounts[0].address;
        let client = await SigningStargateClient.connectWithSigner(
            chain.rpc,
            signer
        );
        const queryClient = await this.getQueryClient(chain.rpc);
        // 计算质押金额
        let balance = await client.getBalance(accounts[0].address, chain.stakeCurrency.coinMinimalDenom);
        let amount = (balance.amount / Math.pow(10, chain.stakeCurrency.coinDecimals)).toFixed(3);
        let ditObj = distList[chain.chainId];
        if (!ditObj) {
            return;
        }
        console.log(`amount: ${amount}, remainMin: ${ditObj.remainMin}, stakeNumber: ${(amount - ditObj.remainMin).toFixed(3) * Math.pow(10, chain.stakeCurrency.coinDecimals)}`)
        let stakeNumber = (amount - ditObj.remainMin).toFixed(3) * Math.pow(10, chain.stakeCurrency.coinDecimals);
        if (stakeNumber < 0) {
            console.log(`余额不足, distribute ${chain.chainId} end`);
            return;
        }

        // 开始构建传输信息
        const fee = new GasFeeUtil().getFee(ditObj.gas, chain.gasPrice);
        let ops = [];
        let rewards = await queryClient.distribution.delegationTotalRewards(address);
        let validators = [];
        for (let reward of rewards.rewards) {
            validators.push(reward.validatorAddress);
        }
        ops.push({
            typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
            value: {
                delegatorAddress: address,
                validatorAddress: validators[0],
                amount: coin(stakeNumber, chain.stakeCurrency.coinMinimalDenom)
            },
        });

        // 获取交易序列信息
        let res = await axios.get(`${chain.rest}/cosmos/auth/v1beta1/accounts/${address}`, {headers: {
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
        let bodyBytes = await this.sign(chain.chainId, address, ops, fee, '', signerData);

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

    async getQueryClient(rpcEndpoint) {
        const tendermint34Client = await Tendermint34Client.connect(rpcEndpoint);
        const queryClient = QueryClient.withExtensions(
            tendermint34Client,
            setupDistributionExtension
        );
        return queryClient;
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

    isEvmosBasedChain(chainId) {
        const re = /[_]{1}[\d]{4}[\\-]{1}[\d]+$/g
        return re.test(chainId)
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
                console.log('chainId', chain.chainId, 'stake success txHash', res.data.tx_response.txhash)
            } else {
                console.log('chainId', chain.chainId, 'Failed to stake tx:', res.data.tx_response.log || res.data.tx_response.raw_log)
            }
            console.log(`stake ${chain.chainId} end`)
            return res
        })
    }

}