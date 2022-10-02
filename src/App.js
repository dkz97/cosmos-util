import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          进入主页
        </p>
        <button onClick={ handlerClick }>
          Learn React
        </button>
      </header>
    </div>
  );
}

function handlerClick() {
  console.log('click');
}

export default App;
