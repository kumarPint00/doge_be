import { HardhatUserConfig } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';
import 'solidity-coverage';
import 'hardhat-gas-reporter';
import '@nomiclabs/hardhat-waffle';

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {},
    sepoliaBase: {
      url: process.env.SEPOLIA_BASE_RPC || 'https://base-goerli.publicnode.com',
      chainId: 84531,
    },
  },
  solidity: {
    compilers: [
      { version: '0.8.17', settings: { optimizer: { enabled: true, runs: 200 } } },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === 'true',
    currency: 'USD',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  mocha: {
    timeout: 20000,
  },
};

export default config;
