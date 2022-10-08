
/**
 * DESC: 
 *  签名提供器父类，子类可以继承该类，实现自己的签名逻辑，如keplr钱包，Falcon钱包
 * 
 */
export default class SignerProvider {
    suggestChainSupport = true
  
    // 传入的provider为钱包对象，如 window.keplr
    constructor(provider){
      this.provider = provider
    }
  
    // 判断提供器是否可用
    available(){
      return !!this.provider
    }
  
    // 判断提供器是否可用
    connected(){
      return this.available()
    }
  
    // 连接网络
    async connect(network){
      try {
        await this.enable(network)
        return await this.getKey(network)
      } catch (e) {
        if(!this.suggestChainSupport){
          throw(e)
        }
        try {
          await this.suggestChain(network)
          return await this.getKey(network)
        } catch (s) {
          throw(s)
        }
      }
    }
  
    // 断开连接
    disconnect(){
    }
  
    // 启用network.chainId网络
    enable(network){
      const { chainId } = network
      return this.provider.enable(chainId)
    }
  
    // 返回当前钱包在此链的地址和公钥
    getKey(network){
      const { chainId } = network
      return this.provider.getKey(chainId)
    }
  
    // 获取签名对象
    getSigner(network){
      const { chainId } = network
      return this.provider.getOfflineSignerAuto(chainId)
    }
  
    // 连接链的主要方法experimentalSuggestChain
    suggestChain(network){
      if(this.suggestChainSupport){
        return this.provider.experimentalSuggestChain(network)
      }else{
        throw new Error(`${network.prettyName} (${network.chainId}) is not supported`)
      }
    }
  
    // 设置扩展参数，请在子类中实现
    setOptions(options){
      return {}
    }
  
    getOptions(){
      return {}
    }
  }