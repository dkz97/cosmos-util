/**
 * 质押全部
 */

export default class StakeAll { 
 
    async stakeAll() {
        // 遍历循环chainslist，并且await distribute
        for (let chain of chainsList) {
            console.log(`stake ${chain.chainId} start`);
            await this.stake(chain)
        }
    }

    async stake() {

    }

}