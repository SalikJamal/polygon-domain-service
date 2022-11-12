require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config({ path: ".env" })

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    mumbai: {
      url: process.env.ALCHEMY_API_URL,
      accounts: [process.env.POLYGON_PRIVATE_KEY]
    }
  },
  solidity: "0.8.17",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
}
