/**
 * claim所有奖励
 */
import { chainsList } from "../../config/chains";
import KeplrSignerProvider from "../signed/KeplrSignerProvider";
import QueryClient from "../QueryClient";
import {
    SigningStargateClient, setupDistributionExtension
} from '@cosmjs/stargate'
import { coins } from '@cosmjs/launchpad'
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';

export default class ClaimAllRewards {


    async claimAll() {
        // 1、将所有链的client初始化
        const datas = [];
        for (let i = 0; i < chainsList.length; i++) {
            let chain = chainsList[i];
            let signer = await this.getAllSigners(chain);
            datas.push({ chain, signer });
        }

        // 2、对当前client进行遍历，claim全部
        for (let i = 0; i < datas.length; i++) {
            let { chain, signer } = datas[i];
            let accounts = await signer.getAccounts();
            let addr = accounts[0].address;
            let queryClient = await QueryClient(signer.chainId, chain.rest, { connectTimeout:1000 });
            let validatorRewards = await queryClient.getRewards(addr, chain.denom);
        }
    }

    async getAllSigners(chain) {
        let keplr = new KeplrSignerProvider(window.keplr);
        await keplr.connect(chain);
        return await keplr.getSigner(chain);
    }

}
