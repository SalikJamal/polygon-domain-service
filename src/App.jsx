import React, { useEffect, useState } from 'react'
import './styles/App.css'
import twitterLogo from './assets/twitter-logo.svg'
import { ethers } from 'ethers'
import contractABI  from './utils/contractABI/Domains.json'
import { networks } from './utils/networks'
import polygonLogo from './assets/polygonlogo.png'
import ethLogo from './assets/ethlogo.png'


// Constants
const TWITTER_HANDLE = '_buildspace'
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`
const TOP_LEVEL_DOMAIN = '.tron'


const App = () => {

	const [currentAccount, setCurrentAccount] = useState('')
	const [domain, setDomain] = useState('')
	const [loading, setLoading] = useState(false)
	const [record, setRecord] = useState('')
	const [network, setNetwork] = useState('')
	const [editing, setEditing] = useState(false)
	const [mints, setMints] = useState([])

	const  { ethereum } = window

	const connectWallet = async () => {
		
		try {

			if(!ethereum) {
				alert("Get MetaMask -> https://metamask.io/")
				return
			}

			const accounts = await ethereum.request({ method: "eth_requestAccounts" })
    
			console.log("Connected", accounts[0])
			setCurrentAccount(accounts[0])

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
			setCurrentAccount(account)
		} else {
			console.log('No authorized account found')
		}

		const chainId = await ethereum.request({ method: 'eth_chainId' })
		setNetwork(networks[chainId])

		ethereum.on('chainChanged', (_chainId) => window.location.reload())

	}

	const switchNetwork = async () => {
		
		if(ethereum) {

			try {

				await ethereum.request({ 
					method: 'wallet_switchEthereumChain',
					params: [{ chainId: '0x13881' }]
				})

			} catch(err) {

				// This error code means that the chain we want has not been added to MetaMask
      			// In this case we ask the user to add it to their MetaMask
				if(err.code === 4902) {

					try {

						await ethereum.request({ 
							method: 'wallet_addEthereumChain',
							params: [{
								chainId: '0x13881',
								chainName: networks['0x13881'],
								rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
								nativeCurrency: {
									name: 'Mumbai MATIC',
									symbol: 'MATIC',
									decimals: 18
								},
								blockExplorerUrls: ['https://mumbai.polygonscan.com/']
							}]
					 	})

					} catch(err) {
						console.log(err)
					}

				}

			}


		} else {
			alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download')
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

					setTimeout(() => {
						fetchMints()
					}, 2000)

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

	const updateDomain = async () => {

		if(!record || !domain) return
		setLoading(true)

		console.log(`Updating domain ${domain} with record ${record}`)

		try {

			if(ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum)
				const signer = provider.getSigner()
				const contract = new ethers.Contract(process.env.REACT_APP_CONTRACT_ADDRESS, contractABI.abi, signer)

				let txn = await contract.setRecord(domain, record)
				await txn.wait()
				console.log(`Record updated! https://mumbai.polygonscan.com/tx/${txn.hash}`)

				// fetchMints()
				setRecord('')
				setDomain('')
			}

		} catch (err) {
			console.log(err)
		}

		setLoading(false)

	}

	const fetchMints = async () => {

		try {

			if(ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum)
				const signer = provider.getSigner()
				const contract = new ethers.Contract(process.env.REACT_APP_CONTRACT_ADDRESS, contractABI.abi, signer)

				// Get all domain names from our contract
				const names = await contract.getAllNames()

				// For each name, get the record and address
				const mintRecords = await Promise.all(names.map(async name => {

					const mintRecord = await contract.records(name)
					const owner = await contract.domains(name)

					return {
						id: names.indexOf(name),
						name: name,
						record: mintRecord,
						owner: owner
					}

				}))

				console.log(`Mints Fetched ${mintRecords}`)
				setMints(mintRecords)

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

		if(network !== 'Polygon Mumbai Testnet') { 
			return (
				<div className='connect-wallet-container'>
					<h2>Please connect to Polygon Mumbai Testnet</h2>
					<button className='cta-button mint-button' onClick={switchNetwork}>Click here to switch</button>
				</div>
			)
		}

		return (
			<div className='form-container'>
				<div className='first-row'>
					<input type='text' value={domain} placeholder='Enter domain name' onChange={e => setDomain(e.target.value)} />
					<p className='tld'>{TOP_LEVEL_DOMAIN}</p>
				</div>

				<input type='text' value={record} placeholder='What is your power?' onChange={e => setRecord(e.target.value)} />

				{editing ? (
					<div className='button-container'>
						{/* This will call the updateDomain function we just made */}
						<button className='cta-button mint-button' disabled={loading} onClick={updateDomain}>Set Record</button>  
              			{/* This will let us get out of editing mode by setting editing to false */}
						  <button className='cta-button mint-button' onClick={() => setEditing(false)}>Cancel</button>  
			  		</div>
				) : (
					<div className='button-container'>
						<button className='cta-button mint-button' disabled={loading} onClick={mintDomain}>Mint</button>  
					</div>
				)}

				
			</div>
		)
	}

	const renderMints = () => {
		if(currentAccount && mints.length > 0) {
			return (
				<div className='mint-container'>
					<p className='subtitle'>Recently minted domains!</p>
					<div className='mint-list'>
						{mints.map((mint, index) => {
							return (
								<div className='mint-item' key={index}>
									<div className='mint-row'>
										<a className='link' href={`https://testnets.opensea.io/assets/mumbai/${process.env.REACT_APP_CONTRACT_ADDRESS}/${mint.id}`} target="_blank" rel="noopener noreferrer">
											<p className='underlined'>{' '}{mint.name}{TOP_LEVEL_DOMAIN}{' '}</p>
										</a>
										{/* If mint.owner is currentAccount, add an edit button */}
										{mint.owner.toLowerCase() === currentAccount.toLowerCase() && 
											<button className="edit-button" onClick={() => editRecord(mint.name)}>
												<img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button" />
											</button>
										}
									</div>
									<p>{mint.record}</p>
								</div>
							)
						})}
					</div>
				</div>
			)
		}
	}

	const editRecord = name => {
		console.log(`Editing record for ${name}`)
		setEditing(true)
		setDomain(name)
	}

	useEffect(() => {
		checkIfWalletIsConnected()
		if(network === 'Polygon Mumbai Testnet') fetchMints()
	}, [currentAccount, network])

  return (
		<div className="App">
			<div className="container">
				<div className="header-container">
					<header>
						<div className="left">
							<p className="title">TRON Name Service</p>
							<p className="subtitle">Your immortal API on the blockchain!</p>
						</div>
						<div className="right">
							<img className='logo' alt='Network logo' src={network.includes('Polygon') ? polygonLogo : ethLogo} />
							{currentAccount ? <p>Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)} </p> : <p>Wallet: Not connected</p>}
						</div>
					</header>
				</div>

				{!currentAccount && renderNotConnectedContainer()}
				{currentAccount && renderInputForm()}
				{mints && renderMints()}

				<div className="footer-container">
					<img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
					<a className="footer-text" href={TWITTER_LINK} target="_blank" rel="noreferrer">{`built with @${TWITTER_HANDLE}`}</a>
				</div>
			</div>
		</div>
	)
}

export default App
