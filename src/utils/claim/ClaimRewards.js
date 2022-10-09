import {
    QueryClient, setupDistributionExtension, SigningStargateClient

} from "@cosmjs/stargate";
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import KeplrSignerProvider from "../signed/KeplrSignerProvider";
import { chainsList } from "../../config/chains";
import GasFeeUtil from "../GasFeeUtil";

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
                    if (total.denom == chain.stakeCurrency.coinMinimalDenom) {
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

        let result = await client.signAndBroadcast(address, ops, fee, '');
        if (result.code > 0) {
            console.log(`${address} failed to claim ${totalReward} ${chain.stakeCurrency.coinDenom}.`, result);
        } else {
            console.log(`${address} claimed ${totalReward} ${chain.stakeCurrency.coinDenom}. Tx Hash: ${result.transactionHash}`);
    
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