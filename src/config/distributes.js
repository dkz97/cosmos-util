
/**
 * {
 *  "chainId" : {
 *      remainMin : 钱包预留的金额
 *      sendAddr ： 需要发送的地址
 *  }
 * }
 */
export const distList = {
    "cosmoshub-4" : { 
        remainMin: 0.02,
        sendAddr : "1",
        gas : 90000
    },
    "osmosis-1" : { 
        remainMin: 0.02,
        sendAddr : "1",
        gas : 80000
    },
    "juno-1" : { 
        remainMin: 0.02,
        sendAddr : "1",
        gas : 90000
    },
    "secret-4" : { 
        remainMin: 0.02,
        sendAddr : "1",
        gas : 20000
    },
    "evmos_9001-2" : { 
        remainMin: 0.01,
        sendAddr : "1",
        gas : 200000
    }
}