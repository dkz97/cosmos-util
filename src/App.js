import logo from './logo.svg';
import './App.css';
import { Button } from 'antd';
// 引入样式
import 'antd/dist/antd.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <div>
        <Button className="buttonClass" type="primary" size='large' onClick={claimAll}>
          一键领取
        </Button>
        <Button className="buttonClass" type="primary" size='large' onClick={distributeAll}>
          一键发送
        </Button>
        <Button className="buttonClass" type="primary" size='large' onClick={stakeAll}>
          一键质押
        </Button>
        </div>
      </header>
    </div>
  );
}

// claim当前账户的奖励，先支持 atom, osmo, scrt, juno, evmos
function claimAll() {
  console.log("claimAll");
}

// 将当前账户的所有资产发送到指定地址，先支持 atom, osmo, scrt, juno, evmos
function distributeAll() {
  console.log("distributeAll");
}

// 质押当前账户的所有资产，先支持 atom, osmo, scrt, juno, evmos
function stakeAll() {
  console.log("stakeAll");
}


export default App;
