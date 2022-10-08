/**
 * 全部配置信息可参考：https://github.com/chainapsis/keplr-example/blob/master/src/main.js 
{
   // 实际链id
   chainId: "osmosis-1",

   // 向用户显示的链的名称
   chainName: "Osmosis mainnet",

   // 当前链的rpc端点，可自行查找新的rpc端点
   rpc: "https://rpc.cosmos.directory/osmosis",

   // 当前链的rest端点，可自行查找新的rest端点
   rest: "https://rest.cosmos.directory/osmosis",

   // 质押币的信息
   stakeCurrency: {
        // 显示给用户的硬币名称
        coinDenom: "OSMO", 
        // 区块链使用的实际denom(即uatom、uscrt)
        coinMinimalDenom: "uosmo",
        // 硬币小数，小数点将最小面额转换为面向用户的面额
        coinDecimals: 6,
        // (可选)如果提供coingecko id，keplr可以显示硬币的法定价值。
        // 如果列出id，可以从https://api.coingecko.com/api/v3/coins/list获取。
        // coinGeckoId: ""
    }

    // 币种类型，目前固定为bip44,并且coinType为118
    bip44: {
        coinType: 118,
    },

    // bech32配置,基本都是 xxx+pub,xxx+valoper,xxx+valoperpub,xxx+valcons,xxx+valconspub
    bech32Config: {
        bech32PrefixAccAddr: "osmo",
        bech32PrefixAccPub: "osmopub",
        bech32PrefixValAddr: "osmovaloper",
        bech32PrefixValPub: "osmovaloperpub",
        bech32PrefixConsAddr: "osmovalcons",
        bech32PrefixConsPub: "osmovalconspub"
    },

    // 此链中使用的所有硬币/代币列表
    currencies: [{
        // 跟stakeCurrency一样填就行了，目前只用链上的币
        coinDenom: "OSMO",
        coinMinimalDenom: "uosmo",
        coinDecimals: 6
    }],

    // 在此链中用作收费令牌的币/令牌列表，给gas用的
    feeCurrencies: [{
        coinDenom: "OSMO",
        coinMinimalDenom: "uosmo",
        coinDecimals: 6
    }],

    // (可选) 用于设置交易的费用
    // 如果该字段未提供，keplr扩展将设置默认天然气价格为(低:0.01，平均:0.025，高:0.04)
    // 目前，keplr不支持基于链上数据的天然气价格动态计算.
    // 确保gas price 高于链验证器和RPC/REST端点接受的最低gas price
    gasPriceStep: {
        low: 0.01,
        average: 0.025,
        high: 0.04
    }

}

目前先全配置，后续可根据名称，直接从https://chains.cosmos.directory/接口中将所需的信息获取到
*/

export const chainsList = [
    {
        chainId: "cosmoshub-4",
        chainName: "Cosmos Hub 4",
        rpc: 'https://rpc.cosmos.directory/cosmoshub',
        rest: 'https://rest.cosmos.directory/cosmoshub',
        stakeCurrency: {
            coinDenom: "ATOM", 
            coinMinimalDenom: "uatom",
            coinDecimals: 6
        },
        bip44: {
            coinType: 118,
        },
        bech32Config: {
            bech32PrefixAccAddr: "atom",
            bech32PrefixAccPub: "atompub",
            bech32PrefixValAddr: "atomvaloper",
            bech32PrefixValPub: "atomvaloperpub",
            bech32PrefixConsAddr: "atomvalcons",
            bech32PrefixConsPub: "atomvalconspub"
        },
        currencies: [{
            coinDenom: "ATOM", 
            coinMinimalDenom: "uatom",
            coinDecimals: 6
        }],
        feeCurrencies: [{
            coinDenom: "ATOM", 
            coinMinimalDenom: "uatom",
            coinDecimals: 6
        }],
        gasPriceStep: {
             low: 0.01,
             average: 0.025,
             high: 0.04
        }
    }
]