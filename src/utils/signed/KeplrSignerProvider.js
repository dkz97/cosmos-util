import SignerProvider from "./SignerProvider.js"

/**
 * DESC:
 *  keplr签名提供器，关于keplr钱包接口的文档请参考：https://docs.keplr.app/api/
 */
export default class KeplrSignerProvider extends SignerProvider {
  key = 'keplr'
  label = 'Keplr Extension'
  keychangeEvent = 'keplr_keystorechange'

  enable(network){
    if (network.gasPricePrefer) {
      this.setOptions({
        sign: { preferNoSetFee: true }
      })
    }
    return super.enable(network)
  }

  setOptions(options){
    return this.provider.defaultOptions = options
  }

  getOptions(){
    return this.provider.defaultOptions
  }
}