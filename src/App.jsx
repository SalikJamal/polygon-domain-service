import React, { useEffect, useState } from 'react'
import './styles/App.css'
import twitterLogo from './assets/twitter-logo.svg'
import { ethers } from 'ethers'
import contractABI  from './utils/contractABI/Domains.json'


// Constants
const TWITTER_HANDLE = '_buildspace'
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`
const TOP_LEVEL_DOMAIN = '.tron'


const App = () => {

	const [currentAccount, setCurrentAccount] = useState('')
	const [domain, setDomain] = useState('')
	// const [loading, setLoading] = useState(false)
	const [record, setRecord] = useState('')

	const  { ethereum } = window

	const connectWallet = async () => {
		
		try {

			if(!ethereum) {
				alert("Get MetaMask -> https://metamask.io/")
				return
			}

			const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    
			console.log("Connected", accounts[0]);
			setCurrentAccount(accounts[0]);

		} catch(err) {
			console.log(err)
		}

	}

	const checkIfWalletIsConnected = async () => {
	
		if(!ethereum) {
			console.log("Make sure you have metamask!")
			return
		} else {
			console.log("We have the ethereum object", ethereum)
		}

		const accounts = await ethereum.request({ method: 'eth_accounts' })

		if(accounts.length !== 0) {
			const account = accounts[0]
			console.log("Found an authorized account:", account)
			setCurrentAccount(account[0])
		} else {
			console.log('No authorized account found')
		}

	}

	const mintDomain = async () => {

		// Don't run if the domain is empty
		if(!domain) return

		// Alert the user if the domain is too short
		if(domain.length < 3) {
			alert('Domain must be at least 3 characters long')
			return
		}

		// Calculate price based on length of domain (change this to match your contract)	
		// 3 chars = 0.5 MATIC, 4 chars = 0.3 MATIC, 5 or more = 0.1 MATIC
		const price = domain.length === 3 ? '0.5' : domain.length === 4 ? '0.3' : '0.1'
		console.log("Minting domain", domain, "with price", price)

		try {

			if(ethereum) {

				const provider = new ethers.providers.Web3Provider(ethereum)
				const signer = provider.getSigner()
				const contract = new ethers.Contract(process.env.REACT_APP_CONTRACT_ADDRESS, contractABI.abi, signer)

				console.log('Going to pop wallet now to pay gas...')

				let tx = await contract.register(domain, { value: ethers.utils.parseEther(price) })
				const receipt = await tx.wait()

				if(receipt.status === 1) {
					console.log(`Domain minted! https://mumbai.polygonscan.com/tx/${tx.hash}`)

					tx = await contract.setRecord(domain, record)
					await tx.wait()

					console.log(`Record set! https://mumbai.polygonscan.com/tx/${tx.hash}`)

					setRecord('')
					setDomain('')

				} else {
					alert('Transaction failed, please try again later')
				}

			}

		} catch(err) {
			console.log(err)
		}

	}

	const renderNotConnectedContainer = () => (
		<div className='connect-wallet-container'>
			<img src="https://media.giphy.com/media/7CNpdCLqq65B6/giphy.gif" alt="Tron Gif" />
			
			<button className="cta-button connect-wallet-button" onClick={connectWallet}>Connect Wallet</button>
		</div>
	)

	const renderInputForm = () => {
		return (
			<div className='form-container'>
				<div className='first-row'>
					<input type='text' value={domain} placeholder='Enter domain name' onChange={e => setDomain(e.target.value)} />
					<p className='tld'>{TOP_LEVEL_DOMAIN}</p>
				</div>

				<input type='text' value={record} placeholder='What is your power?' onChange={e => setRecord(e.target.value)} />

				<div className='button-container'>
					<button className='cta-button mint-button' onClick={mintDomain}>Mint</button>  
					{/* <button className='cta-button mint-button' disabled={null} onClick={null}>Set data</button>  */}
				</div>
			</div>
		)
	}

	useEffect(() => {
		checkIfWalletIsConnected()
	}, [])

  return (
		<div className="App">
			<div className="container">
				<div className="header-container">
					<header>
						<div className="left">
						<p className="title">TRON Name Service</p>
						<p className="subtitle">Your immortal API on the blockchain!</p>
						</div>
					</header>
				</div>

				{!currentAccount && renderNotConnectedContainer()}
				{currentAccount && renderInputForm()}

				<div className="footer-container">
					<img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
					<a className="footer-text" href={TWITTER_LINK} target="_blank" rel="noreferrer">{`built with @${TWITTER_HANDLE}`}</a>
				</div>
			</div>
		</div>
	);
}

export default App
