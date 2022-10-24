import {
    QueryClient, setupDistributionExtension, SigningStargateClient

} from "@cosmjs/stargate";
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import KeplrSignerProvider from "../signed/KeplrSignerProvider";
import { chainsList } from "../../config/chains";
import GasFeeUtil from "../GasFeeUtil";
import axios from "axios";
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { toBase64 } from '@cosmjs/encoding';

export default class ClaimRewards {

    state = { 
        MODE: 1
    }

    async claimAll() {
        // 遍历循环chainslist，并且await claim
        for (let chain of chainsList) {
            console.log(`claim ${chain.chainId} rewards start`);
            await this.claim(chain)
        }
    }

    async claim(chain) {
        const rpcEndpoint = chain.rpc;
        // 获取签名对象
        let keplr = new KeplrSignerProvider(window.keplr);
        chain = new GasFeeUtil().getGasPriceStep(chain);
        await keplr.connect(chain);
        const signer = await keplr.getSigner(chain);
        const accounts = await signer.getAccounts();
        let account = accounts[0];

        try {
            const queryClient = await this.getQueryClient(rpcEndpoint);
            let delegationRewards = await queryClient.distribution.delegationTotalRewards(account.address);
            let validators = [];
            let totalRewards = 0;

            // 构造claim的请求msg
            if (delegationRewards.total.length > 0) {
                for (let reward of delegationRewards.rewards) {
                    validators.push(reward.validatorAddress);
                }
                for (let total of delegationRewards.total) {
                    if (total.denom === chain.stakeCurrency.coinMinimalDenom) {
                        totalRewards += Number(total.amount) / (1e18 * Math.pow(10, chain.stakeCurrency.coinDecimals));
                    }
                }
            }
            if (totalRewards > chain.claim_min && validators.length > 0) {
                const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, signer);
                await this.withdrawRewards(client, chain, account.address, validators, totalRewards);
            }
        } catch (err) {
            console.log(`${account.address} claimed failed. ${err.message}`);
        }
        console.log(`claim ${chain.chainId} rewards end`);
    }

    // claim奖励
    async withdrawRewards(client, chain, address, validators, totalReward) {
        let ops = [];
        for (let validator of validators) {
            let msg = {
                typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
                value: {
                    delegatorAddress: address,
                    validatorAddress: validator
                },
            };
            ops.push(msg);
        }
        const fee = new GasFeeUtil().getFee(200_000, chain.gasPrice);

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
        let bodyBytes = await client.sign(address, ops, fee, '', signerData);

        // 广播交易
        let result = await this.broadcastTx(bodyBytes, chain, totalReward);
        console.log(result);
    }

    async broadcastTx(bodyBytes, chain, totalReward) {
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
                console.log('chainId', chain.chainId, 'claim success txHash', res.data.tx_response.txhash)
            } else {
                console.log('chainId', chain.chainId, 'Failed to claim tx:', res.data.tx_response.log || res.data.tx_response.raw_log)
            }
            console.log(`claim ${chain.chainId} end`)
            return res
        }, {headers: {
            'Access-Control-Allow-Origin': true,
          }})
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

}